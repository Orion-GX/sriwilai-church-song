import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'uat', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  APP_NAME: Joi.string().default('sriwilai-church-song-api'),
  APP_VERSION: Joi.string().default('0.1.0'),
  APP_BASE_PATH: Joi.string().default('/api'),

  /** คั่น origin หลายค่าด้วย comma เช่น http://localhost:3000,http://127.0.0.1:3000 */
  CORS_ORIGIN: Joi.string().allow('').optional(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SCHEMA: Joi.string().default('public'),
  DB_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_MAX_CONNECTIONS: Joi.number().integer().min(1).max(100).default(20),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  REDIS_TLS: Joi.boolean().truthy('true').falsy('false').default(false),

  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  /** ไม่ตั้ง = อัตโนมัติ: pretty เฉพาะ NODE_ENV=development, นอกนั้น JSON */
  LOG_PRETTY: Joi.boolean().truthy('true').falsy('false').optional(),

  AUTH_ACCESS_TOKEN_SECRET: Joi.string().min(32).required(),
  AUTH_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
  AUTH_REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
  AUTH_REFRESH_TOKEN_EXPIRES_IN_DAYS: Joi.number().integer().min(1).max(90).default(30),
  AUTH_REFRESH_COOKIE_NAME: Joi.string().default('ccp_rt'),
  AUTH_BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),

  THROTTLE_TTL_MS: Joi.number().integer().min(1000).max(3_600_000).default(60000),
  THROTTLE_USE_REDIS: Joi.boolean().truthy('true').falsy('false').default(true),
  THROTTLE_AUTH_REGISTER_LIMIT: Joi.number().integer().min(1).max(1000).default(5),
  THROTTLE_AUTH_LOGIN_LIMIT: Joi.number().integer().min(1).max(1000).default(10),
  THROTTLE_AUTH_REFRESH_LIMIT: Joi.number().integer().min(1).max(10000).default(30),
  THROTTLE_AUTH_LOGOUT_LIMIT: Joi.number().integer().min(1).max(10000).default(60),

  LIVE_WS_USE_REDIS_ADAPTER: Joi.boolean().truthy('true').falsy('false').default(false),
});
