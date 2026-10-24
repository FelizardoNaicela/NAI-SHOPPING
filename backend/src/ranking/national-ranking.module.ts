import {
  Module,
} from '@nestjs/common';

import { NationalRankingController } from './national-ranking.controller';

import { NationalRankingService } from './national-ranking.service';

import { NationalRankingAuctionController } from 'src/national-ranking/national-ranking-auction.controller';

import { NationalRankingAuctionService } from 'src/national-ranking/national-ranking-auction.service';

import { NationalRankingAuctionGateway } from 'src/national-ranking/national-ranking-auction.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    NationalRankingController,

    NationalRankingAuctionController,
  ],

  providers: [
    NationalRankingService,

    NationalRankingAuctionService,

    NationalRankingAuctionGateway,
  ],

  exports: [
    NationalRankingService,

    NationalRankingAuctionService,
  ],
})
export class NationalRankingModule {}