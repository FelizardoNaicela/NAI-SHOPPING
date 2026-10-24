import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { AuctionController } from './auction.controller';
import { AuctionGateway } from './auction.gateway';
import { AuctionScheduler } from './auction.scheduler';
import { AuctionService } from './auction.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [AuctionController],
  providers: [
    AuctionService,
    AuctionGateway,
    AuctionScheduler,
  ],
  exports: [
    AuctionGateway,
  ],
})
export class AuctionModule {}