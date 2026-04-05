import { io, type Socket } from 'socket.io-client';

import {
  LIVE_CLIENT_EVENTS,
  LIVE_SERVER_EVENTS,
  LIVE_PAYLOAD_VERSION,
} from '../../src/modules/live/constants/live.events';
import type { LiveParticipantModeDto } from '../../src/modules/live/dto/ws/live-join.dto';

export type { Socket };

/** ต่อ namespace `/live` — path engine.io ค่าเริ่มต้นของ Nest + socket.io */
export function connectLiveSocket(baseUrl: string, accessToken: string): Socket {
  return io(`${baseUrl}/live`, {
    path: '/socket.io',
    auth: { token: accessToken },
    transports: ['websocket'],
    forceNew: true,
    autoConnect: true,
  });
}

export function waitForSocketConnect(socket: Socket, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }
    const t = setTimeout(() => {
      socket.off('connect', onOk);
      socket.off('connect_error', onErr);
      reject(new Error('waitForSocketConnect: timeout'));
    }, timeoutMs);
    const onOk = (): void => {
      clearTimeout(t);
      socket.off('connect_error', onErr);
      resolve();
    };
    const onErr = (err: Error): void => {
      clearTimeout(t);
      socket.off('connect', onOk);
      reject(err);
    };
    socket.once('connect', onOk);
    socket.once('connect_error', onErr);
  });
}

export function onceSocketEvent<T = unknown>(socket: Socket, event: string, timeoutMs = 15_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      socket.off(event, onData);
      reject(new Error(`onceSocketEvent: timeout waiting for "${event}"`));
    }, timeoutMs);
    const onData = (payload: T): void => {
      clearTimeout(t);
      resolve(payload);
    };
    socket.once(event, onData);
  });
}

/** รอจน event ไม่เกิดภายใน timeout — คืน true ถ้า “เงียบ” สมเหตุผล */
export async function expectNoSocketEvent(
  socket: Socket,
  event: string,
  withinMs: number,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const onData = (): void => {
      clearTimeout(t);
      socket.off(event, onData);
      reject(new Error(`expected no "${event}" but received`));
    };
    socket.on(event, onData);
    const t = setTimeout(() => {
      socket.off(event, onData);
      resolve(true);
    }, withinMs);
  });
}

export async function joinLiveSession(
  socket: Socket,
  sessionId: string,
  participantMode: LiveParticipantModeDto | 'leader' | 'follower',
): Promise<void> {
  const joined = onceSocketEvent(socket, LIVE_SERVER_EVENTS.JOINED);
  const state = onceSocketEvent(socket, LIVE_SERVER_EVENTS.SESSION_STATE);
  socket.emit(LIVE_CLIENT_EVENTS.JOIN, { sessionId, participantMode });
  await joined;
  await state;
}

export { LIVE_CLIENT_EVENTS, LIVE_SERVER_EVENTS, LIVE_PAYLOAD_VERSION };
