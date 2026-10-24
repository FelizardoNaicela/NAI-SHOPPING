import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AuctionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{

  private viewers =
new Map<string, Set<string>>();
  @WebSocketServer()
  server!: Server;

  //----------------------------------
  // CONEXÃO
  //----------------------------------

  handleConnection() {
  }

  handleDisconnect(client: Socket) {

for(const [room, viewers] of this.viewers){

if(viewers.has(client.id)){

viewers.delete(client.id);

const productId =
room.replace("auction:","");

this.server.to(room).emit(
"auction:viewers",
{

productId,

viewers:viewers.size,

},
);

if(viewers.size===0){

this.viewers.delete(room);

}

}

}

}

  //----------------------------------
  // SALAS
  //----------------------------------

  @SubscribeMessage('auction:join')
  handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() productId: string,
  ) {
    client.join(`auction:${productId}`);

    const room = `auction:${productId}`;

let roomViewers =
this.viewers.get(room);

if(!roomViewers){

roomViewers=new Set();

this.viewers.set(
room,
roomViewers,
);

}

roomViewers.add(client.id);

this.server.to(room).emit(
"auction:viewers",
{

productId,

viewers:roomViewers.size,

},
);}

  @SubscribeMessage('auction:leave')
  handleLeaveAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() productId: string,
  ) {
    client.leave(`auction:${productId}`);

    const room = `auction:${productId}`;

const roomViewers =
this.viewers.get(room);

if(roomViewers){

roomViewers.delete(client.id);

if(roomViewers.size===0){

this.viewers.delete(room);

}

this.server.to(room).emit(
"auction:viewers",
{

productId,

viewers:roomViewers.size,

},
);

}}

  //----------------------------------
  // EVENTOS
  //----------------------------------

  emitNewBid(data: {
  productId: string;
  bidId: string;
  currentBid: number;
  winnerId: string;
  winnerName?: string;
  createdAt?: Date;
  isWinning: boolean;
  storeId?: string;
storeName?: string;
storeAvatarUrl?: string;
}) {
  this.server
    .to(`auction:${data.productId}`)
    .emit("auction:newBid", data);
}

  emitAuctionClosed(data: {
    productId: string;
    winnerId?: string;
    winnerName?: string;
    finalBid?: number;
  }) {
    this.server
      .to(`auction:${data.productId}`)
      .emit('auction:closed', data);
  }

  emitAuctionExtended(data: {
    productId: string;
    newEndDate: Date;
  }) {
    this.server
      .to(`auction:${data.productId}`)
      .emit('auction:extended', data);
  }

  //----------------------------------
  // UTILITÁRIOS
  //----------------------------------

  getConnectedUsers(productId: string) {
    const room =
      this.server.sockets.adapter.rooms.get(
        `auction:${productId}`,
      );

    return room ? room.size : 0;
  }
}