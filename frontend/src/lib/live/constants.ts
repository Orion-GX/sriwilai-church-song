export const LIVE_PAYLOAD_VERSION = 1 as const;

export const LIVE_CLIENT_EVENTS = {
  JOIN: "live:join",
  LEAVE: "live:left",
  FOLLOW_LEADER: "live:follow",
  UNFOLLOW: "live:unfollow",
  SONGS_ADD: "live:songs:add",
  SONGS_REMOVE: "live:songs:remove",
  SONGS_REORDER: "live:songs:reorder",
  SYNC_PAGE: "live:sync:page",
  SYNC_REQUEST: "live:sync:request",
} as const;

export const LIVE_SERVER_EVENTS = {
  JOINED: "live:joined",
  LEFT_ACK: "live:left:ack",
  SESSION_STATE: "live:session:state",
  SONGS_UPDATED: "live:songs:updated",
  SYNC_BROADCAST: "live:sync:broadcast",
  FOLLOW_STATE: "live:follow:state",
  ERROR: "live:error",
} as const;
