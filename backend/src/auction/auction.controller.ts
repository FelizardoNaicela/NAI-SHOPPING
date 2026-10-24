import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Get,
  Query
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { AuctionService } from './auction.service';
import { CreateBidDto } from './dto/create-bid.dto';

@Controller('auctions')
export class AuctionController {

  constructor(
    private readonly auctionService: AuctionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(':productId/bid')
  placeBid(
    @Param('productId') productId: string,
    @Req() req,
    @Body() dto: CreateBidDto,
  ) {
    return this.auctionService.placeBid(
      productId,
      req.user.sub,
      dto.amount,
    );
  }

  @UseGuards(JwtAuthGuard)
@Get("stats")
getStats(
  @Req() req: any,
) {
  return this.auctionService.getStats(
    req.user.sub,
  );
}

  @Get(':productId/bids')
getHistory(
  @Param('productId') productId: string,
) {
  return this.auctionService.getHistory(productId);
}

@Get(':productId/status')
getStatus(
  @Param('productId') productId: string,
) {
  return this.auctionService.getStatus(productId);
}

@Post(':productId/close')
closeAuction(
  @Param('productId') productId: string,
) {
  return this.auctionService.closeAuction(productId);
}

@UseGuards(JwtAuthGuard)
@Get()
getAuctions(
  @Query("tab") tab?: string,
  @Query("cursor") cursor?: string,
  @Query("limit") limit?: string,
  @Req() req?: any,
) {
  return this.auctionService.getAuctions(
    tab,
    req.user.sub,
    cursor,
    Number(limit) || 20,
  );
}
}