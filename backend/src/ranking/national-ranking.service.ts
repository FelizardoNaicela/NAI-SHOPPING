import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NationalRankingService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================
  // NORMALIZAR PAÍS
  // =========================================

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

  // =========================================
  // RANKING NACIONAL PÚBLICO
  // =========================================
  //
  // Retorna sempre 10 posições.
  //
  // Se uma posição ainda não existir
  // no banco, ela é criada apenas
  // na resposta como disponível.
  //
  // NÃO cria registros no banco.
  // =========================================

  async getNationalRanking(
    countryCode: string,
  ) {
    const normalizedCountryCode =
      this.normalizeCountryCode(
        countryCode,
      );

    const positions =
      await this.prisma
        .nationalRankingPosition
        .findMany({
          where: {
            countryCode:
              normalizedCountryCode,
          },

          orderBy: {
            position: 'asc',
          },

          select: {
            position: true,

            // =================================
            // LOJA RANKEADA
            // =================================

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

            // =================================
            // LEILÃO FIXO DA POSIÇÃO
            //
            // ATENÇÃO:
            // No schema atual a relação se chama
            // "auction", não "auctionProduct".
            // =================================

            auction: {
              select: {
                id: true,
                name: true,
                imageUrl: true,

                startPrice: true,
                currentBid: true,
                minimumIncrement: true,
                reservePrice: true,

                startsAt: true,
                endsAt: true,

                closed: true,
                closedAt: true,
                finalPrice: true,

                countryCode: true,
                position: true,
              },
            },
          },
        });

    // =========================================
    // GARANTIR EXATAMENTE 10 POSIÇÕES
    // =========================================

    return Array.from(
      { length: 10 },
      (_, index) => {
        const position =
          index + 1;

        const existing =
          positions.find(
            item =>
              item.position ===
              position,
          );

        // =====================================
        // POSIÇÃO AINDA NÃO EXISTE
        // =====================================

        if (!existing) {
          return {
            position,
            store: null,
            auctionProduct: null,
          };
        }

        // =====================================
        // POSIÇÃO EXISTENTE
        // =====================================

        return {
          position:
            existing.position,

          // ===================================
          // LOJA
          // ===================================

          store:
            existing.store &&
            existing.store.isActive
              ? {
                  id:
                    existing.store.id,

                  name:
                    existing.store.name,

                  avatarUrl:
                    existing.store.avatarUrl,

                  verified:
                    existing.store.verified,

                  verificationType:
                    existing.store
                      .verificationType,
                }
              : null,

          // ===================================
          // LEILÃO
          //
          // Prisma usa "auction".
          //
          // A API continua devolvendo
          // "auctionProduct" para manter
          // compatibilidade com o frontend.
          // ===================================

          auctionProduct:
            existing.auction
              ? {
                  id:
                    existing.auction.id,

                  name:
                    existing.auction.name,

                  // O frontend atual espera
                  // type AUCTION.
                  type:
                    'AUCTION',

                  // Compatibilidade com
                  // NationalRankingAuction
                  price:
                    existing.auction
                      .startPrice,

                  auctionStartPrice:
                    existing.auction
                      .startPrice,

                  currentBid:
                    existing.auction
                      .currentBid,

                  minimumIncrement:
                    existing.auction
                      .minimumIncrement,

                  auctionStartsAt:
                    existing.auction
                      .startsAt,

                  auctionEndsAt:
                    existing.auction
                      .endsAt,

                  auctionClosed:
                    existing.auction
                      .closed,

                  closedAt:
                    existing.auction
                      .closedAt,

                  finalPrice:
                    existing.auction
                      .finalPrice,

                  imageUrl:
                    existing.auction
                      .imageUrl,
                }
              : null,
        };
      },
    );
  }
}