import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { Prisma, StoreType } from "@prisma/client";

@Injectable()
export class StoresService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async createStore(
  userId: string,
  dto: { name: string; description?: string; type?: StoreType },
) {
  const name = dto.name?.trim();

  if (!name) {
    throw new BadRequestException("Nome da banca obrigatório");
  }

  if (name.length > 25) {
    throw new BadRequestException(
      "O nome da banca pode ter no máximo 25 caracteres",
    );
  }

  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt) {
    throw new BadRequestException("Utilizador inválido");
  }

  return this.prisma.store.create({
    data: {
      name,
      description: dto.description?.trim() || null,
      type: dto.type ?? StoreType.GENERAL_STORE,
      ownerId: userId,
      countryCode: user.countryCode,
      region: user.region,
    },
  });
}

  async getMyStore(
    userId: string,
  ) {
    return this.prisma.store.findFirst({
      where: {
        ownerId: userId,
      },
    });
  }

  async listMyStores(
    userId: string,
  ) {
    return this.prisma.store.findMany({
      where: {
        ownerId: userId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStoreById(
    storeId: string,
  ) {
    return this.prisma.store.findFirst({
      where: {
        id: storeId,
        isActive: true,
      },

      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },

        _count: {
          select: {
            followers: true,
            products: true,
          },
        },
      },
    });
  }

  async followStore(
    userId: string,
    storeId: string,
  ) {
    return this.prisma.storeFollow.upsert({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },

      update: {},

      create: {
        userId,
        storeId,
      },
    });
  }

  async unfollowStore(
    userId: string,
    storeId: string,
  ) {
    return this.prisma.storeFollow.delete({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });
  }

  async isFollowing(
    userId: string,
    storeId: string,
  ) {
    const follow =
      await this.prisma.storeFollow.findUnique({
        where: {
          userId_storeId: {
            userId,
            storeId,
          },
        },
      });

    return {
      isFollowing: !!follow,
    };
  }

  async getStorePage(
    storeId: string,
    viewerId?: string,
  ) {
    const store =
      await this.prisma.store.findFirst({
        where: {
          id: storeId,
          isActive: true,
        },

        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },

          _count: {
            select: {
              followers: true,
              products: true,
            },
          },
        },
      });

    if (!store) {
      throw new BadRequestException(
        'Banca não encontrada ou inativa',
      );
    }

    const isFollowing =
      viewerId
        ? (
            await this.isFollowing(
              viewerId,
              storeId,
            )
          ).isFollowing
        : false;

    const categories =
      await this.prisma.category.findMany({
        where: {
          products: {
            some: {
              storeId,
            },
          },
        },
      });

    const sidebarFeeds =
      await Promise.all(
        categories.map(
          async category => {
            const products =
              await this.prisma.product.findMany({
                where: {
                  storeId,
                  categoryId:
                    category.id,
                },

                orderBy: {
                  createdAt: 'desc',
                },

                take: 6,

                select: {
                  id: true,
                  name: true,
                  price: true,
                  category: true,
                  imageUrl: true,
                  type: true,
                },
              });

            const totalInCategory =
              await this.prisma.product.count({
                where: {
                  storeId,
                  categoryId:
                    category.id,
                },
              });

            return {
              category: {
                id:
                  category.id,

                name:
                  category.name,
              },

              totalInCategory,

              items:
                products,
            };
          },
        ),
      );

    return {
      store: {
        id:
          store.id,

        name:
          store.name,

        description:
          store.description,

        // ===================================
        // VERIFICAÇÃO
        // ===================================

        verified:
          store.verified,

        verificationType:
          store.verificationType,

          type: store.type,

        avatarUrl:
          store.avatarUrl,

        bannerUrl:
          store.bannerUrl,

        owner:
          store.owner,

        countryCode:
          store.countryCode,

        region:
          store.region,

        createdAt:
          store.createdAt,
      },

      stats: {
        followersCount:
          store._count.followers,

        productsCount:
          store._count.products,
      },

      viewer: {
        isFollowing,

        isOwner:
          store.ownerId ===
          viewerId,
      },

      sidebarFeeds,
    };
  }

  async getStoreFeed({
    storeId,
    page,
    limit,
  }: {
    storeId: string;
    page: number;
    limit: number;
  }) {

    const now =
      new Date();

    const skip =
      (page - 1) *
      limit;

    const products =
      await this.prisma.product.findMany({
        where: {
          storeId,
        },

        orderBy: {
          createdAt: 'desc',
        },

        skip,

        take:
          limit,

        include: {
          category: true,

          discounts: {
            include: {
              discount: true,
            },
          },
        },
      });

    return products.map(
      product => {

        const activeDiscount =
          product.discounts
            .map(
              item =>
                item.discount,
            )
            .filter(
              discount =>
                discount.status ===
                  'ACTIVE' &&
                discount.startsAt <=
                  now &&
                discount.endsAt >
                  now,
            )
            .sort(
              (a, b) =>
                b.createdAt.getTime() -
                a.createdAt.getTime(),
            )[0] ?? null;

        const discountedPrice =
          activeDiscount
            ? Math.round(
                product.price *
                  (
                    1 -
                    activeDiscount.discountPercent /
                      100
                  ) *
                  100,
              ) / 100
            : null;

        return {
          id:
            `product-${product.id}`,

          type:
            'product',

          createdAt:
            product.createdAt,

          content:
            product.description,

          product: {
            id:
              product.id,

            name:
              product.name,

            price:
              product.price,

            imageUrl:
              product.imageUrl ??
              null,

            discountedPrice,

            activeDiscount,
          },
        };
      },
    );
  }

 async updateStore(
  storeId: string,
  userId: string,
  data: { avatarUrl?: string; bannerUrl?: string; type?: StoreType },
) {
  const store = await this.prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerId: true },
  });

  if (!store) throw new BadRequestException("Banca não encontrada");
  if (store.ownerId !== userId) throw new BadRequestException("Sem permissão");

  const { avatarUrl, bannerUrl, type } = data;

  return this.prisma.store.update({
    where: { id: storeId },
    data: { avatarUrl, bannerUrl, type },
  });
}

  async getPopularStores(
    limit = 5,
  ) {

    return this.prisma.store.findMany({
      where: {
        isActive: true,
      },

      orderBy: {
        followers: {
          _count: "desc",
        },
      },

      take:
        limit,

      select: {
        id: true,
        name: true,
        avatarUrl: true,
        verified: true,
        type: true,
        verificationType: true,

        _count: {
          select: {
            followers: true,
          },
        },
      },
    });
  }

  async searchStores(
    query: string,
  ) {

    const stores =
      await this.prisma.store.findMany({
        where: {
          isActive: true,

          name: {
            contains: query,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
          name: true,
          avatarUrl: true,
          verified: true,
          verificationType: true,
          type: true,

          _count: {
            select: {
              followers: true,
            },
          },
        },
      });

    // =====================================
    // BOOST DE VERIFICAÇÃO
    // =====================================

    return stores
      .map(
        store => {

          let score =
            store._count.followers;

          if (
            store.verified
          ) {
            score *= 1.1;
          }

          return {
            ...store,
            score,
          };
        },
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      );
  }

  // =========================================
  // GLOBAL SEARCH
  // =========================================

 async globalSearch({
  query,
  country,
  region,
  time,
  sort,
  cursor,
  limit,
  type,
}: {
  query: string;
  country?: string;
  region?: string;
  time?: string;
  sort?: string;
  cursor?: string;
  limit: number;
  type?: string;
}) {
  const now = new Date();

  // Só aceita valores que existem no enum; qualquer outro é ignorado.
  const storeType = Object.values(StoreType).includes(type as StoreType)
    ? (type as StoreType)
    : undefined;

    // =======================================
    // FILTROS DOS PRODUTOS
    // =======================================

    const productWhere:
      Prisma.ProductWhereInput = {

      isPublished: true,

      store: {
        isActive: true,

          ...(storeType ? { type: storeType } : {}),


        ...(country
          ? {
              countryCode:
                country,
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

                {
                  region: null,
                },
              ],
            }
          : {}),
      },
    };

    const productAnd:
      Prisma.ProductWhereInput[] =
      [];

    // =======================================
    // PESQUISA
    // =======================================

    if (
      query?.trim()
    ) {

      productAnd.push({
        OR: [
          {
            name: {
              contains:
                query.trim(),

              mode:
                "insensitive",
            },
          },

          {
            description: {
              contains:
                query.trim(),

              mode:
                "insensitive",
            },
          },
        ],
      });
    }

    // =======================================
    // FILTRO DE DATA
    // =======================================

    if (
      time === "today"
    ) {

      const start =
        new Date();

      start.setHours(
        0,
        0,
        0,
        0,
      );

      productAnd.push({
        createdAt: {
          gte:
            start,
        },
      });
    }

    if (
      time === "7d"
    ) {

      const start =
        new Date(now);

      start.setDate(
        start.getDate() -
          7,
      );

      productAnd.push({
        createdAt: {
          gte:
            start,
        },
      });
    }

    if (
      time === "30d"
    ) {

      const start =
        new Date(now);

      start.setDate(
        start.getDate() -
          30,
      );

      productAnd.push({
        createdAt: {
          gte:
            start,
        },
      });
    }

    if (
      time === "6m"
    ) {

      const start =
        new Date(now);

      start.setMonth(
        start.getMonth() -
          6,
      );

      productAnd.push({
        createdAt: {
          gte:
            start,
        },
      });
    }

    if (
      productAnd.length
    ) {

      productWhere.AND =
        productAnd;
    }

    // =======================================
    // ORDENAÇÃO DOS PRODUTOS
    // =======================================

    let productOrderBy:
      Prisma.ProductOrderByWithRelationInput =
      {
        createdAt:
          "desc",
      };

    switch (
      sort
    ) {

      case "oldest":

        productOrderBy = {
          createdAt:
            "asc",
        };

        break;

      case "priceAsc":

        productOrderBy = {
          price:
            "asc",
        };

        break;

      case "priceDesc":

        productOrderBy = {
          price:
            "desc",
        };

        break;

      default:

        productOrderBy = {
          createdAt:
            "desc",
        };
    }

    // =======================================
    // PREMIUM — PRIMEIRO CARD
    // =======================================
    //
    // IMPORTANTE:
    //
    // O Premium é separado da pesquisa
    // normal.
    //
    // A pesquisa normal NÃO é reorganizada.
    //
    // A única diferença aqui é que buscamos
    // vários Premium compatíveis e fazemos
    // uma rotação entre eles.
    //
    // Não usamos o Premium para alterar
    // a paginação normal.
    // =======================================

    let premiumProduct:
      any =
      null;

    if (
      !cursor
    ) {

      const premiumProductWhere:
        Prisma.ProductWhereInput = {

        isPublished:
          true,

        type:
          "NORMAL",

        store: {
          isActive:
            true,

              ...(storeType ? { type: storeType } : {}),


          verified:
            true,

          verificationType:
            "PREMIUM",

          ...(country
            ? {
                countryCode:
                  country,
              }
            : {}),

          // =================================
          // REGIÃO DO PREMIUM
          // =================================
          //
          // Premium precisa estar realmente
          // na região escolhida.
          //
          // Não usamos region:null aqui.
          // =================================

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

        ...(productAnd.length
          ? {
              AND:
                productAnd,
            }
          : {}),
      };

      // =====================================
      // BUSCAR VÁRIOS PREMIUM
      // =====================================

      const premiumCandidates =
        await this.prisma.product.findMany({
          where:
            premiumProductWhere,

          orderBy: {
            createdAt:
              "desc",
          },

          take:
            20,

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

            images: true,

            discounts: {
              include: {
                discount: true,
              },
            },
          },
        });

      // =====================================
      // ROTAÇÃO PREMIUM
      // =====================================
      //
      // A cada minuto mudamos o Premium
      // utilizado na primeira posição.
      //
      // A pesquisa normal permanece intacta.
      // =====================================

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

        premiumProduct =
          premiumCandidates[
            selectedIndex
          ];
      }
    }

    // =======================================
    // PRODUTOS NORMAIS
    // =======================================
    //
    // IMPORTANTE:
    //
    // NÃO alteramos productWhere.
    //
    // NÃO excluímos o Premium.
    //
    // NÃO fazemos ranking depois.
    //
    // Portanto a pesquisa normal permanece
    // exatamente como anteriormente.
    // =======================================

    const products =
      await this.prisma.product.findMany({
        where:
          productWhere,

        take:
          limit + 1,

        cursor:
          cursor
            ? {
                id:
                  cursor,
              }
            : undefined,

        skip:
          cursor
            ? 1
            : 0,

        orderBy:
          productOrderBy,

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

          images: true,

          discounts: {
            include: {
              discount: true,
            },
          },
        },
      });

    // =======================================
    // CURSOR
    // =======================================

    let nextCursor:
      string | null =
      null;

    if (
      products.length >
      limit
    ) {

      const next =
        products.pop();

      nextCursor =
        next!.id;
    }

    // =======================================
    // FILTROS DAS BANCAS
    // =======================================

    const storeWhere:
      Prisma.StoreWhereInput = {

      isActive:
        true,

          ...(storeType ? { type: storeType } : {}),

      ...(country
        ? {
            countryCode:
              country,
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

              {
                region: null,
              },
            ],
          }
        : {}),
    };

    const storeAnd:
      Prisma.StoreWhereInput[] =
      [];

    // =======================================
    // PESQUISA DAS BANCAS
    // =======================================

    if (
      query?.trim()
    ) {

      storeAnd.push({
        OR: [
          {
            name: {
              contains:
                query.trim(),

              mode:
                "insensitive",
            },
          },

          {
            description: {
              contains:
                query.trim(),

              mode:
                "insensitive",
            },
          },
        ],
      });
    }

    // =======================================
    // FILTRO DE DATA DAS BANCAS
    // =======================================

    if (
      time === "today"
    ) {

      const start =
        new Date();

      start.setHours(
        0,
        0,
        0,
        0,
      );

      storeAnd.push({
        createdAt: {
          gte:
            start,
        },
      });
    }

    if (
      time === "7d"
    ) {

      const start =
        new Date(now);

      start.setDate(
        start.getDate() -
          7,
      );

      storeAnd.push({
        createdAt: {
          gte:
            start,
        },
      });
    }

    if (
      time === "30d"
    ) {

      const start =
        new Date(now);

      start.setDate(
        start.getDate() -
          30,
      );

      storeAnd.push({
        createdAt: {
          gte:
            start,
        },
      });
    }

    if (
      time === "6m"
    ) {

      const start =
        new Date(now);

      start.setMonth(
        start.getMonth() -
          6,
      );

      storeAnd.push({
        createdAt: {
          gte:
            start,
        },
      });
    }

    if (
      storeAnd.length
    ) {

      storeWhere.AND =
        storeAnd;
    }

    // =======================================
    // ORDENAÇÃO DAS BANCAS
    // =======================================

    let storeOrderBy:
      Prisma.StoreOrderByWithRelationInput =
      {
        createdAt:
          "desc",
      };

    if (
      sort === "oldest"
    ) {

      storeOrderBy = {
        createdAt:
          "asc",
      };
    }

    // =======================================
    // BANCAS
    // =======================================

    const stores =
      await this.prisma.store.findMany({
        where:
          storeWhere,

        orderBy:
          storeOrderBy,

        take:
          10,

        select: {
          id: true,
          name: true,
          avatarUrl: true,
          verified: true,
          verificationType: true,
          type: true,

          _count: {
            select: {
              followers: true,
            },
          },
        },
      });

    // =======================================
    // NORMALIZAÇÃO DOS PRODUTOS
    // =======================================

    const normalizeProduct =
      (p: any) => {

        const activeDiscount =
          p.type === "NORMAL"
            ? p.discounts
                .map(
                  (
                    item: any,
                  ) =>
                    item.discount,
                )
                .filter(
                  (
                    discount: any,
                  ) =>
                    discount.status ===
                      "ACTIVE" &&
                    discount.startsAt <=
                      now &&
                    discount.endsAt >
                      now,
                )
                .sort(
                  (
                    a: any,
                    b: any,
                  ) =>
                    b.createdAt.getTime() -
                    a.createdAt.getTime(),
                )[0] ?? null
            : null;

        const discountedPrice =
          activeDiscount
            ? Math.round(
                p.price *
                  (
                    1 -
                    activeDiscount.discountPercent /
                      100
                  ) *
                  100,
              ) / 100
            : null;

        return {
          id:
            p.id,

          name:
            p.name,

          type:
            p.type,

          price:
            p.price,

          discountedPrice,

          activeDiscount,

          imageUrl:
            p.imageUrl,

          store:
            p.store,

          currentBid:
            p.currentBid,

          auctionStartPrice:
            p.auctionStartPrice,

          auctionEndsAt:
            p.auctionEndsAt,

          auctionClosed:
            p.auctionClosed,
        };
      };

    const normalizedProducts =
      products.map(
        normalizeProduct,
      );

    // =======================================
    // NORMALIZAR PREMIUM
    // =======================================

    const normalizedPremiumProduct =
      premiumProduct
        ? normalizeProduct(
            premiumProduct,
          )
        : null;

    // =======================================
    // RETORNO
    // =======================================

    return {
      premiumProduct:
        normalizedPremiumProduct,

      products:
        normalizedProducts,

      stores,

      nextCursor,
    };
  }

  // =========================================
  // SEARCH SUGGESTIONS
  // =========================================

  async searchSuggestions(
    query: string,
  ) {

    if (
      !query.trim()
    ) {
      return [];
    }

    const [
      products,
      stores,
    ] =
      await Promise.all([

        this.prisma.product.findMany({
          where: {
            isPublished: true,

            name: {
              contains:
                query,

              mode:
                "insensitive",
            },
          },

          take:
            5,

          select: {
            name: true,
          },
        }),

        this.prisma.store.findMany({
          where: {
            isActive: true,

            name: {
              contains:
                query,

              mode:
                "insensitive",
            },
          },

          take:
            5,

          select: {
            name: true,
          },
        }),
      ]);

    const suggestions = [

      ...products.map(
        p => ({
          text:
            p.name,

          type:
            "product",
        }),
      ),

      ...stores.map(
        s => ({
          text:
            s.name,

          type:
            "store",
        }),
      ),

    ];

    return suggestions.filter(
      (
        item,
        index,
        self,
      ) =>
        index ===
        self.findIndex(
          s =>
            s.text
              .toLowerCase() ===
              item.text
                .toLowerCase() &&
            s.type ===
              item.type,
        ),
    );
  }
}