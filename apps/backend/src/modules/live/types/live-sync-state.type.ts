/** สถานะที่ leader เผยแพร่ให้ follower (เก็บใน DB + broadcast) */
export interface LiveSyncState {
  songIndex: number;
  sectionLabel?: string | null;
  lineIndex?: number | null;
  charOffset?: number | null;
  scrollRatio?: number | null;
  /** ข้อมูลเสริมจาก leader client */
  meta?: Record<string, unknown>;
  /** monotonic — client ใช้ตรวจว่าเป็นเฟรมใหม่กว่า */
  pageVersion: number;
  updatedAt: string;
}
