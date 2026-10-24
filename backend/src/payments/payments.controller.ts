import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";

import { PaymentsService } from "./payments.service";

import { PaymentQueryDto } from "./dto/payment-query.dto";

interface AuthenticatedRequest
  extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('payments')
export class PaymentsController {
  constructor(
  private readonly paymentsService: PaymentsService,
) {}

  // =========================================================
  // MEUS PAGAMENTOS
  // =========================================================
  //
  // GET /payments/mine
  //
  // Retorna somente pagamentos do utilizador autenticado.
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async mine(
    @Req()
    req: AuthenticatedRequest,

    @Query()
    query: PaymentQueryDto,
  ) {
    return this.paymentsService.getMyPayments(
      req.user.sub,
      query,
    );
  }

  // =========================================================
  // RESUMO
  // =========================================================
  //
  // GET /payments/mine/summary
  //
  // Exemplo:
  //
  // {
  //   totalPaid: 15000,
  //   byType: {
  //     promotions: 10000,
  //     verification: 3000,
  //     nationalRanking: 2000,
  //     other: 0
  //   }
  // }
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Get('mine/summary')
  async mineSummary(
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.paymentsService
      .getMyPaymentSummary(
        req.user.sub,
      );
  }

  // =========================================================
  // PAGAMENTO INDIVIDUAL
  // =========================================================
  //
  // GET /payments/:id
  //
  // Somente o dono do pagamento poderá consultar.
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Req()
    req: AuthenticatedRequest,

    @Param('id')
    paymentId: string,
  ) {
    const payment =
      await this.paymentsService
        .getPaymentById(
          paymentId,
        );

    if (
      payment.userId !==
      req.user.sub
    ) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    return payment;
  }
}