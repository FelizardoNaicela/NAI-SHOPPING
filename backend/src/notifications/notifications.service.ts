import { PrismaService } from '../prisma/prisma.service';
 import { NotificationsGateway } from './notifications.gateway';
import { NotificationMetaMap } from './notification-meta.types';
import {
  Prisma,
  Notification,
  ReportStatus,
  ReportTargetType,
} from '@prisma/client';
import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private gateway: NotificationsGateway,

  ) {}

  // 🔔 criar notificação (AGORA COM META)
 async create<T extends keyof NotificationMetaMap>(
  userId: string,
  type: T,
  message: string,
  meta: NotificationMetaMap[T],
) {
  // 🛡️ Guardrail de segurança
  if (type === 'NEW_PRODUCT') {
    const typedMeta = meta as NotificationMetaMap['NEW_PRODUCT'];

    if (!typedMeta.storeId) {
      throw new Error('NEW_PRODUCT precisa de storeId');
    }
  }

  const notification = await this.prisma.notification.create({
    data: {
      userId,
      type,
      message,
      meta,
    },
  });

  this.gateway.notifyUser(userId, notification);
  await this.emitUnreadCount(userId);

  return notification;
}




  // listar notificações do usuário
  findMy(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // contar não lidas
  countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  // marcar UMA como lida
  async markAsRead(notificationId: string, userId: string) {
  await this.prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      read: false,
    },
    data: { read: true },
  });

  await this.cleanupOldReadNotifications(userId);
  await this.cleanupReadLimit(userId);

  await this.emitUnreadCount(userId);
}


  // marcar TODAS como lidas
 async markAllAsRead(userId: string) {
  await this.prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  await this.cleanupOldReadNotifications(userId);
  await this.cleanupReadLimit(userId);

  this.gateway.emitUnreadCount(userId, 0);

  return { success: true };
}

  // 🔔 método central de contador
  private async emitUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    this.gateway.emitUnreadCount(userId, unreadCount);
  }

  async delete(notificationId: string, userId: string) {
  await this.prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });

  // 🔔 atualizar contador
  await this.emitUnreadCount(userId);

  return { success: true };
}

async cleanupOldReadNotifications(userId: string) {
  const THIRTY_DAYS_AGO = new Date();
  THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

  await this.prisma.notification.deleteMany({
    where: {
      userId,
      read: true,
      createdAt: {
        lt: THIRTY_DAYS_AGO,
      },
    },
  });
}

async cleanupReadLimit(userId: string, limit = 50) {
  const readNotifications = await this.prisma.notification.findMany({
    where: {
      userId,
      read: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: limit, // tudo depois das N mais recentes
    select: {
      id: true,
    },
  });

  if (readNotifications.length === 0) return;

  await this.prisma.notification.deleteMany({
    where: {
      id: {
        in: readNotifications.map(n => n.id),
      },
    },
  });
}

async deleteAllRead(userId: string) {
  await this.prisma.notification.deleteMany({
    where: {
      userId,
      read: true,
    },
  });

  await this.emitUnreadCount(userId);

  return { success: true };
}

private async canNotify(
  userId: string,
  type: 'newProduct' | 'bancaFollowed' | 'system',
  channel: 'inApp' | 'email' | 'whatsapp',
): Promise<boolean> {
  const prefs = await this.prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!prefs) {
    // fallback seguro (default do sistema)
    return channel === 'inApp';
  }

  if (!prefs[type]) return false;
  if (!prefs[channel]) return false;

  return true;
}

async notifyNewProductToFollowers(
  storeId: string,
  productId: string,
  productName: string,
) {
  const store = await this.prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      followers: {
        select: { userId: true },
      },
    },
  });

  if (!store) return;

  for (const follower of store.followers) {
    if (follower.userId === store.ownerId) continue;

    const canInApp = await this.canNotify(
      follower.userId,
      'newProduct',
      'inApp',
    );

    if (!canInApp) continue;

    await this.create(
      follower.userId,
      'NEW_PRODUCT',
      `Novo produto na banca ${store.name}`,
      {
        storeId: store.id,
        storeName: store.name,
        productId,
        productName,
      },
    );
  }
}

async markManyAsRead(
  ids: string[],
  userId: string,
) {
  await this.prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  await this.cleanupOldReadNotifications(userId);
  await this.cleanupReadLimit(userId);

  await this.emitUnreadCount(userId);
}

async notifyNewReview(
  storeId: string,
  reviewerId: string,
  rating: number,
) {
  const store = await this.prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  const user = await this.prisma.user.findUnique({
    where: { id: reviewerId },
    select: { name: true },
  });

  if (!store) return;

  await this.create(
    store.ownerId,
    'NEW_REVIEW',
    `Nova avaliação na tua banca`,
    {
      storeId: store.id,
      storeName: store.name,
      reviewerId,
      reviewerName: user?.name ?? undefined,
      rating,
    },
  );
}

async getNotificationDetails(
  notificationId: string,
  userId: string,
) {
  // 1. Confirmar que a notificação pertence ao utilizador.
  const notification = await this.prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new NotFoundException('Notificação não encontrada.');
  }

  // A meta é apenas uma referência para localizar os registos.
  // Nunca será utilizada como prova de autorização.
  const meta =
    notification.meta &&
    typeof notification.meta === 'object' &&
    !Array.isArray(notification.meta)
      ? (notification.meta as Record<string, unknown>)
      : {};

  // 2. Notificações de resolução ou rejeição da denúncia.
  if (
    notification.type === 'REPORT_RESOLVED' ||
    notification.type === 'REPORT_REJECTED'
  ) {
    const reportId = meta.reportId;

    if (typeof reportId !== 'string') {
      throw new NotFoundException('Detalhes não encontrados.');
    }

    const report = await this.prisma.report.findFirst({
      where: {
        id: reportId,
        reporterId: userId,
        status: {
          in: [ReportStatus.RESOLVED, ReportStatus.REJECTED],
        },
      },
      select: {
        id: true,
        targetType: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Detalhes não encontrados.');
    }

    return {
      notificationId: notification.id,
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt,

      report: {
        id: report.id,
        targetType: report.targetType,
        status: report.status,
        createdAt: report.createdAt,
        reviewedAt: report.reviewedAt,
      },
    };
  }

  // 3. Notificações de medidas administrativas.
  const administrativeTypes = [
    'ADMIN_WARNING',
    'CONTENT_REMOVED',
    'ADMIN_SUSPENSION',
    'ADMIN_ACTION_REVERSED',
    'ADMIN_SUSPENSION_EXPIRED',
  ];

  if (administrativeTypes.includes(notification.type)) {
    const actionId = meta.administrativeActionId;

    if (typeof actionId !== 'string') {
      throw new NotFoundException('Detalhes não encontrados.');
    }

    const action =
      await this.prisma.administrativeAction.findUnique({
        where: {
          id: actionId,
        },
        select: {
          id: true,
          reportId: true,
          targetType: true,
          targetId: true,
          type: true,
          status: true,
          startsAt: true,
          endsAt: true,
          reversedAt: true,
          createdAt: true,
          report: {
            select: {
              id: true,
              targetType: true,
              targetId: true,
            },
          },
        },
      });

    if (
      !action ||
      action.reportId !== meta.reportId ||
      action.report.id !== action.reportId ||
      action.targetType !== action.report.targetType ||
      action.targetId !== action.report.targetId ||
      action.targetType !== meta.targetType ||
      action.targetId !== meta.targetId
    ) {
      throw new NotFoundException('Detalhes não encontrados.');
    }

    // 4. Confirmar quem é o destinatário legítimo da medida.
    let authorized = false;
    let storeName: string | null = null;
    let removedContent: any = null;
let contentLink: string | null = null;

    if (action.targetType === ReportTargetType.USER) {
      authorized = action.targetId === userId;
    }

    if (action.targetType === ReportTargetType.STORE) {
      const store = await this.prisma.store.findUnique({
        where: {
          id: action.targetId,
        },
        select: {
          ownerId: true,
          name: true,
        },
      });

      if (store) {
        authorized = store.ownerId === userId;
        storeName = store.name;
      }
    }

    if (
      action.targetType === ReportTargetType.PRODUCT ||
      action.targetType === ReportTargetType.POST
    ) {
      const store = await this.prisma.store.findFirst({
        where:
          action.targetType === ReportTargetType.PRODUCT
            ? {
                products: {
                  some: {
                    id: action.targetId,
                  },
                },
              }
            : {
                posts: {
                  some: {
                    id: action.targetId,
                  },
                },
              },
        select: {
          ownerId: true,
          name: true,
        },
      });

      if (store) {
        authorized = store.ownerId === userId;
        storeName = store.name;
      }
    }

    if (!authorized) {
      throw new NotFoundException('Detalhes não encontrados.');
    }

   if (
  action.type === 'CONTENT_REMOVAL' &&
  action.targetType === ReportTargetType.POST
) {
  const post = await this.prisma.post.findUnique({
    where: { id: action.targetId },
    select: {
      id: true,
      content: true,
      type: true,
      createdAt: true,
      isActive: true,
      images: {
        orderBy: { order: 'asc' },
        select: {
          url: true,
          order: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  if (post) {
    removedContent = {
      kind: 'POST',
      id: post.id,
      text: post.content,
      type: post.type,
      createdAt: post.createdAt,
      images: post.images.map(image => image.url),
      product: post.product,
    };

    if (post.isActive) {
      contentLink = `/post/${post.id}`;
    }
  }
}

if (
  action.type === 'CONTENT_REMOVAL' &&
  action.targetType === ReportTargetType.PRODUCT
) {
  const product = await this.prisma.product.findUnique({
    where: { id: action.targetId },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      createdAt: true,
      isPublished: true,
      images: {
        where: { isDeleted: false },
        orderBy: { order: 'asc' },
        select: {
          originalUrl: true,
          largeUrl: true,
          mediumUrl: true,
          thumbUrl: true,
          webpUrl: true,
          isCover: true,
          order: true,
        },
      },
    },
  });

  if (product) {
    removedContent = {
      kind: 'PRODUCT',
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
      images: product.images,
    };

    if (product.isPublished) {
      contentLink = `/product/${product.id}`;
    }
  }
}

    // 5. Devolver apenas informação pública da medida.
    return {
  notificationId: notification.id,
  type: notification.type,
  message: notification.message,
  createdAt: notification.createdAt,

  administrativeAction: {
    id: action.id,
    type: action.type,
    status: action.status,
    targetType: action.targetType,
    targetId: action.targetId,
    startsAt: action.startsAt,
    endsAt: action.endsAt,
    reversedAt: action.reversedAt,
    createdAt: action.createdAt,
    storeName,
  },

  content: removedContent,
  contentLink,
};
  }

  throw new NotFoundException(
    'Esta notificação não possui uma página de detalhes disponível.',
  );
}

async createInTransaction<T extends keyof NotificationMetaMap>(
  tx: Prisma.TransactionClient,
  userId: string,
  type: T,
  message: string,
  meta: NotificationMetaMap[T],
): Promise<Notification | null> {
  const prefs = await tx.notificationPreference.findUnique({
    where: { userId },
  });

  // Respeita as preferências de notificações do utilizador.
  if (prefs && (!prefs.system || !prefs.inApp)) {
    return null;
  }

  // Sem preferência configurada, mantém o comportamento padrão:
  // permitir notificações dentro da aplicação.
  return tx.notification.create({
    data: {
      userId,
      type,
      message,
      meta: meta as Prisma.InputJsonValue,
    },
  });
}

async emitCreated(
  userId: string,
  notification: Notification | null,
): Promise<void> {
  if (!notification) return;

  // Só emitir depois de a transação que criou a notificação terminar.
  this.gateway.notifyUser(userId, notification);

  await this.emitUnreadCount(userId);
}
}
