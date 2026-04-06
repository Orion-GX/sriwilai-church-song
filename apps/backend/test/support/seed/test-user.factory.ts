import { buildRegisterPayload, type RegisterPayloadFixture } from '../fixtures/user.fixture';

/**
 * Factory สำหรับสร้าง payload ผู้ใช้ทดสอบ (seed / auth helper)
 */
export const TestUserFactory = {
  uniqueRegisterPayload(overrides?: Partial<RegisterPayloadFixture>): RegisterPayloadFixture {
    return { ...buildRegisterPayload(), ...overrides };
  },
};
