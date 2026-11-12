import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { PaymentGatewayService } from "../payments/gateways/payment-gateway.service";

import {
  PaymentStatus,
  PaymentType,
  PromotionPlacement,
  PromotionStatus,
  PromotionLocationMode,
} from "@prisma/client";
import { REGIONS } from "../common/regions";


type CreatePromotionDto = {
  name: string;
  startsAt: string;
  endsAt: string;
  packageId: string;
  priority?: number;
  placements: PromotionPlacement[];
  productIds: string[];

  locationMode?: PromotionLocationMode;
  targetCountryCode?: string;
  targetRegions?: string[];
};

type UpdatePromotionDto = {
  name?: string;
  startsAt?: string;
  endsAt?: string;
  priority?: number;
  placements?: PromotionPlacement[];
  productIds?: string[];

  locationMode?: PromotionLocationMode;
  targetCountryCode?: string;
  targetRegions?: string[];
};


type PromotionLocation = {
  country?: string;
  region?: string;
};

type PublicPromotionOptions = {
  userId?: string;
  location?: PromotionLocation;
};

type FeedPromotionOptions = PublicPromotionOptions & {
  start: number;
  limit: number;
  seed: string;
};

const PROMOTION_START_POSITION = 1;
const PROMOTION_FIRST_INTERVAL = 4;
const PROMOTION_INTERVAL = 5;

const PROMOTION_DURATION_DAYS = 30;
const PROMOTION_DURATION_MS =
  PROMOTION_DURATION_DAYS *
  24 *
  60 *
  60 *
  1000;

@Injectable()
export class PromotionsService {
  constructor(
  private readonly prisma: PrismaService,

  private readonly paymentGatewayService: PaymentGatewayService,
) {}

  // =========================================================
  // CRIAR CAMPANHA
  // =========================================================

  async create(
    userId: string,
    dto: CreatePromotionDto,
  ) {
    // =========================================================
    // VALIDAÇÕES BÁSICAS
    // =========================================================

    if (!dto.productIds?.length) {
      throw new BadRequestException(
        "A campanha precisa ter pelo menos um produto.",
      );
    }

    if (!dto.placements?.length) {
      throw new BadRequestException(
        "A campanha precisa ter pelo menos um local de exibição.",
      );
    }

    if (!dto.packageId) {
      throw new BadRequestException(
        "É necessário escolher um pacote de promoção.",
      );
    }

    // =========================================================
    // BUSCAR PACOTE
    // =========================================================

    const promotionPackage =
      await this.prisma.promotionPackage.findUnique({
        where: {
          id: dto.packageId,
        },
      });

    if (!promotionPackage) {
      throw new NotFoundException(
        "Pacote de promoção não encontrado.",
      );
    }

    if (!promotionPackage.isActive) {
      throw new BadRequestException(
        "Este pacote não está disponível.",
      );
    }

    // =========================================================
    // BUSCAR BANCA
    // =========================================================

    const store =
      await this.prisma.store.findFirst({
        where: {
          ownerId: userId,
          isActive: true,
        },
      });

    if (!store) {
      throw new NotFoundException(
        "Banca não encontrada.",
      );
    }


const locationMode =
  dto.locationMode ??
  PromotionLocationMode.INHERITED;

const targetCountryCode = (
  locationMode === PromotionLocationMode.INHERITED
    ? store.countryCode
    : dto.targetCountryCode
)?.trim().toUpperCase();

let targetRegions: string[] = [];

if (locationMode === PromotionLocationMode.INHERITED) {
  targetRegions = store.region?.trim()
    ? [store.region.trim()]
    : [];
} else {
  const rawRegions: unknown = dto.targetRegions;

  if (
    rawRegions !== undefined &&
    !Array.isArray(rawRegions)
  ) {
    throw new BadRequestException(
      "A lista de províncias é inválida.",
    );
  }

  const normalizedRegions: string[] = [];

  for (const region of (rawRegions ?? []) as unknown[]) {
    if (typeof region !== "string") {
      throw new BadRequestException(
        "Uma das províncias selecionadas é inválida.",
      );
    }

    const normalizedRegion = region.trim();

    if (normalizedRegion) {
      normalizedRegions.push(normalizedRegion);
    }
  }

  targetRegions = [...new Set(normalizedRegions)];
}

if (!targetCountryCode) {
  throw new BadRequestException(
    "É necessário selecionar um país para a promoção.",
  );
}

targetRegions = this.validatePromotionRegions(
  targetCountryCode,
  targetRegions,
);

    // =========================================================
    // VALIDAR PRODUTOS
    // =========================================================

    const uniqueProductIds = [
      ...new Set(dto.productIds),
    ];

    const products =
      await this.prisma.product.findMany({
        where: {
          id: {
            in: uniqueProductIds,
          },

          storeId: store.id,

          isPublished: true,
        },

        select: {
          id: true,
        },
      });

    if (
      products.length !==
      uniqueProductIds.length
    ) {
      throw new BadRequestException(
        "Um ou mais produtos não pertencem à sua banca ou não estão publicados.",
      );
    }

    // =========================================================
    // DATAS
    // =========================================================

    const startsAt =
      new Date(dto.startsAt);

    const endsAt =
      new Date(dto.endsAt);

    if (
      Number.isNaN(
        startsAt.getTime(),
      ) ||
      Number.isNaN(
        endsAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        "Datas inválidas.",
      );
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        "A data final deve ser posterior à data inicial.",
      );
    }

    // =========================================================
    // CRIAR CAMPANHA
    // =========================================================

    const promotion =
      await this.prisma.productPromotion.create({
        data: {
          storeId: store.id,

          name: dto.name,

          status:
            PromotionStatus.DRAFT,

          startsAt,

          endsAt,

          locationMode,
targetCountryCode,
targetRegions,

          // =====================================================
          // FONTE DE VERDADE DO LIMITE
          // =====================================================

          packageId:
            promotionPackage.id,

          impressionLimit:
            promotionPackage.impressions,

          priority:
            dto.priority ?? 0,

          placements: {
            create:
              dto.placements.map(
                (placement) => ({
                  placement,
                }),
              ),
          },

          products: {
            create:
              uniqueProductIds.map(
                (
                  productId,
                  index,
                ) => ({
                  productId,
                  order: index,
                }),
              ),
          },
        },

        include: {
          store: {
  select: {
    id: true,
    name: true,
    avatarUrl: true,
    verified: true,
    verificationType: true,
    type: true,
  },
},

          package: true,

          products: {
            orderBy: {
              order: "asc",
            },

            include: {
              product: {
                include: {
                  images: {
                    where: {
                      isDeleted: false,
                    },

                    orderBy: {
                      order: "asc",
                    },
                  },

                  store: {
  select: {
    id: true,
    name: true,
    avatarUrl: true,
    verified: true,
    verificationType: true,
    type: true,
  },
},
                },
              },
            },
          },

          placements: true,
        },
      });

    return promotion;
  }

  // =========================================================
  // LISTAR CAMPANHAS DA BANCA
  // =========================================================

  async findMyPromotions(
    userId: string,
  ) {
    const store =
      await this.prisma.store.findFirst({
        where: {
          ownerId: userId,
        },

        select: {
          id: true,
        },
      });

    if (!store) {
      throw new NotFoundException(
        "Banca não encontrada.",
      );
    }

    return this.prisma.productPromotion.findMany({
      where: {
        storeId: store.id,
      },

      orderBy: [
        {
          createdAt: "desc",
        },
      ],

      include: {
        store: {
  select: {
    id: true,
    name: true,
    avatarUrl: true,
    verified: true,
    verificationType: true,
    type: true,
  },
},

        package: true,

        // =====================================================
        // PAGAMENTOS DA CAMPANHA
        //
        // Importante:
        // O frontend poderá saber se existe pagamento,
        // se está PENDING ou PAID e qual foi o valor real.
        // =====================================================

        payments: {
  orderBy: {
    createdAt: "desc",
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
    updatedAt: true,
    metadata: true,
  },
},

        products: {
          orderBy: {
            order: "asc",
          },

          include: {
            product: {
              include: {
                images: {
                  where: {
                    isDeleted: false,
                  },

                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },

        placements: true,
      },
    });
  }

  // =========================================================
  // CRIAR INTENÇÃO DE PAGAMENTO DA PROMOÇÃO
  // =========================================================
  //
  // Este método NÃO confirma pagamento.
  //
  // Ele apenas cria:
  //
  // SitePayment = PENDING
  //
  // O futuro M-Pesa/e-Mola/cartão poderá usar este registro
  // e posteriormente alterá-lo para PAID através da confirmação
  // do provedor.
  //
  // =========================================================

  async createPromotionPayment(
    userId: string,
    promotionId: string,
  ) {
    const promotion =
      await this.findOne(
        userId,
        promotionId,
      );

    // =========================================================
    // VERIFICAR ESTADO
    // =========================================================

    if (
      promotion.status !==
        PromotionStatus.DRAFT
    ) {
      throw new BadRequestException(
        "O pagamento de uma nova contratação só pode ser iniciado para uma campanha em rascunho.",
      );
    }

    // =========================================================
    // PACOTE
    // =========================================================

    if (!promotion.packageId) {
      throw new BadRequestException(
        "Esta campanha não possui um pacote de promoção.",
      );
    }

    const promotionPackage =
      await this.prisma.promotionPackage.findUnique({
        where: {
          id: promotion.packageId,
        },
      });

    if (!promotionPackage) {
      throw new NotFoundException(
        "Pacote de promoção não encontrado.",
      );
    }

    if (!promotionPackage.isActive) {
      throw new BadRequestException(
        "Este pacote não está disponível.",
      );
    }

    // =========================================================
    // VERIFICAR PAGAMENTO JÁ PAGO
    // =========================================================
    //
    // Se esta contratação já possui pagamento PAID,
    // não criamos outro pagamento.
    //
    // =========================================================

    const paidPayments =
  await this.prisma.sitePayment.findMany({
    where: {
      promotionId,

      type:
        PaymentType.PROMOTION,

      status:
        PaymentStatus.PAID,
    },

    orderBy: {
      paidAt: "desc",
    },
  });

const existingPaidPayment =
  paidPayments.find((payment) => {
    const metadata =
      payment.metadata;

    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      return false;
    }

    const storedPackageId =
      (metadata as {
        packageId?: unknown;
      }).packageId;

    return (
      storedPackageId ===
      promotionPackage.id
    );
  });

    if (existingPaidPayment) {
      return {
        alreadyPaid: true,
        payment: existingPaidPayment,
      };
    }

 // =========================================================
// VERIFICAR PAGAMENTO PENDENTE DO PACOTE ATUAL
// =========================================================

const pendingPayments =
  await this.prisma.sitePayment.findMany({
    where: {
      promotionId,

      type:
        PaymentType.PROMOTION,

      status:
        PaymentStatus.PENDING,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

const existingPendingPayment =
  pendingPayments.find((payment) => {
    const metadata =
      payment.metadata;

    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      return false;
    }

    const storedPackageId =
      (metadata as {
        packageId?: unknown;
      }).packageId;

    return (
      storedPackageId ===
      promotionPackage.id
    );
  });

if (existingPendingPayment) {
  return {
    alreadyPaid: false,
    alreadyPending: true,
    payment: existingPendingPayment,
  };
}

    // =========================================================
    // CRIAR PAGAMENTO
    // =========================================================
    //
    // amount é um SNAPSHOT do preço atual do pacote.
    //
    // Se o pacote custar 1.000 MZN hoje e depois passar para
    // 1.200 MZN, este pagamento continuará registrando 1.000.
    //
    // =========================================================


    // =========================================================
// CANCELAR PAGAMENTOS PENDENTES ANTIGOS
// =========================================================
//
// Pagamentos PAID nunca são apagados nem cancelados.
// Eles fazem parte do histórico financeiro.
//
// Apenas cobranças PENDING antigas desta promoção
// deixam de ser válidas quando uma nova tentativa é criada.
// =========================================================

await this.prisma.sitePayment.updateMany({
  where: {
    promotionId,

    type:
      PaymentType.PROMOTION,

    status:
      PaymentStatus.PENDING,
  },

  data: {
    status:
      PaymentStatus.CANCELLED,
  },
});
    const payment =
  await this.prisma.sitePayment.create({
    data: {
      userId,

      storeId:
        promotion.storeId,

      promotionId,

      type:
        PaymentType.PROMOTION,

      status:
        PaymentStatus.PENDING,

      amount:
        promotionPackage.price,

      currency: "MZN",

      description:
        `Promoção "${promotion.name}" - pacote ${promotionPackage.id}`,

      metadata: {
        packageId:
          promotionPackage.id,

        impressions:
          promotionPackage.impressions,

        promotionId,

        storeId:
          promotion.storeId,
      },
    },
  });

// =========================================================
// CRIAR CHECKOUT NO GATEWAY
// =========================================================
//
// O pagamento continua PENDING.
// O gateway apenas cria a cobrança e devolve
// a referência de pagamento.
// =========================================================

let checkout;

try {
  checkout =
    await this.paymentGatewayService.createCheckout({
      paymentId: payment.id,

      amount: payment.amount,

      currency: payment.currency,

      description:
        payment.description ?? undefined,

      metadata: {
        promotionId,

        storeId:
          promotion.storeId,

        packageId:
          promotionPackage.id,
      },
    });
} catch (error) {
  // Se a criação do checkout falhar,
  // a cobrança local deixa de estar pendente.
  //
  // O registro permanece no banco para histórico
  // e análise do erro.

  await this.prisma.sitePayment.update({
    where: {
      id: payment.id,
    },

    data: {
      status:
        PaymentStatus.FAILED,
    },
  });

  throw new BadRequestException(
    "Não foi possível criar o checkout do pagamento.",
  );
}

// =========================================================
// GUARDAR REFERÊNCIA DO GATEWAY
// =========================================================

const updatedPayment =
  await this.prisma.sitePayment.update({
    where: {
      id: payment.id,
    },

    data: {
      reference:
        checkout.reference,

      provider:
        checkout.provider,
    },
  });

// =========================================================
// RETORNAR DADOS DO CHECKOUT
// =========================================================

return {
  alreadyPaid: false,

  alreadyPending: false,

  payment: updatedPayment,

  checkout: {
    provider:
      checkout.provider,

    reference:
      checkout.reference,

    checkoutUrl:
      checkout.checkoutUrl ?? null,

    instructions:
      checkout.instructions ?? null,

    status:
      checkout.status,
  },
};
  }

  // =========================================================
  // BUSCAR PAGAMENTO DA PROMOÇÃO
  // =========================================================

  async getPromotionPayment(
    userId: string,
    promotionId: string,
  ) {
    const promotion =
      await this.findOne(
        userId,
        promotionId,
      );

    const payments =
      await this.prisma.sitePayment.findMany({
        where: {
          promotionId:
            promotion.id,

          type:
            PaymentType.PROMOTION,
        },

        orderBy: {
          createdAt: "desc",
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
  updatedAt: true,
  metadata: true,
},
      });

    return {
      promotionId:
        promotion.id,

      payments,
    };
  }

 // =========================================================
// VERIFICAR SE O PACOTE ATUAL FOI PAGO
// =========================================================
//
// IMPORTANTE:
// Uma promoção pode ser reutilizada depois de EXPIRADA/
// CONCLUÍDA. Por isso, não basta verificar se existe
// qualquer pagamento PAID.
//
// O pagamento precisa pertencer ao pacote atualmente
// associado à campanha.
//
// O packageId fica guardado no metadata do SitePayment.
// =========================================================

private async hasPaidPromotionPayment(
  promotionId: string,
  packageId: string,
) {
  const payments =
    await this.prisma.sitePayment.findMany({
      where: {
        promotionId,

        type:
          PaymentType.PROMOTION,

        status:
          PaymentStatus.PAID,
      },

      orderBy: {
        paidAt: "desc",
      },

      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        provider: true,
        reference: true,
        metadata: true,
      },
    });

  const payment =
    payments.find((item) => {
      const metadata =
        item.metadata;

      if (
        !metadata ||
        typeof metadata !== "object" ||
        Array.isArray(metadata)
      ) {
        return false;
      }

      const storedPackageId =
        (metadata as {
          packageId?: unknown;
        }).packageId;

      return (
        storedPackageId ===
        packageId
      );
    });

  return payment ?? null;
}

  // =========================================================
  // ELIMINAR UMA CAMPANHA DO HISTÓRICO
  // =========================================================

  async deleteHistoryItem(
    userId: string,
    promotionId: string,
  ) {
    // =========================================================
    // BUSCAR CAMPANHA
    // =========================================================

    const promotion =
      await this.prisma.productPromotion.findUnique({
        where: {
          id: promotionId,
        },

        include: {
          store: {
            select: {
              ownerId: true,
            },
          },
        },
      });

    if (!promotion) {
      throw new NotFoundException(
        "Campanha não encontrada.",
      );
    }

    // =========================================================
    // VERIFICAR DONO
    // =========================================================

    if (
      promotion.store.ownerId !== userId
    ) {
      throw new ForbiddenException(
        "Você não pode eliminar esta campanha.",
      );
    }

    // =========================================================
    // SÓ PERMITIR CAMPANHAS FINALIZADAS
    // =========================================================

    const isHistory =
      promotion.status ===
        PromotionStatus.EXPIRED ||
      promotion.status ===
        PromotionStatus.COMPLETED ||
      promotion.status ===
        PromotionStatus.CANCELLED;

    if (!isHistory) {
      throw new BadRequestException(
        "Apenas campanhas finalizadas podem ser eliminadas do histórico.",
      );
    }

    // =========================================================
    // ELIMINAR
    // =========================================================

    await this.prisma.$transaction(
      async (tx) => {
        // -------------------------------------------------------
        // PRODUTOS DA CAMPANHA
        // -------------------------------------------------------

        await tx.productPromotionProduct.deleteMany({
          where: {
            promotionId,
          },
        });

        // -------------------------------------------------------
        // LOCAIS DE EXIBIÇÃO
        // -------------------------------------------------------

        await tx.productPromotionPlacement.deleteMany({
          where: {
            promotionId,
          },
        });

        // -------------------------------------------------------
        // CAMPANHA
        // -------------------------------------------------------
        //
        // SitePayment NÃO é apagado.
        //
        // A relação possui onDelete: SetNull, portanto o
        // histórico financeiro continuará existindo.
        //
        // -------------------------------------------------------

        await tx.productPromotion.delete({
          where: {
            id: promotionId,
          },
        });
      },
    );

    return {
      deleted: true,
      promotionId,
    };
  }

  // =========================================================
  // ELIMINAR TODO O HISTÓRICO
  // =========================================================

  async deleteAllHistory(
    userId: string,
  ) {
    // =========================================================
    // BUSCAR BANCA
    // =========================================================

    const store =
      await this.prisma.store.findFirst({
        where: {
          ownerId: userId,
        },

        select: {
          id: true,
        },
      });

    if (!store) {
      throw new NotFoundException(
        "Banca não encontrada.",
      );
    }

    // =========================================================
    // BUSCAR CAMPANHAS FINALIZADAS
    // =========================================================

    const history =
      await this.prisma.productPromotion.findMany({
        where: {
          storeId: store.id,

          status: {
            in: [
              PromotionStatus.EXPIRED,
              PromotionStatus.COMPLETED,
              PromotionStatus.CANCELLED,
            ],
          },
        },

        select: {
          id: true,
        },
      });

    // =========================================================
    // NADA PARA ELIMINAR
    // =========================================================

    if (!history.length) {
      return {
        deleted: true,
        deletedCount: 0,
      };
    }

    const promotionIds =
      history.map(
        (promotion) => promotion.id,
      );

    // =========================================================
    // ELIMINAR TUDO
    // =========================================================

    await this.prisma.$transaction(
      async (tx) => {
        // -------------------------------------------------------
        // PRODUTOS
        // -------------------------------------------------------

        await tx.productPromotionProduct.deleteMany({
          where: {
            promotionId: {
              in: promotionIds,
            },
          },
        });

        // -------------------------------------------------------
        // PLACEMENTS
        // -------------------------------------------------------

        await tx.productPromotionPlacement.deleteMany({
          where: {
            promotionId: {
              in: promotionIds,
            },
          },
        });

        // -------------------------------------------------------
        // CAMPANHAS
        // -------------------------------------------------------
        //
        // Os SitePayments permanecem no banco.
        //
        // -------------------------------------------------------

        await tx.productPromotion.deleteMany({
          where: {
            id: {
              in: promotionIds,
            },
          },
        });
      },
    );

    return {
      deleted: true,
      deletedCount: history.length,
    };
  }

  // =========================================================
  // BUSCAR UMA CAMPANHA
  // =========================================================

  async findOne(
    userId: string,
    promotionId: string,
  ) {
    const promotion =
      await this.prisma.productPromotion.findUnique({
        where: {
          id: promotionId,
        },

        include: {
          store: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              avatarUrl: true,
              verified: true,
              verificationType: true,
    type: true,
            },
          },

          package: true,

          products: {
            orderBy: {
              order: "asc",
            },

            include: {
              product: {
                include: {
                  images: {
                    where: {
                      isDeleted: false,
                    },

                    orderBy: {
                      order: "asc",
                    },
                  },
                },
              },
            },
          },

          placements: true,

          // =====================================================
          // PAGAMENTOS
          // =====================================================

          payments: {
  orderBy: {
    createdAt: "desc",
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
    updatedAt: true,
    metadata: true,
  },
},
        },
      });

    if (!promotion) {
      throw new NotFoundException(
        "Campanha não encontrada.",
      );
    }

    if (
      promotion.store.ownerId !==
      userId
    ) {
      throw new ForbiddenException(
        "Você não pode acessar esta campanha.",
      );
    }

    return promotion;
  }

  // =========================================================
  // ATUALIZAR CAMPANHA
  // =========================================================

  async update(
    userId: string,
    promotionId: string,
    dto: UpdatePromotionDto,
  ) {
    const promotion =
      await this.prisma.productPromotion.findUnique({
        where: {
          id: promotionId,
        },

        include: {
          store: true,
        },
      });

    if (!promotion) {
      throw new NotFoundException(
        "Campanha não encontrada.",
      );
    }

    if (
      promotion.store.ownerId !==
      userId
    ) {
      throw new ForbiddenException(
        "Você não pode alterar esta campanha.",
      );
    }

    // =========================================================
    // NÃO PERMITIR EDIÇÃO DE CAMPANHA FINALIZADA
    // =========================================================

    if (
      promotion.status ===
        PromotionStatus.EXPIRED ||
      promotion.status ===
        PromotionStatus.COMPLETED ||
      promotion.status ===
        PromotionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Esta campanha não pode mais ser alterada.",
      );
    }

    // =========================================================
    // DATAS
    // =========================================================

    const startsAt =
      dto.startsAt !== undefined
        ? new Date(dto.startsAt)
        : promotion.startsAt;

    const endsAt =
      dto.endsAt !== undefined
        ? new Date(dto.endsAt)
        : promotion.endsAt;

    if (
      Number.isNaN(
        startsAt.getTime(),
      ) ||
      Number.isNaN(
        endsAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        "Datas inválidas.",
      );
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        "A data final deve ser posterior à inicial.",
      );
    }

    // =========================================================
// LOCALIZAÇÃO DA PROMOÇÃO
// =========================================================


const locationMode =
  dto.locationMode ?? promotion.locationMode;

let targetCountryCode =
  promotion.targetCountryCode;

let targetRegions =
  [...promotion.targetRegions];

// ---------------------------------------------------------
// LOCALIZAÇÃO HERDADA DA BANCA
// ---------------------------------------------------------

if (
  locationMode === PromotionLocationMode.INHERITED
) {
  targetCountryCode =
    promotion.store.countryCode.trim().toUpperCase();

  targetRegions = promotion.store.region?.trim()
    ? [promotion.store.region.trim()]
    : [];
}

// ---------------------------------------------------------
// LOCALIZAÇÃO PERSONALIZADA
// ---------------------------------------------------------

else {
  const changingToCustom =
    dto.locationMode === PromotionLocationMode.CUSTOM &&
    promotion.locationMode !== PromotionLocationMode.CUSTOM;

  if (
    changingToCustom &&
    dto.targetCountryCode === undefined
  ) {
    throw new BadRequestException(
      "É necessário selecionar um país para a localização personalizada.",
    );
  }

  if (dto.targetCountryCode !== undefined) {
    targetCountryCode =
      dto.targetCountryCode.trim().toUpperCase();
  }

  if (!targetCountryCode) {
    throw new BadRequestException(
      "É necessário selecionar um país para a promoção.",
    );
  }

  const countryChanged =
    targetCountryCode !== promotion.targetCountryCode;

  if (dto.targetRegions !== undefined) {
    if (!Array.isArray(dto.targetRegions)) {
      throw new BadRequestException(
        "A lista de províncias é inválida.",
      );
    }

    targetRegions = [
      ...new Set(
        dto.targetRegions
          .map((region) => {
            if (typeof region !== "string") {
              throw new BadRequestException(
                "Uma das províncias selecionadas é inválida.",
              );
            }

            return region.trim();
          })
          .filter(Boolean),
      ),
    ];
  } else if (changingToCustom || countryChanged) {
    // Não conservar províncias do país/localização anterior.
    targetRegions = [];
  }
}

targetRegions = this.validatePromotionRegions(
  targetCountryCode,
  targetRegions,
);

    // =========================================================
    // VALIDAR PRODUTOS
    // =========================================================

    if (dto.productIds) {
      if (!dto.productIds.length) {
        throw new BadRequestException(
          "A campanha precisa ter pelo menos um produto.",
        );
      }

      const uniqueProductIds = [
        ...new Set(dto.productIds),
      ];

      const products =
        await this.prisma.product.findMany({
          where: {
            id: {
              in: uniqueProductIds,
            },

            storeId:
              promotion.storeId,

            isPublished: true,
          },

          select: {
            id: true,
          },
        });

      if (
        products.length !==
        uniqueProductIds.length
      ) {
        throw new BadRequestException(
          "Um ou mais produtos são inválidos.",
        );
      }
    }

    // =========================================================
    // VALIDAR PLACEMENTS
    // =========================================================

    if (
      dto.placements &&
      !dto.placements.length
    ) {
      throw new BadRequestException(
        "A campanha precisa ter pelo menos um local de exibição.",
      );
    }

    // =========================================================
    // TRANSACTION
    // =========================================================

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          // -----------------------------------------------------
          // PRODUTOS
          // -----------------------------------------------------

          if (dto.productIds) {
            await tx.productPromotionProduct.deleteMany(
              {
                where: {
                  promotionId,
                },
              },
            );
          }

          // -----------------------------------------------------
          // PLACEMENTS
          // -----------------------------------------------------

          if (dto.placements) {
            await tx.productPromotionPlacement.deleteMany(
              {
                where: {
                  promotionId,
                },
              },
            );
          }

          // -----------------------------------------------------
          // ATUALIZAR CAMPANHA
          // -----------------------------------------------------

          return tx.productPromotion.update({
            where: {
              id: promotionId,
            },

            data: {

              // LOCALIZAÇÃO DA PROMOÇÃO
locationMode,
targetCountryCode,
targetRegions,

              ...(dto.name !== undefined && {
                name: dto.name,
              }),

              ...(dto.startsAt !==
                undefined && {
                startsAt,
              }),

              ...(dto.endsAt !==
                undefined && {
                endsAt,
              }),

              ...(dto.priority !==
                undefined && {
                priority:
                  dto.priority,
              }),

              ...(dto.productIds && {
                products: {
                  create:
                    [
                      ...new Set(
                        dto.productIds,
                      ),
                    ].map(
                      (
                        productId,
                        index,
                      ) => ({
                        productId,
                        order: index,
                      }),
                    ),
                },
              }),

              ...(dto.placements && {
                placements: {
                  create:
                    dto.placements.map(
                      (placement) => ({
                        placement,
                      }),
                    ),
                },
              }),
            },

            include: {
              package: true,

              products: {
                orderBy: {
                  order: "asc",
                },

                include: {
                  product: {
                    include: {
                      images: {
                        where: {
                          isDeleted: false,
                        },

                        orderBy: {
                          order: "asc",
                        },
                      },
                    },
                  },
                },
              },

              placements: true,
            },
          });
        },
      );

    return updated;
  }

  // =========================================================
  // ATIVAR
  // =========================================================

  async activate(
    userId: string,
    promotionId: string,
  ) {
    const promotion =
      await this.findOne(
        userId,
        promotionId,
      );

    // =========================================================
    // ESTADO
    // =========================================================

    if (
      promotion.status !==
        PromotionStatus.DRAFT &&
      promotion.status !==
        PromotionStatus.PAUSED
    ) {
      throw new BadRequestException(
        "Esta campanha não pode ser ativada neste estado.",
      );
    }

    // =========================================================
    // PAGAMENTO
    // =========================================================
    //
    // PAUSED:
    // Não exige novo pagamento porque a contratação já existe.
    //
    // DRAFT:
    // Exige um pagamento PAID.
    //
    // =========================================================

    if (
      promotion.status ===
      PromotionStatus.DRAFT
    ) {
      const paidPayment =
  await this.hasPaidPromotionPayment(
    promotionId,
    promotion.packageId,
  );

      if (!paidPayment) {
        throw new BadRequestException(
          "Esta campanha ainda não foi paga. É necessário concluir o pagamento antes de ativá-la.",
        );
      }
    }

    // =========================================================
    // PACOTE
    // =========================================================

    if (!promotion.packageId) {
      throw new BadRequestException(
        "Esta campanha não possui um pacote de promoção.",
      );
    }

    const promotionPackage =
      await this.prisma.promotionPackage.findUnique({
        where: {
          id: promotion.packageId,
        },
      });

    if (!promotionPackage) {
      throw new NotFoundException(
        "Pacote de promoção não encontrado.",
      );
    }

    if (!promotionPackage.isActive) {
      throw new BadRequestException(
        "O pacote desta campanha não está mais disponível.",
      );
    }

    // =========================================================
    // IMPRESSÕES
    // =========================================================

    if (
      promotion.impressionsUsed >=
      promotion.impressionLimit
    ) {
      throw new BadRequestException(
        "A campanha já atingiu o limite de impressões.",
      );
    }

    // =========================================================
    // PRODUTOS
    // =========================================================

    if (!promotion.products.length) {
      throw new BadRequestException(
        "A campanha não possui produtos.",
      );
    }

   // =========================================================
// NOVO PERÍODO
// =========================================================

const now = new Date();

/*
 * A duração foi definida quando a campanha foi criada.
 *
 * Em DRAFT, startsAt e endsAt guardam a duração escolhida,
 * mas o tempo ainda não está a contar.
 *
 * Em PAUSED, guardam o tempo que restava quando foi pausada.
 */

const durationMs =
  promotion.endsAt.getTime() -
  promotion.startsAt.getTime();

if (durationMs <= 0) {
  throw new BadRequestException(
    "A duração desta campanha é inválida.",
  );
}

const endsAt = new Date(
  now.getTime() + durationMs,
);

    // =========================================================
    // ATIVAR
    // =========================================================

    return this.prisma.productPromotion.update({
      where: {
        id: promotionId,
      },

      data: {
        status:
          PromotionStatus.ACTIVE,

        startsAt: now,

        endsAt,
      },

      include: {
        package: true,

        store: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            verified: true,
            verificationType: true,
    type: true,
          },
        },

        products: {
          orderBy: {
            order: "asc",
          },

          include: {
            product: {
              include: {
                images: {
                  where: {
                    isDeleted: false,
                  },

                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },

        placements: true,

        payments: {
          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            provider: true,
            reference: true,
            paidAt: true,
          },
        },
      },
    });
  }

 // =========================================================
// PAUSAR
// =========================================================

async pause(
  userId: string,
  promotionId: string,
) {
  const promotion =
    await this.findOne(
      userId,
      promotionId,
    );

  if (
    promotion.status !==
    PromotionStatus.ACTIVE
  ) {
    throw new BadRequestException(
      "Só uma campanha ativa pode ser pausada.",
    );
  }

  const now = new Date();

  // Tempo que ainda restava à campanha.
  const remainingMs =
    promotion.endsAt.getTime() -
    now.getTime();

  if (remainingMs <= 0) {
    await this.prisma.productPromotion.update({
      where: {
        id: promotionId,
      },

      data: {
        status: PromotionStatus.EXPIRED,
      },
    });

    throw new BadRequestException(
      "Esta campanha já terminou e não pode ser pausada.",
    );
  }

  // Guardamos o período restante.
  // O tempo ficará congelado enquanto estiver PAUSED.
  const newEndsAt = new Date(
    now.getTime() + remainingMs,
  );

  return this.prisma.productPromotion.update({
    where: {
      id: promotionId,
    },

    data: {
      status: PromotionStatus.PAUSED,
      startsAt: now,
      endsAt: newEndsAt,
    },
  });
}

  // =========================================================
  // CANCELAR
  // =========================================================

  async cancel(
    userId: string,
    promotionId: string,
  ) {
    await this.findOne(
      userId,
      promotionId,
    );

    return this.prisma.productPromotion.update({
      where: {
        id: promotionId,
      },

      data: {
        status:
          PromotionStatus.CANCELLED,
      },
    });
  }

  // =========================================================
  // BUSCAR CAMPANHAS ATIVAS
  // =========================================================

  async getActivePromotions(
  placement: PromotionPlacement,
  location: {
    countryCode: string;
    region: string | null;
  },
) {
    const now = new Date();

    if (!location.countryCode) {
  return [];
}

    const promotions =
      await this.prisma.productPromotion.findMany({
        where: {
          status: PromotionStatus.ACTIVE,

          targetCountryCode: location.countryCode,


OR: location.region
  ? [
      {
        targetRegions: {
          isEmpty: true,
        },
      },
      {
        targetRegions: {
          has: location.region,
        },
      },
    ]
  : [
      {
        targetRegions: {
          isEmpty: true,
        },
      },
    ],


          startsAt: {
            lte: now,
          },

          endsAt: {
            gt: now,
          },

          placements: {
            some: {
              placement,
            },
          },
        },

        orderBy: [
          {
            priority: "desc",
          },

          {
            impressionsUsed: "asc",
          },

          {
            createdAt: "asc",
          },
        ],

        include: {
          store: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              verified: true,
              verificationType: true,
    type: true,
            },
          },

          package: true,

          products: {
            orderBy: {
              order: "asc",
            },

            include: {
              product: {
                include: {
                  images: {
                    where: {
                      isDeleted: false,
                    },

                    orderBy: {
                      order: "asc",
                    },
                  },
                },
              },
            },
          },

          placements: true,
        },
      });

    // =========================================================
    // REMOVER CAMPANHAS QUE JÁ ATINGIRAM O LIMITE
    // =========================================================

    return promotions.filter(
      (promotion) =>
        promotion.impressionsUsed <
        promotion.impressionLimit,
    );
  }

  // =========================================================
  // REGISTRAR IMPRESSÃO
  // =========================================================

  async registerImpression(
    promotionId: string,
  ) {
    const promotion =
      await this.prisma.productPromotion.findUnique({
        where: {
          id: promotionId,
        },
      });

    if (!promotion) {
      throw new NotFoundException(
        "Campanha não encontrada.",
      );
    }

    if (
      promotion.status !==
      PromotionStatus.ACTIVE
    ) {
      return {
        registered: false,
      };
    }

    const now = new Date();

    if (now < promotion.startsAt) {
      return {
        registered: false,
      };
    }

    if (now >= promotion.endsAt) {
      await this.prisma.productPromotion.update({
        where: {
          id: promotionId,
        },

        data: {
          status:
            PromotionStatus.EXPIRED,
        },
      });

      return {
        registered: false,
        expired: true,
      };
    }

    if (
      promotion.impressionsUsed >=
      promotion.impressionLimit
    ) {
      await this.prisma.productPromotion.update({
        where: {
          id: promotionId,
        },

        data: {
          status:
            PromotionStatus.COMPLETED,
        },
      });

      return {
        registered: false,
      };
    }

    const updated =
      await this.prisma.productPromotion.update({
        where: {
          id: promotionId,
        },

        data: {
          impressionsUsed: {
            increment: 1,
          },
        },
      });

    if (
      updated.impressionsUsed >=
      updated.impressionLimit
    ) {
      await this.prisma.productPromotion.update({
        where: {
          id: promotionId,
        },

        data: {
          status:
            PromotionStatus.COMPLETED,
        },
      });
    }

    return {
      registered: true,
      impressionsUsed:
        updated.impressionsUsed,
      impressionLimit:
        updated.impressionLimit,
    };
  }

  // =========================================================
  // BUSCAR PRODUTOS PROMOVIDOS PARA FEED
  // =========================================================

  async getFeedPromotions(
    options: FeedPromotionOptions,
  ) {
    const start = Math.max(
      0,
      options.start ?? 0,
    );

    const limit = Math.max(
      1,
      Math.min(
        options.limit ?? 10,
        50,
      ),
    );

    const seed =
      options.seed || "default";

    const positions =
      this.getFeedPromotionPositions(
        start,
        limit,
      );

    if (!positions.length) {
      return {
        start,
        limit,
        positions: [],
        promotions: [],
      };
    }

    const location =
  await this.resolvePromotionLocation(options);

if (!location) {
  return {
    start,
    limit,
    positions,
    promotions: [],
  };
}

const activePromotions =
  await this.getActivePromotions(
    PromotionPlacement.FEED,
    location,
  );

    if (!activePromotions.length) {
      return {
        start,
        limit,
        positions,
        promotions: [],
      };
    }

    /*
     * Primeiro fazemos a rotação com base
     * no seed do feed.
     *
     * O mesmo seed mantém a mesma ordem
     * durante o scroll.
     *
     * Um novo seed, gerado no refresh,
     * muda a ordem.
     */

    const rotated =
      this.rotatePromotions(
        activePromotions,
        seed,
      );

    /*
     * Agora distribuímos as promoções
     * pelos slots.
     *
     * Enquanto houver promoções diferentes,
     * não repetimos nenhuma.
     *
     * Se houver menos promoções que slots,
     * a sequência volta ao início.
     */

    const slotPromotions =
      positions.map(
        (position, index) => {
          const promotion =
            rotated[
              index %
                rotated.length
            ];

          return {
            position,
            promotion,
          };
        },
      );

    return {
      start,
      limit,
      positions,
      promotions:
        slotPromotions,
    };
  }

  // =========================================================
  // BUSCAR PRODUTOS PROMOVIDOS PARA PESQUISA
  // =========================================================

  async getSearchPromotions(
  seed: string = "default",
  options: PublicPromotionOptions = {},
) {
  const location =
    await this.resolvePromotionLocation(options);

  if (!location) {
    return [];
  }

  const promotions =
    await this.getActivePromotions(
      PromotionPlacement.SEARCH,
      location,
    );

  return this.rotatePromotions(
    promotions,
    seed,
  );
}

  // =========================================================
  // BUSCAR PRODUTOS PROMOVIDOS PARA CATEGORIA
  // =========================================================

 async getCategoryPromotions(
  seed: string = "default",
  options: PublicPromotionOptions = {},
) {
  const location =
    await this.resolvePromotionLocation(options);

  if (!location) {
    return [];
  }

  const promotions =
    await this.getActivePromotions(
      PromotionPlacement.CATEGORY,
      location,
    );

  return this.rotatePromotions(
    promotions,
    seed,
  );
}

  // =========================================================
  // POSIÇÕES DAS PROMOÇÕES NO FEED
  // =========================================================

  private getFeedPromotionPositions(
    start: number,
    limit: number,
  ): number[] {
    const end = start + limit;

    const positions: number[] = [];

    let position = PROMOTION_START_POSITION;

    // Primeiro slot: 1
    // Segundo: 5
    // Depois: 10, 15, 20...

    while (position <= end) {
      if (position > start) {
        positions.push(position);
      }

      if (
        position ===
        PROMOTION_START_POSITION
      ) {
        position += PROMOTION_FIRST_INTERVAL;
      } else {
        position += PROMOTION_INTERVAL;
      }
    }

    return positions;
  }

  // =========================================================
  // HASH DO SEED
  // =========================================================

  private hashSeed(
    seed: string,
  ): number {
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash =
        (hash * 31 +
          seed.charCodeAt(i)) >>>
        0;
    }

    return hash;
  }

  // =========================================================
  // ROTAÇÃO DAS PROMOÇÕES
  // =========================================================

  private rotatePromotions<
    T extends { id: string }
  >(
    promotions: T[],
    seed: string,
  ): T[] {
    if (promotions.length <= 1) {
      return promotions;
    }

    const hash =
      this.hashSeed(seed);

    const offset =
      hash % promotions.length;

    return [
      ...promotions.slice(offset),
      ...promotions.slice(0, offset),
    ];
  }

   // =========================================================
  // NOVA CONTRATAÇÃO / NOVO PACOTE
  // =========================================================
  //
  // IMPORTANTE:
  //
  // Uma nova contratação NÃO reutiliza a campanha anterior.
  //
  // Criamos um novo ProductPromotion para representar uma
  // nova contratação.
  //
  // A campanha antiga permanece intacta no histórico.
  //
  // O novo pagamento será criado separadamente através de
  // createPromotionPayment().
  //
  // =========================================================

  async changePackage(
    userId: string,
    promotionId: string,
    packageId: string,
  ) {
    // =========================================================
    // BUSCAR CAMPANHA ANTIGA
    // =========================================================

    const promotion =
      await this.findOne(
        userId,
        promotionId,
      );

 // =========================================================
// VERIFICAR EXPIRAÇÃO POR DATA
// =========================================================

const now = new Date();

let currentStatus =
  promotion.status;


// =========================================================
// VERIFICAR EXPIRAÇÃO POR DATA
// =========================================================

// Apenas campanhas ACTIVE podem expirar pelo tempo.
// DRAFT ainda não começou a contar.
// PAUSED tem o período congelado.

if (
  promotion.status === PromotionStatus.ACTIVE &&
  promotion.endsAt <= now
) {
  currentStatus = PromotionStatus.EXPIRED;

  await this.prisma.productPromotion.update({
    where: {
      id: promotionId,
   },
    data: {
      status: PromotionStatus.EXPIRED,
    },
  });
}

// =========================================================
// SÓ PERMITIR NOVA CONTRATAÇÃO
// APÓS FINALIZAÇÃO
// =========================================================

if (
  currentStatus !== PromotionStatus.EXPIRED &&
  currentStatus !== PromotionStatus.COMPLETED
) {
  throw new BadRequestException(
    "O novo pacote só pode ser contratado depois que a campanha terminar.",
  );
}

    // =========================================================
    // VALIDAR PACKAGE ID
    // =========================================================

    if (!packageId) {
      throw new BadRequestException(
        "É necessário escolher um pacote de promoção.",
      );
    }

    // =========================================================
    // BUSCAR NOVO PACOTE
    // =========================================================

    const promotionPackage =
      await this.prisma.promotionPackage.findUnique({
        where: {
          id: packageId,
        },
      });

    if (!promotionPackage) {
      throw new NotFoundException(
        "Pacote de promoção não encontrado.",
      );
    }

    if (!promotionPackage.isActive) {
      throw new BadRequestException(
        "Este pacote não está disponível.",
      );
    }

    // =========================================================
    // VALIDAR PRODUTOS
    // =========================================================

    if (!promotion.products.length) {
      throw new BadRequestException(
        "A campanha não possui produtos para uma nova contratação.",
      );
    }

    // =========================================================
    // NOVO PERÍODO
    // =========================================================

    const endsAt =
      new Date(
        now.getTime() +
          PROMOTION_DURATION_MS,
      );

    // =========================================================
    // CRIAR NOVA CONTRATAÇÃO
    // =========================================================
    //
    // A campanha antiga NÃO é alterada.
    //
    // Criamos uma nova ProductPromotion com:
    //
    // - novo ID
    // - novo createdAt
    // - novo pacote
    // - novas impressões
    // - novo período
    // - status DRAFT
    //
    // Os produtos e placements da campanha anterior
    // são copiados para a nova contratação.
    //
    // Nenhum pagamento é criado aqui.
    //
    // =========================================================

    const newPromotion =
      await this.prisma.productPromotion.create({
        data: {
          storeId:
            promotion.storeId,

          name:
            promotion.name,

          status:
            PromotionStatus.DRAFT,

          startsAt:
            now,

          endsAt,

          packageId:
            promotionPackage.id,

          impressionLimit:
            promotionPackage.impressions,

          impressionsUsed: 0,

          priority:
            promotion.priority,

            locationMode: promotion.locationMode,
targetCountryCode: promotion.targetCountryCode,
targetRegions: promotion.targetRegions,

          placements: {
            create:
              promotion.placements.map(
                (placement) => ({
                  placement:
                    placement.placement,
                }),
              ),
          },

          products: {
            create:
              promotion.products.map(
                (item) => ({
                  productId:
                    item.productId,

                  order:
                    item.order,
                }),
              ),
          },
        },

        include: {
          package: true,

          store: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              verified: true,
              verificationType: true,
    type: true,
            },
          },

          products: {
            orderBy: {
              order: "asc",
            },

            include: {
              product: {
                include: {
                  images: {
                    where: {
                      isDeleted: false,
                    },

                    orderBy: {
                      order: "asc",
                    },
                  },
                },
              },
            },
          },

          placements: true,

          payments: {
            orderBy: {
              createdAt: "desc",
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
              updatedAt: true,
              metadata: true,
            },
          },
        },
      });

    return newPromotion;
  }

  // =========================================================
  // LISTAR PACOTES DE PROMOÇÃO
  // =========================================================

  async getPackages() {
    return this.prisma.promotionPackage.findMany({
      where: {
        isActive: true,
      },

      orderBy: {
        impressions: "asc",
      },

      select: {
        id: true,
        impressions: true,
        price: true,
        isActive: true,
      },
    });
  }

  // =========================================================
// CONFIRMAR PAGAMENTO DA PROMOÇÃO
// =========================================================
//
// ATENÇÃO:
// Este método NÃO deve ser chamado diretamente por um
// usuário normal.
//
// Ele deve ser utilizado futuramente por:
// - webhook do provedor de pagamento;
// - integração M-Pesa;
// - e-Mola;
// - cartão;
// - transferência bancária;
// - ou uma área administrativa segura.
//
// O pagamento só passa para PAID quando houver confirmação
// real.
//
// =========================================================

async confirmPromotionPayment(
  paymentId: string,
  provider?: string,
  reference?: string,
) {
  const payment =
    await this.prisma.sitePayment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!payment) {
    throw new NotFoundException(
      "Pagamento não encontrado.",
    );
  }

  if (
    payment.type !==
    PaymentType.PROMOTION
  ) {
    throw new BadRequestException(
      "Este pagamento não pertence a uma promoção.",
    );
  }

  // =========================================================
  // IDEMPOTÊNCIA
  // =========================================================
  //
  // Se o provedor enviar a mesma confirmação duas vezes,
  // não devemos criar outro pagamento nem alterar novamente
  // o registro.
  //
  // =========================================================

  if (
    payment.status ===
    PaymentStatus.PAID
  ) {
    return payment;
  }

  if (
    payment.status !==
    PaymentStatus.PENDING
  ) {
    throw new BadRequestException(
      "Este pagamento não está pendente.",
    );
  }

  // =========================================================
  // VERIFICAR REFERÊNCIA
  // =========================================================

  if (reference) {
    const existingReference =
      await this.prisma.sitePayment.findFirst({
        where: {
          reference,

          NOT: {
            id: paymentId,
          },
        },

        select: {
          id: true,
        },
      });

    if (existingReference) {
      throw new BadRequestException(
        "A referência de pagamento já está associada a outro pagamento.",
      );
    }
  }

  // =========================================================
  // MARCAR COMO PAGO
  // =========================================================

  return this.prisma.sitePayment.update({
    where: {
      id: paymentId,
    },

    data: {
      status:
        PaymentStatus.PAID,

      paidAt:
        new Date(),

      ...(provider !== undefined && {
        provider,
      }),

      ...(reference !== undefined && {
        reference,
      }),
    },
  });
}

private async resolvePromotionLocation(
  options: PublicPromotionOptions,
): Promise<{
  countryCode: string;
  region: string | null;
} | null> {

  // 1. Se o frontend enviou uma localização,
  // ela tem prioridade, mesmo para utilizadores autenticados.
  const selectedCountry =
    options.location?.country?.trim().toUpperCase();

  if (selectedCountry) {
    return {
      countryCode: selectedCountry,
      region:
        options.location?.region?.trim() || null,
    };
  }

  // 2. Só usamos o perfil como localização padrão
  // quando não foi enviada uma localização pelo filtro.
  if (options.userId) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: options.userId,
      },
      select: {
        countryCode: true,
        region: true,
      },
    });

    if (!user?.countryCode) {
      return null;
    }

    return {
      countryCode: user.countryCode.trim().toUpperCase(),
      region: user.region?.trim() || null,
    };
  }

  // 3. Visitante sem localização selecionada.
  return null;
}


private validatePromotionRegions(
  countryCode: string,
  regions: string[],
): string[] {
  const allowedRegions =
    REGIONS[countryCode as keyof typeof REGIONS];

  if (!allowedRegions) {
    throw new BadRequestException(
      "O país selecionado não está disponível para promoções.",
    );
  }

  const invalidRegions = regions.filter(
    (region) => !allowedRegions.includes(region),
  );

  if (invalidRegions.length > 0) {
    throw new BadRequestException(
      `As seguintes províncias não pertencem ao país selecionado: ${invalidRegions.join(", ")}.`,
    );
  }

  return regions;
}

}