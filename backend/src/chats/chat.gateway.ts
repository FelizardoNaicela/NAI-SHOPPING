import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;
private onlineUsers = new Map<string, Set<string>>();

private activeUsers = new Map<string, Set<string>>();
  constructor(
  private jwtService: JwtService,
  private chatService: ChatService,
  private prisma: PrismaService,
) {}

  // 🔐 AUTENTICAÇÃO
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

    client.data.userId = userId;

    // =========================================
    // 🔥 ONLINE
    // =========================================

    const sockets =
      this.onlineUsers.get(userId) ??
      new Set<string>();

    sockets.add(client.id);

    this.onlineUsers.set(
      userId,
      sockets,
    );

    // =========================================
    // 📦 ENTREGAR MENSAGENS RECEBIDAS OFFLINE
    // =========================================

    const deliveredMessages =
      await this.chatService.markAllAsDelivered(
        userId,
      );

    if (
      deliveredMessages.length === 0
    ) {
      return;
    }

    // =========================================
    // 📡 AGRUPAR POR CONVERSA
    // =========================================

    const grouped =
      new Map<
        string,
        string[]
      >();

    for (
      const message of deliveredMessages
    ) {
      const ids =
        grouped.get(
          message.conversationId,
        ) ?? [];

      ids.push(message.id);

      grouped.set(
        message.conversationId,
        ids,
      );
    }

    // =========================================
    // 📡 AVISAR ENTREGA
    // =========================================

    for (
      const [
        conversationId,
        messageIds,
      ] of grouped
    ) {
      this.server
        .to(
          `conversation:${conversationId}`,
        )
        .emit(
          'chat:delivered',
          {
            conversationId,
            messageIds,
          },
        );
    }

  } catch {
    client.disconnect();
  }
}

  async handleDisconnect(
  client: Socket
) {

  const userId =
    client.data.userId;

  if (!userId) return;


  // =========================================
  // SOCKET
  // =========================================

  const sockets =
    this.onlineUsers.get(
      userId
    );

  if (sockets) {

    sockets.delete(
      client.id
    );

    if (
      sockets.size === 0
    ) {
      this.onlineUsers.delete(
        userId
      );
    }
  }


  // =========================================
  // PRESENÇA NO SITE
  // =========================================

  const activeSockets =
    this.activeUsers.get(
      userId
    );

  if (activeSockets) {

    activeSockets.delete(
      client.id
    );

    if (
      activeSockets.size === 0
    ) {

      this.activeUsers.delete(
        userId
      );

      await this.prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          lastSeen:
            new Date(),
        },
      });

    }
  }
}

isUserOnline(
  userId: string
) {

  return this.activeUsers.has(
    userId
  );

}

private getUserSocketIds(
  userId: string,
): string[] {
  return Array.from(
    this.onlineUsers.get(userId) ?? [],
  );
}

private async emitNewMessage(
  message: any,
  senderId: string,
) {
  const conversationRoom =
    `conversation:${message.conversationId}`;

  // =========================================
  // 1. CHAT NORMAL
  // =========================================

  this.server
    .to(conversationRoom)
    .emit("chat:new-message", {
      ...message,
      senderId,
    });

  // =========================================
  // 2. DESTINATÁRIO FORA DA CONVERSA
  // =========================================

  const receiverSocketIds =
    this.getUserSocketIds(
      message.receiverId,
    );

  for (const socketId of receiverSocketIds) {
    const receiverSocket =
      this.server.sockets.sockets.get(
        socketId,
      );

    if (!receiverSocket) {
      continue;
    }

    if (
      receiverSocket.rooms.has(
        conversationRoom,
      )
    ) {
      continue;
    }

    receiverSocket.emit(
      "chat:new-message",
      {
        ...message,
        senderId,
      },
    );
  }
}

private async markMessageAsDeliveredIfOnline(
  message: any,
) {
  const receiverSocketIds =
    this.getUserSocketIds(
      message.receiverId,
    );

  // Destinatário não está conectado
  if (
    receiverSocketIds.length === 0
  ) {
    return;
  }

  await this.chatService.markMessageAsDelivered(
    message.id,
  );

  this.server
    .to(`conversation:${message.conversationId}`)
    .emit('chat:delivered', {
      conversationId:
        message.conversationId,

      messageIds: [message.id],
    });
}

// =========================================
// PRESENÇA NO SITE
// =========================================

@SubscribeMessage(
  "presence:active"
)
handlePresenceActive(
  @ConnectedSocket()
  client: Socket
) {

  const userId =
    client.data.userId;

  if (!userId) return;


  const activeSockets =
    this.activeUsers.get(
      userId
    ) ??
    new Set<string>();


  activeSockets.add(
    client.id
  );


  this.activeUsers.set(
    userId,
    activeSockets
  );
}


@SubscribeMessage(
  "presence:inactive"
)
async handlePresenceInactive(
  @ConnectedSocket()
  client: Socket
) {

  const userId =
    client.data.userId;

  if (!userId) return;


  const activeSockets =
    this.activeUsers.get(
      userId
    );

  if (!activeSockets) {
    return;
  }


  activeSockets.delete(
    client.id
  );


  if (
    activeSockets.size === 0
  ) {

    this.activeUsers.delete(
      userId
    );


    await this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        lastSeen:
          new Date(),
      },
    });

  }
}

  // 🔥 ENTRAR NA CONVERSA (VALIDADO)
  @SubscribeMessage('chat:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const conversation = await this.chatService.getConversationById(
      data.conversationId,
    );

    if (!conversation) return;

    const isUser = conversation.userId === userId;
    const isStoreOwner =
      conversation.store.ownerId === userId;

    if (!isUser && !isStoreOwner) {
      return;
    }

    client.join(`conversation:${data.conversationId}`);
  }

  // 💬 ENVIAR MENSAGEM
  @SubscribeMessage('chat:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
replyToId?: string;
    },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

   const message = await this.chatService.createMessage({
  conversationId: data.conversationId,
  senderId: userId,
  content: data.content,
  replyToId: data.replyToId,
});

// 🔥 NOVA MENSAGEM
await this.emitNewMessage(
  message,
  userId,
);

// 📦 ENTREGUE
await this.markMessageAsDeliveredIfOnline(
  message,
);

return message;
  }


  // ⌨️ TYPING (CORRIGIDO)
  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // 🔥 enviar só pros OUTROS
    client
      .to(`conversation:${data.conversationId}`)
      .emit('chat:typing', {
        userId,
      });
  }

  @SubscribeMessage('chat:stop-typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client
      .to(`conversation:${data.conversationId}`)
      .emit('chat:stop-typing', {
        userId,
      });
  }

 @SubscribeMessage('chat:read')
async handleRead(
  @ConnectedSocket() client: Socket,
  @MessageBody()
  data: {
    conversationId: string;
  },
) {
  const userId = client.data.userId;

  if (!userId) return;

  await this.chatService.markAsRead(
    data.conversationId,
    userId,
  );

  client
    .to(`conversation:${data.conversationId}`)
    .emit('chat:read', {
      userId,
      conversationId: data.conversationId,
    });
}

@SubscribeMessage(
  'chat:get-status'
)
async handleGetStatus(
  @ConnectedSocket()
  client: Socket,

  @MessageBody()
  data: {
    targetUserId: string;
  },
) {

  const online =
    this.activeUsers.has(
      data.targetUserId
    );

  client.emit(
    'chat:status',
    {
      userId:
        data.targetUserId,

      online,
    }
  );
}

@SubscribeMessage('chat:image')
async handleImageMessage(
  @ConnectedSocket() client: Socket,

  @MessageBody()
 data: {
  conversationId: string;
  imageUrl: string;
  replyToId?: string;
},
) {
  const userId = client.data.userId;

  if (!userId) return;

  const message =
  await this.chatService.createImageMessage({
    conversationId: data.conversationId,
    senderId: userId,
    imageUrl: data.imageUrl,
    replyToId: data.replyToId,
  });

await this.emitNewMessage(
  message,
  userId,
);

return message;
}

@SubscribeMessage("chat:edit")
async handleEdit(
  @ConnectedSocket() client: Socket,
  @MessageBody()
  body: {
    messageId: string;
    content: string;
  }
) {
  const userId = client.data.userId;

  const message =
    await this.chatService.editMessage(
      body.messageId,
      userId,
      body.content
    );

  this.server.to(
  `conversation:${message.conversationId}`
).emit(
  "chat:message-edited",
  message
);
}

@SubscribeMessage("chat:delete")
async handleDelete(
  @ConnectedSocket() client: Socket,
  @MessageBody()
  body: {
    messageId: string;
  }
) {
  const userId = client.data.userId;

  const message =
    await this.chatService.deleteMessage(
      body.messageId,
      userId
    );

  this.server.to(
  `conversation:${message.conversationId}`
).emit(
  "chat:message-deleted",
  {
    messageId: message.id,
  }
);
}

@SubscribeMessage("chat:react")
async handleReact(
  @ConnectedSocket() client: Socket,
  @MessageBody()
  body: {
    messageId: string;
    emoji: string;
  }
) {
  const userId = client.data.userId;

  if (!userId) return;

  const existingReaction =
    await this.prisma.messageReaction.findFirst({
      where: {
        messageId: body.messageId,
        userId,
        emoji: body.emoji,
      },
    });

  // remove reação se já existir
  if (existingReaction) {
    await this.prisma.messageReaction.delete({
      where: {
        id: existingReaction.id,
      },
    });
  } else {
    // adiciona reação
    await this.prisma.messageReaction.create({
      data: {
        messageId: body.messageId,
        userId,
        emoji: body.emoji,
      },
    });
  }

  // pega mensagem atualizada
  const updatedMessage =
  await this.prisma.message.findUnique({
    where: {
      id: body.messageId,
    },

    include: {
      reactions: true,

      sender: {
        select: {
          id: true,
          name: true,
        },
      },

      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          imageUrl: true,
          messageType: true,
        },
      },
    },
  });

  if (!updatedMessage) return;

  this.server.to(
  `conversation:${updatedMessage.conversationId}`
).emit(
  "chat:message-reacted",
  updatedMessage
);
}

@SubscribeMessage('chat:audio')
async handleAudioMessage(
  @ConnectedSocket() client: Socket,

  @MessageBody()
  data: {
  conversationId: string;
  audioUrl: string;
  replyToId?: string;
},
) {
  const userId = client.data.userId;

  if (!userId) return;

  const message =
   await this.chatService.createAudioMessage({
  conversationId: data.conversationId,
  senderId: userId,
  audioUrl: data.audioUrl,
  replyToId: data.replyToId,
});

  await this.emitNewMessage(
  message,
  userId,
);

  return message;
}

@SubscribeMessage("chat:delivered")
async handleDelivered(
  @ConnectedSocket() client: Socket,

  @MessageBody()
  data: {
    conversationId: string;
  }
) {
  const userId = client.data.userId;

  if (!userId) return;

  const messageIds =
  await this.chatService.markAsDelivered(
    data.conversationId,
    userId
  );

this.server
  .to(
    `conversation:${data.conversationId}`
  )
  .emit("chat:delivered", {
    conversationId: data.conversationId,
    messageIds,
  });
}


@SubscribeMessage('chat:video')
async handleVideoMessage(
  @ConnectedSocket() client: Socket,

  @MessageBody()
 data: {
  conversationId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  replyToId?: string;
},
) {
  const userId = client.data.userId;

  if (!userId) return;

  const message =
  await this.chatService.createVideoMessage({
  conversationId: data.conversationId,
  senderId: userId,
  videoUrl: data.videoUrl,
  thumbnailUrl: data.thumbnailUrl,
  replyToId: data.replyToId,
});

  await this.emitNewMessage(
  message,
  userId,
);

  return message;
}

@SubscribeMessage('chat:document')
async handleDocumentMessage(
  @ConnectedSocket() client: Socket,

  @MessageBody()
  data: {
    conversationId: string;
    documentUrl: string;
    documentName: string;
    replyToId?: string;
  },
) {
  const userId = client.data.userId;

  if (!userId) return;

  const message =
    await this.chatService.createDocumentMessage({
      conversationId: data.conversationId,
      senderId: userId,
      documentUrl: data.documentUrl,
      documentName: data.documentName,
      replyToId: data.replyToId,
    });

  await this.emitNewMessage(
  message,
  userId,
);

  return message;
}


@SubscribeMessage('chat:location')
async handleLocationMessage(
  @ConnectedSocket() client: Socket,

  @MessageBody()
  data: {
    conversationId: string;
    latitude: number;
    longitude: number;
    replyToId?: string;
  },
) {
  const userId = client.data.userId;

  if (!userId) return;

  const message =
    await this.chatService.createLocationMessage({
      conversationId: data.conversationId,
      senderId: userId,
      latitude: data.latitude,
      longitude: data.longitude,
      replyToId: data.replyToId,
    });

  await this.emitNewMessage(
  message,
  userId,
);

  return message;
}

@SubscribeMessage("chat:share-message")
async handleShareMessage(
  @ConnectedSocket() client: Socket,

  @MessageBody()
  data: {
    conversationId: string;
    sharedMessageId: string;
  },
) {
  const userId = client.data.userId;

  if (!userId) return;

  const message =
    await this.chatService.createSharedMessage({
      conversationId: data.conversationId,
      senderId: userId,
      sharedMessageId: data.sharedMessageId,
    });

  await this.emitNewMessage(
  message,
  userId,
);

  return message;
}

@SubscribeMessage('chat:share-link')
async handleShareLink(
  @ConnectedSocket() client: Socket,

  @MessageBody()
  data: {
    conversationId: string;
    sharedProductId?: string;
    sharedPostId?: string;
  },
) {

  const userId = client.data.userId;

  if (!userId) return;

  const message =
    await this.chatService.createSharedLink({
      conversationId: data.conversationId,
      senderId: userId,
      sharedProductId: data.sharedProductId,
      sharedPostId: data.sharedPostId,
    });

  await this.emitNewMessage(
  message,
  userId,
);

  return message;
}
}