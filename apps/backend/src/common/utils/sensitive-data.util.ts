/**
 * รายการคีย์ที่ต้องไม่เก็บใน audit / ไม่ log แบบ plain (ใช้ร่วมกับ Pino redact paths)
 */
export const SENSITIVE_FIELD_KEYS_LOWER = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'currentpassword',
  'current_password',
  'newpassword',
  'new_password',
  'refreshtoken',
  'refresh_token',
  'accesstoken',
  'access_token',
  'token',
  'secret',
  'authorization',
  'cookie',
  'set-cookie',
  'sharetoken',
  'share_token',
  'chordprobody',
  'chordpro_body',
  'creditcard',
  'cvv',
  'ssn',
]);

const REDACT_PLACEHOLDER = '[REDACTED]';
const MAX_DEPTH = 8;

function keyIsSensitive(key: string): boolean {
  return SENSITIVE_FIELD_KEYS_LOWER.has(key.toLowerCase().replace(/[-_]/g, ''));
}

/**
 * Deep-clone + redact ค่าที่ key ตรงรายการ sensitive (สำหรับ before_data / after_data / metadata)
 */
export function redactStructuredData(input: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return '[MAX_DEPTH]';
  }
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => redactStructuredData(item, depth + 1));
  }
  if (typeof input === 'object' && input.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (keyIsSensitive(k)) {
        out[k] = REDACT_PLACEHOLDER;
      } else {
        out[k] = redactStructuredData(v, depth + 1);
      }
    }
    return out;
  }
  return '[NON_PLAIN]';
}
