import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { NationalRankingService } from './national-ranking.service';

@Controller('ranking')
export class NationalRankingController {
  constructor(
    private readonly nationalRankingService: NationalRankingService,
  ) {}

  // =========================================
  // RANKING NACIONAL PÚBLICO
  // =========================================
  //
  // GET
  // /ranking/national?countryCode=MZ
  //
  // NÃO precisa de login.
  // NÃO usa AdminGuard.
  // =========================================

  @Get('national')
  async getNationalRanking(
    @Query('countryCode')
    countryCode?: string,
  ) {
    return this.nationalRankingService
      .getNationalRanking(
        countryCode ?? '',
      );
  }
}