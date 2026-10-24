import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

import { Readable } from 'stream';

import {
  createReadStream,
  createWriteStream,
} from 'fs';

import {
  mkdir,
  rm,
  stat,
  open,
} from 'fs/promises';

import {
  basename,
  join,
  relative,
  resolve,
} from 'path';

import {
  pipeline,
} from 'stream/promises';

import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
} from '@prisma/client';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class LegalEvidenceService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(
  LegalEvidenceService.name,
);

  // =========================================================
  // PRESERVAR UMA MENSAGEM
  // =========================================================

  async preserveMessage(
    messageId: string,
  ): Promise<number> {
    if (!messageId?.trim()) {
      throw new BadRequestException(
        'ID da mensagem é obrigatório.',
      );
    }

    const normalizedMessageId =
      messageId.trim();

    const message =
      await this.prisma.message.findUnique({
        where: {
          id: normalizedMessageId,
        },

        select: {
          id: true,
          conversationId: true,

          senderId: true,
          receiverId: true,

          messageType: true,
          content: true,

          imageUrl: true,
          audioUrl: true,
          videoUrl: true,

          documentName: true,
          documentUrl: true,
          thumbnailUrl: true,

          latitude: true,
          longitude: true,

          replyToId: true,
          sharedMessageId: true,
          sharedProductId: true,
          sharedPostId: true,

          createdAt: true,
          editedAt: true,
          deletedAt: true,

          conversation: {
            select: {
              userId: true,
              storeId: true,
            },
          },
        },
      });

    if (!message) {
      return 0;
    }


const userScopeConditions: Prisma.LegalHoldWhereInput[] = [
  { userId: message.senderId },
  { userId: message.conversation.userId },
];

if (message.receiverId) {
  userScopeConditions.push({
    userId: message.receiverId,
  });
}

userScopeConditions.push({
  userId: null,
});

    // ---------------------------------------------------------
    // ENCONTRAR HOLDS ATIVOS QUE COBREM ESTA MENSAGEM
    // ---------------------------------------------------------

    const holds =
      await this.prisma.legalHold.findMany({
        where: {
          status: 'ACTIVE',

          AND: [
            {
              OR: [
                {
                  messageId: message.id,
                },

                {
                  messageId: null,
                },
              ],
            },

            {
              OR: [
                {
                  conversationId:
                    message.conversationId,
                },

                {
                  conversationId: null,
                },
              ],
            },

            {
              OR: [
                {
                  storeId:
                    message.conversation.storeId,
                },

                {
                  storeId: null,
                },
              ],
            },

            {
  OR: userScopeConditions,
},

            {
              OR: [
                {
                  fromDate: null,
                },

                {
                  fromDate: {
                    lte: message.createdAt,
                  },
                },
              ],
            },

            {
              OR: [
                {
                  toDate: null,
                },

                {
                  toDate: {
                    gte: message.createdAt,
                  },
                },
              ],
            },
          ],
        },


select: {
  id: true,
  investigationId: true,
  messageId: true,
  conversationId: true,
  storeId: true,
  userId: true,
  fromDate: true,
  toDate: true,
},
      });


const matchingHolds = holds.filter((hold) =>
  this.messageMatchesHoldScope(message, hold),
);

if (matchingHolds.length === 0) {
  return 0;
}

    // ---------------------------------------------------------
    // SNAPSHOT DA MENSAGEM
    // ---------------------------------------------------------

    const snapshot = {
      id: message.id,

      conversationId:
        message.conversationId,

      senderId:
        message.senderId,

      receiverId:
        message.receiverId,

      messageType:
        message.messageType,

      content:
        message.content,

      imageUrl:
        message.imageUrl,

      audioUrl:
        message.audioUrl,

      videoUrl:
        message.videoUrl,

      documentName:
        message.documentName,

      documentUrl:
        message.documentUrl,

      thumbnailUrl:
        message.thumbnailUrl,

      latitude:
        message.latitude,

      longitude:
        message.longitude,

      replyToId:
        message.replyToId,

      sharedMessageId:
        message.sharedMessageId,

      sharedProductId:
        message.sharedProductId,

      sharedPostId:
        message.sharedPostId,

      createdAt:
        message.createdAt.toISOString(),

      editedAt:
        message.editedAt?.toISOString() ?? null,

      deletedAt:
        message.deletedAt?.toISOString() ?? null,
    };

    const plaintext =
      JSON.stringify(snapshot);

    // ---------------------------------------------------------
    // HASH DA EVIDÊNCIA
    // ---------------------------------------------------------

    const evidenceHash =
      createHash('sha256')
        .update(plaintext, 'utf8')
        .digest('hex');

    // ---------------------------------------------------------
    // PROTEGER O CONTEÚDO
    // ---------------------------------------------------------

    const encryptedContent =
      this.encrypt(plaintext);

    let createdCount = 0;

    // ---------------------------------------------------------
    // CRIAR UMA EVIDÊNCIA POR INVESTIGAÇÃO
    // ---------------------------------------------------------

for (const hold of matchingHolds) {
      const existing =
        await this.prisma.legalMessageEvidence.findUnique({
          where: {
            messageId_investigationId: {
              messageId: message.id,
              investigationId:
                hold.investigationId,
            },
          },

          select: {
            id: true,
          },
        });

      if (existing) {
        continue;
      }

     const physicalMedia =
  await this.preservePhysicalMediaSet(
    message,
    hold.investigationId,
  );

try {
  await this.prisma.legalMessageEvidence.create({
    data: {
      messageId: message.id,

      investigationId:
        hold.investigationId,

      holdId:
        hold.id,

      conversationId:
        message.conversationId,

      senderId:
        message.senderId,

      receiverId:
        message.receiverId,

      messageType:
        message.messageType,

      encryptedContent,

      encryptedAudioReference:
        physicalMedia.encryptedAudioReference,

      encryptedImageReference:
        physicalMedia.encryptedImageReference,

      encryptedVideoReference:
        physicalMedia.encryptedVideoReference,

      encryptedThumbnailReference:
        physicalMedia.encryptedThumbnailReference,

      encryptedDocumentReference:
        physicalMedia.encryptedDocumentReference,

      documentName:
        message.documentName,

      evidenceHash,

      capturedAt:
        new Date(),
    },
  });

  createdCount++;
} catch (error) {
  await this.cleanupPhysicalFiles([
    physicalMedia.encryptedAudioReference,
    physicalMedia.encryptedImageReference,
    physicalMedia.encryptedVideoReference,
    physicalMedia.encryptedThumbnailReference,
    physicalMedia.encryptedDocumentReference,
  ]);

  throw error;
}    }

    return createdCount;
  }

  async preserveMessagesForHold(
  holdId: string,
): Promise<number> {
  if (!holdId?.trim()) {
    throw new BadRequestException(
      'ID do Legal Hold é obrigatório.',
    );
  }

  const normalizedHoldId = holdId.trim();

  const hold =
    await this.prisma.legalHold.findUnique({
      where: {
        id: normalizedHoldId,
      },
      select: {
        id: true,
        status: true,

        userId: true,
        storeId: true,
        conversationId: true,
        messageId: true,

        fromDate: true,
        toDate: true,
      },
    });

  if (!hold) {
    throw new BadRequestException(
      'Legal Hold não encontrado.',
    );
  }

  if (hold.status !== 'ACTIVE') {
    throw new BadRequestException(
      'O Legal Hold não está ativo.',
    );
  }

  const andConditions: Prisma.MessageWhereInput[] = [];

  // =========================================================
  // MENSAGEM ESPECÍFICA
  // =========================================================

  if (hold.messageId) {
    andConditions.push({
      id: hold.messageId,
    });
  }

  // =========================================================
  // CONVERSA
  // =========================================================

  if (hold.conversationId) {
    andConditions.push({
      conversationId: hold.conversationId,
    });
  }

  // =========================================================
  // BANCA
  // =========================================================

  if (hold.storeId) {
    andConditions.push({
      conversation: {
        storeId: hold.storeId,
      },
    });
  }

  // =========================================================
  // UTILIZADOR
  // =========================================================


if (hold.userId) {
  andConditions.push({
    OR: [
      { senderId: hold.userId },
      { receiverId: hold.userId },
      {
        conversation: {
          userId: hold.userId,
        },
      },
    ],
  });
}

  // =========================================================
  // DATA INICIAL
  // =========================================================

  if (hold.fromDate) {
    andConditions.push({
      createdAt: {
        gte: hold.fromDate,
      },
    });
  }

  // =========================================================
  // DATA FINAL
  // =========================================================

  if (hold.toDate) {
    andConditions.push({
      createdAt: {
        lte: hold.toDate,
      },
    });
  }

  if (andConditions.length === 0) {
    throw new BadRequestException(
      'O Legal Hold não possui um escopo válido.',
    );
  }

  const messages =
    await this.prisma.message.findMany({
      where: {
        AND: andConditions,
      },

      select: {
        id: true,
      },

      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

  let preservedCount = 0;

  for (const message of messages) {
  preservedCount +=
    await this.preserveMessageForHold(
      message.id,
      hold.id,
    );
}

  return preservedCount;
}

// =========================================================
// PRESERVAR MENSAGEM DENTRO DE UMA TRANSAÇÃO
// =========================================================

async preserveMessageInTransaction(
  messageId: string,
  tx: Prisma.TransactionClient,
  originalDeletedAt: Date | null,
  createdPhysicalReferences: string[] = [],
) {
  if (!messageId?.trim()) {
    throw new BadRequestException(
      'ID da mensagem é obrigatório.',
    );
  }

  const normalizedMessageId =
    messageId.trim();

  const message =
    await tx.message.findUnique({
      where: {
        id: normalizedMessageId,
      },

      select: {
        id: true,
        conversationId: true,

        senderId: true,
        receiverId: true,

        messageType: true,
        content: true,

        imageUrl: true,
        audioUrl: true,
        videoUrl: true,

        documentName: true,
        documentUrl: true,
        thumbnailUrl: true,

        latitude: true,
        longitude: true,

        replyToId: true,
        sharedMessageId: true,
        sharedProductId: true,
        sharedPostId: true,

        createdAt: true,
        editedAt: true,
        deletedAt: true,

        conversation: {
          select: {
            userId: true,
            storeId: true,
          },
        },
      },
    });

  if (!message) {
    throw new BadRequestException(
      'Mensagem não encontrada.',
    );
  }

  // ---------------------------------------------------------
  // ENCONTRAR HOLDS ATIVOS QUE COBREM ESTA MENSAGEM
  // ---------------------------------------------------------


const userScopeConditions: Prisma.LegalHoldWhereInput[] = [
  { userId: message.senderId },
  { userId: message.conversation.userId },
];

if (message.receiverId) {
  userScopeConditions.push({
    userId: message.receiverId,
  });
}

userScopeConditions.push({
  userId: null,
});

  const holds =
    await tx.legalHold.findMany({
      where: {
        status: 'ACTIVE',

        AND: [
          {
            OR: [
              {
                messageId: message.id,
              },

              {
                messageId: null,
              },
            ],
          },

          {
            OR: [
              {
                conversationId:
                  message.conversationId,
              },

              {
                conversationId: null,
              },
            ],
          },

          {
            OR: [
              {
                storeId:
                  message.conversation.storeId,
              },

              {
                storeId: null,
              },
            ],
          },

          {
            OR: userScopeConditions,
          },

          {
            OR: [
              {
                fromDate: null,
              },

              {
                fromDate: {
                  lte: message.createdAt,
                },
              },
            ],
          },

          {
            OR: [
              {
                toDate: null,
              },

              {
                toDate: {
                  gte: message.createdAt,
                },
              },
            ],
          },
        ],
      },


select: {
  id: true,
  investigationId: true,
  messageId: true,
  conversationId: true,
  storeId: true,
  userId: true,
  fromDate: true,
  toDate: true,
},
    });


const matchingHolds = holds.filter((hold) =>
  this.messageMatchesHoldScope(message, hold),
);

if (matchingHolds.length === 0) {
  return 0;
}

  // ---------------------------------------------------------
  // SNAPSHOT DA MENSAGEM ANTES DA ELIMINAÇÃO
  // ---------------------------------------------------------

  const snapshot = {
    id: message.id,
    conversationId: message.conversationId,

    senderId: message.senderId,
    receiverId: message.receiverId,

    messageType: message.messageType,

    content: message.content,

    imageUrl: message.imageUrl,
    audioUrl: message.audioUrl,
    videoUrl: message.videoUrl,

    documentName: message.documentName,
    documentUrl: message.documentUrl,
    thumbnailUrl: message.thumbnailUrl,

    latitude: message.latitude,
    longitude: message.longitude,

    replyToId: message.replyToId,
    sharedMessageId: message.sharedMessageId,
    sharedProductId: message.sharedProductId,
    sharedPostId: message.sharedPostId,

    createdAt:
      message.createdAt.toISOString(),

    editedAt:
      message.editedAt?.toISOString() ?? null,

    deletedAt:
      message.deletedAt?.toISOString() ?? null,
  };

  const plaintext =
    JSON.stringify(snapshot);

  const evidenceHash =
    createHash('sha256')
      .update(plaintext, 'utf8')
      .digest('hex');

  const encryptedContent =
    this.encrypt(plaintext);

  let createdCount = 0;

  // ---------------------------------------------------------
  // CRIAR / ATUALIZAR EVIDÊNCIA
  // ---------------------------------------------------------

for (const hold of matchingHolds) {
    const existing =
      await tx.legalMessageEvidence.findUnique({
        where: {
          messageId_investigationId: {
            messageId: message.id,
            investigationId:
              hold.investigationId,
          },
        },

        select: {
          id: true,
          originalDeletedAt: true,
        },
      });


if (existing) {
  // Nunca substituir a evidência original.
  // Só registar a eliminação quando existe
  // efetivamente uma operação de eliminação.

  if (
    originalDeletedAt &&
    !existing.originalDeletedAt
  ) {
    await tx.legalMessageEvidence.update({
      where: {
        id: existing.id,
      },
      data: {
        originalDeletedAt,
      },
    });
  }

  continue;
}

    const physicalMedia =
  await this.preservePhysicalMediaSet(
    message,
    hold.investigationId,
  );

createdPhysicalReferences.push(
  ...Object.values(physicalMedia).filter(
    (reference): reference is string =>
      typeof reference === 'string',
  ),
);

  try {
  await tx.legalMessageEvidence.create({
    data: {
      messageId: message.id,

      investigationId:
        hold.investigationId,

      holdId:
        hold.id,

      conversationId:
        message.conversationId,

      senderId:
        message.senderId,

      receiverId:
        message.receiverId,

      messageType:
        message.messageType,

      encryptedContent,

      encryptedAudioReference:
        physicalMedia.encryptedAudioReference,

      encryptedImageReference:
        physicalMedia.encryptedImageReference,

      encryptedVideoReference:
        physicalMedia.encryptedVideoReference,

      encryptedThumbnailReference:
        physicalMedia.encryptedThumbnailReference,

      encryptedDocumentReference:
        physicalMedia.encryptedDocumentReference,

      documentName:
        message.documentName,

      evidenceHash,

      capturedAt:
        new Date(),

      originalDeletedAt:
  originalDeletedAt ?? undefined,
    },
  });
} catch (error) {
  await this.cleanupPhysicalFiles([
    physicalMedia.encryptedAudioReference,
    physicalMedia.encryptedImageReference,
    physicalMedia.encryptedVideoReference,
    physicalMedia.encryptedThumbnailReference,
    physicalMedia.encryptedDocumentReference,
  ]);

  throw error;
}

    createdCount++;
  }

  return createdCount;
}

async cleanupPreservedPhysicalFiles(
  references: string[],
): Promise<void> {
  await this.cleanupPhysicalFiles(references);
}

  // =========================================================
  // PRESERVAÇÃO FÍSICA DAS MÍDIAS
  // =========================================================

  private async preservePhysicalMedia(
    sourceUrl: string,
    investigationId: string,
    mediaType: string,
  ): Promise<string | undefined> {
    if (!sourceUrl?.trim()) {
      return undefined;
    }

    const sourcePath =
      this.resolveAllowedChatFile(
        sourceUrl,
      );

    if (!sourcePath) {
      throw new InternalServerErrorException(
        'A mídia da mensagem não possui uma origem local válida para preservação.',
      );
    }

    let sourceStat;

    try {
      sourceStat =
        await stat(sourcePath);
    } catch {
      throw new InternalServerErrorException(
        'O arquivo físico da mídia não foi encontrado para preservação jurídica.',
      );
    }

    if (!sourceStat.isFile()) {
      throw new InternalServerErrorException(
        'A origem da mídia não é um arquivo válido.',
      );
    }

    const evidenceRoot =
      resolve(
        process.cwd(),
        'legal-evidence',
      );

    const investigationDirectory =
      join(
        evidenceRoot,
        investigationId,
      );

    await mkdir(
      investigationDirectory,
      {
        recursive: true,
      },
    );

    const physicalId =
      randomBytes(32)
        .toString('hex');

    const encryptedFileName =
      `${mediaType}-${physicalId}.enc`;

    const destinationPath =
      join(
        investigationDirectory,
        encryptedFileName,
      );

    const relativeDestination =
      relative(
        process.cwd(),
        destinationPath,
      ).replace(/\\/g, '/');

   const encryption = await this.encryptFile(
  sourcePath,
  destinationPath,
);

try {
  return this.encrypt(
    JSON.stringify({
      version: 1,
      type: mediaType,
      path: relativeDestination,
      sha256: encryption.sha256,
      size: encryption.size,
      originalName: basename(sourcePath),
    }),
  );
} catch (error) {
  // O ficheiro já foi criado, mas a referência
  // protegida não foi produzida. Remover o destino.
  try {
    await rm(destinationPath, {
      force: true,
    });
  } catch {
    this.logger.error(
      'Não foi possível remover um ficheiro físico cuja referência de evidência falhou ao ser criada.',
    );
  }

  throw error;
}
  }

  private async preservePhysicalMediaSet(
  message: {
    audioUrl?: string | null;
    imageUrl?: string | null;
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
    documentUrl?: string | null;
  },
  investigationId: string,
): Promise<{
  encryptedAudioReference?: string;
  encryptedImageReference?: string;
  encryptedVideoReference?: string;
  encryptedThumbnailReference?: string;
  encryptedDocumentReference?: string;
}> {
  const references: {
    encryptedAudioReference?: string;
    encryptedImageReference?: string;
    encryptedVideoReference?: string;
    encryptedThumbnailReference?: string;
    encryptedDocumentReference?: string;
  } = {};

  try {
    references.encryptedAudioReference =
      await this.preservePhysicalMedia(
        message.audioUrl ?? '',
        investigationId,
        'audio',
      );

    references.encryptedImageReference =
      await this.preservePhysicalMedia(
        message.imageUrl ?? '',
        investigationId,
        'image',
      );

    references.encryptedVideoReference =
      await this.preservePhysicalMedia(
        message.videoUrl ?? '',
        investigationId,
        'video',
      );

    references.encryptedThumbnailReference =
      await this.preservePhysicalMedia(
        message.thumbnailUrl ?? '',
        investigationId,
        'thumbnail',
      );

    references.encryptedDocumentReference =
      await this.preservePhysicalMedia(
        message.documentUrl ?? '',
        investigationId,
        'document',
      );

    return references;
  } catch (error) {
    await this.cleanupPhysicalFiles(
      Object.values(references),
    );

    throw error;
  }
}

  private resolveAllowedChatFile(
    sourceUrl: string,
  ): string | null {
    const normalized =
      sourceUrl.trim();

    if (!normalized.startsWith('/uploads/chat/')) {
      return null;
    }

    const relativePath =
      normalized
        .replace(/^\/+/, '');

    const uploadsRoot =
      resolve(
        process.cwd(),
        'uploads',
        'chat',
      );

    const candidate =
      resolve(
        process.cwd(),
        relativePath,
      );

    const relativeToRoot =
      relative(
        uploadsRoot,
        candidate,
      );

    if (
      relativeToRoot.startsWith('..') ||
      relativeToRoot.includes('..\\') ||
      relativeToRoot.includes('../') ||
      relativeToRoot === ''
    ) {
      return null;
    }

    return candidate;
  }


private async encryptFile(
  sourcePath: string,
  destinationPath: string,
): Promise<{
  sha256: string;
  size: number;
}> {
  const key = this.getMediaEncryptionKey();
  const iv = randomBytes(12);

  const cipher = createCipheriv(
    'aes-256-gcm',
    key,
    iv,
  );

  const hash = createHash('sha256');
  let totalBytes = 0;

  try {
    // 1. Gravar o IV original sem o passar pelo cifrador.
    await pipeline(
      Readable.from([iv]),
      createWriteStream(destinationPath, {
        flags: 'wx',
        mode: 0o600,
      }),
    );

    // 2. Cifrar apenas os dados originais e acrescentá-los
    //    depois do IV.
    const input = Readable.from(
      (async function* () {
        for await (const chunk of createReadStream(sourcePath)) {
          const buffer = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk);

          hash.update(buffer);
          totalBytes += buffer.length;

          yield buffer;
        }
      })(),
    );

    await pipeline(
      input,
      cipher,
      createWriteStream(destinationPath, {
        flags: 'a',
        mode: 0o600,
      }),
    );

    // 3. Acrescentar o authTag original no final do ficheiro.
    const authTag = cipher.getAuthTag();

    await pipeline(
      Readable.from([authTag]),
      createWriteStream(destinationPath, {
        flags: 'a',
        mode: 0o600,
      }),
    );

    return {
      sha256: hash.digest('hex'),
      size: totalBytes,
    };
  } catch (error) {
    try {
      await rm(destinationPath, { force: true });
    } catch {
      this.logger.error(
        'Não foi possível remover um ficheiro físico incompleto após falha de cifragem.',
      );
    }

    throw error;
  }
}


 private async cleanupPhysicalFile(
  encryptedReference?: string,
): Promise<void> {
  if (!encryptedReference) {
    return;
  }

  try {
    const metadataPlaintext =
      this.decrypt(
        encryptedReference,
      );

    const metadata =
      JSON.parse(metadataPlaintext) as {
        path?: string;
      };

    if (!metadata.path) {
      return;
    }

    const evidenceRoot =
      resolve(
        process.cwd(),
        'legal-evidence',
      );

    const candidate =
      resolve(
        process.cwd(),
        metadata.path,
      );

    const relativeToEvidenceRoot =
      relative(
        evidenceRoot,
        candidate,
      );

    /*
     * Impede que uma referência adulterada
     * faça o processo apagar um arquivo fora
     * de legal-evidence/.
     */
    if (
      relativeToEvidenceRoot.startsWith('..') ||
      relativeToEvidenceRoot.includes('..\\') ||
      relativeToEvidenceRoot.includes('../') ||
      relativeToEvidenceRoot === ''
    ) {
      return;
    }

    await rm(
      candidate,
      {
        force: true,
      },
    );
  } catch {
  this.logger.warn(
    'A limpeza de um ficheiro físico de evidência falhou. A falha original da preservação será mantida.',
  );
}
}

private async cleanupPhysicalFiles(
  encryptedReferences: Array<
    string | undefined
  >,
): Promise<void> {
  for (const encryptedReference of encryptedReferences) {
    await this.cleanupPhysicalFile(
      encryptedReference,
    );
  }
}

    // =========================================================
  // CONSULTAR EVIDÊNCIAS DE UMA INVESTIGAÇÃO
  // =========================================================

  async listEvidenceForInvestigation(
    investigationId: string,
    limit = 50,
  ) {
    if (!investigationId?.trim()) {
      throw new BadRequestException(
        'ID da investigação é obrigatório.',
      );
    }

    const normalizedInvestigationId =
      investigationId.trim();

    const normalizedLimit =
      Math.min(
        Math.max(
          Number.isInteger(limit) ? limit : 50,
          1,
        ),
        100,
      );

    const evidence =
      await this.prisma.legalMessageEvidence.findMany({
        where: {
          investigationId:
            normalizedInvestigationId,
        },

        orderBy: [
          {
            capturedAt: 'desc',
          },
          {
            id: 'desc',
          },
        ],

        take: normalizedLimit,

        select: {
          id: true,

          messageId: true,
          investigationId: true,
          holdId: true,

          conversationId: true,

          senderId: true,
          receiverId: true,

          messageType: true,

          documentName: true,

          evidenceHash: true,

          capturedAt: true,
          originalDeletedAt: true,

          encryptedContent: true,

          encryptedAudioReference: true,
          encryptedImageReference: true,
          encryptedVideoReference: true,
          encryptedThumbnailReference: true,
          encryptedDocumentReference: true,
        },
      });

    return evidence.map((item) => ({
      id: item.id,

      messageId: item.messageId,

      investigationId:
        item.investigationId,

      holdId: item.holdId,

      conversationId:
        item.conversationId,

      senderId:
        item.senderId,

      receiverId:
        item.receiverId,

      messageType:
        item.messageType,

      documentName:
        item.documentName,

      evidenceHash:
        item.evidenceHash,

      capturedAt:
        item.capturedAt,

      originalDeletedAt:
        item.originalDeletedAt,

      hasContent:
        !!item.encryptedContent,

      hasAudio:
        !!item.encryptedAudioReference,

      hasImage:
        !!item.encryptedImageReference,

      hasVideo:
        !!item.encryptedVideoReference,

      hasThumbnail:
        !!item.encryptedThumbnailReference,

      hasDocument:
        !!item.encryptedDocumentReference,
    }));
  }

 async listEvidenceForMessages(
  investigationId: string,
  messageIds: string[],
) {
  if (!investigationId?.trim()) {
    throw new BadRequestException(
      'ID da investigação é obrigatório.',
    );
  }

  const normalizedInvestigationId =
    investigationId.trim();

  const normalizedMessageIds = [
    ...new Set(
      messageIds
        .filter((id) => typeof id === 'string')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];

  if (normalizedMessageIds.length === 0) {
    return [];
  }

  const evidence =
    await this.prisma.legalMessageEvidence.findMany({
      where: {
        investigationId: normalizedInvestigationId,
        messageId: {
          in: normalizedMessageIds,
        },
      },

      orderBy: [
        { capturedAt: 'desc' },
        { id: 'desc' },
      ],

      select: {
        id: true,
        messageId: true,
        investigationId: true,
        holdId: true,
        conversationId: true,
        senderId: true,
        receiverId: true,
        messageType: true,
        documentName: true,
        evidenceHash: true,
        capturedAt: true,
        originalDeletedAt: true,

        // Campos reais do modelo Prisma
        encryptedContent: true,
        encryptedAudioReference: true,
        encryptedImageReference: true,
        encryptedVideoReference: true,
        encryptedThumbnailReference: true,
        encryptedDocumentReference: true,
      },
    });

  return evidence.map((item) => ({
    id: item.id,
    messageId: item.messageId,
    investigationId: item.investigationId,
    holdId: item.holdId,
    conversationId: item.conversationId,
    senderId: item.senderId,
    receiverId: item.receiverId,
    messageType: item.messageType,
    documentName: item.documentName,
    evidenceHash: item.evidenceHash,
    capturedAt: item.capturedAt,
    originalDeletedAt: item.originalDeletedAt,

    // Indicadores calculados a partir dos campos reais
    hasContent: !!item.encryptedContent,
    hasAudio: !!item.encryptedAudioReference,
    hasImage: !!item.encryptedImageReference,
    hasVideo: !!item.encryptedVideoReference,
    hasThumbnail: !!item.encryptedThumbnailReference,
    hasDocument: !!item.encryptedDocumentReference,
  }));
}

  // =========================================================
  // CONSULTAR UMA EVIDÊNCIA ESPECÍFICA
  // =========================================================

  async getEvidenceForInvestigation(
    investigationId: string,
    evidenceId: string,
  ) {
    if (!investigationId?.trim()) {
      throw new BadRequestException(
        'ID da investigação é obrigatório.',
      );
    }

    if (!evidenceId?.trim()) {
      throw new BadRequestException(
        'ID da evidência é obrigatório.',
      );
    }

    const normalizedInvestigationId =
      investigationId.trim();

    const normalizedEvidenceId =
      evidenceId.trim();

    const evidence =
      await this.prisma.legalMessageEvidence.findFirst({
        where: {
          id: normalizedEvidenceId,

          investigationId:
            normalizedInvestigationId,
        },

        select: {
          id: true,

          messageId: true,
          investigationId: true,
          holdId: true,

          conversationId: true,

          senderId: true,
          receiverId: true,

          messageType: true,

          encryptedContent: true,

          encryptedAudioReference: true,
          encryptedImageReference: true,
          encryptedVideoReference: true,
          encryptedThumbnailReference: true,
          encryptedDocumentReference: true,

          documentName: true,

          evidenceHash: true,

          capturedAt: true,

          originalDeletedAt: true,
        },
      });

    if (!evidence) {
      throw new BadRequestException(
        'Evidência não encontrada dentro desta investigação.',
      );
    }

    if (!evidence.encryptedContent) {
      throw new InternalServerErrorException(
        'A evidência não possui conteúdo criptografado.',
      );
    }

    let plaintext: string;

    try {
      plaintext =
        this.decrypt(
          evidence.encryptedContent,
        );
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível descriptografar a evidência.',
      );
    }

    const calculatedHash =
      createHash('sha256')
        .update(plaintext, 'utf8')
        .digest('hex');

    if (
      calculatedHash !==
      evidence.evidenceHash
    ) {
      throw new InternalServerErrorException(
        'A integridade da evidência não pôde ser confirmada.',
      );
    }

    let snapshot: unknown;

    try {
      snapshot =
        JSON.parse(plaintext);
    } catch {
      throw new InternalServerErrorException(
        'O conteúdo preservado da evidência está inválido.',
      );
    }

    return {
      id: evidence.id,

      messageId:
        evidence.messageId,

      investigationId:
        evidence.investigationId,

      holdId:
        evidence.holdId,

      conversationId:
        evidence.conversationId,

      senderId:
        evidence.senderId,

      receiverId:
        evidence.receiverId,

      messageType:
        evidence.messageType,

      documentName:
        evidence.documentName,

      capturedAt:
        evidence.capturedAt,

      originalDeletedAt:
        evidence.originalDeletedAt,

      evidenceHash:
        evidence.evidenceHash,

      integrityVerified: true,

      snapshot,

      media: {
        hasAudio:
          !!evidence.encryptedAudioReference,

        hasImage:
          !!evidence.encryptedImageReference,

        hasVideo:
          !!evidence.encryptedVideoReference,

        hasThumbnail:
          !!evidence.encryptedThumbnailReference,

        hasDocument:
          !!evidence.encryptedDocumentReference,
      },
    };
  }

    // =========================================================
  // ACESSO CONTROLADO À MÍDIA DA EVIDÊNCIA
  // =========================================================

  async getEvidenceMediaForInvestigation(
    investigationId: string,
    evidenceId: string,
    mediaType:
      | 'audio'
      | 'image'
      | 'video'
      | 'thumbnail'
      | 'document',
  ) {
    if (!investigationId?.trim()) {
      throw new BadRequestException(
        'ID da investigação é obrigatório.',
      );
    }

    if (!evidenceId?.trim()) {
      throw new BadRequestException(
        'ID da evidência é obrigatório.',
      );
    }

    const normalizedInvestigationId =
      investigationId.trim();

    const normalizedEvidenceId =
      evidenceId.trim();

    const evidence =
      await this.prisma.legalMessageEvidence.findFirst({
        where: {
          id: normalizedEvidenceId,

          investigationId:
            normalizedInvestigationId,
        },

        select: {
          id: true,

          encryptedAudioReference: true,
          encryptedImageReference: true,
          encryptedVideoReference: true,
          encryptedThumbnailReference: true,
          encryptedDocumentReference: true,

          documentName: true,

          messageType: true,
        },
      });

    if (!evidence) {
      throw new BadRequestException(
        'Evidência não encontrada dentro desta investigação.',
      );
    }

    let encryptedReference:
      | string
      | null
      | undefined;

    switch (mediaType) {
      case 'audio':
        encryptedReference =
          evidence.encryptedAudioReference;
        break;

      case 'image':
        encryptedReference =
          evidence.encryptedImageReference;
        break;

      case 'video':
        encryptedReference =
          evidence.encryptedVideoReference;
        break;

      case 'thumbnail':
        encryptedReference =
          evidence.encryptedThumbnailReference;
        break;

      case 'document':
        encryptedReference =
          evidence.encryptedDocumentReference;
        break;
    }

    if (!encryptedReference) {
      throw new BadRequestException(
        'Esta evidência não possui a mídia solicitada.',
      );
    }

    let metadataPlaintext: string;

    try {
      metadataPlaintext =
        this.decrypt(
          encryptedReference,
        );
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível validar a referência física da evidência.',
      );
    }

    let metadata: {
      version?: number;
      type?: string;
      path?: string;
      sha256?: string;
      size?: number;
      originalName?: string;
    };

    try {
      metadata =
        JSON.parse(
          metadataPlaintext,
        ) as typeof metadata;
    } catch {
      throw new InternalServerErrorException(
        'A referência física da evidência está inválida.',
      );
    }

    if (
  metadata.version !== 1 ||
  !metadata.path ||
  !metadata.sha256 ||
  !Number.isSafeInteger(metadata.size) ||
  metadata.size === undefined ||
  metadata.size < 0
) {
  throw new InternalServerErrorException(
    'Os metadados físicos da evidência são inválidos.',
  );
}

const originalSize =
  metadata.size;

    if (
      metadata.type !== mediaType
    ) {
      throw new InternalServerErrorException(
        'O tipo da mídia não corresponde à evidência preservada.',
      );
    }

    const evidenceRoot =
      resolve(
        process.cwd(),
        'legal-evidence',
      );

    const physicalPath =
      resolve(
        process.cwd(),
        metadata.path,
      );

    const relativeToEvidenceRoot =
      relative(
        evidenceRoot,
        physicalPath,
      );

    if (
      relativeToEvidenceRoot.startsWith('..') ||
      relativeToEvidenceRoot.includes('..\\') ||
      relativeToEvidenceRoot.includes('../') ||
      relativeToEvidenceRoot === ''
    ) {
      throw new InternalServerErrorException(
        'A referência física da evidência está fora da área protegida.',
      );
    }

    let physicalStat;

    try {
      physicalStat =
        await stat(
          physicalPath,
        );
    } catch {
      throw new InternalServerErrorException(
        'O arquivo físico da evidência não foi encontrado.',
      );
    }

    if (!physicalStat.isFile()) {
      throw new InternalServerErrorException(
        'A origem física da evidência não é um arquivo válido.',
      );
    }

    if (
  physicalStat.size !==
  originalSize + 12 + 16
) {
      throw new InternalServerErrorException(
        'O tamanho da mídia preservada não corresponde aos metadados de integridade.',
      );
    }

   await this.verifyPhysicalMediaIntegrity(
  physicalPath,
  physicalStat.size,
  metadata.sha256,
);

const stream =
  await this.createDecryptedMediaStream(
    physicalPath,
    physicalStat.size,
  );

return {
  stream,

  originalName:
    metadata.originalName ??
    `${evidence.id}-${mediaType}`,

  mediaType,

  contentType:
    metadata.type ||
    'application/octet-stream',

  originalSize:

    metadata.size,

  sha256:
    metadata.sha256,

  encryptedSize:
    physicalStat.size,
};
  }

  // =========================================================
  // CRIPTOGRAFIA
  // =========================================================

  private encrypt(
    plaintext: string,
  ): string {
    const secret =
      process.env.LEGAL_EVIDENCE_ENCRYPTION_KEY;

    if (!secret) {
      throw new InternalServerErrorException(
        'Chave de proteção das evidências não configurada.',
      );
    }

    const key =
      createHash('sha256')
        .update(secret, 'utf8')
        .digest();

    const iv =
      randomBytes(12);

    const cipher =
      createCipheriv(
        'aes-256-gcm',
        key,
        iv,
      );

    const encrypted =
      Buffer.concat([
        cipher.update(
          plaintext,
          'utf8',
        ),

        cipher.final(),
      ]);

    const authTag =
      cipher.getAuthTag();

    /*
     * Formato:
     *
     * iv.authTag.ciphertext
     *
     * Tudo em base64.
     */

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join('.');
  }

    private decrypt(
    encrypted: string,
  ): string {
    const secret =
      process.env.LEGAL_EVIDENCE_ENCRYPTION_KEY;

    if (!secret) {
      throw new InternalServerErrorException(
        'Chave de proteção das evidências não configurada.',
      );
    }

    if (!encrypted?.trim()) {
      throw new InternalServerErrorException(
        'Conteúdo criptografado da evidência inválido.',
      );
    }

    const parts =
      encrypted.split('.');

    if (parts.length !== 3) {
      throw new InternalServerErrorException(
        'Formato da evidência criptografada inválido.',
      );
    }

    const [
      ivBase64,
      authTagBase64,
      encryptedBase64,
    ] = parts;

    let iv: Buffer;
    let authTag: Buffer;
    let ciphertext: Buffer;

    try {
      iv =
        Buffer.from(
          ivBase64,
          'base64',
        );

      authTag =
        Buffer.from(
          authTagBase64,
          'base64',
        );

      ciphertext =
        Buffer.from(
          encryptedBase64,
          'base64',
        );
    } catch {
      throw new InternalServerErrorException(
        'Conteúdo criptografado da evidência inválido.',
      );
    }

    if (
      iv.length !== 12 ||
      authTag.length !== 16
    ) {
      throw new InternalServerErrorException(
        'Estrutura criptográfica da evidência inválida.',
      );
    }

    const key =
      createHash('sha256')
        .update(secret, 'utf8')
        .digest();

    try {
      const decipher =
  createDecipheriv(
          'aes-256-gcm',
          key,
          iv,
        );

      decipher.setAuthTag(
        authTag,
      );

      const decrypted =
        Buffer.concat([
          decipher.update(
            ciphertext,
          ),

          decipher.final(),
        ]);

      return decrypted.toString(
        'utf8',
      );
    } catch {
      throw new InternalServerErrorException(
        'Falha na autenticação criptográfica da evidência.',
      );
    }
  }



private messageMatchesHoldScope(
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string | null;
    createdAt: Date;
    conversation: {
      userId: string;
      storeId: string;
    };
  },
  hold: {
    messageId: string | null;
    conversationId: string | null;
    storeId: string | null;
    userId: string | null;
    fromDate: Date | null;
    toDate: Date | null;
  },
): boolean {
  // Cada critério preenchido é obrigatório.
  if (
    hold.messageId !== null &&
    hold.messageId !== message.id
  ) {
    return false;
  }

  if (
    hold.conversationId !== null &&
    hold.conversationId !== message.conversationId
  ) {
    return false;
  }

  if (
    hold.storeId !== null &&
    hold.storeId !== message.conversation.storeId
  ) {
    return false;
  }

  if (
    hold.userId !== null &&
    hold.userId !== message.conversation.userId &&
    hold.userId !== message.senderId &&
    hold.userId !== message.receiverId
  ) {
    return false;
  }

  if (
    hold.fromDate !== null &&
    message.createdAt < hold.fromDate
  ) {
    return false;
  }

  if (
    hold.toDate !== null &&
    message.createdAt > hold.toDate
  ) {
    return false;
  }

  // Um hold sem qualquer critério não pode abranger tudo.
  const hasScope = Boolean(
    hold.messageId ||
    hold.conversationId ||
    hold.storeId ||
    hold.userId ||
    hold.fromDate ||
    hold.toDate
  );

  return hasScope;
}

  private async preserveMessageForHold(
  messageId: string,
  holdId: string,
): Promise<number> {
  const message =
    await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },

      select: {
        id: true,
        conversationId: true,

        senderId: true,
        receiverId: true,

        messageType: true,
        content: true,

        imageUrl: true,
        audioUrl: true,
        videoUrl: true,

        documentName: true,
        documentUrl: true,
        thumbnailUrl: true,

        latitude: true,
        longitude: true,

        replyToId: true,
        sharedMessageId: true,
        sharedProductId: true,
        sharedPostId: true,

        createdAt: true,
        editedAt: true,
        deletedAt: true,


conversation: {
  select: {
    userId: true,
    storeId: true,
  },
},
      },
    });

  if (!message) {
    return 0;
  }

  const hold =
    await this.prisma.legalHold.findUnique({
      where: {
        id: holdId,
      },


select: {
  id: true,
  investigationId: true,
  status: true,
  messageId: true,
  conversationId: true,
  storeId: true,
  userId: true,
  fromDate: true,
  toDate: true,
},
    });

  if (!hold) {
    throw new BadRequestException(
      'Legal Hold não encontrado.',
    );
  }

  if (hold.status !== 'ACTIVE') {
    return 0;
  }


if (!this.messageMatchesHoldScope(message, hold)) {
  return 0;
}

  const existing =
    await this.prisma.legalMessageEvidence.findUnique({
      where: {
        messageId_investigationId: {
          messageId: message.id,
          investigationId:
            hold.investigationId,
        },
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    return 0;
  }

  const snapshot = {
    id: message.id,

    conversationId:
      message.conversationId,

    senderId:
      message.senderId,

    receiverId:
      message.receiverId,

    messageType:
      message.messageType,

    content:
      message.content,

    imageUrl:
      message.imageUrl,

    audioUrl:
      message.audioUrl,

    videoUrl:
      message.videoUrl,

    documentName:
      message.documentName,

    documentUrl:
      message.documentUrl,

    thumbnailUrl:
      message.thumbnailUrl,

    latitude:
      message.latitude,

    longitude:
      message.longitude,

    replyToId:
      message.replyToId,

    sharedMessageId:
      message.sharedMessageId,

    sharedProductId:
      message.sharedProductId,

    sharedPostId:
      message.sharedPostId,

    createdAt:
      message.createdAt.toISOString(),

    editedAt:
      message.editedAt?.toISOString() ?? null,

    deletedAt:
      message.deletedAt?.toISOString() ?? null,
  };

  const plaintext =
    JSON.stringify(snapshot);

  const evidenceHash =
    createHash('sha256')
      .update(plaintext, 'utf8')
      .digest('hex');

  const encryptedContent =
    this.encrypt(plaintext);

    const physicalMedia =
  await this.preservePhysicalMediaSet(
    message,
    hold.investigationId,
  );

 try {
  await this.prisma.legalMessageEvidence.create({
    data: {
      messageId: message.id,

      investigationId:
        hold.investigationId,

      holdId:
        hold.id,

      conversationId:
        message.conversationId,

      senderId:
        message.senderId,

      receiverId:
        message.receiverId,

      messageType:
        message.messageType,

      encryptedContent,

      encryptedAudioReference:
        physicalMedia.encryptedAudioReference,

      encryptedImageReference:
        physicalMedia.encryptedImageReference,

      encryptedVideoReference:
        physicalMedia.encryptedVideoReference,

      encryptedThumbnailReference:
        physicalMedia.encryptedThumbnailReference,

      encryptedDocumentReference:
        physicalMedia.encryptedDocumentReference,

      documentName:
        message.documentName,

      evidenceHash,

      capturedAt: new Date(),
    },
  });
} catch (error) {
  await this.cleanupPhysicalFiles([
    physicalMedia.encryptedAudioReference,
    physicalMedia.encryptedImageReference,
    physicalMedia.encryptedVideoReference,
    physicalMedia.encryptedThumbnailReference,
    physicalMedia.encryptedDocumentReference,
  ]);

  throw error;
}

  return 1;
}

private async readPhysicalEncryptionParts(
  physicalPath: string,
  encryptedSize: number,
): Promise<{
  iv: Buffer;
  authTag: Buffer;
}> {
  if (encryptedSize < 12 + 16) {
    throw new InternalServerErrorException(
      'O arquivo físico da evidência é inválido.',
    );
  }

  const handle = await open(physicalPath, 'r');

  try {
    const iv = Buffer.alloc(12);
    const authTag = Buffer.alloc(16);

    const ivResult = await handle.read(
      iv,
      0,
      iv.length,
      0,
    );

    if (ivResult.bytesRead !== 12) {
      throw new InternalServerErrorException(
        'Não foi possível ler o IV da evidência.',
      );
    }

    const authTagResult = await handle.read(
      authTag,
      0,
      authTag.length,
      encryptedSize - 16,
    );

    if (authTagResult.bytesRead !== 16) {
      throw new InternalServerErrorException(
        'Não foi possível ler o authTag da evidência.',
      );
    }

    return {
      iv,
      authTag,
    };
  } finally {
    await handle.close();
  }
}

private async verifyPhysicalMediaIntegrity(
  physicalPath: string,
  encryptedSize: number,
  expectedSha256: string,
): Promise<void> {
  const { iv, authTag } =
    await this.readPhysicalEncryptionParts(
      physicalPath,
      encryptedSize,
    );

  const decipher = createDecipheriv(
    'aes-256-gcm',
    this.getMediaEncryptionKey(),
    iv,
  );

  decipher.setAuthTag(authTag);

  const hash = createHash('sha256');

  const encryptedStream = createReadStream(
    physicalPath,
    {
      start: 12,
      end: encryptedSize - 17,
    },
  );

  try {
    encryptedStream.on('data', (chunk: Buffer) => {
      const plaintext = decipher.update(chunk);

      if (plaintext.length > 0) {
        hash.update(plaintext);
      }
    });

    await new Promise<void>((resolvePromise, rejectPromise) => {
      encryptedStream.once(
        'error',
        rejectPromise,
      );

      encryptedStream.once(
        'end',
        () => {
          try {
            const finalPlaintext =
              decipher.final();

            if (finalPlaintext.length > 0) {
              hash.update(finalPlaintext);
            }

            resolvePromise();
          } catch (error) {
            rejectPromise(error);
          }
        },
      );
    });
  } catch {
    throw new InternalServerErrorException(
      'A integridade criptográfica da evidência não pôde ser validada.',
    );
  }

  const calculatedSha256 =
    hash.digest('hex');

  if (
    calculatedSha256.toLowerCase() !==
    expectedSha256.toLowerCase()
  ) {
    throw new InternalServerErrorException(
      'A integridade SHA-256 da evidência foi comprometida.',
    );
  }
}

private getMediaEncryptionKey(): Buffer {
  const value =
    process.env.LEGAL_EVIDENCE_MEDIA_ENCRYPTION_KEY;

  if (!value) {
    throw new InternalServerErrorException(
      'Chave de criptografia física da evidência não configurada.',
    );
  }

  const key = Buffer.from(value, 'hex');

  if (key.length !== 32) {
    throw new InternalServerErrorException(
      'A chave de criptografia física da evidência é inválida.',
    );
  }

  return key;
}


private async createDecryptedMediaStream(
  physicalPath: string,
  encryptedSize: number,
): Promise<NodeJS.ReadableStream> {
  const { iv, authTag } =
    await this.readPhysicalEncryptionParts(
      physicalPath,
      encryptedSize,
    );

  const decipher = createDecipheriv(
    'aes-256-gcm',
    this.getMediaEncryptionKey(),
    iv,
  );

  decipher.setAuthTag(authTag);

  const encryptedStream = createReadStream(
    physicalPath,
    {
      start: 12,
      end: encryptedSize - 17,
    },
  );

  encryptedStream.on('error', () => {
    decipher.destroy();
  });

  return encryptedStream.pipe(decipher);
}

async startEvidenceAccessAudit(
  investigationId: string,
  evidenceId: string,
  requestedById: string,
  action: 'VIEW' | 'MEDIA',
  mediaType?: string,
  ipAddress?: string,
  userAgent?: string,
) {
  return this.prisma.legalEvidenceAccessAudit.create({
    data: {
      investigationId,
      evidenceId,
      requestedById,
      action,
      mediaType,
      ipAddress,
      userAgent,
      status: 'STARTED',
    },
  });
}

async completeEvidenceAccessAudit(
  auditId: string,
) {
  return this.prisma.legalEvidenceAccessAudit.updateMany({
    where: {
      id: auditId,
      status: 'STARTED',
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });
}

async failEvidenceAccessAudit(
  auditId: string,
  errorMessage: string,
) {
  return this.prisma.legalEvidenceAccessAudit.updateMany({
    where: {
      id: auditId,
      status: 'STARTED',
    },
    data: {
      status: 'FAILED',
      errorMessage: errorMessage.slice(0, 1000),
      completedAt: new Date(),
    },
  });
}
}