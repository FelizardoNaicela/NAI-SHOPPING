import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';

import { NationalRankingAuctionGateway } from './national-ranking-auction.gateway';

@Injectable()
export class NationalRankingAuctionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionGateway: NationalRankingAuctionGateway,
  ) {}

  // =========================================================
  // NORMALIZAR PAÍS
  // =========================================================

  private normalizeCountryCode(
    countryCode: string,
  ): string {
    const normalized =
      countryCode
        ?.trim()
        .toUpperCase();

    if (!normalized) {
      throw new BadRequestException(
        'countryCode é obrigatório.',
      );
    }

    return normalized;
  }

  // =========================================================
  // OBTER LEILÃO
  // =========================================================

  async getAuction(
    auctionId: string,
  ) {
    const auction =
      await this.prisma
        .nationalRankingAuction
        .findUnique({
          where: {
            id: auctionId,
          },

          include: {
            rankingPosition: {
              select: {
                id: true,
                countryCode: true,
                position: true,

                store: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    verified: true,
                    verificationType: true,
                    isActive: true,
                  },
                },
              },
            },

            winnerStore: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                verified: true,
                verificationType: true,
              },
            },
          },
        });

    if (!auction) {
      throw new NotFoundException(
        'Leilão do ranking não encontrado.',
      );
    }

    return {
      id:
        auction.id,

      countryCode:
        auction.countryCode,

      position:
        auction.position,

      name:
        auction.name,

      imageUrl:
        auction.imageUrl,

      startPrice:
        auction.startPrice,

      currentBid:
        auction.currentBid,

      minimumIncrement:
        auction.minimumIncrement,

      reservePrice:
        auction.reservePrice,

      startsAt:
        auction.startsAt,

      endsAt:
        auction.endsAt,

      closed:
        auction.closed,

      closedAt:
        auction.closedAt,

      finalPrice:
        auction.finalPrice,

      winnerStoreId:
        auction.winnerStoreId,

      winnerStore:
        auction.winnerStore,

      rankingPosition:
        auction.rankingPosition,
    };
  }

  // =========================================================
  // LISTAR LEILÕES DO RANKING
  // =========================================================

  async getAuctions(
    countryCode: string,
  ) {
    const normalizedCountryCode =
      this.normalizeCountryCode(
        countryCode,
      );

    return this.prisma
      .nationalRankingAuction
      .findMany({
        where: {
          countryCode:
            normalizedCountryCode,
        },

        include: {
          rankingPosition: {
            select: {
              position: true,

              store: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  verified: true,
                  verificationType: true,
                },
              },
            },
          },
        },

        orderBy: {
          position: 'asc',
        },
      });
  }

  // =========================================================
  // HISTÓRICO DE LANCES
  // =========================================================

  async getHistory(
    auctionId: string,
  ) {
    const auction =
      await this.prisma
        .nationalRankingAuction
        .findUnique({
          where: {
            id: auctionId,
          },
        });

    if (!auction) {
      throw new NotFoundException(
        'Leilão do ranking não encontrado.',
      );
    }

    return this.prisma
      .nationalRankingAuctionBid
      .findMany({
        where: {
          auctionId,
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
              verified: true,
              verificationType: true,
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

  // =========================================================
  // STATUS
  // =========================================================

  async getStatus(
    auctionId: string,
  ) {
    const auction =
      await this.prisma
        .nationalRankingAuction
        .findUnique({
          where: {
            id: auctionId,
          },

          include: {
            winnerStore: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });

    if (!auction) {
      throw new NotFoundException(
        'Leilão do ranking não encontrado.',
      );
    }

    return {
      id:
        auction.id,

      countryCode:
        auction.countryCode,

      position:
        auction.position,

      currentBid:
        auction.currentBid,

      closed:
        auction.closed,

      startsAt:
        auction.startsAt,

      endsAt:
        auction.endsAt,

      winnerStoreId:
        auction.winnerStoreId,

      winnerStore:
        auction.winnerStore,

      finalPrice:
        auction.finalPrice,
    };
  }

  // =========================================================
  // FAZER LANCE
  // =========================================================

  async placeBid(
    auctionId: string,
    userId: string,
    amount: number,
    storeId?: string,
  ) {
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new BadRequestException(
        'Valor do lance inválido.',
      );
    }

    const auction =
      await this.prisma
        .nationalRankingAuction
        .findUnique({
          where: {
            id: auctionId,
          },
        });

    if (!auction) {
      throw new NotFoundException(
        'Leilão do ranking não encontrado.',
      );
    }

    const now =
      new Date();

    if (auction.closed) {
      throw new BadRequestException(
        'Este leilão já foi encerrado.',
      );
    }

    if (
      now <
      auction.startsAt
    ) {
      throw new BadRequestException(
        'O leilão ainda não começou.',
      );
    }

    if (
      now >=
      auction.endsAt
    ) {
      throw new BadRequestException(
        'O leilão terminou.',
      );
    }

    // =======================================================
    // ENCONTRAR BANCA DO UTILIZADOR
    // =======================================================

    let store;

    if (storeId) {
      store =
        await this.prisma.store.findUnique({
          where: {
            id: storeId,
          },
        });

      if (!store) {
        throw new NotFoundException(
          'Banca não encontrada.',
        );
      }

      if (
        store.ownerId !== userId
      ) {
        throw new ForbiddenException(
          'Esta banca não pertence ao utilizador.',
        );
      }
    } else {
      store =
        await this.prisma.store.findFirst({
          where: {
            ownerId: userId,

            countryCode:
              auction.countryCode,

            isActive: true,

            verified: true,

            verificationType:
              'PREMIUM',
          },

          orderBy: {
            createdAt: 'asc',
          },
        });

      if (!store) {
        throw new ForbiddenException(
          'É necessário possuir uma banca Premium verificada e ativa neste país para participar do leilão.',
        );
      }
    }

    // =======================================================
    // VALIDAR BANCA
    // =======================================================

    if (
      !store.isActive
    ) {
      throw new ForbiddenException(
        'A banca está inativa.',
      );
    }

    if (
      !store.verified ||
      store.verificationType !==
        'PREMIUM'
    ) {
      throw new ForbiddenException(
        'Somente bancas Premium verificadas podem participar deste leilão.',
      );
    }

    if (
      store.countryCode !==
      auction.countryCode
    ) {
      throw new ForbiddenException(
        'A banca deve pertencer ao mesmo país do ranking.',
      );
    }

    // =======================================================
    // TRANSAÇÃO
    // =======================================================

    const result =
      await this.prisma.$transaction(
        async tx => {
          const latest =
            await tx
              .nationalRankingAuction
              .findUnique({
                where: {
                  id: auctionId,
                },
              });

          if (!latest) {
            throw new NotFoundException(
              'Leilão do ranking não encontrado.',
            );
          }

          const transactionNow =
            new Date();

          // ---------------------------------------------------
          // VALIDAR NOVAMENTE O ESTADO REAL DO LEILÃO
          // ---------------------------------------------------

          if (
            latest.closed
          ) {
            throw new BadRequestException(
              'Este leilão já foi encerrado.',
            );
          }

          if (
            transactionNow <
            latest.startsAt
          ) {
            throw new BadRequestException(
              'O leilão ainda não começou.',
            );
          }

          if (
            transactionNow >=
            latest.endsAt
          ) {
            throw new BadRequestException(
              'O leilão terminou.',
            );
          }

          // ---------------------------------------------------
          // CALCULAR LANCE MÍNIMO COM DADOS ATUAIS
          // ---------------------------------------------------

          const latestCurrentBid =
            latest.currentBid ??
            latest.startPrice;

          const latestMinimum =
            latest.currentBid === null ||
            latest.currentBid === undefined
              ? latest.startPrice
              : latestCurrentBid +
                (
                  latest.minimumIncrement ??
                  1
                );

          if (
            amount <
            latestMinimum
          ) {
            throw new BadRequestException(
              `O lance mínimo permitido é ${latestMinimum} MT.`,
            );
          }

          // ---------------------------------------------------
          // EXTENSÃO AUTOMÁTICA
          // ---------------------------------------------------

          let newEndDate =
            latest.endsAt;

          const remaining =
            latest.endsAt.getTime() -
            transactionNow.getTime();

          if (
            remaining <=
            30_000
          ) {
            newEndDate =
              new Date(
                latest.endsAt.getTime() +
                  3 * 60 * 1000,
              );
          }

          // ---------------------------------------------------
          // GUARDAR ANTIGO LÍDER
          // ---------------------------------------------------

          const previousWinnerStoreId =
            latest.winnerStoreId;

          // ---------------------------------------------------
          // CRIAR LANCE
          // ---------------------------------------------------

          const bid =
            await tx
              .nationalRankingAuctionBid
              .create({
                data: {
                  amount,

                  auctionId,

                  userId,

                  storeId:
                    store.id,
                },
              });

          // ---------------------------------------------------
          // REMOVER LÍDER ANTERIOR
          // ---------------------------------------------------

          await tx
            .nationalRankingAuctionBid
            .updateMany({
              where: {
                auctionId,

                isWinning:
                  true,
              },

              data: {
                isWinning:
                  false,
              },
            });

          // ---------------------------------------------------
          // MARCAR NOVO LÍDER
          // ---------------------------------------------------

          await tx
            .nationalRankingAuctionBid
            .update({
              where: {
                id:
                  bid.id,
              },

              data: {
                isWinning:
                  true,
              },
            });

          // ---------------------------------------------------
          // ATUALIZAR LEILÃO
          // ---------------------------------------------------

          const updatedAuction =
            await tx
              .nationalRankingAuction
              .update({
                where: {
                  id:
                    auctionId,
                },

                data: {
                  currentBid:
                    amount,

                  winnerStoreId:
                    store.id,

                  endsAt:
                    newEndDate,
                },
              });

          return {
            bid,

            updatedAuction,

            previousWinnerStoreId,

            newEndDate,
          };
        },
      );

    // =======================================================
    // NOTIFICAR ANTIGO LÍDER
    // =======================================================

    if (
      result.previousWinnerStoreId &&
      result.previousWinnerStoreId !==
        store.id
    ) {
      const previousStore =
        await this.prisma.store.findUnique({
          where: {
            id:
              result.previousWinnerStoreId,
          },

          select: {
            ownerId: true,
            name: true,
          },
        });

      if (
        previousStore
      ) {
        await this.prisma.notification.create({
          data: {
            userId:
              previousStore.ownerId,

            type:
              'NATIONAL_RANKING_AUCTION_OUTBID',

            message:
              `O lance da sua banca "${previousStore.name}" foi ultrapassado no leilão da posição ${auction.position} do Ranking Nacional.`,

            meta: {
              auctionId,

              position:
                auction.position,

              newBid:
                amount,

              storeId:
                store.id,
            },
          },
        });
      }
    }

    // =======================================================
    // BUSCAR DADOS DO UTILIZADOR
    // =======================================================

    const bidder =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId,
        },

        select: {
          id: true,
          name: true,
        },
      });

    // =======================================================
    // EVENTO DE EXTENSÃO
    // =======================================================

    if (
      result.newEndDate.getTime() !==
      auction.endsAt.getTime()
    ) {
      this.auctionGateway.emitAuctionExtended({
        auctionId,

        newEndDate:
          result.newEndDate,
      });
    }

    // =======================================================
    // EVENTO DE NOVO LANCE
    // =======================================================

    this.auctionGateway.emitNewBid({
      auctionId,

      bidId:
        result.bid.id,

      currentBid:
        amount,

      winnerUserId:
        userId,

      winnerName:
        bidder?.name ??
        undefined,

      storeId:
        store.id,

      storeName:
        store.name,

      storeAvatarUrl:
        store.avatarUrl ??
        undefined,

      createdAt:
        result.bid.createdAt,

      isWinning:
        true,
    });

    return {
      success:
        true,

      bid:
        result.bid,

      currentBid:
        amount,

      winnerStoreId:
        store.id,

      endsAt:
        result.newEndDate,
    };
  }

  // =========================================================
  // ENCERRAR LEILÃO
  // =========================================================

  async closeAuction(
    auctionId: string,
  ) {
    const auction =
      await this.prisma
        .nationalRankingAuction
        .findUnique({
          where: {
            id: auctionId,
          },
        });

    if (!auction) {
      throw new NotFoundException(
        'Leilão do ranking não encontrado.',
      );
    }

    if (
      auction.closed
    ) {
      return auction;
    }

    const now =
      new Date();

    if (
      now <
      auction.endsAt
    ) {
      throw new BadRequestException(
        'O leilão ainda não terminou.',
      );
    }

    // =======================================================
    // CALCULAR RESULTADO
    // =======================================================

    const currentBid =
      auction.currentBid;

    const reserveReached =
      auction.reservePrice === null ||
      auction.reservePrice === undefined ||
      (
        currentBid !== null &&
        currentBid !== undefined &&
        currentBid >=
          auction.reservePrice
      );

    const winnerStoreId =
      reserveReached
        ? auction.winnerStoreId
        : null;

    const finalPrice =
      reserveReached
        ? currentBid
        : null;

    // =======================================================
    // TRANSAÇÃO
    // =======================================================

    const updated =
      await this.prisma.$transaction(
        async tx => {
          const latest =
            await tx
              .nationalRankingAuction
              .findUnique({
                where: {
                  id:
                    auctionId,
                },
              });

          if (!latest) {
            throw new NotFoundException(
              'Leilão do ranking não encontrado.',
            );
          }

          // Outro processo pode ter encerrado
          // o leilão antes deste.
          if (
            latest.closed
          ) {
            return latest;
          }

          const latestNow =
            new Date();

          if (
            latestNow <
            latest.endsAt
          ) {
            throw new BadRequestException(
              'O leilão ainda não terminou.',
            );
          }

          const latestCurrentBid =
            latest.currentBid;

          const latestReserveReached =
            latest.reservePrice === null ||
            latest.reservePrice === undefined ||
            (
              latestCurrentBid !== null &&
              latestCurrentBid !== undefined &&
              latestCurrentBid >=
                latest.reservePrice
            );

          const latestWinnerStoreId =
            latestReserveReached
              ? latest.winnerStoreId
              : null;

          const latestFinalPrice =
            latestReserveReached
              ? latestCurrentBid
              : null;

          const updatedAuction =
            await tx
              .nationalRankingAuction
              .update({
                where: {
                  id:
                    auctionId,
                },

                data: {
                  closed:
                    true,

                  closedAt:
                    latestNow,

                  finalPrice:
                    latestFinalPrice,

                  winnerStoreId:
                    latestWinnerStoreId,
                },
              });

          return updatedAuction;
        },
      );

    // =======================================================
    // RESULTADO FINAL REAL
    // =======================================================

    const finalWinnerStoreId =
      updated.winnerStoreId;

    const finalAuctionPrice =
      updated.finalPrice;

    // =======================================================
    // NOTIFICAÇÃO AO VENCEDOR
    // =======================================================

    if (
      finalWinnerStoreId
    ) {
      const winnerStore =
        await this.prisma.store.findUnique({
          where: {
            id:
              finalWinnerStoreId,
          },

          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        });

      if (
        winnerStore
      ) {
        await this.prisma.notification.create({
          data: {
            userId:
              winnerStore.ownerId,

            type:
              'NATIONAL_RANKING_AUCTION_WON',

            message:
              `Parabéns! A sua banca "${winnerStore.name}" venceu o leilão da posição ${updated.position} do Ranking Nacional. O resultado do leilão foi registrado; a atribuição da posição ao ranking é feita separadamente pela gestão do ranking.`,

            meta: {
              auctionId,

              countryCode:
                updated.countryCode,

              position:
                updated.position,

              finalPrice:
                finalAuctionPrice,

              storeId:
                winnerStore.id,
            },
          },
        });
      }
    }

    // =======================================================
    // EVENTO DE FECHAMENTO
    // =======================================================

    this.auctionGateway.emitAuctionClosed({
      auctionId,

      winnerStoreId:
        finalWinnerStoreId ??
        undefined,

      finalBid:
        finalAuctionPrice ??
        undefined,
    });

    return updated;
  }

  // =========================================================
  // FECHAMENTO AUTOMÁTICO
  // =========================================================
  //
  // Executa a cada 10 segundos.
  //
  // IMPORTANTE:
  // Este método SOMENTE encerra o leilão.
  //
  // Ele NÃO:
  // - atribui a posição;
  // - troca a banca da posição;
  // - remove a banca atual;
  // - chama assignNationalRankingPosition().
  //
  // O vencedor do leilão continua sendo apenas o vencedor
  // registrado no NationalRankingAuction.
  //
  // A posição real continua sendo administrada separadamente
  // pelo sistema de gestão do Ranking Nacional.
  // =========================================================

  @Cron('*/10 * * * * *')
  async closeExpiredAuctions() {
    const now =
      new Date();

    const expiredAuctions =
      await this.prisma
        .nationalRankingAuction
        .findMany({
          where: {
            closed:
              false,

            endsAt: {
              lte:
                now,
            },
          },

          select: {
            id: true,
          },

          orderBy: {
            endsAt:
              'asc',
          },

          take: 50,
        });

    for (
      const auction
      of expiredAuctions
    ) {
      try {
        await this.closeAuction(
          auction.id,
        );
      } catch (error) {
      }
    }
  }
}