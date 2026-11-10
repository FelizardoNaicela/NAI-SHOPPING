
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AdminRole,
  AdminStatus,
  Notification,
  Prisma,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly notificationsService: NotificationsService,
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
   // =====================================================
// REGISTAR DENÚNCIA E CRIAR NOTIFICAÇÕES
// NA MESMA TRANSAÇÃO
// =====================================================

const result = await this.prisma.$transaction(
  async (tx) => {
    const report = await tx.report.create({
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

    const notifications =
      await this.notifyReportManagers(
        tx,
        report.id,
        reporterId,
        dto.targetType,
        targetId,
      );

    return {
      report,
      notifications,
    };
  },
);

// =====================================================
// EMITIR WEBSOCKET SOMENTE DEPOIS DO COMMIT
// =====================================================

await Promise.all(
  result.notifications.map((item) =>
    this.notificationsService.emitCreated(
      item.userId,
      item.notification,
    ),
  ),
);

return result.report;
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

  // =====================================================
// OBTER A BANCA ASSOCIADA AO ALVO DA DENÚNCIA
// =====================================================

private async getTargetStore(
  tx: Prisma.TransactionClient,
  targetType: ReportTargetType,
  targetId: string,
) {
  const storeSelect = {
    id: true,
    countryCode: true,
    region: true,
    regionalManagementLocked: true,
  } as const;

  if (targetType === ReportTargetType.STORE) {
    return tx.store.findUnique({
      where: { id: targetId },
      select: storeSelect,
    });
  }

  if (targetType === ReportTargetType.PRODUCT) {
    const product = await tx.product.findUnique({
      where: { id: targetId },
      select: {
        store: {
          select: storeSelect,
        },
      },
    });

    return product?.store ?? null;
  }

  if (targetType === ReportTargetType.POST) {
    const post = await tx.post.findUnique({
      where: { id: targetId },
      select: {
        store: {
          select: storeSelect,
        },
      },
    });

    return post?.store ?? null;
  }

  return null;
}

// =====================================================
// NOTIFICAR ADMINISTRADORES QUE PODEM GERIR A DENÚNCIA
// =====================================================

// =====================================================
// NOTIFICAR ADMINISTRADORES QUE PODEM GERIR A DENÚNCIA
// =====================================================

private async notifyReportManagers(
  tx: Prisma.TransactionClient,
  reportId: string,
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
) {
  const isUserReport =
    targetType === ReportTargetType.USER;

  const targetStore = isUserReport
    ? null
    : await this.getTargetStore(
        tx,
        targetType,
        targetId,
      );

  if (!isUserReport && !targetStore) {
    return [];
  }

  const regionalAdminCondition =
    !isUserReport &&
    !targetStore!.regionalManagementLocked
      ? [
          {
            adminRole: AdminRole.REGIONAL_ADMIN,
            canManageReports: true,
            region: targetStore!.region,
            user: {
              countryCode: {
                equals: targetStore!.countryCode,
                mode: 'insensitive' as const,
              },
            },
          },
        ]
      : [];

  const admins = await tx.adminProfile.findMany({
    where: {
      status: AdminStatus.ACTIVE,
      OR: [
        {
          adminRole: AdminRole.SUPER_ADMIN,
        },
        ...regionalAdminCondition,
      ],
    },
    select: {
      userId: true,
    },
  });

  // O tipo explícito resolve o erro never[].
  const notifications: {
    userId: string;
    notification: Notification;
  }[] = [];

  for (const admin of admins) {
    // Não notificar o próprio denunciante.
    if (admin.userId === reporterId) {
      continue;
    }

    const notification =
      await this.notificationsService.createInTransaction(
        tx,
        admin.userId,
        'NEW_REPORT',
        'Foi recebida uma nova denúncia que precisa de análise.',
        {
          reportId,
          targetType,
        },
      );

    if (notification) {
      notifications.push({
        userId: admin.userId,
        notification,
      });
    }
  }

  return notifications;
}
}
