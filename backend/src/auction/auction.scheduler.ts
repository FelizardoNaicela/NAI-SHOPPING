import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { AuctionService } from './auction.service';

@Injectable()
export class AuctionScheduler {

  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionService: AuctionService,
  ) {}

  @Cron(CronExpression.EVERY_SECOND)
  async closeExpiredAuctions() {

    const auctions = await this.prisma.product.findMany({
      where: {
        type: 'AUCTION',
        auctionClosed: false,
        auctionEndsAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    for (const auction of auctions) {

      try {

        await this.auctionService.closeAuction(
          auction.id,
        );

      } catch (e) {

      }

    }

  }

}