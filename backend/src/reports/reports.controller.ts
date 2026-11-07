
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  // =====================================================
  // CRIAR DENÚNCIA
  // =====================================================

  @Post()
  createReport(
    @Req() req: any,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(
      req.user.sub,
      dto,
    );
  }

  // =====================================================
  // MINHAS DENÚNCIAS
  // =====================================================

  @Get('mine')
  getMyReports(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getMyReports(
      req.user.sub,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
