import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PaymentStatus,
  PaymentType,
  VerificationRequestStatus,
  VerificationType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================================
  // SOLICITAR VERIFICAÇÃO
  //
  // Somente o proprietário da loja pode solicitar.
  //
  // BASIC:
  //   pode ser posteriormente aprovada por Regional Admin
  //   com as permissões necessárias.
  //
  // PREMIUM:
  //   pode ser solicitada pelo proprietário,
  //   mas somente SUPER_ADMIN poderá aprovar.
  // =========================================================

  async requestVerification(
    userId: string,
    storeId: string,
    requestedType: VerificationType,
  ) {
    // =======================================================
    // VALIDAR TIPO
    // =======================================================

    if (
      requestedType !== VerificationType.BASIC &&
      requestedType !== VerificationType.PREMIUM
    ) {
      throw new BadRequestException(
        'Tipo de verificação inválido.',
      );
    }

    // =======================================================
    // BUSCAR LOJA
    // =======================================================

    const store =
      await this.prisma.store.findUnique({
        where: {
          id: storeId,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Loja não encontrada.',
      );
    }

    // =======================================================
    // VALIDAR PROPRIETÁRIO
    // =======================================================

    if (store.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não é o proprietário desta loja.',
      );
    }

    // =======================================================
    // LOJA ATIVA
    // =======================================================

    if (!store.isActive) {
      throw new BadRequestException(
        'Não é possível solicitar verificação para uma loja inativa.',
      );
    }

// =======================================================
// REGRA DE HIERARQUIA DA VERIFICAÇÃO
//
// PREMIUM só pode ser solicitada por uma banca
// que já possui uma verificação BASIC ativa.
//
// BASIC → pode solicitar PREMIUM
// PREMIUM → já possui PREMIUM
// SEM VERIFICAÇÃO → não pode solicitar PREMIUM
// =======================================================

if (
  requestedType === VerificationType.PREMIUM
) {
  if (
    !store.verified ||
    store.verificationType !==
      VerificationType.BASIC
  ) {
    throw new BadRequestException(
      'A verificação Premium só pode ser solicitada por uma banca que já possui verificação Básica.',
    );
  }
}

    // =======================================================
    // JÁ POSSUI O TIPO SOLICITADO
    // =======================================================

    if (
      store.verified &&
      store.verificationType === requestedType
    ) {
      throw new BadRequestException(
        `A loja já possui verificação ${requestedType}.`,
      );
    }

    // =======================================================
    // NÃO PERMITIR PEDIDO DUPLICADO
    // =======================================================

    const pending =
      await this.prisma.verificationRequest.findFirst({
        where: {
          storeId,

          status:
            VerificationRequestStatus.PENDING,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    if (pending) {
      throw new BadRequestException(
        'Esta loja já possui uma solicitação de verificação pendente.',
      );
    }

    // =======================================================
    // CRIAR PEDIDO
    // =======================================================

    return this.prisma.verificationRequest.create({
      data: {
        storeId,

        requestedType,

        requestedById:
          userId,

        status:
          VerificationRequestStatus.PENDING,
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            verified: true,
            verificationType: true,
            countryCode: true,
            region: true,
          },
        },

        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  // =========================================================
  // LISTAR MINHAS SOLICITAÇÕES
  //
  // Somente solicitações criadas pelo próprio utilizador.
  // =========================================================

  async listMyVerificationRequests(
    userId: string,
    storeId?: string,
  ) {
    const where: {
      requestedById: string;
      storeId?: string;
    } = {
      requestedById: userId,
    };

    if (storeId?.trim()) {
      where.storeId =
        storeId.trim();
    }

    return this.prisma.verificationRequest.findMany({
      where,

      include: {
        store: {
          select: {
            id: true,
            name: true,
            verified: true,
            verificationType: true,
            countryCode: true,
            region: true,
          },
        },

        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },

        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // CANCELAR SOLICITAÇÃO
  //
  // Somente o proprietário da loja pode cancelar
  // uma solicitação própria que ainda esteja PENDING.
  // =========================================================

  async cancelVerificationRequest(
    userId: string,
    requestId: string,
  ) {
    const request =
      await this.prisma.verificationRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          store: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              verified: true,
              verificationType: true,
            },
          },
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Solicitação de verificação não encontrada.',
      );
    }

    // =======================================================
    // VALIDAR PROPRIETÁRIO
    // =======================================================

    if (request.store.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não é o proprietário desta loja.',
      );
    }

    // =======================================================
    // SOMENTE PENDING
    // =======================================================

    if (
      request.status !==
      VerificationRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        'Somente solicitações pendentes podem ser canceladas.',
      );
    }

    // =======================================================
    // CANCELAR
    // =======================================================

    return this.prisma.verificationRequest.update({
      where: {
        id: request.id,
      },

      data: {
        status:
          VerificationRequestStatus.CANCELLED,

        reviewedById:
          null,

        reviewedAt:
          null,

        rejectionReason:
          null,
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            verified: true,
            verificationType: true,
          },
        },
      },
    });
  }

  // =========================================================
// CONSULTAR ESTADO COMPLETO DA VERIFICAÇÃO
//
// Somente o proprietário da banca pode consultar
// o estado das suas próprias solicitações.
//
// O método devolve:
// - dados da solicitação;
// - dados da banca;
// - estado do pagamento;
// - tipo de verificação;
// - estado final da verificação.
// =========================================================

async getVerificationStatus(
  userId: string,
  requestId: string,
) {
  // =======================================================
  // BUSCAR SOLICITAÇÃO
  // =======================================================

  const request =
    await this.prisma.verificationRequest.findFirst({
      where: {
        id: requestId,

        requestedById: userId,
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            verified: true,
            verificationType: true,
            countryCode: true,
            region: true,
          },
        },

        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },

        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },

        payments: {
          where: {
            type: PaymentType.VERIFICATION,
          },

          orderBy: {
            createdAt: 'desc',
          },

          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            currency: true,
            description: true,
            reference: true,
            provider: true,
            paidAt: true,
            createdAt: true,
            metadata: true,
          },
        },
      },
    });

  if (!request) {
    throw new NotFoundException(
      'Solicitação de verificação não encontrada.',
    );
  }

  // =======================================================
  // PAGAMENTO MAIS RECENTE
  // =======================================================

  const latestPayment =
    request.payments[0] ?? null;

  // =======================================================
  // DETERMINAR ESTADO DO PROCESSO
  // =======================================================

  let verificationStatus:
    | 'PENDING_REVIEW'
    | 'REJECTED'
    | 'CANCELLED'
    | 'AWAITING_PAYMENT'
    | 'PAYMENT_CONFIRMED'
    | 'COMPLETED' = 'PENDING_REVIEW';

  if (
    request.status ===
    VerificationRequestStatus.REJECTED
  ) {
    verificationStatus = 'REJECTED';
  } else if (
    request.status ===
    VerificationRequestStatus.CANCELLED
  ) {
    verificationStatus = 'CANCELLED';
  } else if (
    request.status ===
    VerificationRequestStatus.PENDING
  ) {
    verificationStatus = 'PENDING_REVIEW';
  } else if (
    request.status ===
      VerificationRequestStatus.APPROVED &&
    latestPayment?.status ===
      PaymentStatus.PAID &&
    request.store.verified &&
    request.store.verificationType ===
      request.requestedType
  ) {
    verificationStatus = 'COMPLETED';
  } else if (
    request.status ===
      VerificationRequestStatus.APPROVED &&
    latestPayment?.status ===
      PaymentStatus.PAID
  ) {
    verificationStatus = 'PAYMENT_CONFIRMED';
  } else if (
    request.status ===
    VerificationRequestStatus.APPROVED
  ) {
    verificationStatus = 'AWAITING_PAYMENT';
  }

  // =======================================================
  // RESULTADO
  // =======================================================

  return {
    request: {
      id: request.id,
      status: request.status,
      requestedType: request.requestedType,
      rejectionReason:
        request.rejectionReason,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
    },

    store: request.store,

    payment: latestPayment,

    verificationStatus,

    isCompleted:
      verificationStatus === 'COMPLETED',
  };
}
}