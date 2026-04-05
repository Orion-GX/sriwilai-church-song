import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';

/**
 * จับ HTTP error ทั้งหมด — log ด้วย Pino (แยก 4xx เป็น warn, 5xx เป็น error)
 * ไม่ใส่ body ลูกค้าใน log โดยไม่จำเป็น
 */
@Catch()
export class HttpExceptionLoggingFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (c: number) => { json: (b: unknown) => void } }>();
    const request = ctx.getRequest<{
      method?: string;
      url?: string;
      requestId?: string;
      user?: { sub?: string };
    }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = exception instanceof HttpException ? exception.getResponse() : undefined;

    const base = {
      msg: 'http_error',
      statusCode: status,
      method: request.method,
      path: request.url,
      requestId: request.requestId,
      userId: request.user?.sub,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          ...base,
          err:
            exception instanceof Error
              ? {
                  type: exception.name,
                  message: exception.message,
                  stack: exception.stack,
                }
              : exception,
        },
        'HTTP 5xx',
      );
    } else if (status >= HttpStatus.BAD_REQUEST) {
      const responseMessage =
        typeof body === 'string' ? body : (body as { message?: unknown })?.message;
      this.logger.warn(
        {
          ...base,
          responseMessage,
        },
        'HTTP 4xx',
      );
    }

    if (exception instanceof HttpException) {
      response.status(status).json(body);
      return;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const message = isProd ? 'Internal server error' : exception instanceof Error ? exception.message : 'Error';
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
    });
  }
}
