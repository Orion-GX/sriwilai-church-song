/**
 * Room strategy (Socket.IO rooms)
 *
 * - `liveSessionRoom(sessionId)` — ทุกคนในเซสชัน (leader + follower) รับ events:
 *   รายการเพลงอัปเดต, สถานะเซสชัน, (optional) broadcast ทั้งห้อง
 * - `liveFollowersRoom(sessionId)` — เฉพาะ follower ที่กด follow leader ใช้รับ leader sync (page)
 *   leader ไม่อยู่ห้องนี้
 */
export const LIVE_ROOM_PREFIX = 'live:session' as const;

export function liveSessionRoom(sessionId: string): string {
  return `${LIVE_ROOM_PREFIX}:${sessionId}`;
}

export function liveFollowersRoom(sessionId: string): string {
  return `${LIVE_ROOM_PREFIX}:${sessionId}:followers`;
}
