import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { NotificationMetaMap } from './notification-meta.types';

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
}
