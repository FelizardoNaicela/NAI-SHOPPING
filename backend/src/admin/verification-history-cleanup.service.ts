import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  Cron,
  CronExpression,
} from '@nestjs/schedule';

import {
  VerificationRequestStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VerificationHistoryCleanupService {
  private readonly logger =
    new Logger(
      VerificationHistoryCleanupService.name,
    );

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================
  // LIMPEZA AUTOMÁTICA
  // =========================================
  //
  // Executa todos os dias à meia-noite.
  //
  // PENDING:
  // nunca é apagado automaticamente.
  //
  // CANCELLED:
  // mantém por 7 dias.
  //
  // REJECTED:
  // mantém por 30 dias.
  //
  // APPROVED:
  // mantém por 90 dias.
  //
  // IMPORTANTE:
  // Esta limpeza apaga somente o histórico
  // da solicitação.
  //
  // NÃO altera:
  // - Store.verified
  // - Store.verificationType
  // - Store
  // - User
  // =========================================

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupVerificationHistory(): Promise<void> {
    this.logger.log(
      '🧹 Iniciando limpeza do histórico de verificações...',
    );

    try {
      const now =
        new Date();

      // =====================================
      // CANCELADAS
      //
      // CANCELLED não possui reviewedAt,
      // portanto usamos createdAt.
      // =====================================

      const cancelledCutoff =
        new Date(
          now.getTime() -
            7 *
              24 *
              60 *
              60 *
              1000,
        );

      const cancelledResult =
        await this.prisma.verificationRequest.deleteMany({
          where: {
            status:
              VerificationRequestStatus.CANCELLED,

            createdAt: {
              lt: cancelledCutoff,
            },
          },
        });

      // =====================================
      // REJEITADAS
      //
      // REJECTED possui reviewedAt.
      // A retenção começa quando a decisão
      // foi tomada.
      // =====================================

      const rejectedCutoff =
        new Date(
          now.getTime() -
            30 *
              24 *
              60 *
              60 *
              1000,
        );

      const rejectedResult =
        await this.prisma.verificationRequest.deleteMany({
          where: {
            status:
              VerificationRequestStatus.REJECTED,

            reviewedAt: {
              not: null,
              lt: rejectedCutoff,
            },
          },
        });

      // =====================================
      // APROVADAS
      //
      // Mantemos por mais tempo porque são
      // registros históricos importantes.
      // =====================================

      const approvedCutoff =
        new Date(
          now.getTime() -
            90 *
              24 *
              60 *
              60 *
              1000,
        );

      const approvedResult =
        await this.prisma.verificationRequest.deleteMany({
          where: {
            status:
              VerificationRequestStatus.APPROVED,

            reviewedAt: {
              not: null,
              lt: approvedCutoff,
            },
          },
        });

      // =====================================
      // LOG
      // =====================================

      const totalDeleted =
        cancelledResult.count +
        rejectedResult.count +
        approvedResult.count;

      this.logger.log(
        `🧹 Limpeza concluída. ` +
          `Canceladas: ${cancelledResult.count} | ` +
          `Rejeitadas: ${rejectedResult.count} | ` +
          `Aprovadas: ${approvedResult.count} | ` +
          `Total: ${totalDeleted}`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Erro ao limpar histórico de verificações.',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }
}