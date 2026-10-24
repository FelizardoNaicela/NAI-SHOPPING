import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PaymentStatus,
  PaymentType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import {
  PaymentGatewayService,
} from './gateways/payment-gateway.service';

@Injectable()
export class PaymentsService {
  constructor(
  private readonly prisma: PrismaService,

  private readonly paymentGatewayService: PaymentGatewayService,
) {}

  // =========================================================
  // CRIAR PAGAMENTO
  // =========================================================
  //
  // Este método é pensado principalmente para uso interno
  // pelos módulos de Promoções, Verificação e Ranking.
  //
  // NÃO significa que o dinheiro foi pago.
  //
  // O pagamento começa como PENDING.
  // =========================================================

  async createPayment(
    userId: string,
    dto: CreatePaymentDto,
  ) {
    // =======================================================
    // VALOR
    // =======================================================

    const amount = Number(dto.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new BadRequestException(
        'Valor do pagamento inválido.',
      );
    }

    // =======================================================
    // TIPO
    // =======================================================

    if (!dto.type) {
      throw new BadRequestException(
        'O tipo do pagamento é obrigatório.',
      );
    }

    // =======================================================
    // MOEDA
    // =======================================================

    const currency =
      dto.currency
        ?.trim()
        .toUpperCase() || 'MZN';

    // =======================================================
    // VERIFICAR UTILIZADOR
    // =======================================================

    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Utilizador não encontrado.',
      );
    }

    // =======================================================
    // VALIDAR RELAÇÃO COM PROMOÇÃO
    // =======================================================

    if (dto.promotionId) {
      const promotion =
        await this.prisma.productPromotion.findUnique({
          where: {
            id: dto.promotionId,
          },

          select: {
            id: true,
            store: {
              select: {
                ownerId: true,
              },
            },
          },
        });

      if (!promotion) {
        throw new NotFoundException(
          'Promoção não encontrada.',
        );
      }

      if (
        promotion.store.ownerId !==
        userId
      ) {
        throw new BadRequestException(
          'A promoção não pertence ao utilizador.',
        );
      }
    }

    // =======================================================
    // VALIDAR LEILÃO DO RANKING
    // =======================================================

    if (dto.rankingAuctionId) {
      const auction =
        await this.prisma
          .nationalRankingAuction
          .findUnique({
            where: {
              id:
                dto.rankingAuctionId,
            },

            select: {
              id: true,
              winnerStoreId: true,

              winnerStore: {
                select: {
                  ownerId: true,
                },
              },
            },
          });

      if (!auction) {
        throw new NotFoundException(
          'Leilão do Ranking Nacional não encontrado.',
        );
      }

      // -----------------------------------------------------
      // Se já existe vencedor, verificamos se pertence
      // ao utilizador que está criando o pagamento.
      // -----------------------------------------------------

      if (
        auction.winnerStore &&
        auction.winnerStore.ownerId !==
          userId
      ) {
        throw new BadRequestException(
          'O leilão não pertence ao utilizador.',
        );
      }
    }

    // =======================================================
    // VALIDAR PEDIDO DE VERIFICAÇÃO
    // =======================================================

    if (
      dto.verificationRequestId
    ) {
      const request =
        await this.prisma
          .verificationRequest
          .findUnique({
            where: {
              id:
                dto.verificationRequestId,
            },

            select: {
              id: true,

              requestedById: true,
            },
          });

      if (!request) {
        throw new NotFoundException(
          'Pedido de verificação não encontrado.',
        );
      }

      if (
        request.requestedById !==
        userId
      ) {
        throw new BadRequestException(
          'O pedido de verificação não pertence ao utilizador.',
        );
      }
    }

    // =======================================================
    // REFERÊNCIA
    // =======================================================

    const reference =
      dto.reference?.trim() || undefined;

    // =======================================================
    // CRIAR
    // =======================================================

    return this.prisma.sitePayment.create({
      data: {
        userId,

        type:
          dto.type,

        status:
          PaymentStatus.PENDING,

        amount,

        currency,

        description:
          dto.description
            ?.trim() || null,

        reference,

        provider:
          dto.provider
            ?.trim()
            .toUpperCase() || null,

        promotionId:
          dto.promotionId ?? null,

        rankingAuctionId:
          dto.rankingAuctionId ?? null,

        verificationRequestId:
          dto.verificationRequestId ??
          null,

        metadata:
          dto.metadata
            ? (dto.metadata as Prisma.InputJsonValue)
            : undefined,
      },

      include: {
        promotion: {
          select: {
            id: true,
            name: true,
          },
        },

        rankingAuction: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            position: true,
          },
        },

        verificationRequest: {
          select: {
            id: true,
            requestedType: true,
            status: true,
          },
        },
      },
    });
  }

  // =========================================================
// MARCAR COMO PAGO
// =========================================================
//
// Regras:
// - O pagamento deve existir.
// - Se já estiver PAID, retorna o pagamento sem duplicar
//   a confirmação.
// - Apenas pagamentos PENDING podem passar para PAID.
// - A referência, quando informada, deve ser válida.
// - Uma referência não pode pertencer a outro pagamento.
// - O provedor é normalizado antes de ser guardado.
// =========================================================

async markAsPaid(
  paymentId: string,
  reference?: string,
  provider?: string,
) {
  // =======================================================
  // PROCURAR PAGAMENTO
  // =======================================================

  const payment =
    await this.prisma.sitePayment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!payment) {
    throw new NotFoundException(
      'Pagamento não encontrado.',
    );
  }

  // =======================================================
  // IDEMPOTÊNCIA
  // =======================================================

  if (
    payment.status ===
    PaymentStatus.PAID
  ) {
    return payment;
  }

  // =======================================================
  // VALIDAR ESTADO
  // =======================================================

  if (
    payment.status !==
    PaymentStatus.PENDING
  ) {
    throw new BadRequestException(
      `Este pagamento não pode ser confirmado porque está com o estado ${payment.status}.`,
    );
  }

  // =======================================================
  // NORMALIZAR REFERÊNCIA E PROVEDOR
  // =======================================================

  const normalizedReference =
    reference?.trim() || undefined;

  const normalizedProvider =
    provider?.trim().toUpperCase() || undefined;

  // =======================================================
  // VALIDAR REFERÊNCIA DUPLICADA
  // =======================================================

  if (normalizedReference) {
    const existingPayment =
      await this.prisma.sitePayment.findFirst({
        where: {
          reference: normalizedReference,

          NOT: {
            id: paymentId,
          },
        },

        select: {
          id: true,
        },
      });

    if (existingPayment) {
      throw new BadRequestException(
        'A referência de pagamento já está associada a outro pagamento.',
      );
    }
  }

  // =======================================================
  // CONFIRMAR PAGAMENTO
  // =======================================================

  return this.prisma.sitePayment.update({
    where: {
      id: paymentId,
    },

    data: {
      status:
        PaymentStatus.PAID,

      paidAt:
        new Date(),

      ...(normalizedReference !== undefined && {
        reference:
          normalizedReference,
      }),

      ...(normalizedProvider !== undefined && {
        provider:
          normalizedProvider,
      }),
    },
  });
}

  // =========================================================
  // MARCAR COMO FALHADO
  // =========================================================

  async markAsFailed(
    paymentId: string,
  ) {
    const payment =
      await this.getPaymentById(
        paymentId,
      );

    if (
      payment.status ===
      PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Um pagamento já confirmado não pode ser marcado como falhado.',
      );
    }

    return this.prisma.sitePayment.update({
      where: {
        id: paymentId,
      },

      data: {
        status:
          PaymentStatus.FAILED,
      },
    });
  }

  // =========================================================
  // CANCELAR
  // =========================================================

  async cancelPayment(
    paymentId: string,
  ) {
    const payment =
      await this.getPaymentById(
        paymentId,
      );

    if (
      payment.status ===
      PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Um pagamento já confirmado não pode ser cancelado.',
      );
    }

    if (
      payment.status ===
      PaymentStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'Este pagamento já foi reembolsado.',
      );
    }

    return this.prisma.sitePayment.update({
      where: {
        id: paymentId,
      },

      data: {
        status:
          PaymentStatus.CANCELLED,
      },
    });
  }

  // =========================================================
  // REEMBOLSO
  // =========================================================
  //
  // O processamento financeiro real do reembolso será
  // conectado posteriormente ao provedor.
  // =========================================================

  async markAsRefunded(
    paymentId: string,
  ) {
    const payment =
      await this.getPaymentById(
        paymentId,
      );

    if (
      payment.status !==
      PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Somente pagamentos confirmados podem ser reembolsados.',
      );
    }

    return this.prisma.sitePayment.update({
      where: {
        id: paymentId,
      },

      data: {
        status:
          PaymentStatus.REFUNDED,
      },
    });
  }

  // =========================================================
  // BUSCAR PAGAMENTO
  // =========================================================

  async getPaymentById(
    paymentId: string,
  ) {
    const payment =
      await this.prisma.sitePayment.findUnique({
        where: {
          id: paymentId,
        },

        include: {
          promotion: {
            select: {
              id: true,
              name: true,
            },
          },

          rankingAuction: {
            select: {
              id: true,
              name: true,
              countryCode: true,
              position: true,
              finalPrice: true,
              winnerStoreId: true,
            },
          },

          verificationRequest: {
            select: {
              id: true,
              requestedType: true,
              status: true,
            },
          },

          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    return payment;
  }

  // =========================================================
  // MEUS PAGAMENTOS
  // =========================================================

  async getMyPayments(
    userId: string,
    query: PaymentQueryDto = {},
  ) {
    const page = Math.max(
      1,
      Number(query.page) || 1,
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(query.limit) || 20,
      ),
    );

    const skip =
      (page - 1) * limit;

    const where: Prisma.SitePaymentWhereInput =
      {
        userId,

        ...(query.type && {
          type: query.type,
        }),

        ...(query.status && {
          status: query.status,
        }),
      };

    const [
      payments,
      total,
    ] =
      await this.prisma.$transaction([
        this.prisma.sitePayment.findMany({
          where,

          orderBy: [
            {
              createdAt: 'desc',
            },
          ],

          skip,

          take: limit,

          include: {
            promotion: {
              select: {
                id: true,
                name: true,
              },
            },

            rankingAuction: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                position: true,
              },
            },

            verificationRequest: {
              select: {
                id: true,
                requestedType: true,
                status: true,
              },
            },

            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),

        this.prisma.sitePayment.count({
          where,
        }),
      ]);

    return {
      payments,

      pagination: {
        page,
        limit,
        total,

        totalPages:
          Math.ceil(
            total / limit,
          ),
      },
    };
  }

  // =========================================================
  // RESUMO FINANCEIRO DO UTILIZADOR
  // =========================================================
  //
  // IMPORTANTE:
  // Aqui contamos somente PAID.
  //
  // PENDING, FAILED, CANCELLED e REFUNDED
  // não entram em "totalPaid".
  // =========================================================

  async getMyPaymentSummary(
    userId: string,
  ) {
    const paidPayments =
      await this.prisma.sitePayment.findMany({
        where: {
          userId,

          status:
            PaymentStatus.PAID,
        },

        select: {
          type: true,
          amount: true,
          currency: true,
        },
      });

    const totalPaid =
      paidPayments.reduce(
        (total, payment) =>
          total + payment.amount,
        0,
      );

    const promotionsPaid =
      paidPayments
        .filter(
          payment =>
            payment.type ===
            PaymentType.PROMOTION,
        )
        .reduce(
          (total, payment) =>
            total + payment.amount,
          0,
        );

    const verificationPaid =
      paidPayments
        .filter(
          payment =>
            payment.type ===
            PaymentType.VERIFICATION,
        )
        .reduce(
          (total, payment) =>
            total + payment.amount,
          0,
        );

    const nationalRankingPaid =
      paidPayments
        .filter(
          payment =>
            payment.type ===
            PaymentType.NATIONAL_RANKING,
        )
        .reduce(
          (total, payment) =>
            total + payment.amount,
          0,
        );

    const otherPaid =
      paidPayments
        .filter(
          payment =>
            payment.type ===
            PaymentType.OTHER,
        )
        .reduce(
          (total, payment) =>
            total + payment.amount,
          0,
        );

    return {
      currency:
        paidPayments[0]?.currency ??
        'MZN',

      totalPaid,

      byType: {
        promotions:
          promotionsPaid,

        verification:
          verificationPaid,

        nationalRanking:
          nationalRankingPaid,

        other:
          otherPaid,
      },
    };
  }

  // =========================================================
// VERIFICAR E MARCAR PAGAMENTO COMO PAGO
// =========================================================
//
// Consulta o gateway configurado e só confirma o pagamento
// interno quando o gateway devolver:
// - status PAID;
// - valor igual ao pagamento interno;
// - moeda igual ao pagamento interno.
//
// Este método não deve ser exposto diretamente ao cliente
// sem autenticação e sem validações adicionais.
// =========================================================

async verifyAndMarkAsPaid(
  reference: string,
) {
  // =======================================================
  // VALIDAR REFERÊNCIA
  // =======================================================

  const normalizedReference =
    reference?.trim();

  if (!normalizedReference) {
    throw new BadRequestException(
      'A referência do pagamento é obrigatória.',
    );
  }

  // =======================================================
  // PROCURAR PAGAMENTO INTERNO
  // =======================================================

  const payment =
    await this.prisma.sitePayment.findUnique({
      where: {
        reference: normalizedReference,
      },
    });

  if (!payment) {
    throw new NotFoundException(
      'Pagamento não encontrado para a referência informada.',
    );
  }

  // =======================================================
  // IDEMPOTÊNCIA
  // =======================================================

  if (
    payment.status ===
    PaymentStatus.PAID
  ) {
    return {
      alreadyPaid: true,

      payment,
    };
  }

  // =======================================================
  // VALIDAR ESTADO INTERNO
  // =======================================================

  if (
    payment.status !==
    PaymentStatus.PENDING
  ) {
    throw new BadRequestException(
      `Este pagamento não pode ser confirmado porque está com o estado ${payment.status}.`,
    );
  }

  // =======================================================
  // CONSULTAR O GATEWAY
  // =======================================================

  let gatewayPayment;

  try {
    gatewayPayment =
      await this.paymentGatewayService.verifyPayment(
        normalizedReference,
      );
  } catch {
    throw new BadRequestException(
      'Não foi possível verificar o pagamento no provedor.',
    );
  }

  // =======================================================
  // VALIDAR ESTADO DO GATEWAY
  // =======================================================

  if (
    gatewayPayment.status !==
    'PAID'
  ) {
    throw new BadRequestException(
      `O pagamento no provedor ainda não está confirmado. Estado atual: ${gatewayPayment.status}.`,
    );
  }

  // =======================================================
  // VALIDAR VALOR
  // =======================================================

  if (
    gatewayPayment.amount !==
    payment.amount
  ) {
    throw new BadRequestException(
      'O valor confirmado pelo provedor não corresponde ao valor do pagamento.',
    );
  }

  // =======================================================
  // VALIDAR MOEDA
  // =======================================================

  const gatewayCurrency =
    gatewayPayment.currency
      ?.trim()
      .toUpperCase();

  const paymentCurrency =
    payment.currency
      .trim()
      .toUpperCase();

  if (
    !gatewayCurrency ||
    gatewayCurrency !==
      paymentCurrency
  ) {
    throw new BadRequestException(
      'A moeda confirmada pelo provedor não corresponde à moeda do pagamento.',
    );
  }

  // =======================================================
  // CONFIRMAR NO BANCO DE DADOS
  // =======================================================

  const confirmedPayment =
    await this.markAsPaid(
      payment.id,

      normalizedReference,

      this.paymentGatewayService.getProviderName(),
    );

  return {
    alreadyPaid: false,

    payment: confirmedPayment,
  };
}

async findByReferenceForAdmin(reference: string) {
  const normalized = reference?.trim();

  if (!normalized) {
    throw new BadRequestException(
      'A referência do pagamento é obrigatória.',
    );
  }

  const payment = await this.prisma.sitePayment.findUnique({
    where: { reference: normalized },

    include: {
      promotion: {
        select: { id: true, name: true },
      },

      store: {
        select: {
          id: true,
          name: true,
          verified: true,
          verificationType: true,
        },
      },

      verificationRequest: {
        select: {
          id: true,
          requestedType: true,
          status: true,

          requestedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new NotFoundException(
      'Nenhum pagamento encontrado com esta referência.',
    );
  }

  return {
    id: payment.id,
    type: payment.type,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    provider: payment.provider,
    reference: payment.reference,
    description: payment.description,
    createdAt: payment.createdAt,
    paidAt: payment.paidAt,

    store: payment.store ?? null,

    payer: payment.verificationRequest?.requestedBy ?? null,

    verification: payment.verificationRequest
      ? {
          requestedType: payment.verificationRequest.requestedType,
          requestStatus: payment.verificationRequest.status,
        }
      : null,

    promotion: payment.promotion ?? null,
  };
}

async getRevenueStats(year: number, region?: string) {
  const currentYear = new Date().getFullYear();

  const safeYear =
    Number.isInteger(year) && year >= 2000 && year <= currentYear + 1
      ? year
      : currentYear;

  const from = new Date(safeYear, 0, 1);
  const to = new Date(safeYear + 1, 0, 1);

  const storeSelect = {
    select: {
      region: true,
      countryCode: true,
      regions: { select: { region: true }, take: 1 },
    },
  } as const;

  const [payments, firstPaid] = await Promise.all([
    this.prisma.sitePayment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: from, lt: to },
      },
      select: {
        type: true,
        amount: true,
        currency: true,
        paidAt: true,
        store: storeSelect,
        verificationRequest: { select: { store: storeSelect } },
        promotion: { select: { store: storeSelect } },
        rankingAuction: { select: { winnerStore: storeSelect } },
      },
    }),

    this.prisma.sitePayment.aggregate({
      where: { status: PaymentStatus.PAID, paidAt: { not: null } },
      _min: { paidAt: true },
    }),
  ]);

  const NO_REGION = 'Sem região';
  const wanted = region?.trim() || '';

  const emptyBucket = () => ({
    total: 0,
    verification: 0,
    promotion: 0,
    nationalRanking: 0,
    other: 0,
    count: 0,
  });

  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    ...emptyBucket(),
  }));

  const byType = {
    verification: 0,
    promotion: 0,
    nationalRanking: 0,
    other: 0,
  };

  const regionMap = new Map<string, ReturnType<typeof emptyBucket>>();

  let total = 0;
  let count = 0;

  for (const payment of payments) {
    if (!payment.paidAt) {
      continue;
    }

    const store =
      payment.store ??
      payment.verificationRequest?.store ??
      payment.promotion?.store ??
      payment.rankingAuction?.winnerStore ??
      null;

    const paymentRegion =
      store?.region?.trim() ||
      store?.regions?.[0]?.region?.trim() ||
      NO_REGION;

    const key =
      payment.type === PaymentType.VERIFICATION
        ? 'verification'
        : payment.type === PaymentType.PROMOTION
          ? 'promotion'
          : payment.type === PaymentType.NATIONAL_RANKING
            ? 'nationalRanking'
            : 'other';

    // Por região: sempre o ano inteiro, sem filtro
    const regionBucket = regionMap.get(paymentRegion) ?? emptyBucket();
    regionBucket[key] += payment.amount;
    regionBucket.total += payment.amount;
    regionBucket.count += 1;
    regionMap.set(paymentRegion, regionBucket);

    // Meses e totais: respeitam o filtro de região
    if (wanted && paymentRegion !== wanted) {
      continue;
    }

    const bucket = months[payment.paidAt.getMonth()];

    bucket[key] += payment.amount;
    bucket.total += payment.amount;
    bucket.count += 1;

    byType[key] += payment.amount;
    total += payment.amount;
    count += 1;
  }

  const byRegion = Array.from(regionMap.entries())
    .map(([name, values]) => ({ region: name, ...values }))
    .sort((a, b) => b.total - a.total);

  const firstYear =
    firstPaid._min.paidAt?.getFullYear() ?? currentYear;

  const availableYears: number[] = [];

  for (let y = currentYear; y >= Math.min(firstYear, currentYear); y--) {
    availableYears.push(y);
  }

  return {
    year: safeYear,
    region: wanted || null,
    currency: payments[0]?.currency ?? 'MZN',
    total,
    paymentsCount: count,
    byType,
    months,
    byRegion,
    availableYears,
  };
}
}