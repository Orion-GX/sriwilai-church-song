/**
 * สัญญา Socket.IO โมดูล Live (อ้างอิง production ที่ `live.gateway.ts` + `constants/live.events.ts`)
 *
 * - Namespace: `/live` (เชื่อม client ด้วย `io(baseUrl + "/live", { path: "/socket.io" })`)
 * - การยืนยันตัวตน: `handshake.auth.token` เป็น JWT access (ไม่ต้องมีคำว่า Bearer)
 * - Payload ฝั่งเซิร์ฟเวอร์ที่มี `v` ใช้ `LIVE_PAYLOAD_VERSION` (= 1)
 *
 * Client → Server และ Server → Client ใช้ชื่อ event ตามค่าคงที่ด้านล่างเท่านั้น
 * (ห้าม hard-code string ซ้ำในเทส — import จากที่นี่หรือจาก `src/modules/live/constants/live.events`)
 */

export {
  LIVE_CLIENT_EVENTS,
  LIVE_PAYLOAD_VERSION,
  LIVE_SERVER_EVENTS,
} from '../../src/modules/live/constants/live.events';

export {
  LIVE_ROOM_PREFIX,
  liveFollowersRoom,
  liveSessionRoom,
} from '../../src/modules/live/constants/live-rooms';
