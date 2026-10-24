import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  AdminRole,
  AdminStatus,
  LegalHoldStatus,
  LegalInvestigationQueryStatus,
  LegalInvestigationStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { LegalEvidenceService } from './legal-evidence.service';
import {
  CompleteLegalInvestigationInput,
  FailLegalInvestigationInput,
  LegalInvestigationAuditResult,
  LegalInvestigationScope,
  StartLegalInvestigationInput,
  LegalMessageSearchInput,
  LegalMessageSearchResponse,
  LegalInvestigationQueryAuditResult,
} from './legal-investigation.types';

import {
  createHmac,
  timingSafeEqual,
} from 'crypto';

@Injectable()
export class LegalInvestigationService {

    private readonly logger = new Logger(
  LegalInvestigationService.name,
);
  constructor(
  private readonly prisma: PrismaService,
  private readonly legalEvidenceService: LegalEvidenceService,
) {}

  private async assertLegalInvestigator(
  userId: string,
): Promise<void> {
  const user =
    await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,

        legalInvestigatorProfile: {
          select: {
            status: true,
          },
        },
      },
    });

  if (!user) {
    throw new ForbiddenException(
      'Usuário não encontrado.',
    );
  }

  if (user.role !== 'LEGAL_INVESTIGATOR') {
    throw new ForbiddenException(
      'Acesso restrito a investigadores legais.',
    );
  }

  if (!user.legalInvestigatorProfile) {
    throw new ForbiddenException(
      'Perfil de investigador legal não encontrado.',
    );
  }

  if (
    user.legalInvestigatorProfile.status !==
    'ACTIVE'
  ) {
    throw new ForbiddenException(
      'Perfil de investigador legal não está ativo.',
    );
  }
}


  async listMyInvestigations(requestedById: string) {
    await this.assertLegalInvestigator(requestedById);

    const investigations =
      await this.prisma.legalInvestigationAudit.findMany({
        where: {
          requestedById,
        },

        orderBy: {
          createdAt: 'desc',
        },

        select: {
          id: true,
          legalReference: true,
          reason: true,
          status: true,
          resultCount: true,
          errorMessage: true,
          createdAt: true,
        },
      });

    return investigations;
  }


  // =========================================================
  // INICIAR AUDITORIA
  // =========================================================

  async startInvestigation(
  input: StartLegalInvestigationInput,
  requestedById: string,
  ipAddress?: string,
  userAgent?: string,
) {
  await this.assertLegalInvestigator(requestedById);

  this.validateStartInput(input);

const scope = this.normalizeScope(input.scope);

  await this.validateScopeCompatibility(scope);

  const result = await this.prisma.$transaction(async (tx) => {
    const audit = await tx.legalInvestigationAudit.create({
      data: {
        requestedById,
        legalReference: input.legalReference.trim(),
        reason: input.reason.trim(),

        userId: scope.userId,
        storeId: scope.storeId,
        conversationId: scope.conversationId,
        messageId: scope.messageId,

        fromDate: scope.fromDate,
        toDate: scope.toDate,

        searchTerm: scope.searchTerm,

        ipAddress,
        userAgent,

        status: LegalInvestigationStatus.STARTED,
      },
    });

    const hold = await tx.legalHold.create({
      data: {
        investigationId: audit.id,

        createdById: requestedById,

        status: LegalHoldStatus.ACTIVE,

        userId: scope.userId,
        storeId: scope.storeId,
        conversationId: scope.conversationId,
        messageId: scope.messageId,

        fromDate: scope.fromDate,
        toDate: scope.toDate,
      },
    });

    return {
      audit,
      hold,
    };
  });

  let preservedEvidenceCount = 0;

try {
  preservedEvidenceCount =
    await this.legalEvidenceService
      .preserveMessagesForHold(
        result.hold.id,
      );
} catch (error) {
  const errorMessage =
    error instanceof Error
      ? error.message.trim().slice(0, 2000)
      : 'Falha durante a preservação inicial das evidências.';

  try {
    await this.prisma.legalInvestigationAudit.update({
      where: {
        id: result.audit.id,
      },
      data: {
        status: LegalInvestigationStatus.FAILED,
        errorMessage,
      },
    });
  } catch (auditError) {
    this.logger.error(
      `Falha ao registar o estado FAILED da investigação ${result.audit.id}.`,
      auditError instanceof Error
        ? auditError.stack
        : undefined,
    );
  }

  throw new InternalServerErrorException(
    'Não foi possível concluir a preservação inicial das evidências.',
  );
}


return {
  id: result.audit.id,
  status: result.audit.status,
  createdAt: result.audit.createdAt,
  preservedEvidenceCount,
};
}

  // =========================================================
  // CONCLUIR AUDITORIA
  // =========================================================

 async completeInvestigation(
  input: CompleteLegalInvestigationInput,
  requestedById: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<LegalInvestigationAuditResult> {
    if (!input.investigationId) {
      throw new BadRequestException(
        'ID da investigação é obrigatório.',
      );
    }

    if (
      !Number.isInteger(input.resultCount) ||
      input.resultCount < 0
    ) {
      throw new BadRequestException(
        'resultCount deve ser um número inteiro maior ou igual a zero.',
      );
    }

    const existing = await this.prisma.legalInvestigationAudit.findUnique({
      where: {
        id: input.investigationId,
      },
      select: {
  id: true,
  status: true,
  requestedById: true,
},
    });

    if (!existing) {
      throw new NotFoundException(
        'Registro de investigação não encontrado.',
      );
    }

   if (existing.requestedById !== requestedById) {
  await this.recordDeniedAttempt(
    requestedById,
    'Tentativa de concluir uma investigação pertencente a outro investigador.',
    ipAddress,
    userAgent,
    'POST',
    '/legal-investigation/complete',
    input.investigationId,
  );

  throw new ForbiddenException(
    'Esta investigação pertence a outro investigador.',
  );
}

   await this.assertLegalInvestigator(
  requestedById,
);

    if (existing.status !== LegalInvestigationStatus.STARTED) {
      throw new BadRequestException(
        'Esta investigação não está em estado STARTED.',
      );
    }

    const updateResult =
  await this.prisma.legalInvestigationAudit.updateMany({
    where: {
      id: input.investigationId,
      requestedById,
      status: LegalInvestigationStatus.STARTED,
    },

    data: {
      status: LegalInvestigationStatus.COMPLETED,
      resultCount: input.resultCount,
    },
  });

if (updateResult.count !== 1) {
  throw new BadRequestException(
    'A investigação já não está disponível para conclusão.',
  );
}

const audit =
  await this.prisma.legalInvestigationAudit.findUnique({
    where: {
      id: input.investigationId,
    },

    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

if (!audit) {
  throw new NotFoundException(
    'Registro de investigação não encontrado após a atualização.',
  );
}

return audit;
  }

  // =========================================================
  // MARCAR COMO FALHA
  // =========================================================

  async failInvestigation(
  input: FailLegalInvestigationInput,
  requestedById: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<LegalInvestigationAuditResult> {
    if (!input.investigationId) {
      throw new BadRequestException(
        'ID da investigação é obrigatório.',
      );
    }

    if (!input.errorMessage?.trim()) {
      throw new BadRequestException(
        'A mensagem de erro é obrigatória.',
      );
    }

    const existing = await this.prisma.legalInvestigationAudit.findUnique({
      where: {
        id: input.investigationId,
      },
      select: {
  id: true,
  status: true,
  requestedById: true,
},
    });

    if (!existing) {
      throw new NotFoundException(
        'Registro de investigação não encontrado.',
      );
    }

    if (existing.requestedById !== requestedById) {
  await this.recordDeniedAttempt(
    requestedById,
    'Tentativa de marcar como falha uma investigação pertencente a outro investigador.',
    ipAddress,
    userAgent,
    'POST',
    '/legal-investigation/fail',
    input.investigationId,
  );

  throw new ForbiddenException(
    'Esta investigação pertence a outro investigador.',
  );
}
    await this.assertLegalInvestigator(
  requestedById,
);

    if (existing.status !== LegalInvestigationStatus.STARTED) {
      throw new BadRequestException(
        'Esta investigação não está em estado STARTED.',
      );
    }

    const updateResult =
  await this.prisma.legalInvestigationAudit.updateMany({
    where: {
      id: input.investigationId,
      requestedById,
      status: LegalInvestigationStatus.STARTED,
    },

    data: {
      status: LegalInvestigationStatus.FAILED,

      // Evitamos guardar uma mensagem gigantesca.
      errorMessage: input.errorMessage.trim().slice(0, 2000),
    },
  });

if (updateResult.count !== 1) {
  throw new BadRequestException(
    'A investigação já não está disponível para ser marcada como falha.',
  );
}

const audit =
  await this.prisma.legalInvestigationAudit.findUnique({
    where: {
      id: input.investigationId,
    },

    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

if (!audit) {
  throw new NotFoundException(
    'Registro de investigação não encontrado após a atualização.',
  );
}

return audit;
  }

  // =========================================================
  // VALIDAÇÃO INICIAL
  // =========================================================

  private validateStartInput(
    input: StartLegalInvestigationInput,
  ): void {

    if (!input.legalReference?.trim()) {
      throw new BadRequestException(
        'A referência legal é obrigatória.',
      );
    }

    if (!input.reason?.trim()) {
      throw new BadRequestException(
        'O motivo da investigação é obrigatório.',
      );
    }

    if (
      input.legalReference.trim().length > 300
    ) {
      throw new BadRequestException(
        'A referência legal é demasiado longa.',
      );
    }

    if (
      input.reason.trim().length > 2000
    ) {
      throw new BadRequestException(
        'O motivo da investigação é demasiado longo.',
      );
    }
  }

  // =========================================================
  // NORMALIZAÇÃO DO ESCOPO
  // =========================================================

  private normalizeScope(
  scope: LegalInvestigationScope,
): LegalInvestigationScope {
  const fromDate =
    this.parseHttpDate(
      scope.fromDate,
      'fromDate',
    );

  const toDate =
    this.parseHttpDate(
      scope.toDate,
      'toDate',
    );

  const normalized: LegalInvestigationScope = {
    userId: scope.userId?.trim() || undefined,

    storeId: scope.storeId?.trim() || undefined,

    conversationId:
      scope.conversationId?.trim() || undefined,

    messageId:
      scope.messageId?.trim() || undefined,

    fromDate,

    toDate,

    searchTerm:
      scope.searchTerm?.trim() || undefined,
  };

  const hasIdentifier =
  !!normalized.userId ||
  !!normalized.storeId ||
  !!normalized.conversationId ||
  !!normalized.messageId;

if (!hasIdentifier) {
  throw new BadRequestException(
    'A investigação precisa de pelo menos um identificador de escopo: utilizador, banca, conversa ou mensagem. As datas só podem restringir esse escopo.',
  );
}

  if (
    normalized.fromDate &&
    normalized.toDate &&
    normalized.fromDate > normalized.toDate
  ) {
    throw new BadRequestException(
      'fromDate não pode ser posterior a toDate.',
    );
  }

  if (
    normalized.searchTerm &&
    normalized.searchTerm.length > 500
  ) {
    throw new BadRequestException(
      'O termo de pesquisa é demasiado longo.',
    );
  }

  return normalized;
}

    // =========================================================
  // VALIDAR COMPATIBILIDADE DO ESCOPO
  // =========================================================

  private async validateScopeCompatibility(
    scope: LegalInvestigationScope,
  ): Promise<void> {

    // ---------------------------------------------------------
    // CONVERSA
    // ---------------------------------------------------------

    let conversation:
      | {
          id: string;
          userId: string;
          storeId: string;
        }
      | null = null;

    if (scope.conversationId) {
      conversation =
        await this.prisma.conversation.findUnique({
          where: {
            id: scope.conversationId,
          },
          select: {
            id: true,
            userId: true,
            storeId: true,
          },
        });

      if (!conversation) {
        throw new NotFoundException(
          'A conversa indicada no escopo não foi encontrada.',
        );
      }

      if (
        scope.userId &&
        conversation.userId !== scope.userId
      ) {
        throw new BadRequestException(
          'A conversa indicada não pertence ao utilizador informado.',
        );
      }

      if (
        scope.storeId &&
        conversation.storeId !== scope.storeId
      ) {
        throw new BadRequestException(
          'A conversa indicada não pertence à banca informada.',
        );
      }
    }

    // ---------------------------------------------------------
    // MENSAGEM
    // ---------------------------------------------------------

    let message:
      | {
          id: string;
          conversationId: string;
          senderId: string;
          receiverId: string | null;
          conversation: {
            userId: string;
            storeId: string;
          };
        }
      | null = null;

    if (scope.messageId) {
      message =
        await this.prisma.message.findUnique({
          where: {
            id: scope.messageId,
          },
          select: {
            id: true,
            conversationId: true,
            senderId: true,
            receiverId: true,

            conversation: {
              select: {
                userId: true,
                storeId: true,
              },
            },
          },
        });

      if (!message) {
        throw new NotFoundException(
          'A mensagem indicada no escopo não foi encontrada.',
        );
      }

      // -------------------------------------------------------
      // messageId ↔ conversationId
      // -------------------------------------------------------

      if (
        scope.conversationId &&
        message.conversationId !==
          scope.conversationId
      ) {
        throw new BadRequestException(
          'A mensagem indicada não pertence à conversa informada.',
        );
      }

      // -------------------------------------------------------
      // messageId ↔ userId
      // -------------------------------------------------------

      if (scope.userId) {
        const belongsToUser =
          message.senderId === scope.userId ||
          message.receiverId === scope.userId ||
          message.conversation.userId ===
            scope.userId;

        if (!belongsToUser) {
          throw new BadRequestException(
            'A mensagem indicada não está relacionada ao utilizador informado.',
          );
        }
      }

      // -------------------------------------------------------
      // messageId ↔ storeId
      // -------------------------------------------------------

      if (
        scope.storeId &&
        message.conversation.storeId !==
          scope.storeId
      ) {
        throw new BadRequestException(
          'A mensagem indicada não pertence à banca informada.',
        );
      }
    }
  }

  async searchMessages(
  input: LegalMessageSearchInput,
  requestedById: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<LegalMessageSearchResponse> {
  if (!input.investigationId) {
    throw new BadRequestException(
      'investigationId é obrigatório.',
    );
  }

  const audit =
  await this.prisma.legalInvestigationAudit.findUnique({
    where: {
      id: input.investigationId,
    },
    select: {
  id: true,
  status: true,
  requestedById: true,

  userId: true,
  storeId: true,
  conversationId: true,
  messageId: true,

  fromDate: true,
  toDate: true,

  searchTerm: true,
},
  });

  if (!audit) {
    throw new NotFoundException(
      'Investigação não encontrada.',
    );
  }

  if (audit.requestedById !== requestedById) {
  await this.recordDeniedAttempt(
    requestedById,
    'Tentativa de acessar uma investigação pertencente a outro investigador.',
    ipAddress,
    userAgent,
    'POST',
    '/legal-investigation/messages/search',
    input.investigationId,
  );

  throw new ForbiddenException(
    'Esta investigação pertence a outro investigador.',
  );
}

  await this.assertLegalInvestigator(
  audit.requestedById,
);

  if (
    audit.status !== LegalInvestigationStatus.STARTED
  ) {
    throw new BadRequestException(
      'A investigação precisa estar no estado STARTED.',
    );
  }

  let queryAudit:
  | LegalInvestigationQueryAuditResult
  | undefined;

try {

  // ---------------------------------------------------------
  // NORMALIZAÇÃO
  // ---------------------------------------------------------

  const conversationId =
    input.conversationId?.trim() || undefined;

  const messageId =
    input.messageId?.trim() || undefined;

  const userId =
    input.userId?.trim() || undefined;

  const storeId =
    input.storeId?.trim() || undefined;

  const searchTerm =
    input.searchTerm?.trim() || undefined;

  const limit = Math.min(
    Math.max(input.limit ?? 50, 1),
    100,
  );

  const fromDate =
  this.parseHttpDate(
    input.fromDate,
    'fromDate',
  );

const toDate =
  this.parseHttpDate(
    input.toDate,
    'toDate',
  );

  // ---------------------------------------------------------
  // VALIDAR INTERVALO DE DATAS
  // ---------------------------------------------------------

 if (
  fromDate &&
  toDate &&
  fromDate > toDate
) {
  throw new BadRequestException(
    'fromDate não pode ser posterior a toDate.',
  );
}

if (
  audit.fromDate &&
  fromDate &&
  fromDate < audit.fromDate
) {
  throw new ForbiddenException(
    'A data inicial da consulta ultrapassa o início da investigação.',
  );
}

if (
  audit.toDate &&
  toDate &&
  toDate > audit.toDate
) {
  throw new ForbiddenException(
    'A data final da consulta ultrapassa o fim da investigação.',
  );
}


  if (
  audit.userId &&
  userId &&
  audit.userId !== userId
) {
  throw new ForbiddenException(
    'A consulta tenta ultrapassar o utilizador definido na investigação.',
  );
}

if (
  audit.storeId &&
  storeId &&
  audit.storeId !== storeId
) {
  throw new ForbiddenException(
    'A consulta tenta ultrapassar a banca definida na investigação.',
  );
}

if (
  audit.conversationId &&
  conversationId &&
  audit.conversationId !== conversationId
) {
  throw new ForbiddenException(
    'A consulta tenta ultrapassar a conversa definida na investigação.',
  );
}

if (
  audit.messageId &&
  messageId &&
  audit.messageId !== messageId
) {
  throw new ForbiddenException(
    'A consulta tenta ultrapassar a mensagem definida na investigação.',
  );
}

  // ---------------------------------------------------------
  // VALIDAR COMPATIBILIDADE DOS FILTROS DA CONSULTA
  // ---------------------------------------------------------

  await this.validateScopeCompatibility({
    userId,
    storeId,
    conversationId,
    messageId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    searchTerm,
  });

  queryAudit =
  await this.startQueryAudit(
    input,
    requestedById,
    ipAddress,
    userAgent,
    fromDate,
    toDate,
  );

  // ---------------------------------------------------------
  // CONSTRUIR WHERE
  // ---------------------------------------------------------

 const andConditions: Prisma.MessageWhereInput[] = [];

// =========================================================
// ESCOPO ORIGINAL DA INVESTIGAÇÃO
// =========================================================

// Utilizador original
if (audit.userId) {
  andConditions.push({
    OR: [
      {
        senderId: audit.userId,
      },
      {
        receiverId: audit.userId,
      },
    ],
  });
}

// Banca original
if (audit.storeId) {
  andConditions.push({
    conversation: {
      storeId: audit.storeId,
    },
  });
}

// Conversa original
if (audit.conversationId) {
  andConditions.push({
    conversationId: audit.conversationId,
  });
}

// Mensagem original
if (audit.messageId) {
  andConditions.push({
    id: audit.messageId,
  });
}

// Data inicial original
if (audit.fromDate) {
  andConditions.push({
    createdAt: {
      gte: audit.fromDate,
    },
  });
}

// Data final original
if (audit.toDate) {
  andConditions.push({
    createdAt: {
      lte: audit.toDate,
    },
  });
}

// Termo original
if (audit.searchTerm) {
  andConditions.push({
    content: {
      contains: audit.searchTerm,
      mode: 'insensitive',
    },
  });
}

// =========================================================
// FILTROS ADICIONAIS DA CONSULTA
// =========================================================

// Utilizador solicitado na consulta
if (userId) {
  andConditions.push({
    OR: [
      {
        senderId: userId,
      },
      {
        receiverId: userId,
      },
    ],
  });
}

// Banca solicitada na consulta
if (storeId) {
  andConditions.push({
    conversation: {
      storeId,
    },
  });
}

// Conversa solicitada na consulta
if (conversationId) {
  andConditions.push({
    conversationId,
  });
}

// Mensagem solicitada na consulta
if (messageId) {
  andConditions.push({
    id: messageId,
  });
}

// Data inicial solicitada
if (fromDate) {
  andConditions.push({
    createdAt: {
      gte: fromDate,
    },
  });
}

// Data final solicitada
if (toDate) {
  andConditions.push({
    createdAt: {
      lte: toDate,
    },
  });
}

// Termo adicional
if (searchTerm) {
  andConditions.push({
    content: {
      contains: searchTerm,
      mode: 'insensitive',
    },
  });
}

// Tipo de mensagem
if (input.messageType) {
  andConditions.push({
    messageType: input.messageType,
  });
}

const where: Prisma.MessageWhereInput = {
  AND: andConditions,
};

 // ---------------------------------------------------------
// CURSOR
// ---------------------------------------------------------

let cursorPosition:
  | {
      createdAt: Date;
      id: string;
    }
  | undefined;

if (input.cursor) {
  cursorPosition =
    this.parseMessageSearchCursor(
      input.cursor,
    );

  andConditions.push({
    OR: [
      {
        createdAt: {
          lt: cursorPosition.createdAt,
        },
      },

      {
        AND: [
          {
            createdAt:
              cursorPosition.createdAt,
          },

          {
            id: {
              lt: cursorPosition.id,
            },
          },
        ],
      },
    ],
  });
}

const messages =
  await this.prisma.message.findMany({
    where,

    orderBy: [
      {
        createdAt: 'desc',
      },

      {
        id: 'desc',
      },
    ],

    take: limit + 1,

    select: {
      id: true,
      conversationId: true,

      senderId: true,

      sender: {
        select: {
          name: true,
        },
      },

      content: true,
      messageType: true,

      createdAt: true,
      editedAt: true,
      deletedAt: true,

      imageUrl: true,
      audioUrl: true,
      videoUrl: true,
      documentName: true,

      receiverId: true,

      latitude: true,
      longitude: true,

      replyToId: true,

      sharedMessageId: true,
      sharedProductId: true,
      sharedPostId: true,
    },
  });

  const hasMore = messages.length > limit;

  if (hasMore) {
    messages.pop();
  }

  const result = messages.map((message) => ({
    id: message.id,
    conversationId: message.conversationId,

    senderId: message.senderId,
    senderName: message.sender.name,

    content: message.content,
    messageType: message.messageType,

    createdAt: message.createdAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,

    imageUrl: message.imageUrl,
    audioUrl: message.audioUrl,
    videoUrl: message.videoUrl,
    documentName: message.documentName,

    receiverId: message.receiverId,

    latitude: message.latitude,
    longitude: message.longitude,

    replyToId: message.replyToId,

    sharedMessageId: message.sharedMessageId,
    sharedProductId: message.sharedProductId,
    sharedPostId: message.sharedPostId,
  }));

  await this.completeQueryAudit(
  queryAudit.id,
  result.length,
);

return {
  messages: result,

  hasMore,

  nextCursor: hasMore
  ? messages[messages.length - 1]
      ? this.createMessageSearchCursor(
          messages[messages.length - 1].createdAt,
          messages[messages.length - 1].id,
        )
      : null
  : null,

  resultCount: result.length,
};

} catch (error) {
  if (queryAudit) {
    await this.failQueryAudit(
      queryAudit.id,
      error instanceof Error
        ? error.message
        : 'Erro desconhecido durante a pesquisa.',
    );
  }

  throw error;
}
}

  // =========================================================
  // LISTAR EVIDÊNCIAS DA INVESTIGAÇÃO
  // =========================================================

  async listEvidence(
    investigationId: string,
    requestedById: string,
  ) {
    if (!investigationId?.trim()) {
      throw new BadRequestException(
        'ID da investigação é obrigatório.',
      );
    }

    const normalizedInvestigationId =
      investigationId.trim();

    const investigation =
      await this.prisma.legalInvestigationAudit.findUnique({
        where: {
          id: normalizedInvestigationId,
        },

        select: {
          id: true,
          requestedById: true,
          status: true,
        },
      });

    if (!investigation) {
      throw new NotFoundException(
        'Investigação não encontrada.',
      );
    }

    if (
      investigation.requestedById !==
      requestedById
    ) {
      throw new ForbiddenException(
        'Esta investigação pertence a outro investigador.',
      );
    }

    await this.assertLegalInvestigator(
      requestedById,
    );

    return this.legalEvidenceService
      .listEvidenceForInvestigation(
        investigation.id,
      );
  }

  async listEvidenceByMessages(
  investigationId: string,
  messageIds: string[],
  requestedById: string,
) {
  if (!investigationId?.trim()) {
    throw new BadRequestException(
      'ID da investigação é obrigatório.',
    );
  }

  const normalizedInvestigationId = investigationId.trim();

  const normalizedMessageIds = [
    ...new Set(
      messageIds
        .filter((id) => typeof id === 'string')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];

  if (
    normalizedMessageIds.length === 0 ||
    normalizedMessageIds.length > 100
  ) {
    throw new BadRequestException(
      'A lista de mensagens é inválida.',
    );
  }

  const investigation =
    await this.prisma.legalInvestigationAudit.findUnique({
      where: {
        id: normalizedInvestigationId,
      },
      select: {
        id: true,
        requestedById: true,
      },
    });

  if (!investigation) {
    throw new NotFoundException(
      'Investigação não encontrada.',
    );
  }

  if (investigation.requestedById !== requestedById) {
    throw new ForbiddenException(
      'Esta investigação pertence a outro investigador.',
    );
  }

  await this.assertLegalInvestigator(requestedById);

  return this.legalEvidenceService.listEvidenceForMessages(
    investigation.id,
    normalizedMessageIds,
  );
}

  // =========================================================
  // CONSULTAR UMA EVIDÊNCIA
  // =========================================================

  async getEvidence(
    investigationId: string,
    evidenceId: string,
    requestedById: string,
    ipAddress?: string,
    userAgent?: string,
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

    const investigation =
      await this.prisma.legalInvestigationAudit.findUnique({
        where: {
          id: normalizedInvestigationId,
        },

        select: {
          id: true,
          requestedById: true,
          status: true,
        },
      });

    if (!investigation) {
      throw new NotFoundException(
        'Investigação não encontrada.',
      );
    }

    if (
      investigation.requestedById !==
      requestedById
    ) {
      await this.recordDeniedAttempt(
        requestedById,
        'Tentativa de acessar uma evidência pertencente a outra investigação.',
        ipAddress,
        userAgent,
        'GET',
        `/legal-investigation/${normalizedInvestigationId}/evidence/${normalizedEvidenceId}`,
        normalizedInvestigationId,
      );

      throw new ForbiddenException(
        'Esta investigação pertence a outro investigador.',
      );
    }

    await this.assertLegalInvestigator(
      requestedById,
    );

    const accessAudit =
      await this.legalEvidenceService
        .startEvidenceAccessAudit(
          normalizedInvestigationId,
          normalizedEvidenceId,
          requestedById,
          'VIEW',
          undefined,
          ipAddress,
          userAgent,
        );

    try {
      const result =
        await this.legalEvidenceService
          .getEvidenceForInvestigation(
            normalizedInvestigationId,
            normalizedEvidenceId,
          );

      await this.legalEvidenceService
        .completeEvidenceAccessAudit(
          accessAudit.id,
        );

      return result;
    } catch (error) {
      await this.legalEvidenceService
        .failEvidenceAccessAudit(
          accessAudit.id,
          error instanceof Error
            ? error.message
            : 'Falha ao consultar evidência.',
        );

      throw error;
    }
  }

private async startQueryAudit(
  input: LegalMessageSearchInput,
  requestedById: string,
  ipAddress?: string,
  userAgent?: string,
  fromDate?: Date,
  toDate?: Date,
): Promise<LegalInvestigationQueryAuditResult> {
  const queryAudit =
    await this.prisma.legalInvestigationQueryAudit.create({
      data: {
        investigationId: input.investigationId,

        requestedById,

        conversationId:
          input.conversationId?.trim() || undefined,

        messageId:
          input.messageId?.trim() || undefined,

        userId:
          input.userId?.trim() || undefined,

        storeId:
          input.storeId?.trim() || undefined,

        fromDate,
toDate,

        searchTerm:
          input.searchTerm?.trim() || undefined,

        messageType: input.messageType,

        ipAddress,
        userAgent,

        status:
          LegalInvestigationQueryStatus.STARTED,
      },

      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

  return queryAudit;
}

private async completeQueryAudit(
  queryAuditId: string,
  resultCount: number,
): Promise<void> {
  await this.prisma.legalInvestigationQueryAudit.update({
    where: {
      id: queryAuditId,
    },

    data: {
      status:
        LegalInvestigationQueryStatus.COMPLETED,

      resultCount,

      completedAt: new Date(),
    },
  });
}

private async failQueryAudit(
  queryAuditId: string,
  errorMessage: string,
): Promise<void> {
  await this.prisma.legalInvestigationQueryAudit.update({
    where: {
      id: queryAuditId,
    },

    data: {
      status:
        LegalInvestigationQueryStatus.FAILED,

      errorMessage:
        errorMessage.trim().slice(0, 2000),

      completedAt: new Date(),
    },
  });
}

private createMessageSearchCursor(
  createdAt: Date,
  id: string,
): string {
  const version = '1';
  const createdAtValue = createdAt.toISOString();

  const payload =
    `${version}.${createdAtValue}.${id}`;

  const secret =
    process.env.LEGAL_INVESTIGATION_CURSOR_SECRET ??
    process.env.JWT_SECRET;

  if (!secret) {
    throw new InternalServerErrorException(
      'Segredo de paginação não configurado.',
    );
  }

  const signature = createHmac(
    'sha256',
    secret,
  )
    .update(payload)
    .digest('hex');

  const cursorData = JSON.stringify({
    v: version,
    createdAt: createdAtValue,
    id,
    signature,
  });

  return Buffer.from(
    cursorData,
    'utf8',
  ).toString('base64url');
}

private parseMessageSearchCursor(
  cursor: string,
): {
  createdAt: Date;
  id: string;
} {
  if (!cursor || cursor.length > 1000) {
    throw new BadRequestException(
      'Cursor de paginação inválido.',
    );
  }

  let parsed: {
    v?: unknown;
    createdAt?: unknown;
    id?: unknown;
    signature?: unknown;
  };

  try {
    parsed = JSON.parse(
      Buffer.from(
        cursor,
        'base64url',
      ).toString('utf8'),
    );
  } catch {
    throw new BadRequestException(
      'Cursor de paginação inválido.',
    );
  }

  if (
    parsed.v !== '1' ||
    typeof parsed.createdAt !== 'string' ||
    typeof parsed.id !== 'string' ||
    typeof parsed.signature !== 'string'
  ) {
    throw new BadRequestException(
      'Cursor de paginação inválido.',
    );
  }

  const createdAt =
    new Date(parsed.createdAt);

  if (
    Number.isNaN(
      createdAt.getTime(),
    )
  ) {
    throw new BadRequestException(
      'Cursor de paginação inválido.',
    );
  }

  const secret =
    process.env.LEGAL_INVESTIGATION_CURSOR_SECRET ??
    process.env.JWT_SECRET;

  if (!secret) {
    throw new InternalServerErrorException(
      'Segredo de paginação não configurado.',
    );
  }

  const payload =
    `${parsed.v}.${createdAt.toISOString()}.${parsed.id}`;

  const expectedSignature =
    createHmac(
      'sha256',
      secret,
    )
      .update(payload)
      .digest('hex');

  const providedBuffer =
    Buffer.from(
      parsed.signature,
      'utf8',
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      'utf8',
    );

  if (
    providedBuffer.length !==
    expectedBuffer.length
  ) {
    throw new BadRequestException(
      'Cursor de paginação inválido.',
    );
  }

  if (
    !timingSafeEqual(
      providedBuffer,
      expectedBuffer,
    )
  ) {
    throw new BadRequestException(
      'Cursor de paginação inválido.',
    );
  }

  return {
    createdAt,
    id: parsed.id,
  };
}

private parseHttpDate(
  value: Date | string | undefined,
  fieldName: string,
): Date | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException(
        `${fieldName} contém uma data inválida.`,
      );
    }

    return value;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(
      `${fieldName} deve ser uma data válida.`,
    );
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new BadRequestException(
      `${fieldName} não pode estar vazio.`,
    );
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(
      `${fieldName} contém uma data inválida.`,
    );
  }

  return parsed;
}

private async recordDeniedAttempt(
  requestedById: string | undefined,
  reason: string,
  ipAddress?: string,
  userAgent?: string,
  method?: string,
  path?: string,
  investigationId?: string,
): Promise<void> {
  try {
    await this.prisma.legalInvestigationDeniedAttempt.create({
      data: {
        requestedById,

        investigationId,

        reason:
          reason.trim().slice(0, 1000),

        ipAddress,
        userAgent,

        method,
        path,
      },
    });
  } catch {
    // A auditoria de segurança não deve mascarar
    // o erro original da operação.
  }
}

  // =========================================================
  // ACESSAR MÍDIA DE UMA EVIDÊNCIA
  // =========================================================

  async getEvidenceMedia(
    investigationId: string,
    evidenceId: string,
    mediaType:
      | 'audio'
      | 'image'
      | 'video'
      | 'thumbnail'
      | 'document',
    requestedById: string,
    ipAddress?: string,
    userAgent?: string,
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

    await this.assertLegalInvestigator(
      requestedById,
    );

    const investigation =
      await this.prisma.legalInvestigationAudit.findFirst({
        where: {
          id: normalizedInvestigationId,
          requestedById,
        },

        select: {
          id: true,
        },
      });

    if (!investigation) {
      await this.recordDeniedAttempt(
        requestedById,

        'Tentativa de acessar mídia de investigação não pertencente ao investigador.',

        ipAddress,
        userAgent,

        'GET',

        `/legal-investigation/${normalizedInvestigationId}/evidence/${normalizedEvidenceId}/media/${mediaType}`,

        normalizedInvestigationId,
      );

      throw new ForbiddenException(
        'Acesso à investigação não autorizado.',
      );
    }

    const accessAudit =
      await this.legalEvidenceService
        .startEvidenceAccessAudit(
          normalizedInvestigationId,
          normalizedEvidenceId,
          requestedById,
          'MEDIA',
          mediaType,
          ipAddress,
          userAgent,
        );

    try {
      const result =
        await this.legalEvidenceService
          .getEvidenceMediaForInvestigation(
            normalizedInvestigationId,
            normalizedEvidenceId,
            mediaType,
          );

      return {
        ...result,
        accessAuditId: accessAudit.id,
      };

} catch (error) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : String(error);

  const errorStack =
    error instanceof Error
      ? error.stack
      : undefined;

  this.logger.error(
    `Falha ao preparar mídia da evidência. ` +
      `Investigação: ${normalizedInvestigationId}; ` +
      `evidência: ${normalizedEvidenceId}; ` +
      `tipo: ${mediaType}; erro: ${errorMessage}`,
    errorStack,
  );

  try {
    await this.legalEvidenceService.failEvidenceAccessAudit(
      accessAudit.id,
      errorMessage,
    );
  } catch (auditError) {
    this.logger.error(
      'Não foi possível registar a falha de acesso à evidência.',
      auditError instanceof Error
        ? auditError.stack
        : undefined,
    );
  }

  throw error;
}

  }


async releaseLegalHold(
  holdId: string,
  adminUserId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const normalizedHoldId = holdId?.trim();
  const normalizedReason = reason?.trim();

  if (!normalizedHoldId) {
    throw new BadRequestException(
      'O ID do Legal Hold é obrigatório.',
    );
  }

  if (!normalizedReason) {
    throw new BadRequestException(
      'O motivo da libertação é obrigatório.',
    );
  }

  if (normalizedReason.length > 2000) {
    throw new BadRequestException(
      'O motivo da libertação não pode exceder 2000 caracteres.',
    );
  }

  const normalizedIpAddress = ipAddress?.trim() || null;
  const normalizedUserAgent = userAgent?.trim() || null;

  const releasedHold = await this.prisma.$transaction(async (tx) => {
    const adminProfile = await tx.adminProfile.findUnique({
      where: { userId: adminUserId },
      select: {
        adminRole: true,
        status: true,
      },
    });

    if (
      !adminProfile ||
      adminProfile.adminRole !== AdminRole.SUPER_ADMIN ||
      adminProfile.status !== AdminStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'A libertação de Legal Holds está reservada a SUPER_ADMIN ativos.',
      );
    }

    const hold = await tx.legalHold.findUnique({
      where: { id: normalizedHoldId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!hold) {
      throw new NotFoundException(
        'Legal Hold não encontrado.',
      );
    }

    if (hold.status !== LegalHoldStatus.ACTIVE) {
      throw new BadRequestException(
        'Este Legal Hold já foi libertado.',
      );
    }

    // Atualização condicional: apenas uma libertação pode vencer
    // se duas solicitações forem processadas simultaneamente.
    const updateResult = await tx.legalHold.updateMany({
      where: {
        id: normalizedHoldId,
        status: LegalHoldStatus.ACTIVE,
      },
      data: {
        status: LegalHoldStatus.RELEASED,
        releasedAt: new Date(),
        releaseReason: normalizedReason,
        releasedById: adminUserId,
        releasedFromIpAddress: normalizedIpAddress,
        releasedByUserAgent: normalizedUserAgent,
      },
    });

    if (updateResult.count !== 1) {
      throw new BadRequestException(
        'O Legal Hold já não está disponível para libertação.',
      );
    }

    const result = await tx.legalHold.findUnique({
      where: { id: normalizedHoldId },
      select: {
        id: true,
        investigationId: true,
        status: true,
        releasedAt: true,
        releaseReason: true,
        releasedById: true,
        releasedFromIpAddress: true,
        releasedByUserAgent: true,
      },
    });

    if (!result) {
      throw new InternalServerErrorException(
        'Não foi possível confirmar a libertação do Legal Hold.',
      );
    }

    return result;
  });

  // Registar no log apenas depois de a transação ser confirmada.
  this.logger.log(
    `Legal Hold ${releasedHold.id} libertado por SUPER_ADMIN ${adminUserId}.`,
  );

  return releasedHold;
}

private async assertActiveSuperAdmin(userId: string): Promise<void> {
  const profile = await this.prisma.adminProfile.findUnique({
    where: { userId },
    select: { adminRole: true, status: true },
  });

  if (
    !profile ||
    profile.adminRole !== AdminRole.SUPER_ADMIN ||
    profile.status !== AdminStatus.ACTIVE
  ) {
    throw new ForbiddenException(
      'Esta operação está reservada a SUPER_ADMIN ativos.',
    );
  }
}

async listLegalHolds(
  adminUserId: string,
  status?: string,
  query?: string,
) {
  await this.assertActiveSuperAdmin(adminUserId);

  const normalizedStatus =
    status === LegalHoldStatus.ACTIVE || status === LegalHoldStatus.RELEASED
      ? status
      : undefined;

  const term = query?.trim().slice(0, 200);

  const holds = await this.prisma.legalHold.findMany({
    where: {
      ...(normalizedStatus && { status: normalizedStatus }),
      ...(term && {
        investigation: {
          legalReference: { contains: term, mode: 'insensitive' },
        },
      }),
    },

    orderBy: { createdAt: 'desc' },
    take: 100,

    select: {
      id: true,
      status: true,
      createdAt: true,
      releasedAt: true,
      releaseReason: true,

      userId: true,
      storeId: true,
      conversationId: true,
      messageId: true,
      fromDate: true,
      toDate: true,

      releasedBy: { select: { name: true, email: true } },

      investigation: {
        select: {
          id: true,
          legalReference: true,
          reason: true,
          status: true,
          requestedBy: { select: { name: true, email: true } },
        },
      },

      _count: { select: { evidence: true } },
    },
  });

  return holds.map(hold => ({
    id: hold.id,
    status: hold.status,
    createdAt: hold.createdAt,
    releasedAt: hold.releasedAt,
    releaseReason: hold.releaseReason,
    releasedBy: hold.releasedBy,

    scope: {
      userId: hold.userId,
      storeId: hold.storeId,
      conversationId: hold.conversationId,
      messageId: hold.messageId,
      fromDate: hold.fromDate,
      toDate: hold.toDate,
    },

    evidenceCount: hold._count.evidence,
    investigation: hold.investigation,
  }));
}

}