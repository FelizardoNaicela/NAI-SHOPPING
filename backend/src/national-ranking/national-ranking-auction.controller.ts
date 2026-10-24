import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

import { NationalRankingAuctionService } from './national-ranking-auction.service';

// =========================================================
// REQUEST AUTENTICADO
// =========================================================

interface AuthenticatedRequest
  extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

// =========================================================
// DTO DO LANCE
// =========================================================

interface PlaceNationalRankingBidDto {
  amount: number;

  /**
   * Opcional.
   *
   * Se o utilizador possuir mais de uma banca
   * Premium elegível, poderá escolher qual banca
   * está a participar.
   */
  storeId?: string;
}

// =========================================================
// CONTROLLER
// =========================================================

@Controller(
  'ranking/national/auctions',
)
export class NationalRankingAuctionController {
  constructor(
    private readonly auctionService:
      NationalRankingAuctionService,
  ) {}

  // =========================================================
  // LISTAR LEILÕES DE UM PAÍS
  // =========================================================
  //
  // GET
  // /ranking/national/auctions/MZ
  //
  // PÚBLICO
  // =========================================================

  @Get('country/:countryCode')
async getAuctions(
  @Param('countryCode')
  countryCode: string,
) {
  return this.auctionService.getAuctions(
    countryCode,
  );
}

  // =========================================================
  // DETALHES DO LEILÃO
  // =========================================================
  //
  // GET
  // /ranking/national/auctions/:auctionId
  //
  // PÚBLICO
  // =========================================================

  @Get('auction/:auctionId')
  async getAuction(
    @Param('auctionId')
    auctionId: string,
  ) {
    return this.auctionService.getAuction(
      auctionId,
    );
  }

  // =========================================================
  // HISTÓRICO
  // =========================================================
  //
  // GET
  // /ranking/national/auctions/auction/:auctionId/history
  //
  // PÚBLICO
  // =========================================================

  @Get(
    'auction/:auctionId/history',
  )
  async getHistory(
    @Param('auctionId')
    auctionId: string,
  ) {
    return this.auctionService.getHistory(
      auctionId,
    );
  }

  // =========================================================
  // STATUS
  // =========================================================

  @Get(
    'auction/:auctionId/status',
  )
  async getStatus(
    @Param('auctionId')
    auctionId: string,
  ) {
    return this.auctionService.getStatus(
      auctionId,
    );
  }

  // =========================================================
  // FAZER LANCE
  // =========================================================
  //
  // POST
  // /ranking/national/auctions/auction/:auctionId/bid
  //
  // REQUER LOGIN
  // =========================================================

  @Post(
    'auction/:auctionId/bid',
  )
  @UseGuards(
    JwtAuthGuard,
  )
  async placeBid(
    @Req()
    req: AuthenticatedRequest,

    @Param('auctionId')
    auctionId: string,

    @Body()
    body: PlaceNationalRankingBidDto,
  ) {
    return this.auctionService.placeBid(
      auctionId,
      req.user.sub,
      Number(body.amount),
      body.storeId,
    );
  }
}