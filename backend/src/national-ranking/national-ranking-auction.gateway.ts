import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import {
  Server,
  Socket,
} from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NationalRankingAuctionGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect
{
  private viewers =
    new Map<
      string,
      Set<string>
    >();

  @WebSocketServer()
  server!: Server;

  // =========================================================
  // CONEXÃO
  // =========================================================

  handleConnection(
  ) {
  }

  // =========================================================
  // DESCONEXÃO
  // =========================================================

  handleDisconnect(
    client: Socket,
  ) {
    for (
      const [
        room,
        viewers,
      ] of this.viewers
    ) {
      if (
        viewers.has(
          client.id,
        )
      ) {
        viewers.delete(
          client.id,
        );

        const auctionId =
          room.replace(
            'national-ranking-auction:',
            '',
          );

        this.server
          .to(room)
          .emit(
            'national-ranking-auction:viewers',
            {
              auctionId,
              viewers:
                viewers.size,
            },
          );

        if (
          viewers.size === 0
        ) {
          this.viewers.delete(
            room,
          );
        }
      }
    }
  }

  // =========================================================
  // ENTRAR NO LEILÃO
  // =========================================================

  @SubscribeMessage(
    'national-ranking-auction:join',
  )
  handleJoinAuction(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    auctionId: string,
  ) {
    const room =
      `national-ranking-auction:${auctionId}`;

    client.join(room);

    let roomViewers =
      this.viewers.get(
        room,
      );

    if (
      !roomViewers
    ) {
      roomViewers =
        new Set<string>();

      this.viewers.set(
        room,
        roomViewers,
      );
    }

    roomViewers.add(
      client.id,
    );

    this.server
      .to(room)
      .emit(
        'national-ranking-auction:viewers',
        {
          auctionId,
          viewers:
            roomViewers.size,
        },
      );
  }

  // =========================================================
  // SAIR DO LEILÃO
  // =========================================================

  @SubscribeMessage(
    'national-ranking-auction:leave',
  )
  handleLeaveAuction(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    auctionId: string,
  ) {
    const room =
      `national-ranking-auction:${auctionId}`;

    client.leave(room);

    const roomViewers =
      this.viewers.get(
        room,
      );

    if (
      roomViewers
    ) {
      roomViewers.delete(
        client.id,
      );

      if (
        roomViewers.size === 0
      ) {
        this.viewers.delete(
          room,
        );
      }

      this.server
        .to(room)
        .emit(
          'national-ranking-auction:viewers',
          {
            auctionId,
            viewers:
              roomViewers.size,
          },
        );
    }
  }

  // =========================================================
  // NOVO LANCE
  // =========================================================

  emitNewBid(
    data: {
      auctionId: string;

      bidId: string;

      currentBid: number;

      winnerUserId: string;

      winnerName?: string;

      storeId: string;

      storeName: string;

      storeAvatarUrl?: string;

      createdAt?: Date;

      isWinning: boolean;
    },
  ) {
    this.server
      .to(
        `national-ranking-auction:${data.auctionId}`,
      )
      .emit(
        'national-ranking-auction:newBid',
        data,
      );
  }

  // =========================================================
  // LEILÃO ESTENDIDO
  // =========================================================

  emitAuctionExtended(
    data: {
      auctionId: string;

      newEndDate: Date;
    },
  ) {
    this.server
      .to(
        `national-ranking-auction:${data.auctionId}`,
      )
      .emit(
        'national-ranking-auction:extended',
        data,
      );
  }

  // =========================================================
  // LEILÃO ENCERRADO
  // =========================================================

  emitAuctionClosed(
    data: {
      auctionId: string;

      winnerStoreId?: string;

      finalBid?: number;
    },
  ) {
    this.server
      .to(
        `national-ranking-auction:${data.auctionId}`,
      )
      .emit(
        'national-ranking-auction:closed',
        data,
      );
  }

  // =========================================================
  // UTILITÁRIO
  // =========================================================

  getConnectedUsers(
    auctionId: string,
  ) {
    const room =
      this.server.sockets.adapter.rooms.get(
        `national-ranking-auction:${auctionId}`,
      );

    return room
      ? room.size
      : 0;
  }
}