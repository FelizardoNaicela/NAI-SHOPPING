import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}
  /* =========================
     Criar post
  ========================= */

  async create(userId: string, dto: CreatePostDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      select: { ownerId: true },
    });

    if (!store || store.ownerId !== userId) {
      throw new ForbiddenException('Sem permissão para postar');
    }

    return this.prisma.post.create({
  data: {
    storeId: dto.storeId,
    content: dto.content,
    type: dto.productId ? 'PRODUCT_PROMOTION' : dto.type,
    productId: dto.productId,

    images: dto.imageUrls
      ? {
          create: dto.imageUrls.map((url, index) => ({
            url,
            order: index,
          })),
        }
      : undefined,
  },
  include: {
  store: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  },

  images: {
    orderBy: { order: 'asc' },
  },

  product: true,
},
});
  }

  /* =========================
     Feed da banca (cursor pagination)
  ========================= */

  async getStoreFeed(storeId: string, cursor?: string, limit = 10) {
    const posts = await this.prisma.post.findMany({
    where: {
        storeId,
    },

    take: limit + 1,

    ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
    }),

    orderBy: [
        {
            createdAt: "desc",
        },
        {
            id: "desc",
        },
    ],

    include: {
        store: {
            select: {
                id: true,
                name: true,
                avatarUrl: true,
            },
        },

        images: {
            orderBy: {
                order: "asc",
            },
        },

        product: {
            include: {
                images: {
                    orderBy: {
                        order: "asc",
                    },
                },
            },
        },
    },
});

    const hasNext = posts.length > limit;
    const data = hasNext ? posts.slice(0, -1) : posts;

    return {
      data,
      nextCursor: hasNext ? data[data.length - 1].id : null,
    };
  }

  async getGlobalFeed(params: {
  userId?: string; // 👈 agora opcional
  cursor?: string;
  limit: number;
  overrideCountry?: string;
  overrideRegion?: string;
}) {

  let country = params.overrideCountry;

// "" significa "Todas as províncias"
let region =
  params.overrideRegion === ""
    ? undefined
    : params.overrideRegion;

  // 🔐 se estiver logado, usa dados do user
  if (params.userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        countryCode: true,
        region: true,
      },
    });

    if (user) {

  // Se não foi escolhido país, usa o país do utilizador.
  if (!country) {
    country = user.countryCode;
  }

  // Só usa a região do utilizador
  // quando o frontend não enviou nenhum filtro.
  if (
    params.overrideCountry === undefined &&
    params.overrideRegion === undefined
  ) {
    region = user.region ?? undefined;
  }

} }

  // 🌍 fallback global (IMPORTANTE)
  if (!country) {
    country = "MZ"; // default
  }

  const posts = await this.prisma.post.findMany({
  where: {
    store: {
      countryCode: country,

      ...(region
        ? {
            OR: [
              // Região principal/legada
              {
                region: region,
              },

              // Nova região autorizada
              {
                regions: {
                  some: {
                    region: region,
                  },
                },
              },

              // Mantém o comportamento antigo
              // das lojas sem região principal.
              {
                region: null,
              },
            ],
          }
        : {}),
    },
  },

  take: params.limit,

  ...(params.cursor && {
    skip: 1,
    cursor: {
      id: params.cursor,
    },
  }),

  orderBy: [
    {
      createdAt: "desc",
    },
    {
      id: "desc",
    },
  ],

  include: {
    store: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        countryCode: true,
        region: true,
        verified: true,
    verificationType: true,
    type: true,
      },
    },

    images: true,

    product: {
      include: {
        images: true,
      },
    },
  },
});

  const nextCursor =
    posts.length === params.limit
      ? posts[posts.length - 1].id
      : null;

  return {
    data: posts,
    nextCursor,
  };
}

async getFollowingFeed(userId: string, params: { cursor?: string; limit: number }) {

  const posts = await this.prisma.post.findMany({

    where: {
      store: {
        followers: {
          some: {
            userId: userId
          }
        }
      }
    },

    take: params.limit,

    ...(params.cursor && {
      skip: 1,
      cursor: { id: params.cursor }
    }),

    orderBy: {
      createdAt: "desc"
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
        }
      },
      images: true,
      product: {
        include: {
          images: true
        }
      }
    }

  });

  const nextCursor =
    posts.length === params.limit
      ? posts[posts.length - 1].id
      : null;

  return {
    data: posts,
    nextCursor
  };

}


async findOne(id: string) {

  const post =
    await this.prisma.post.findUnique({
      where: {
        id,
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            verified: true,
            verificationType: true,
          },
        },

        images: {
          orderBy: {
            order: "asc",
          },
        },

        product: {
          include: {
            images: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

  if (!post) {
    throw new NotFoundException(
      "Publicação não encontrada",
    );
  }

  return post;
}
}