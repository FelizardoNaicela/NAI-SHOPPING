
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // VALIDAR SE O ALVO DA DENÚNCIA EXISTE
  // =====================================================

  private async validateTarget(
    targetType: ReportTargetType,
    targetId: string,
    reporterId: string,
  ) {
    switch (targetType) {
      case ReportTargetType.STORE: {
        const store = await this.prisma.store.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            isActive: true,
          },
        });

        if (!store) {
          throw new NotFoundException(
            'A banca que pretendes denunciar não foi encontrada.',
          );
        }

        return;
      }

      case ReportTargetType.PRODUCT: {
        const product = await this.prisma.product.findUnique({
          where: { id: targetId },
          select: {
            id: true,
          },
        });

        if (!product) {
          throw new NotFoundException(
            'O produto que pretendes denunciar não foi encontrado.',
          );
        }

        return;
      }

      case ReportTargetType.POST: {
        const post = await this.prisma.post.findUnique({
          where: { id: targetId },
          select: {
            id: true,
          },
        });

        if (!post) {
          throw new NotFoundException(
            'A publicação que pretendes denunciar não foi encontrada.',
          );
        }

        return;
      }

      case ReportTargetType.USER: {
        if (targetId === reporterId) {
          throw new BadRequestException(
            'Não podes denunciar a tua própria conta.',
          );
        }

        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            deletedAt: true,
          },
        });

        if (!user || user.deletedAt) {
          throw new NotFoundException(
            'O utilizador que pretendes denunciar não foi encontrado.',
          );
        }

        return;
      }

      default:
        throw new BadRequestException(
          'Tipo de denúncia inválido.',
        );
    }
  }

  // =====================================================
  // CRIAR DENÚNCIA
  // =====================================================

  async createReport(
    reporterId: string,
    dto: CreateReportDto,
  ) {
    const targetId = dto.targetId?.trim();

    if (!targetId) {
      throw new BadRequestException(
        'O conteúdo que pretendes denunciar é obrigatório.',
      );
    }

    const description = dto.description?.trim();

    if (description && description.length > 2000) {
      throw new BadRequestException(
        'A descrição não pode ultrapassar 2000 caracteres.',
      );
    }

    // Confirmar que o utilizador que denuncia existe.
    const reporter = await this.prisma.user.findUnique({
      where: { id: reporterId },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!reporter || reporter.deletedAt) {
      throw new NotFoundException(
        'A tua conta não foi encontrada.',
      );
    }

    // Confirmar que o conteúdo denunciado existe.
    await this.validateTarget(
      dto.targetType,
      targetId,
      reporterId,
    );

    // Impedir outra denúncia pendente do mesmo utilizador
    // para o mesmo conteúdo.
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reporterId,
        targetType: dto.targetType,
        targetId,
        status: {
          in: [
            ReportStatus.PENDING,
            ReportStatus.UNDER_REVIEW,
          ],
        },
      },
      select: {
        id: true,
      },
    });

    if (existingReport) {
      throw new ConflictException(
        'Já tens uma denúncia pendente para este conteúdo.',
      );
    }

    // Registar a denúncia.
    // Nenhuma banca, publicação, produto ou conta
    // será suspensa automaticamente.
    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId,
        reason: dto.reason,
        description: description || null,
        status: ReportStatus.PENDING,
      },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });
  }

  // =====================================================
  // LISTAR AS MINHAS DENÚNCIAS
  // =====================================================

  async getMyReports(
    reporterId: string,
    page = 1,
    limit = 20,
  ) {
    const safePage = Math.max(
      1,
      Math.floor(Number(page) || 1),
    );

    const safeLimit = Math.min(
      50,
      Math.max(1, Math.floor(Number(limit) || 20)),
    );

    const where = {
      reporterId,
    };

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        select: {
          id: true,
          targetType: true,
          targetId: true,
          reason: true,
          description: true,
          status: true,
          reviewNotes: true,
          createdAt: true,
          reviewedAt: true,
        },
      }),

      this.prisma.report.count({
        where,
      }),
    ]);

    return {
      reports,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}
