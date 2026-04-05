/**
 * Event design: client ↔ server (Socket.IO namespace `/live`)
 *
 * ทุก event ใช้ payload เป็น object เดียว (DTO ด้านล่าง) — version field คงที่เป็น 1
 */

export const LIVE_PAYLOAD_VERSION = 1 as const;

/** Client → Server */
export const LIVE_CLIENT_EVENTS = {
  /** เข้าห้องเซสชัน (หลัง REST สร้าง session แล้ว) */
  JOIN: 'live:join',
  /** ออกจากห้อง */
  LEAVE: 'live:left',
  /** follower เริ่มรับ leader sync (join followers room) */
  FOLLOW_LEADER: 'live:follow',
  /** หยุดรับ sync จาก leader */
  UNFOLLOW: 'live:unfollow',
  /** leader / manager เพิ่มเพลงเข้าเซสชัน */
  SONGS_ADD: 'live:songs:add',
  /** ลบเพลงออกจากลิสต์ไลฟ์ */
  SONGS_REMOVE: 'live:songs:remove',
  /** เรียงลำดับใหม่ (ส่ง live_session_songs.id ตามลำดับ) */
  SONGS_REORDER: 'live:songs:reorder',
  /** leader อัปเดตหน้า/ตำแหน่งใน ChordPro (broadcast ไป followers room) */
  SYNC_PAGE: 'live:sync:page',
  /** ขอ snapshot ล่าสุดจาก server (หลัง join หรือ reconnect) */
  SYNC_REQUEST: 'live:sync:request',
} as const;

/** Server → Client */
export const LIVE_SERVER_EVENTS = {
  /** ยืนยัน join สำเร็จ + ข้อมูลพื้นฐาน */
  JOINED: 'live:joined',
  /** ยืนยันออกจากห้อง (หลัง client ส่ง `live:left`) */
  LEFT_ACK: 'live:left:ack',
  /** snapshot เต็มของเซสชัน + ลิสต์เพลง + sync_state */
  SESSION_STATE: 'live:session:state',
  /** ลิสต์เพลงในเซสชันเปลี่ยน */
  SONGS_UPDATED: 'live:songs:updated',
  /** leader เปลี่ยนหน้า — ส่งไปเฉพาะ followers room */
  SYNC_BROADCAST: 'live:sync:broadcast',
  /** follower mode เปลี่ยน (follow/unfollow) — optional แจ้ง client */
  FOLLOW_STATE: 'live:follow:state',
  ERROR: 'live:error',
} as const;
