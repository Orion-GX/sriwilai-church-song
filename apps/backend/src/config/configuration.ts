export interface AppConfig {
  nodeEnv: string;
  port: number;
  appName: string;
  appVersion: string;
  appBasePath: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  schema: string;
  ssl: boolean;
  maxConnections: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password: string;
  db: number;
  tls: boolean;
}

export interface LoggingConfig {
  level: string;
  prettyPrint: boolean;
}

export interface AuthConfig {
  accessTokenSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresInDays: number;
  refreshCookieName: string;
  bcryptSaltRounds: number;
}

/** ttl เป็นมิลลิวินาที (ตาม @nestjs/throttler v6) */
export interface ThrottleConfig {
  ttlMs: number;
  /** ใช้ Redis เป็น storage ของ rate limit (แนะนำเมื่อรันหลาย instance) */
  useRedisStorage: boolean;
  authRegisterLimit: number;
  authLoginLimit: number;
  authRefreshLimit: number;
  authLogoutLimit: number;
}

export interface LiveWsConfig {
  /**
   * เปิด @socket.io/redis-adapter — แชร์ room/event ข้าม pod/process
   * (ควรเปิดพร้อม THROTTLE_USE_REDIS เมื่อ scale มากกว่า 1 instance)
   */
  useRedisAdapter: boolean;
}

export interface CorsConfig {
  /** origin ที่อนุญาตให้ส่ง credentials (ว่าง = ปิด CORS ในฝั่ง Nest — ใช้เมื่อ reverse proxy same-origin) */
  origins: string[];
}

export interface AppConfiguration {
  app: AppConfig;
  cors: CorsConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  logging: LoggingConfig;
  auth: AuthConfig;
  throttle: ThrottleConfig;
  liveWs: LiveWsConfig;
}

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const parseCorsOrigins = (): string[] => {
  const fromEnv = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
  if (fromEnv?.length) {
    return fromEnv;
  }
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production') {
    return [];
  }
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
};

export default (): AppConfiguration => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number.parseInt(process.env.PORT ?? '3001', 10),
    appName: process.env.APP_NAME ?? 'sriwilai-church-song-api',
    appVersion: process.env.APP_VERSION ?? '0.1.0',
    appBasePath: process.env.APP_BASE_PATH ?? '/api',
  },
  cors: {
    origins: parseCorsOrigins(),
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'church_chord_pro',
    schema: process.env.DB_SCHEMA ?? 'public',
    ssl: parseBoolean(process.env.DB_SSL, false),
    maxConnections: Number.parseInt(process.env.DB_MAX_CONNECTIONS ?? '20', 10),
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
    db: Number.parseInt(process.env.REDIS_DB ?? '0', 10),
    tls: parseBoolean(process.env.REDIS_TLS, false),
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
    prettyPrint: parseBoolean(process.env.LOG_PRETTY, true),
  },
  auth: {
    accessTokenSecret:
      process.env.AUTH_ACCESS_TOKEN_SECRET ??
      'dev-access-only-do-not-use-in-prod-32chars',
    accessTokenExpiresIn: process.env.AUTH_ACCESS_TOKEN_EXPIRES_IN ?? '15m',
    refreshTokenSecret:
      process.env.AUTH_REFRESH_TOKEN_SECRET ??
      'dev-refresh-only-do-not-use-in-prod-32chars',
    refreshTokenExpiresInDays: Number.parseInt(process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30', 10),
    refreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME ?? 'ccp_rt',
    bcryptSaltRounds: Number.parseInt(process.env.AUTH_BCRYPT_SALT_ROUNDS ?? '12', 10),
  },
  throttle: {
    ttlMs: Number.parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    useRedisStorage: parseBoolean(process.env.THROTTLE_USE_REDIS, true),
    authRegisterLimit: Number.parseInt(process.env.THROTTLE_AUTH_REGISTER_LIMIT ?? '5', 10),
    authLoginLimit: Number.parseInt(process.env.THROTTLE_AUTH_LOGIN_LIMIT ?? '10', 10),
    authRefreshLimit: Number.parseInt(process.env.THROTTLE_AUTH_REFRESH_LIMIT ?? '30', 10),
    authLogoutLimit: Number.parseInt(process.env.THROTTLE_AUTH_LOGOUT_LIMIT ?? '60', 10),
  },
  liveWs: {
    useRedisAdapter: parseBoolean(process.env.LIVE_WS_USE_REDIS_ADAPTER, false),
  },
});
