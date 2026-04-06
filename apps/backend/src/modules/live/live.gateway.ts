import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { AppConfiguration } from '../../config/configuration';
import { JwtPayload } from '../auth/types/jwt-payload.type';

import { LIVE_CLIENT_EVENTS, LIVE_SERVER_EVENTS, LIVE_PAYLOAD_VERSION } from './constants/live.events';
import { liveFollowersRoom, liveSessionRoom } from './constants/live-rooms';
import { LiveParticipantModeDto, LiveJoinPayloadDto } from './dto/ws/live-join.dto';
import { LiveSessionIdPayloadDto } from './dto/ws/live-session-id.dto';
import { LiveSongAddPayloadDto } from './dto/ws/live-song-add.dto';
import { LiveSongRemovePayloadDto } from './dto/ws/live-song-remove.dto';
import { LiveSongsReorderPayloadDto } from './dto/ws/live-songs-reorder.dto';
import { LiveSyncPagePayloadDto } from './dto/ws/live-sync-page.dto';
import { LiveService } from './live.service';
import type { LiveErrorServerPayload } from './types/live-ws-payloads.type';
import { assertWsDto } from './utils/ws-validate.util';

export interface LiveSocketData {
  userId?: string;
  email?: string;
  sessionIdJoined?: string;
  participantMode?: 'leader' | 'follower';
  followingLeader?: boolean;
}

@WebSocketGateway({
  namespace: '/live',
  cors: { origin: true, credentials: true },
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LiveGateway.name);

  constructor(
    private readonly liveService: LiveService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    try {
      const raw =
        typeof sock.handshake.auth?.token === 'string'
          ? sock.handshake.auth.token.replace(/^Bearer\s+/i, '')
          : typeof sock.handshake.headers?.authorization === 'string'
            ? sock.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
            : undefined;
      if (!raw?.length) {
        sock.emit(LIVE_SERVER_EVENTS.ERROR, this.err('unauthorized', 'Missing access token'));
        sock.disconnect(true);
        return;
      }
      const secret = this.configService.get('auth', { infer: true }).accessTokenSecret;
      const payload = await this.jwtService.verifyAsync<JwtPayload>(raw, { secret });
      if (payload.type !== 'access') {
        throw new Error('invalid_token_type');
      }
      sock.data.userId = payload.sub;
      sock.data.email = payload.email;
    } catch (e) {
      this.logger.warn(`WS reject: ${e instanceof Error ? e.message : e}`);
      sock.emit(LIVE_SERVER_EVENTS.ERROR, this.err('unauthorized', 'Invalid or expired token'));
      sock.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const sock = client as Socket & { data: LiveSocketData };
    const sid = sock.data.sessionIdJoined;
    if (sid) {
      sock.leave(liveSessionRoom(sid));
      sock.leave(liveFollowersRoom(sid));
    }
  }

  @SubscribeMessage(LIVE_CLIENT_EVENTS.JOIN)
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    const userId = sock.data.userId;
    if (!userId) {
      throw new WsException(this.err('unauthorized', 'Not authenticated'));
    }
    const dto = assertWsDto(LiveJoinPayloadDto, body);

    if (dto.participantMode === LiveParticipantModeDto.LEADER) {
      await this.liveService.assertJoinAsLeader(userId, dto.sessionId);
    } else {
      await this.liveService.assertReadSession(userId, dto.sessionId);
    }

    if (sock.data.sessionIdJoined && sock.data.sessionIdJoined !== dto.sessionId) {
      sock.leave(liveSessionRoom(sock.data.sessionIdJoined));
      sock.leave(liveFollowersRoom(sock.data.sessionIdJoined));
    }

    sock.join(liveSessionRoom(dto.sessionId));
    sock.data.sessionIdJoined = dto.sessionId;
    sock.data.participantMode = dto.participantMode;
    sock.data.followingLeader = false;

    sock.emit(LIVE_SERVER_EVENTS.JOINED, {
      v: LIVE_PAYLOAD_VERSION,
      sessionId: dto.sessionId,
      participantMode: dto.participantMode,
      room: liveSessionRoom(dto.sessionId),
      followingLeader: false,
    });

    const full = await this.liveService.loadSessionWithSongs(dto.sessionId);
    sock.emit(LIVE_SERVER_EVENTS.SESSION_STATE, this.liveService.buildStatePayload(full));
  }

  @SubscribeMessage(LIVE_CLIENT_EVENTS.LEAVE)
  async onLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    const dto = assertWsDto(LiveSessionIdPayloadDto, body);
    sock.leave(liveSessionRoom(dto.sessionId));
    sock.leave(liveFollowersRoom(dto.sessionId));
    if (sock.data.sessionIdJoined === dto.sessionId) {
      sock.data.sessionIdJoined = undefined;
      sock.data.participantMode = undefined;
      sock.data.followingLeader = false;
    }
    sock.emit(LIVE_SERVER_EVENTS.LEFT_ACK, { v: LIVE_PAYLOAD_VERSION, sessionId: dto.sessionId });
  }

  @SubscribeMessage(LIVE_CLIENT_EVENTS.FOLLOW_LEADER)
  async onFollow(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    const userId = sock.data.userId;
    if (!userId) {
      throw new WsException(this.err('unauthorized', 'Not authenticated'));
    }
    const dto = assertWsDto(LiveSessionIdPayloadDto, body);
    await this.liveService.assertReadSession(userId, dto.sessionId);
    sock.join(liveFollowersRoom(dto.sessionId));
    sock.data.followingLeader = true;
    sock.emit(LIVE_SERVER_EVENTS.FOLLOW_STATE, {
      v: LIVE_PAYLOAD_VERSION,
      sessionId: dto.sessionId,
      followingLeader: true,
    });
  }

  @SubscribeMessage(LIVE_CLIENT_EVENTS.UNFOLLOW)
  async onUnfollow(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    const dto = assertWsDto(LiveSessionIdPayloadDto, body);
    sock.leave(liveFollowersRoom(dto.sessionId));
    sock.data.followingLeader = false;
    sock.emit(LIVE_SERVER_EVENTS.FOLLOW_STATE, {
      v: LIVE_PAYLOAD_VERSION,
      sessionId: dto.sessionId,
      followingLeader: false,
    });
  }

  @SubscribeMessage(LIVE_CLIENT_EVENTS.SONGS_ADD)
  async onSongsAdd(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    const userId = sock.data.userId;
    if (!userId) {
      throw new WsException(this.err('unauthorized', 'Not authenticated'));
    }
    const dto = assertWsDto(LiveSongAddPayloadDto, body);
    const rows = await this.liveService.addSong(userId, dto.sessionId, dto.songId, dto.position);
    this.server.to(liveSessionRoom(dto.sessionId)).emit(
      LIVE_SERVER_EVENTS.SONGS_UPDATED,
      this.liveService.mapSongsPayload(dto.sessionId, rows),
    );
  }

  @SubscribeMessage(LIVE_CLIENT_EVENTS.SONGS_REMOVE)
  async onSongsRemove(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    const userId = sock.data.userId;
    if (!userId) {
      throw new WsException(this.err('unauthorized', 'Not authenticated'));
    }
    const dto = assertWsDto(LiveSongRemovePayloadDto, body);
    const rows = await this.liveService.removeSong(userId, dto.sessionId, dto.liveSongId);
    this.server.to(liveSessionRoom(dto.sessionId)).emit(
      LIVE_SERVER_EVENTS.SONGS_UPDATED,
      this.liveService.mapSongsPayload(dto.sessionId, rows),
    );
  }

  @SubscribeMessage(LIVE_CLIENT_EVENTS.SONGS_REORDER)
  async onSongsReorder(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    const userId = sock.data.userId;
    if (!userId) {
      throw new WsException(this.err('unauthorized', 'Not authenticated'));
    }
    const dto = assertWsDto(LiveSongsReorderPayloadDto, body);
    const rows = await this.liveService.reorderSongs(userId, dto.sessionId, dto.orderedLiveSongIds);
    this.server.to(liveSessionRoom(dto.sessionId)).emit(
      LIVE_SERVER_EVENTS.SONGS_UPDATED,
      this.liveService.mapSongsPayload(dto.sessionId, rows),
    );
  }

  @SubscribeMessage(LIVE_CLIENT_EVENTS.SYNC_PAGE)
  async onSyncPage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    const userId = sock.data.userId;
    if (!userId) {
      throw new WsException(this.err('unauthorized', 'Not authenticated'));
    }
    const dto = assertWsDto(LiveSyncPagePayloadDto, body);
    const sync = await this.liveService.leaderPublishSync(userId, dto.sessionId, dto.page);
    this.server.to(liveFollowersRoom(dto.sessionId)).emit(LIVE_SERVER_EVENTS.SYNC_BROADCAST, {
      v: LIVE_PAYLOAD_VERSION,
      sessionId: dto.sessionId,
      sync,
      emittedByUserId: userId,
    });
  }

  @SubscribeMessage(LIVE_CLIENT_EVENTS.SYNC_REQUEST)
  async onSyncRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sock = client as Socket & { data: LiveSocketData };
    const userId = sock.data.userId;
    if (!userId) {
      throw new WsException(this.err('unauthorized', 'Not authenticated'));
    }
    const dto = assertWsDto(LiveSessionIdPayloadDto, body);
    await this.liveService.assertReadSession(userId, dto.sessionId);
    const full = await this.liveService.loadSessionWithSongs(dto.sessionId);
    sock.emit(LIVE_SERVER_EVENTS.SESSION_STATE, this.liveService.buildStatePayload(full));
  }

  private err(code: string, message: string): LiveErrorServerPayload {
    return { v: LIVE_PAYLOAD_VERSION, code, message };
  }
}
