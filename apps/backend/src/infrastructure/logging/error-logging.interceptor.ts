import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { Logger } from 'nestjs-pino';

export const ERROR_LOGGED_BY_INTERCEPTOR = Symbol('errorLoggedByInterceptor');

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const controller = context.getClass()?.name;
    const handler = context.getHandler()?.name;
    const request = http.getRequest<{
      method?: string;
      url?: string;
      requestId?: string;
      user?: { sub?: string };
    }>();

    return next.handle().pipe(
      catchError((exception: unknown) => {
        const status =
          exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const baseLog = {
          msg: 'request_failed',
          statusCode: status,
          method: request?.method,
          path: request?.url,
          requestId: request?.requestId,
          userId: request?.user?.sub,
          controller,
          handler,
        };

        const err =
          exception instanceof Error
            ? {
                type: exception.name,
                message: exception.message,
                stack: exception.stack,
              }
            : exception;

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
          this.logger.error({ ...baseLog, err }, 'Request failed with 5xx');
        } else if (status >= HttpStatus.BAD_REQUEST) {
          this.logger.warn({ ...baseLog, err }, 'Request failed with 4xx');
        }

        if (exception && typeof exception === 'object') {
          Object.defineProperty(exception, ERROR_LOGGED_BY_INTERCEPTOR, {
            value: true,
            enumerable: false,
            configurable: true,
          });
        }

        return throwError(() => exception);
      }),
    );
  }
}
