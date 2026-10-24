import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { Inject, forwardRef } from '@nestjs/common';


@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;
constructor(
  private jwtService: JwtService,
  @Inject(forwardRef(() => NotificationsService))
  private notificationsService: NotificationsService,
) {
}


  async handleConnection(client: Socket) {
  try {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }

    const payload = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    const userId = payload.sub;
    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    client.join(`user:${userId}`);

    // ✅ EMITIR CONTADOR INICIAL
    const unreadCount =
      await this.notificationsService.countUnread(userId);

    this.emitUnreadCount(userId, unreadCount);

  } catch {
    client.disconnect();
  }
}


  handleDisconnect(client: Socket) {
    // opcional
  }

  // 📡 emitir nova notificação
  notifyUser(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }

  // 🔔 emitir contador
  emitUnreadCount(userId: string, unreadCount: number) {
    this.server
      .to(`user:${userId}`)
      .emit('notification:unread-count', { unreadCount });
  }

@SubscribeMessage('notification:mark-read')
async markAsRead(
  @MessageBody() data: { id: string },
  @ConnectedSocket() client: Socket,
) {
  const userId = client.data.userId;

  if (!userId) {
    return;
  }

  await this.notificationsService.markAsRead(data.id, userId);
}

}
