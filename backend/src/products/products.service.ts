import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/client';
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

const productInclude = {
  store: true,
  category: true,
  images: true,
};

@Injectable()
export class ProductsService {
constructor(
  private prisma: PrismaService,
  private notificationsService: NotificationsService,
) {}


  async createProduct(
  userId: string,
  storeId: string,
  data: {
    name: string;
    description?: string;
    type?: "NORMAL" | "AUCTION";
    price: number;
    stock?: number;
    categoryId?: string;
    publishToFeed?: boolean;
    images?: any[];
    auctionStartPrice?: number;
    minimumIncrement?: number;
    reservePrice?: number;
    auctionStartsAt?: string;
    auctionEndsAt?: string;
}
) {
  const store = await this.prisma.store.findFirst({
    where: {
      id: storeId,
      ownerId: userId,
    },
  });

  if (!store) {
    throw new ForbiddenException('Esta banca não pertence a si');
  }

  if (data.type === "AUCTION") {

  if (!data.auctionStartsAt || !data.auctionEndsAt) {
    throw new ForbiddenException("O leilão precisa de data de início e fim.");
  }

  const starts = new Date(data.auctionStartsAt);
  const ends = new Date(data.auctionEndsAt);

  if (ends <= starts) {
    throw new ForbiddenException(
      "A data de término deve ser posterior à data de início."
    );
  }

  if (!data.minimumIncrement || data.minimumIncrement <= 0) {
    throw new ForbiddenException(
      "O incremento mínimo deve ser maior que zero."
    );
  }

  if (data.price <= 0) {
    throw new ForbiddenException(
      "O lance inicial deve ser maior que zero."
    );
  }
}

  const cover = data.images?.[0];

  const product = await this.prisma.product.create({
  data: {
    name: data.name,
    description: data.description,

    type: data.type ?? "NORMAL",

    price: data.price,

    stock:
      data.type === "AUCTION"
        ? 1
        : (data.stock ?? 0),

    storeId,

    categoryId: data.categoryId || null,

    imageUrl: cover?.originalUrl || cover?.url || null,

    isPublished: data.publishToFeed ?? true,

    // ===== CAMPOS DO LEILÃO =====

    auctionStartPrice:
      data.type === "AUCTION"
        ? data.price
        : undefined,

    currentBid:
      data.type === "AUCTION"
        ? data.price
        : undefined,

    minimumIncrement:
      data.type === "AUCTION"
        ? data.minimumIncrement
        : undefined,

    reservePrice:
      data.type === "AUCTION"
        ? data.reservePrice
        : undefined,

    auctionStartsAt:
      data.type === "AUCTION" && data.auctionStartsAt
        ? new Date(data.auctionStartsAt)
        : undefined,

    auctionEndsAt:
      data.type === "AUCTION" && data.auctionEndsAt
        ? new Date(data.auctionEndsAt)
        : undefined,

    auctionClosed: false,

    images: data.images?.length
      ? {
          create: data.images.map((img, index) => ({
            originalUrl: img.originalUrl || img.url,
            largeUrl: img.largeUrl ?? null,
            mediumUrl: img.mediumUrl ?? null,
            smallUrl: img.smallUrl ?? null,
            thumbUrl: img.thumbUrl ?? null,
            webpUrl: img.webpUrl ?? null,
            width: img.width ?? null,
            height: img.height ?? null,
            sizeKb: img.sizeKb ?? null,
            order: index,
            isCover: index === 0,
          })),
        }
      : undefined,
  },

  include: productInclude,
});

  try {
    await this.notificationsService.notifyNewProductToFollowers(
      product.storeId,
      product.id,
      product.name,
    );
  } catch (err) {
  }

  await this.prisma.store.update({
    where: { id: storeId },
    data: {
      lastActivity: new Date(),
      isActive: true,
    },
  });

  return product;
}

 async findAll(storeId?: string) {

  const products = await this.prisma.product.findMany({
    where: {
      ...(storeId ? { storeId } : {}),

      store: {
        isActive: true,
      },
    },

    orderBy: {
      createdAt: 'desc',
    },

    include: productInclude,
  });

  return this.applyActiveDiscounts(products);
}

async findOne(id: string) {
  const product = await this.prisma.product.findUnique({
    where: { id },
 include: {
  store: {
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  },

  category: true,

  images: {
    orderBy: {
      order: "asc",
    },
  },

  discounts: {
    where: {
      discount: {
        status: "ACTIVE",
      },
    },
    include: {
      discount: true,
    },
  },
},
  });

  if (!product) return null;

  const now = new Date();

const activeDiscount =
  product.type === 'NORMAL'
    ? product.discounts.find((item) => {
        const discount = item.discount;

        return (
          discount.status === 'ACTIVE' &&
          discount.startsAt <= now &&
          now < discount.endsAt
        );
      })?.discount ?? null
    : null;

const discountedPrice =
  activeDiscount
    ? Number(
        (
          product.price -
          (product.price *
            activeDiscount.discountPercent) /
            100
        ).toFixed(2),
      )
    : null;

return {
  ...product,

  activeDiscount: activeDiscount
    ? {
        id: activeDiscount.id,
        discountPercent:
          activeDiscount.discountPercent,
        startsAt: activeDiscount.startsAt,
        endsAt: activeDiscount.endsAt,
      }
    : null,

  discountedPrice,

  images: product.images.map(img => ({
    id: img.id,
    url:
      img.largeUrl ||
      img.mediumUrl ||
      img.smallUrl ||
      img.thumbUrl ||
      img.originalUrl,
  })),
};
}



async updateProduct(
  userId: string,
  productId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryId?: string | null;
    publishToFeed?: boolean;

    auctionStartPrice?: number;
    minimumIncrement?: number;
    reservePrice?: number;
    auctionStartsAt?: string;
    auctionEndsAt?: string;
  },
) {
  const product = await this.prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      store: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundException('Produto não encontrado');
  }

  // ==========================================
// SEGURANÇA
// ==========================================

if (product.store.ownerId !== userId) {
  throw new ForbiddenException(
    'Não tem permissão para editar este produto',
  );
}

// ==========================================
// LEILÃO JÁ EXPIRADO
// ==========================================

if (
  product.type === 'AUCTION' &&
  product.auctionEndsAt &&
  new Date() >= product.auctionEndsAt
) {
  throw new BadRequestException(
    'Este leilão já terminou e não pode mais ser editado.',
  );
}

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  if (data.price !== undefined && data.price <= 0) {
    throw new BadRequestException(
      'O preço deve ser maior que zero',
    );
  }

  if (data.stock !== undefined && data.stock < 0) {
    throw new BadRequestException(
      'O stock não pode ser negativo',
    );
  }

  // ==========================================
  // LEILÃO
  // ==========================================

  if (product.type === 'AUCTION') {
  const starts =
    data.auctionStartsAt !== undefined
      ? new Date(data.auctionStartsAt)
      : product.auctionStartsAt;

  const ends =
    data.auctionEndsAt !== undefined
      ? new Date(data.auctionEndsAt)
      : product.auctionEndsAt;

  if (
    starts &&
    ends &&
    ends <= starts
  ) {
    throw new BadRequestException(
      'A data de término deve ser posterior à data de início',
    );
  }

  if (
    data.minimumIncrement !== undefined &&
    data.minimumIncrement <= 0
  ) {
    throw new BadRequestException(
      'O incremento mínimo deve ser maior que zero',
    );
  }

  if (
    data.auctionStartPrice !== undefined &&
    data.auctionStartPrice <= 0
  ) {
    throw new BadRequestException(
      'O lance inicial deve ser maior que zero',
    );
  }

  if (
    data.reservePrice !== undefined &&
    data.reservePrice < 0
  ) {
    throw new BadRequestException(
      'O preço de reserva não pode ser negativo',
    );
  }
}

  // ==========================================
  // ATUALIZAÇÃO
  // ==========================================

  return this.prisma.product.update({
    where: {
      id: productId,
    },

    data: {
      ...(data.name !== undefined
        ? { name: data.name }
        : {}),

      ...(data.description !== undefined
        ? { description: data.description }
        : {}),

      ...(data.price !== undefined
        ? { price: data.price }
        : {}),

      ...(data.stock !== undefined
        ? { stock: data.stock }
        : {}),

      ...(data.categoryId !== undefined
        ? { categoryId: data.categoryId }
        : {}),

      ...(data.publishToFeed !== undefined
        ? { isPublished: data.publishToFeed }
        : {}),

      ...(product.type === 'AUCTION'
        ? {
            ...(data.auctionStartPrice !== undefined
              ? {
                  auctionStartPrice:
                    data.auctionStartPrice,
                }
              : {}),

            ...(data.minimumIncrement !== undefined
              ? {
                  minimumIncrement:
                    data.minimumIncrement,
                }
              : {}),

            ...(data.reservePrice !== undefined
              ? {
                  reservePrice:
                    data.reservePrice,
                }
              : {}),

            ...(data.auctionStartsAt !== undefined
              ? {
                  auctionStartsAt:
                    new Date(data.auctionStartsAt),
                }
              : {}),

            ...(data.auctionEndsAt !== undefined
              ? {
                  auctionEndsAt:
                    new Date(data.auctionEndsAt),
                }
              : {}),
          }
        : {}),
    },

    include: productInclude,
  });
}

async deleteProduct(
  userId: string,
  productId: string,
) {
  const product = await this.prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      store: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundException(
      'Produto não encontrado',
    );
  }

  // ==========================================
  // SEGURANÇA
  // ==========================================

  if (product.store.ownerId !== userId) {
    throw new ForbiddenException(
      'Não tem permissão para apagar este produto',
    );
  }

  // ==========================================
  // APAGAMENTO
  // ==========================================

  await this.prisma.$transaction(async (tx) => {

    // Imagens
    await tx.productImage.deleteMany({
      where: {
        productId,
      },
    });

    // Favoritos
    await tx.productFavorite.deleteMany({
      where: {
        productId,
      },
    });

    // Lances do leilão
    await tx.auctionBid.deleteMany({
      where: {
        productId,
      },
    });

    // Relações com promoções
    await tx.productPromotionProduct.deleteMany({
      where: {
        productId,
      },
    });

    // Posts ligados ao produto
    await tx.post.updateMany({
      where: {
        productId,
      },
      data: {
        productId: null,
      },
    });

    // Mensagens que partilharam o produto
    await tx.message.updateMany({
      where: {
        sharedProductId: productId,
      },
      data: {
        sharedProductId: null,
      },
    });

    // Finalmente o produto
    await tx.product.delete({
      where: {
        id: productId,
      },
    });
  });

  return {
    success: true,
    message: 'Produto apagado com sucesso',
  };
}

async listProducts(filters: {
  category?: string;
  search?: string;
  order?: string;
  country?: string;
  region?: string;
  time?: string;
  sort?: string;
  cursor?: string;
  limit: number;
  storeId?: string;
}){
 let {
  category,
  search,
  order,
  country,
  region,
  time,
  sort,
  cursor,
  limit,
  storeId,
} = filters;


  const where: Prisma.ProductWhereInput = {
  store: {
    isActive: true,
  },
};

const conditions: Prisma.ProductWhereInput[] = [];

where.store = {
  isActive: true,

  ...(country
    ? {
        countryCode: country,
      }
    : {}),

  ...(region
    ? {
        OR: [
          // Região principal/legada
          {
            region,
          },

          // Região autorizada pelo administrador
          {
            regions: {
              some: {
                region,
              },
            },
          },

          // Mantém compatibilidade com lojas
          // que não possuem região principal.
          {
            region: null,
          },
        ],
      }
    : {}),
};


  // 🔹 Filtro por banca
  if (storeId) {
    where.storeId = storeId;
  }



  const now = new Date();

if (time === "today") {

  const start = new Date();

  start.setHours(0, 0, 0, 0);

  where.createdAt = {
    gte: start,
  };

}

else if (time === "7d") {

  const start = new Date(now);

  start.setDate(start.getDate() - 7);

  where.createdAt = {
    gte: start,
  };

}

else if (time === "30d") {

  const start = new Date(now);

  start.setDate(start.getDate() - 30);

  where.createdAt = {
    gte: start,
  };

}

else if (time === "6m") {
  const start = new Date(now);
  start.setMonth(start.getMonth() - 6);

  where.createdAt = {
    gte: start,
  };
}
  // 🔹 Pesquisa por nome ou descrição
  if (search) {

  conditions.push({

    OR: [

      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },

    ],

  });

}

  // 🔹 Filtro por categoria (pai ou filho)
  if (category) {

  conditions.push({

    OR: [

      {
        categoryId: category,
      },

      {
        category: {
          parentId: category,
        },
      },

    ],

  });

}


  // 🔹 Ordenação
 let orderBy: Prisma.ProductOrderByWithRelationInput = {
    createdAt: "desc",
};

if (order && !sort) {

    switch (order) {

        case "price_asc":
            sort = "priceAsc";
            break;

        case "price_desc":
            sort = "priceDesc";
            break;

    }

}

switch (sort) {

    case "oldest":

        orderBy = {
            createdAt: "asc",
        };

        break;

    case "priceAsc":

        orderBy = {
            price: "asc",
        };

        break;

    case "priceDesc":

        orderBy = {
            price: "desc",
        };

        break;

    case "popular":

    orderBy = {
        createdAt: "desc",
    };

        break;

    default:

        orderBy = {
            createdAt: "desc",
        };

}

if (conditions.length > 0) {

  where.AND = conditions;

}
 const items = await this.prisma.product.findMany({
  where,
  orderBy,
  take: limit + 1,
  cursor: cursor
    ? { id: cursor }
    : undefined,
  skip: cursor ? 1 : 0,
  include: productInclude,
});

let nextCursor: string | null = null;

if (items.length > limit) {
  const next = items.pop();
  nextCursor = next!.id;
}

const itemsWithDiscount =
  await this.applyActiveDiscounts(items);

// =========================================
// PRODUTO PREMIUM
// =========================================
//
// Só procura Premium na primeira página
// de uma categoria.
//
// Não interfere na paginação normal.
// Não remove o Premium dos items normais.
// =========================================

let premiumProduct: any = null;

if (
  category &&
  !storeId &&
  !cursor
) {

  const premiumProductWhere:
    Prisma.ProductWhereInput = {

    isPublished: true,

    type: "NORMAL",

    store: {
      isActive: true,

      verified: true,

      verificationType: "PREMIUM",

      ...(country
        ? {
            countryCode: country,
          }
        : {}),

      ...(region
        ? {
            OR: [
              {
                region,
              },
              {
                regions: {
                  some: {
                    region,
                  },
                },
              },
            ],
          }
        : {}),
    },

    AND: [
      ...conditions,

      ...(where.createdAt
        ? [
            {
              createdAt:
                where.createdAt,
            },
          ]
        : []),
    ],
  };

  const premiumCandidates =
    await this.prisma.product.findMany({

      where:
        premiumProductWhere,

      orderBy: {
        createdAt: "desc",
      },

      take: 20,

      include: productInclude,
    });

  if (
    premiumCandidates.length > 0
  ) {

    const rotationSeed =
      Math.floor(
        Date.now() /
          (60 * 1000),
      );

    const selectedIndex =
      rotationSeed %
      premiumCandidates.length;

    const selectedPremium =
      premiumCandidates[
        selectedIndex
      ];

    const premiumWithDiscount =
      await this.applyActiveDiscounts([
        selectedPremium,
      ]);

    premiumProduct =
      premiumWithDiscount[0] ?? null;
  }
}

// =========================================
// RETORNO
// =========================================

return {
  items: itemsWithDiscount,

  premiumProduct,

  nextCursor,
};
}

async publicFeed({
  limit,
  cursor,
}: {
  limit: number;
  cursor?: string;
}) {
  const products =
    await this.prisma.product.findMany({
      where: {
        isPublished: true,

        store: {
          isActive: true,
        },
      },

      take: limit + 1,

      skip: cursor ? 1 : 0,

      cursor: cursor
        ? { id: cursor }
        : undefined,

      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],

      include: productInclude,
    });

  let nextCursor: string | null = null;

  if (products.length > limit) {
    const next = products.pop();

    nextCursor = next?.id ?? null;
  }

  const items =
    await this.applyActiveDiscounts(
      products,
    );

  return {
    items,
    nextCursor,
  };
}

async feedFromFollowedStores(
  userId: string,
  limit = 20,
) {

  const products =
    await this.prisma.product.findMany({
   where: {
  isPublished: true,
  store: {
    isActive: true,
    followers: {
      some: { userId },
    },
  },
},

    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    include: productInclude

   });

  return this.applyActiveDiscounts(products);
}

async addFavorite(userId: string, productId: string) {

  return this.prisma.productFavorite.upsert({

    where: {

      userId_productId: {
        userId,
        productId,
      },

    },

    update: {},

    create: {

      userId,

      productId,

    },

  });

}

async removeFavorite(
  userId: string,
  productId: string,
) {

  return this.prisma.productFavorite.delete({

    where: {

      userId_productId: {

        userId,

        productId,

      },

    },

  });

}

async isFavorite(
  userId: string,
  productId: string,
) {

  const favorite =
    await this.prisma.productFavorite.findUnique({

      where: {

        userId_productId: {

          userId,

          productId,

        },

      },

    });

  return {

    favorite: !!favorite,

  };

}

async listFavorites(userId: string) {

  const favorites =
    await this.prisma.productFavorite.findMany({

      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        product: {
          include: {
            store: true,
            category: true,
            images: true,
          },
        },
      },

    });

  return this.applyActiveDiscounts(
    favorites.map(f => f.product),
  );
}

  // =========================================================
  // DESCONTO ATIVO DE UM PRODUTO
  // =========================================================

  private async getActiveDiscount(productId: string) {
    const now = new Date();

    const discountProduct =
      await this.prisma.productDiscountProduct.findFirst({
        where: {
          productId,

          discount: {
            status: 'ACTIVE',

            startsAt: {
              lte: now,
            },

            endsAt: {
              gt: now,
            },
          },
        },

        include: {
          discount: true,
        },

        orderBy: {
          discount: {
            createdAt: 'desc',
          },
        },
      });

    if (!discountProduct) {
      return null;
    }

    return discountProduct.discount;
  }

  // =========================================================
  // APLICAR DESCONTO A UM PRODUTO
  // =========================================================

  private async applyActiveDiscount<T extends {
    id: string;
    type: any;
    price: number;
  }>(product: T) {

    // Leilões nunca recebem desconto
    if (product.type === 'AUCTION') {
      return {
        ...product,
        activeDiscount: null,
        discountedPrice: null,
      };
    }

    const discount = await this.getActiveDiscount(product.id);

    if (!discount) {
      return {
        ...product,
        activeDiscount: null,
        discountedPrice: null,
      };
    }

    const discountedPrice =
      product.price -
      (product.price * discount.discountPercent) / 100;

    return {
      ...product,

      activeDiscount: {
        id: discount.id,
        name: discount.name,
        discountPercent: discount.discountPercent,
        startsAt: discount.startsAt,
        endsAt: discount.endsAt,
      },

      discountedPrice: Number(
        discountedPrice.toFixed(2),
      ),
    };
  }

  // =========================================================
  // APLICAR DESCONTO A UMA LISTA DE PRODUTOS
  // =========================================================

  private async applyActiveDiscounts<T extends {
    id: string;
    type: any;
    price: number;
  }>(products: T[]) {

    return Promise.all(
      products.map(product =>
        this.applyActiveDiscount(product),
      ),
    );
  }

    // =========================================================
  // CRIAR DESCONTO
  // =========================================================

  async createDiscount(
    userId: string,
    data: {
      storeId: string;
      name?: string;
      discountPercent: number;
      startsAt: string;
      endsAt: string;
      productIds: string[];
    },
  ) {

    // -------------------------------------------------------
    // SEGURANÇA
    // -------------------------------------------------------

    const store = await this.prisma.store.findFirst({
      where: {
        id: data.storeId,
        ownerId: userId,
      },
    });

    if (!store) {
      throw new ForbiddenException(
        'Esta banca não pertence a si',
      );
    }

    // -------------------------------------------------------
    // VALIDAÇÕES
    // -------------------------------------------------------

    if (
      data.discountPercent <= 0 ||
      data.discountPercent > 90
    ) {
      throw new BadRequestException(
        'O desconto deve estar entre 1% e 90%',
      );
    }

    if (!data.productIds?.length) {
      throw new BadRequestException(
        'Selecione pelo menos um produto',
      );
    }

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime())
    ) {
      throw new BadRequestException(
        'Datas inválidas',
      );
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'A data de término deve ser posterior à data de início',
      );
    }

    // -------------------------------------------------------
    // BUSCAR PRODUTOS
    // -------------------------------------------------------

    const products =
      await this.prisma.product.findMany({
        where: {
          id: {
            in: data.productIds,
          },

          storeId: data.storeId,
        },

        select: {
          id: true,
          type: true,
        },
      });

    // -------------------------------------------------------
    // TODOS DEVEM PERTENCER À BANCA
    // -------------------------------------------------------

    if (
      products.length !== data.productIds.length
    ) {
      throw new BadRequestException(
        'Um ou mais produtos não pertencem a esta banca',
      );
    }

    // -------------------------------------------------------
    // LEILÕES NÃO PODEM TER DESCONTO
    // -------------------------------------------------------

    const auctionProduct =
      products.find(
        product => product.type === 'AUCTION',
      );

    if (auctionProduct) {
      throw new BadRequestException(
        'Leilões não podem receber descontos',
      );
    }

    // -------------------------------------------------------
    // VERIFICAR SOBREPOSIÇÃO
    // -------------------------------------------------------

    const overlapping =
      await this.prisma.productDiscountProduct.findFirst({
        where: {
          productId: {
            in: data.productIds,
          },

          discount: {
            status: {
              in: [
                'DRAFT',
                'ACTIVE',
                'PAUSED',
              ],
            },

            startsAt: {
              lt: endsAt,
            },

            endsAt: {
              gt: startsAt,
            },
          },
        },

        include: {
          discount: true,
        },
      });

    if (overlapping) {
      throw new BadRequestException(
        'Um dos produtos já possui um desconto neste período',
      );
    }

    // -------------------------------------------------------
    // CRIAR DESCONTO
    // -------------------------------------------------------

    const createdDiscount =
  await this.prisma.productDiscount.create({
    data: {
      storeId: data.storeId,

      name: data.name,

      discountPercent:
        data.discountPercent,

      startsAt,

      endsAt,

      status: 'DRAFT',

      products: {
        create: data.productIds.map(
          productId => ({
            productId,
          }),
        ),
      },
    },

    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });

    const oldDiscounts =
  await this.prisma.productDiscount.findMany({
    where: {
      storeId: data.storeId,
    },

    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],

    skip: 50,

    select: {
      id: true,
    },
  });

if (oldDiscounts.length > 0) {
  await this.prisma.productDiscount.deleteMany({
    where: {
      id: {
        in: oldDiscounts.map(
          discount => discount.id,
        ),
      },
    },
  });
}

return createdDiscount;
  }

    // =========================================================
  // ATIVAR DESCONTO
  // =========================================================

  async activateDiscount(
    userId: string,
    discountId: string,
  ) {

    const discount =
      await this.prisma.productDiscount.findUnique({
        where: {
          id: discountId,
        },

        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  type: true,
                },
              },
            },
          },
        },
      });

    if (!discount) {
      throw new NotFoundException(
        'Desconto não encontrado',
      );
    }

    const store =
      await this.prisma.store.findFirst({
        where: {
          id: discount.storeId,
          ownerId: userId,
        },
      });

    if (!store) {
      throw new ForbiddenException(
        'Não tem permissão para este desconto',
      );
    }

    if (
      discount.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        'Este desconto foi cancelado',
      );
    }

    const now = new Date();

    if (discount.endsAt <= now) {
      throw new BadRequestException(
        'Este desconto já terminou',
      );
    }

    if (!discount.products.length) {
      throw new BadRequestException(
        'Este desconto não possui produtos',
      );
    }

    const auction =
      discount.products.find(
        item =>
          item.product.type === 'AUCTION',
      );

    if (auction) {
      throw new BadRequestException(
        'Leilões não podem receber descontos',
      );
    }

    const overlapping =
      await this.prisma.productDiscountProduct.findFirst({
        where: {
          productId: {
            in: discount.products.map(
              item => item.productId,
            ),
          },

          discountId: {
            not: discount.id,
          },

          discount: {
            status: {
              in: [
                'ACTIVE',
                'PAUSED',
              ],
            },

            startsAt: {
              lt: discount.endsAt,
            },

            endsAt: {
              gt: discount.startsAt,
            },
          },
        },
      });

    if (overlapping) {
      throw new BadRequestException(
        'Existe outro desconto conflitante para um dos produtos',
      );
    }

    return this.prisma.productDiscount.update({
      where: {
        id: discountId,
      },

      data: {
        status: 'ACTIVE',
      },

      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

    // =========================================================
  // PAUSAR DESCONTO
  // =========================================================

  async pauseDiscount(
    userId: string,
    discountId: string,
  ) {

    const discount =
      await this.prisma.productDiscount.findUnique({
        where: {
          id: discountId,
        },
      });

    if (!discount) {
      throw new NotFoundException(
        'Desconto não encontrado',
      );
    }

    if (discount.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Este desconto não está ativo',
      );
    }

    const store =
      await this.prisma.store.findFirst({
        where: {
          id: discount.storeId,
          ownerId: userId,
        },
      });

    if (!store) {
      throw new ForbiddenException(
        'Não tem permissão para este desconto',
      );
    }

    return this.prisma.productDiscount.update({
      where: {
        id: discountId,
      },

      data: {
        status: 'PAUSED',
      },
    });
  }

    // =========================================================
  // CANCELAR DESCONTO
  // =========================================================

  async cancelDiscount(
    userId: string,
    discountId: string,
  ) {

    const discount =
      await this.prisma.productDiscount.findUnique({
        where: {
          id: discountId,
        },
      });

    if (!discount) {
      throw new NotFoundException(
        'Desconto não encontrado',
      );
    }

    const store =
      await this.prisma.store.findFirst({
        where: {
          id: discount.storeId,
          ownerId: userId,
        },
      });

    if (!store) {
      throw new ForbiddenException(
        'Não tem permissão para este desconto',
      );
    }

    return this.prisma.productDiscount.update({
      where: {
        id: discountId,
      },

      data: {
        status: 'CANCELLED',
      },
    });
  }

    // =========================================================
  // LISTAR DESCONTOS DA BANCA
  // =========================================================

  async listStoreDiscounts(
    userId: string,
    storeId: string,
  ) {

    const store =
      await this.prisma.store.findFirst({
        where: {
          id: storeId,
          ownerId: userId,
        },
      });

    if (!store) {
      throw new ForbiddenException(
        'Esta banca não pertence a si',
      );
    }

    return this.prisma.productDiscount.findMany({
      where: {
        storeId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        products: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });
  }


}
