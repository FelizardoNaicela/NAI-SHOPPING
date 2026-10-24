import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuctionGateway } from './auction.gateway';

@Injectable()
export class AuctionService {

  constructor(
  private prisma: PrismaService,
  private auctionGateway: AuctionGateway,
) {}

  async placeBid(
    productId: string,
    userId: string,
    amount: number,
  ) {

    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        store: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Leilão não encontrado.');
    }

    if (product.type !== 'AUCTION') {
      throw new BadRequestException('Este produto não é um leilão.');
    }

    if (product.auctionClosed) {
      throw new BadRequestException('Este leilão já foi encerrado.');
    }

    const now = new Date();

    if (
      product.auctionStartsAt &&
      now < product.auctionStartsAt
    ) {
      throw new BadRequestException(
        'O leilão ainda não começou.',
      );
    }

    if (
      product.auctionEndsAt &&
      now >= product.auctionEndsAt
    ) {
      throw new BadRequestException(
        'O leilão terminou.',
      );
    }

    if (product.store.ownerId === userId) {
      throw new ForbiddenException(
        'O dono da banca não pode licitar.',
      );
    }

    const currentBid =
      product.currentBid ??
      product.auctionStartPrice ??
      0;

    const minimum =
      product.minimumIncrement ?? 1;

    const minimumAllowed =
      currentBid + minimum;

    if (amount < minimumAllowed) {
      throw new BadRequestException(
        `O lance mínimo permitido é ${minimumAllowed} MT.`,
      );
    }

    const bid = await this.prisma.auctionBid.create({
  data: {
    amount,
    userId,
    productId,
    storeId: product.storeId,
  },
});

    const bidder = await this.prisma.user.findUnique({
  where: {
    id: userId,
  },
  select: {
    id: true,
    name: true,
  },
});

let newEndDate = product.auctionEndsAt;

if (product.auctionEndsAt) {
  const remaining =
    product.auctionEndsAt.getTime() - Date.now();

  // últimos 30 segundos
  if (remaining <= 30_000) {
    newEndDate = new Date(
      product.auctionEndsAt.getTime() + 3 * 60 * 1000,
    );
  }
}

const updatedProduct =
 await this.prisma.product.update({
  where: {
    id: productId,
  },
  data: {
    currentBid: amount,
    auctionWinnerId: userId,
    auctionEndsAt: newEndDate,
  },
});

if (
  newEndDate &&
  product.auctionEndsAt &&
  newEndDate.getTime() !== product.auctionEndsAt.getTime()
) {
  this.auctionGateway.emitAuctionExtended({
  productId,
  newEndDate,
});
}


    const previousWinnerId = product.auctionWinnerId;
      if (
      previousWinnerId &&
      previousWinnerId !== userId
    ) {

      await this.prisma.notification.create({

        data: {

          userId: previousWinnerId,

          type: 'AUCTION_OUTBID',

          message:
            `O seu lance em "${product.name}" foi ultrapassado.`,

          meta: {

            productId,

            newBid: amount,

          },

        },

      });

      }

      await this.prisma.auctionBid.updateMany({
  where: {
    productId,
    isWinning: true,
  },
  data: {
    isWinning: false,
  },
});

await this.prisma.auctionBid.update({
  where: {
    id: bid.id,
  },
  data: {
    isWinning: true,
  },
});



    // Não criar notificação para o próprio licitador.
// O frontend mostrará apenas um toast.

  this.auctionGateway.emitNewBid({
    productId,
    bidId: bid.id,
    currentBid: amount,
    winnerId: userId,
    winnerName: bidder?.name ?? undefined,
    createdAt: bid.createdAt,
    isWinning: true,
});


    return {
      success: true,
      bid,
      currentBid: amount,
      auctionWinnerId: userId,
    };

  }

  async getHistory(productId: string) {
  return this.prisma.auctionBid.findMany({
    where: {
      productId,
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },

      store: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },

    orderBy: [
      {
        createdAt: 'desc',
      },
    ],
  });
}

async getStatus(productId: string) {

  const product = await this.prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      auctionWinner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundException();
  }

  return {
    currentBid: product.currentBid,
    auctionClosed: product.auctionClosed,
    auctionEndsAt: product.auctionEndsAt,
    winner: product.auctionWinner,
  };

}

async closeAuction(productId: string) {

  const product =
    await this.prisma.product.findUnique({

      where: {
        id: productId,
      },

    });

     if (!product) {
    throw new NotFoundException();
  }

  if (product.auctionClosed) {
    return product;
  }
const updatedProduct =
  await this.prisma.product.update({
    where: {
      id: productId,
    },
    data:{

    auctionClosed:true,

    closedAt:new Date(),

    finalPrice:product.currentBid,

},
  });

    const winner = product.auctionWinnerId
  ? await this.prisma.user.findUnique({
      where: {
        id: product.auctionWinnerId,
      },
      select: {
        id: true,
        name: true,
      },
    })
  : null;



  if (winner) {


    await this.prisma.notification.create({

        data: {

            userId: winner.id,

            type: 'AUCTION_WON',

            message: `Parabéns! Ganhou o leilão "${product.name}".`,

            meta: {
                productId: product.id,
            },

        },

    });

}


this.auctionGateway.emitAuctionClosed({
    productId: updatedProduct.id,
    winnerId: winner?.id,
    winnerName: winner?.name ?? undefined,
    finalBid: updatedProduct.currentBid ?? undefined,
});

return updatedProduct;
}

async getOpenAuctions() {

  const products = await this.prisma.product.findMany({

    where: {

      type: "AUCTION",

      auctionClosed: false,

      auctionEndsAt: {
        gt: new Date(),
      },

    },

    include: {
      store: true,
      images: {
        orderBy: {
          order: "asc",
        },
      },
      category: true,
    },

    orderBy: {
      auctionEndsAt: "asc",
    },

  });

  return products.map(product => ({

    ...product,

    images: product.images.map(img => ({
    id: img.id,
    url:
        img.largeUrl ||
        img.mediumUrl ||
        img.smallUrl ||
        img.thumbUrl ||
        img.originalUrl,
})),

  }));

}

async endingSoon() {

  const now = new Date();

  const oneHour =
    new Date(now.getTime() + 60 * 60 * 1000);

  return this.prisma.product.findMany({

    where: {

      type: 'AUCTION',

      auctionClosed: false,

      auctionEndsAt: {

        gt: now,

        lte: oneHour,

      },

    },

    include: {

      store: true,

      images: true,

      category: true,

    },

    orderBy: {

      auctionEndsAt: 'asc',

    },

  });

}


async getAuctions(
  tab?: string,
  userId?: string,
  cursor?: string,
  limit = 20,
) {
  const now = new Date();

  switch (tab) {

    case "ending": {

      const data = await this.prisma.product.findMany({

        where: {
          type: "AUCTION",
          auctionClosed: false,
          auctionEndsAt: {
            gt: now,
          },
        },

        include: {
          store: true,
          images: true,
          category: true,
        },

        orderBy: {
          auctionEndsAt: "asc",
        },

        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,

      });

      let nextCursor: string | null = null;

      if (data.length > limit) {
        const next = data.pop();
        nextCursor = next!.id;
      }

      return {
        data,
        nextCursor,
      };

    }

    case "closed": {

      const data = await this.prisma.product.findMany({

        where: {
          type: "AUCTION",
          auctionClosed: true,
        },

        include: {
          store: true,
          images: true,
          category: true,
        },

        orderBy: {
          closedAt: "desc",
        },

        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,

      });

      let nextCursor: string | null = null;

      if (data.length > limit) {
        const next = data.pop();
        nextCursor = next!.id;
      }

      return {
        data,
        nextCursor,
      };

    }

    case "favorites": {

      if (!userId) {
        return {
          data: [],
          nextCursor: null,
        };
      }

      const favorites = await this.prisma.productFavorite.findMany({

        where: {
          userId,
          product: {
            type: "AUCTION",
          },
        },

        include: {
          product: {
            include: {
              store: true,
              images: true,
              category: true,
            },
          },
        },

      });

      return {
        data: favorites.map(f => f.product),
        nextCursor: null,
      };

    }

    default: {

      const data = await this.prisma.product.findMany({

        where: {
          type: "AUCTION",
          auctionClosed: false,
          auctionEndsAt: {
            gt: now,
          },
        },

        include: {
          store: true,
          images: true,
          category: true,
        },

        orderBy: {
          auctionEndsAt: "asc",
        },

        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,

      });

      let nextCursor: string | null = null;

      if (data.length > limit) {
        const next = data.pop();
        nextCursor = next!.id;
      }

      return {
        data,
        nextCursor,
      };

    }

  }
}

async getStats(userId: string) {

  const now = new Date();

  const endOfDay = new Date(now);

  endOfDay.setHours(
    23,
    59,
    59,
    999,
  );

  const [
    active,
    ending,
    favorites,
    highest,
  ] = await Promise.all([

    this.prisma.product.count({

      where: {

        type: "AUCTION",

        auctionClosed: false,

        auctionEndsAt: {

          gt: now,

        },

      },

    }),

    this.prisma.product.count({

      where: {

        type: "AUCTION",

        auctionClosed: false,

        auctionEndsAt: {

          gt: now,

          lte: endOfDay,

        },

      },

    }),

    this.prisma.productFavorite.count({

      where: {

        userId,

        product: {

          type: "AUCTION",

        },

      },

    }),

    this.prisma.product.findFirst({

      where: {

        type: "AUCTION",

      },

      orderBy: {

        currentBid: "desc",

      },

      select: {

        currentBid: true,

        auctionStartPrice: true,

      },

    }),

  ]);

  return {

    active,

    ending,

    favorites,

    highestBid:

      highest?.currentBid ??

      highest?.auctionStartPrice ??

      0,

  };

}
}