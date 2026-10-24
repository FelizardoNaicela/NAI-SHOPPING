import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { LegalEvidenceService } from '../legal-investigation/legal-evidence.service';

@Injectable()
export class ChatService {
 constructor(
  private prisma: PrismaService,
  private readonly legalEvidenceService: LegalEvidenceService,
) {}

  // =========================================
  // CONVERSA
  // =========================================

  async getOrCreateConversation(
    userId: string,
    storeId: string,
  ) {
    let conversation =
      await this.prisma.conversation.findUnique({
        where: {
          userId_storeId: {
            userId,
            storeId,
          },
        },
      });

    if (!conversation) {
      conversation =
        await this.prisma.conversation.create({
          data: {
            userId,
            storeId,
          },
        });
    }

    return conversation;
  }

  async getConversationById(
    conversationId: string,
  ) {
    return this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },

      include: {
        store: true,
      },
    });
  }

  // =========================================
  // HELPERS
  // =========================================

private async buildMessageInclude() {
  return {
    reactions: true,

    sender: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    },

    conversation: {
      select: {
        id: true,
        userId: true,

        store: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            avatarUrl: true,
          },
        },
      },
    },

    replyTo: {
      select: {
        id: true,
        content: true,
        senderId: true,
        imageUrl: true,
        audioUrl: true,
        thumbnailUrl: true,
        messageType: true,
        documentName: true,
        reactions: true,
      },
    },

    sharedMessage: {
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },

        sharedProduct: {
          include: {
            images: {
              where: {
                isCover: true,
              },
              take: 1,
            },

            store: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },

        sharedPost: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    },

    sharedProduct: {
      include: {
        images: {
          where: {
            isCover: true,
          },
          take: 1,
        },

        store: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    },

    sharedPost: {
      include: {
        store: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    },
  };
}

  // =========================================
  // CREATE MESSAGE
  // =========================================

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    replyToId?: string;
  }) {
    if (!data.content?.trim()) {
      throw new BadRequestException(
        'Mensagem vazia',
      );
    }

    const conversation =
      await this.prisma.conversation.findUnique({
        where: {
          id: data.conversationId,
        },

        include: {
          store: true,
        },
      });

    if (!conversation) {
      throw new BadRequestException(
        'Conversa não existe',
      );
    }

    const storeOwnerId =
      conversation.store.ownerId;

    if (
      data.senderId !== conversation.userId &&
      data.senderId !== storeOwnerId
    ) {
      throw new BadRequestException(
        'Sem permissão',
      );
    }

    const receiverId =
      data.senderId === conversation.userId
        ? storeOwnerId
        : conversation.userId;

    const message =
      await this.prisma.message.create({
        data: {
          conversationId:
            data.conversationId,

          senderId: data.senderId,

          receiverId,

          content: data.content,

          replyToId: data.replyToId,
        },

        include:
          await this.buildMessageInclude(),
      });

    await this.prisma.conversation.update({
      where: {
        id: data.conversationId,
      },

      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  }

  async sendMessage(
    senderId: string,
    conversationId: string,
    content: string,
  ) {
    return this.createMessage({
      senderId,
      conversationId,
      content,
    });
  }

  // =========================================
  // IMAGE MESSAGE
  // =========================================


// =========================================
// IMAGE MESSAGE
// =========================================

async createImageMessage(data: {
  conversationId: string;
  senderId: string;
  imageUrl: string;
  replyToId?: string;
}) {
  const conversation =
    await this.prisma.conversation.findUnique({
      where: {
        id: data.conversationId,
      },
      include: {
        store: true,
      },
    });

  if (!conversation) {
    throw new BadRequestException(
      'Conversa não encontrada.',
    );
  }

  if (
    data.senderId !== conversation.userId &&
    data.senderId !== conversation.store.ownerId
  ) {
    throw new BadRequestException(
      'Não tens autorização para enviar mensagens nesta conversa.',
    );
  }

  const receiverId =
    data.senderId === conversation.userId
      ? conversation.store.ownerId
      : conversation.userId;

  return this.prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      receiverId,
      imageUrl: data.imageUrl,
      messageType: 'IMAGE',
      replyToId: data.replyToId,
    },
    include: await this.buildMessageInclude(),
  });
}

// =========================================
// AUDIO MESSAGE
// =========================================

async createAudioMessage(data: {
  conversationId: string;
  senderId: string;
  audioUrl: string;
  replyToId?: string;
}) {
  const conversation =
    await this.prisma.conversation.findUnique({
      where: {
        id: data.conversationId,
      },
      include: {
        store: true,
      },
    });

  if (!conversation) {
    throw new BadRequestException(
      'Conversa não encontrada.',
    );
  }

  if (
    data.senderId !== conversation.userId &&
    data.senderId !== conversation.store.ownerId
  ) {
    throw new BadRequestException(
      'Não tens autorização para enviar mensagens nesta conversa.',
    );
  }

  const receiverId =
    data.senderId === conversation.userId
      ? conversation.store.ownerId
      : conversation.userId;

  return this.prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      receiverId,
      audioUrl: data.audioUrl,
      messageType: 'AUDIO',
      replyToId: data.replyToId,
    },
    include: await this.buildMessageInclude(),
  });
}

// =========================================
// VIDEO MESSAGE
// =========================================

async createVideoMessage(data: {
  conversationId: string;
  senderId: string;
  videoUrl: string;
  replyToId?: string;
  thumbnailUrl?: string;
}) {
  const conversation =
    await this.prisma.conversation.findUnique({
      where: {
        id: data.conversationId,
      },
      include: {
        store: true,
      },
    });

  if (!conversation) {
    throw new BadRequestException(
      'Conversa não encontrada.',
    );
  }

  if (
    data.senderId !== conversation.userId &&
    data.senderId !== conversation.store.ownerId
  ) {
    throw new BadRequestException(
      'Não tens autorização para enviar mensagens nesta conversa.',
    );
  }

  const receiverId =
    data.senderId === conversation.userId
      ? conversation.store.ownerId
      : conversation.userId;

  return this.prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      receiverId,
      videoUrl: data.videoUrl,
      messageType: 'VIDEO',
      replyToId: data.replyToId,
      thumbnailUrl: data.thumbnailUrl,
    },
    include: await this.buildMessageInclude(),
  });
}

// =========================================
// DOCUMENT MESSAGE
// =========================================

async createDocumentMessage(data: {
  conversationId: string;
  senderId: string;
  documentUrl: string;
  documentName: string;
  replyToId?: string;
}) {
  const conversation =
    await this.prisma.conversation.findUnique({
      where: {
        id: data.conversationId,
      },
      include: {
        store: true,
      },
    });

  if (!conversation) {
    throw new BadRequestException(
      'Conversa não encontrada.',
    );
  }

  if (
    data.senderId !== conversation.userId &&
    data.senderId !== conversation.store.ownerId
  ) {
    throw new BadRequestException(
      'Não tens autorização para enviar mensagens nesta conversa.',
    );
  }

  const receiverId =
    data.senderId === conversation.userId
      ? conversation.store.ownerId
      : conversation.userId;

  return this.prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      receiverId,
      documentUrl: data.documentUrl,
      documentName: data.documentName,
      messageType: 'DOCUMENT',
      replyToId: data.replyToId,
    },
    include: await this.buildMessageInclude(),
  });
}

// =========================================
// LOCATION MESSAGE
// =========================================

async createLocationMessage(data: {
  conversationId: string;
  senderId: string;
  latitude: number;
  longitude: number;
  replyToId?: string;
}) {
  const conversation =
    await this.prisma.conversation.findUnique({
      where: {
        id: data.conversationId,
      },
      include: {
        store: true,
      },
    });

  if (!conversation) {
    throw new BadRequestException(
      'Conversa não encontrada.',
    );
  }

  if (
    data.senderId !== conversation.userId &&
    data.senderId !== conversation.store.ownerId
  ) {
    throw new BadRequestException(
      'Não tens autorização para enviar mensagens nesta conversa.',
    );
  }

  const receiverId =
    data.senderId === conversation.userId
      ? conversation.store.ownerId
      : conversation.userId;

  return this.prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      receiverId,
      latitude: data.latitude,
      longitude: data.longitude,
      messageType: 'LOCATION',
      replyToId: data.replyToId,
    },
    include: await this.buildMessageInclude(),
  });
}

async createSharedMessage(data: {
  conversationId: string;
  senderId: string;
  sharedMessageId: string;
}) {
  if (
    !data.conversationId?.trim() ||
    !data.senderId?.trim() ||
    !data.sharedMessageId?.trim()
  ) {
    throw new BadRequestException(
      'Dados de partilha inválidos.',
    );
  }

  return this.prisma.$transaction(async (tx) => {
    // 1. Confirmar que o remetente participa
    // na conversa de destino.
    const destinationConversation =
      await tx.conversation.findFirst({
        where: {
          id: data.conversationId,
          OR: [
            {
              userId: data.senderId,
            },
            {
              store: {
                ownerId: data.senderId,
              },
            },
          ],
        },
        include: {
          store: {
            select: {
              ownerId: true,
            },
          },
        },
      });

    if (!destinationConversation) {
      throw new BadRequestException(
        'Conversa não encontrada ou acesso não autorizado.',
      );
    }

    // 2. Resolver a mensagem original.
    // O Set impede ciclos de referências.
    let currentMessageId = data.sharedMessageId;

    const visitedMessageIds = new Set<string>();

    while (true) {
      if (visitedMessageIds.has(currentMessageId)) {
        throw new BadRequestException(
          'Foi detetado um ciclo nas mensagens partilhadas.',
        );
      }

      visitedMessageIds.add(currentMessageId);

      const message =
        await tx.message.findUnique({
          where: {
            id: currentMessageId,
          },
          select: {
            id: true,
            messageType: true,
            sharedMessageId: true,
            deletedAt: true,
            conversation: {
              select: {
                userId: true,
                store: {
                  select: {
                    ownerId: true,
                  },
                },
              },
            },
          },
        });

      if (!message) {
        throw new BadRequestException(
          'Mensagem original não encontrada.',
        );
      }

      // Não permitir partilhar mensagens eliminadas.
      if (message.deletedAt) {
        throw new BadRequestException(
          'Não é possível partilhar uma mensagem eliminada.',
        );
      }

      // 3. Confirmar autorização para aceder
      // à conversa da mensagem de origem.
      const canAccessSourceConversation =
        message.conversation.userId === data.senderId ||
        message.conversation.store.ownerId === data.senderId;

      if (!canAccessSourceConversation) {
        throw new BadRequestException(
          'Não tens autorização para partilhar esta mensagem.',
        );
      }

      // Se for uma partilha, continuar até à mensagem
      // original, evitando cadeias circulares.
      if (message.messageType === 'SHARED_MESSAGE') {
        if (!message.sharedMessageId) {
          throw new BadRequestException(
            'A mensagem partilhada não contém uma referência válida.',
          );
        }

        currentMessageId = message.sharedMessageId;
        continue;
      }

      // Encontrada a mensagem original autorizada.
      break;
    }

    // 4. Criar a partilha na conversa de destino.
    const receiverId =
      data.senderId === destinationConversation.userId
        ? destinationConversation.store.ownerId
        : destinationConversation.userId;

    const sharedMessage =
      await tx.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          receiverId,
          messageType: 'SHARED_MESSAGE',
          sharedMessageId: currentMessageId,
        },
        include: await this.buildMessageInclude(),
      });

    // 5. Atualizar a atividade da conversa.
    await tx.conversation.update({
      where: {
        id: data.conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return sharedMessage;
  });
}
  // =========================================
  // GET MESSAGES
  // =========================================

 async getMessages(
  conversationId: string,
  userId: string,
  limit = 20,
  cursor?: string,
) {
  const conversation = await this.prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        {
          userId,
        },
        {
          store: {
            ownerId: userId,
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    throw new Error('Conversa não encontrada ou acesso não autorizado.');
  }

  const messages = await this.prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit + 1,
    ...(cursor
      ? {
          cursor: {
            id: cursor,
          },
          skip: 1,
        }
      : {}),
    include: await this.buildMessageInclude(),
  });

  const hasMore = messages.length > limit;

  if (hasMore) {
    messages.pop();
  }

  return {
    messages,
    hasMore,
    nextCursor: hasMore
      ? messages[messages.length - 1]?.id ?? null
      : null,
  };
}

  // =========================================
  // EDIT MESSAGE
  // =========================================


async editMessage(
  messageId: string,
  userId: string,
  content: string,
) {
  const normalizedContent =
    content?.trim();

  if (!normalizedContent) {
    throw new BadRequestException(
      'A mensagem não pode estar vazia.',
    );
  }

  const createdPhysicalReferences: string[] = [];

  try {
    return await this.prisma.$transaction(
      async (tx) => {
        const message =
          await tx.message.findUnique({
            where: {
              id: messageId,
            },
          });

        if (!message) {
          throw new BadRequestException(
            'Mensagem não encontrada.',
          );
        }

        if (message.senderId !== userId) {
          throw new BadRequestException(
            'Sem permissão para editar esta mensagem.',
          );
        }

        if (message.deletedAt) {
          throw new BadRequestException(
            'Não é possível editar uma mensagem eliminada.',
          );
        }

        // Preservar a versão anterior se existir
        // um Legal Hold ativo que cubra a mensagem.
        await this.legalEvidenceService
  .preserveMessageInTransaction(
    message.id,
    tx,
    null,
    createdPhysicalReferences,
  );
        return tx.message.update({
          where: {
            id: messageId,
          },

          data: {
            content: normalizedContent,
            editedAt: new Date(),
          },

          include:
            await this.buildMessageInclude(),
        });
      },
    );
  } catch (error) {
    // A transação falhou: remover somente as
    // referências físicas criadas nesta tentativa.
    await this.legalEvidenceService
      .cleanupPreservedPhysicalFiles(
        createdPhysicalReferences,
      );

    throw error;
  }
}


async deleteMessage(
  messageId: string,
  userId: string,
) {
  // Regista apenas as referências físicas criadas
  // durante esta tentativa de eliminação.
  const createdPhysicalReferences: string[] = [];

  try {
    return await this.prisma.$transaction(
      async (tx) => {
        const message =
          await tx.message.findUnique({
            where: {
              id: messageId,
            },
          });

        if (!message) {
  throw new NotFoundException('Mensagem não encontrada.');
}

if (message.senderId !== userId) {
  throw new ForbiddenException('Sem permissão.');
}

        const deletedAt = new Date();

        // PRESERVAÇÃO JURÍDICA
        // Executada antes de limpar a mensagem.
        await this.legalEvidenceService
          .preserveMessageInTransaction(
            message.id,
            tx,
            deletedAt,
            createdPhysicalReferences,
          );

        // ELIMINAÇÃO LÓGICA DA MENSAGEM
        return tx.message.update({
          where: {
            id: messageId,
          },

          data: {
            deletedAt,

            content: null,

            imageUrl: null,
            audioUrl: null,
            videoUrl: null,
            thumbnailUrl: null,

            documentUrl: null,
            documentName: null,

            latitude: null,
            longitude: null,
          },

          include:
            await this.buildMessageInclude(),
        });
      },
    );
  } catch (error) {
    // A transação falhou: remover somente os ficheiros
    // de evidência criados durante esta tentativa.
    await this.legalEvidenceService
      .cleanupPreservedPhysicalFiles(
        createdPhysicalReferences,
      );

    // Preservar o erro original.
    throw error;
  }
}

  // =========================================
  // READ / DELIVERED
  // =========================================

  async markAsRead(
  conversationId: string,
  userId: string,
) {
  const now = new Date();

  await this.prisma.message.updateMany({
    where: {
      conversationId,

      receiverId: userId,

      senderId: {
        not: userId,
      },

      readAt: null,
    },

    data: {
      deliveredAt: now,
      readAt: now,
    },
  });

  return true;
}

  async markAsDelivered(
  conversationId: string,
  userId: string,
) {
  const messages =
    await this.prisma.message.findMany({
      where: {
        conversationId,

        receiverId: userId,

        senderId: {
          not: userId,
        },

        deliveredAt: null,
      },

      select: {
        id: true,
      },
    });

  if (messages.length === 0) {
    return [];
  }

  const deliveredAt = new Date();

  await this.prisma.message.updateMany({
    where: {
      id: {
        in: messages.map(
          (message) => message.id
        ),
      },
    },

    data: {
      deliveredAt,
    },
  });

  return messages.map(
    (message) => message.id
  );
}

async markAllAsDelivered(
  userId: string,
) {
  const messages =
    await this.prisma.message.findMany({
      where: {
        receiverId: userId,

        senderId: {
          not: userId,
        },

        deliveredAt: null,
      },

      select: {
        id: true,
        conversationId: true,
      },
    });

  if (messages.length === 0) {
    return [];
  }

  const deliveredAt = new Date();

  await this.prisma.message.updateMany({
    where: {
      id: {
        in: messages.map(
          (message) => message.id
        ),
      },
    },

    data: {
      deliveredAt,
    },
  });

  return messages;
}

async markMessageAsDelivered(
  messageId: string,
) {
  const message =
    await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },

      select: {
        id: true,
        deliveredAt: true,
      },
    });

  if (!message) {
    return null;
  }

  // Já foi entregue
  if (message.deliveredAt) {
    return message;
  }

  return this.prisma.message.update({
    where: {
      id: messageId,
    },

    data: {
      deliveredAt: new Date(),
    },

    select: {
      id: true,
      deliveredAt: true,
    },
  });
}

  // =========================================
  // CONVERSAS USER
  // =========================================

  async listConversations(
    userId: string,
  ) {
    return this.prisma.conversation.findMany({
      where: {
        userId,
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            ownerId: true,

            owner: {
              select: {
                lastSeen: true,
              },
            },
          },
        },

        messages: {
  orderBy: {
    createdAt: "desc",
  },

  take: 1,

  select: {
    content: true,
    messageType: true,
    documentName: true,
  },
},

        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,

                readAt: null,

                senderId: {
                  not: userId,
                },
              },
            },
          },
        },
      },

      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  // =========================================
  // CONVERSAS STORE
  // =========================================

  async listStoreConversations(
    storeId: string,
    ownerId: string,
  ) {
    return this.prisma.conversation.findMany({
      where: {
        storeId,
      },

      include: {
       user: {
  select: {
    id: true,
    name: true,
    avatarUrl: true,
    username: true,
    bio: true,
    lastSeen: true,
  },
},

        messages: {
  orderBy: {
    createdAt: "desc",
  },

  take: 1,

  select: {
    content: true,
    messageType: true,
    documentName: true,
  },
},

        _count: {
          select: {
            messages: {
              where: {
                readAt: null,

                receiverId: ownerId,

                senderId: {
                  not: ownerId,
                },
              },
            },
          },
        },
      },

      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async listStoreConversationsMultiple(
    storeIds: string[],
    ownerId: string,
  ) {
    return this.prisma.conversation.findMany({
      where: {
        storeId: {
          in: storeIds,
        },
      },

      include: {
        user: {
  select: {
    id: true,
    name: true,
    avatarUrl: true,
    username: true,
    bio: true,
    lastSeen: true,
  },
},

       messages: {
  orderBy: {
    createdAt: "desc",
  },

  take: 1,

  select: {
    content: true,
    messageType: true,
    documentName: true,
  },
},

        _count: {
          select: {
            messages: {
              where: {
                readAt: null,

                receiverId: ownerId,
              },
            },
          },
        },
      },

      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getUnreadCount(userId: string) {
  return this.prisma.message.count({
    where: {
      receiverId: userId,
      readAt: null,
      senderId: {
        not: userId,
      },
    },
  });
}


async getUnreadMessages(userId: string) {
  return this.prisma.message.findMany({
    where: {
      receiverId: userId,

      readAt: null,

      senderId: {
        not: userId,
      },
    },

    orderBy: {
      createdAt: 'asc',
    },

    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },

      conversation: {
  select: {
    id: true,
    userId: true,

    store: {
      select: {
        id: true,
        name: true,
        ownerId: true,
        avatarUrl: true,
      },
    },
  },
},

      sharedProduct: {
        include: {
          images: {
            where: {
              isCover: true,
            },
            take: 1,
          },

          store: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },

      sharedPost: {
        include: {
          store: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}

  // =========================================
  // STORES OWNER
  // =========================================

  async getStoresByOwner(
    ownerId: string,
  ) {
    return this.prisma.store.findMany({
      where: {
        ownerId,
      },
    });
  }

// =========================================
// CONVERSATION INFO
// =========================================

async getConversationInfo(
  conversationId: string,
  userId: string,
) {

  const conversation = await this.prisma.conversation.findFirst({
  where: {
    id: conversationId,
    OR: [
      {
        userId,
      },
      {
        store: {
          ownerId: userId,
        },
      },
    ],
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    },
    store: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        ownerId: true,
      },
    },
    messages: {
      orderBy: {
        createdAt: 'asc',
      },
      include: await this.buildMessageInclude(),
    },
  },
});

  if (!conversation) {

    throw new Error(
      "Conversa não encontrada",
    );

  }

  if (!conversation) {
  throw new Error(
    "Conversa não encontrada",
  );
}

return {

  participant:
    this.buildParticipant(
      conversation,
      userId,
    ),

  media: {

  images: this.getImages(conversation.messages),

  videos: this.getVideos(conversation.messages),

  gallery: this.getGallery(conversation.messages),

  audios: this.getAudios(conversation.messages),

  documents: this.getDocuments(conversation.messages),

  locations: this.getLocations(conversation.messages),

  links: this.getLinks(conversation.messages),

},

  statistics:
    this.buildStatistics(
      conversation.messages,
    ),

};

}


// =========================================
// PARTICIPANTE
// =========================================

private buildParticipant(
  conversation: any,
  userId: string,
) {

  const isStoreOwner =
    conversation.store.ownerId === userId;

  if (isStoreOwner) {

    return {

      id: conversation.user.id,

      type: "USER",

      name: conversation.user.name,

      username:
        conversation.user.username,

      avatarUrl:
        conversation.user.avatarUrl,

      bio:
        conversation.user.bio,

      lastSeen:
        conversation.user.lastSeen,

    };

  }

  return {

    id: conversation.store.id,

    type: "STORE",

    name:
      conversation.store.name,

    avatarUrl:
      conversation.store.avatarUrl,

    bio:
      conversation.store.description,

    lastSeen:
      conversation.store.lastActivity,

    verified:
      conversation.store.verified,

    verificationType:
      conversation.store.verificationType,

    region:
      conversation.store.region,

    countryCode:
      conversation.store.countryCode,

  };

}


// =========================================
// IMAGENS
// =========================================

private getImages(
  messages: any[],
) {

  return messages

    .filter(

      m =>

        m.messageType === "IMAGE" &&
        m.imageUrl,

    )

    .map(m => ({

      id: m.id,

      url: m.imageUrl,

      type: "IMAGE",

      createdAt: m.createdAt,

      senderName: m.senderName,

    }));

}

// =========================================
// VÍDEOS
// =========================================

private getVideos(
  messages: any[],
) {

  return messages

    .filter(

      m =>

        m.messageType === "VIDEO" &&
        m.videoUrl,

    )

    .map(m => ({

      id: m.id,

      url: m.videoUrl,

      type: "VIDEO",

      createdAt: m.createdAt,

      senderName: m.senderName,

    }));

}

// =========================================
// GALERIA
// =========================================

private getGallery(
    messages: any[],
) {

    return messages

        .filter(

            m =>

                (
                    m.messageType === "IMAGE" &&
                    m.imageUrl
                )

                ||

                (

                    m.messageType === "VIDEO" &&
                    m.videoUrl

                ),

        )

        .map(m => ({

            id: m.id,

            url:

                m.messageType === "IMAGE"

                    ? m.imageUrl

                    : m.videoUrl,

            type: m.messageType,

            createdAt: m.createdAt,

            senderName:

                m.sender?.name ??

                m.store?.name ??

                undefined,

        }));

}

// =========================================
// ÁUDIOS
// =========================================

private getAudios(
  messages: any[],
) {

  return messages

    .filter(

      m =>

        m.messageType === "AUDIO" &&
        m.audioUrl,

    )

    .map(m => ({

      id: m.id,

      url: m.audioUrl,

      createdAt:
        m.createdAt,

    }));

}

// =========================================
// DOCUMENTOS
// =========================================

private getDocuments(
  messages: any[],
) {

  return messages

    .filter(

      m =>

        m.messageType === "DOCUMENT" &&
        m.documentUrl,

    )

    .map(m => ({

      id: m.id,

      name:
        m.documentName,

      url:
        m.documentUrl,

      createdAt:
        m.createdAt,

    }));

}

// =========================================
// LOCALIZAÇÕES
// =========================================

private getLocations(
  messages: any[],
) {

  return messages

    .filter(

      m =>
        m.messageType ===
        "LOCATION",

    )

    .map(m => ({

      id: m.id,

      latitude:
        m.latitude,

      longitude:
        m.longitude,

      createdAt:
        m.createdAt,

    }));

}

// =========================================
// LINKS
// =========================================

private getLinks(
  messages: any[],
) {

  return messages

    .filter(

      m =>

        m.content &&
        /https?:\/\/[^\s]+/i.test(
          m.content,
        ),

    )

    .map(m => ({

      id: m.id,

      text:
        m.content,

      createdAt:
        m.createdAt,

    }));

}

// =========================================
// ESTATÍSTICAS
// =========================================

private buildStatistics(
  messages: any[],
) {

  return {

    totalMessages:
      messages.length,

    firstMessageAt:
      messages.length
        ? messages[
            messages.length - 1
          ].createdAt
        : null,

    lastMessageAt:
      messages.length
        ? messages[0].createdAt
        : null,

  };

}

async listShareConversations(
  userId: string,
) {

  const conversations =
    await this.prisma.conversation.findMany({

      where: {

        OR: [

          {
            userId,
          },

          {
            store: {
              ownerId: userId,
            },
          },

        ],

      },

      include: {

        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },

        store: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            ownerId: true,
          },
        },

        messages: {

          orderBy: {
            createdAt: "desc",
          },

          take: 1,

          select: {
            content: true,
            messageType: true,
            documentName: true,
          },

        },

      },

      orderBy: {
        updatedAt: "desc",
      },

    });

  return conversations.map((c) => {

    const isStoreOwner =
      c.store.ownerId === userId;

    const otherName =
      isStoreOwner
        ? c.user.name
        : c.store.name;

    const otherAvatar =
      isStoreOwner
        ? c.user.avatarUrl
        : c.store.avatarUrl;

    const last =
      c.messages[0];

    let preview = "Sem mensagens";

    if (last) {

      switch (last.messageType) {

        case "IMAGE":
          preview = "📷 Foto";
          break;

        case "VIDEO":
          preview = "🎥 Vídeo";
          break;

        case "AUDIO":
          preview = "🎤 Áudio";
          break;

        case "DOCUMENT":
          preview =
            `📄 ${last.documentName ?? "Documento"}`;
          break;

        case "LOCATION":
          preview = "📍 Localização";
          break;

        case "SHARED_MESSAGE":
          preview = "↗ Mensagem compartilhada";
          break;

        case "SHARED_PRODUCT":
          preview = "🛍 Produto";
          break;

        case "SHARED_POST":
          preview = "📰 Publicação";
          break;

        default:
          preview =
            last.content ??
            "Mensagem";

      }

    }

    return {

      id: c.id,

      name: otherName,

      avatarUrl: otherAvatar,

      preview,

      updatedAt: c.updatedAt,

    };

  });

}


async createSharedLink(data: {
  conversationId: string;
  senderId: string;
  sharedProductId?: string;
  sharedPostId?: string;
}) {
  if (!data.conversationId?.trim() || !data.senderId?.trim()) {
    throw new BadRequestException(
      'Dados da partilha inválidos.',
    );
  }

  const hasProduct = Boolean(data.sharedProductId?.trim());
  const hasPost = Boolean(data.sharedPostId?.trim());

  if (hasProduct === hasPost) {
    throw new BadRequestException(
      'Indica exatamente um produto ou uma publicação.',
    );
  }

  return this.prisma.$transaction(async (tx) => {
    // 1. Confirmar que o remetente participa
    // na conversa de destino.
    const conversation = await tx.conversation.findFirst({
      where: {
        id: data.conversationId,
        OR: [
          { userId: data.senderId },
          { store: { ownerId: data.senderId } },
        ],
      },
      include: {
        store: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new BadRequestException(
        'Conversa não encontrada ou acesso não autorizado.',
      );
    }

    // 2. Confirmar que o item a partilhar existe.
    if (hasProduct) {
      const product = await tx.product.findUnique({
        where: {
          id: data.sharedProductId!,
        },
        select: {
          id: true,
        },
      });

      if (!product) {
        throw new BadRequestException(
          'Produto não encontrado.',
        );
      }
    }

    if (hasPost) {
      const post = await tx.post.findUnique({
        where: {
          id: data.sharedPostId!,
        },
        select: {
          id: true,
        },
      });

      if (!post) {
        throw new BadRequestException(
          'Publicação não encontrada.',
        );
      }
    }

    // 3. Determinar o destinatário apenas depois
    // de validar o participante.
    const receiverId =
      data.senderId === conversation.userId
        ? conversation.store.ownerId
        : conversation.userId;

    // 4. Criar a partilha e atualizar a conversa
    // na mesma transação.
    const message = await tx.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        receiverId,
        messageType: 'SHARED_LINK',
        sharedProductId: data.sharedProductId,
        sharedPostId: data.sharedPostId,
      },
      include: await this.buildMessageInclude(),
    });

    await tx.conversation.update({
      where: {
        id: data.conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  });
}}