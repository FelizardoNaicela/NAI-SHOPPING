import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowsService {
constructor(
  private prisma: PrismaService,
  private notificationsService: NotificationsService, // 👈 ADD
) {}
  async followStore(userId: string, storeId: string) {
  try {
    const follow = await this.prisma.storeFollow.create({
      data: {
        userId,
        storeId,
      },
    });

    // 🔥 buscar dados
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (store && user && store.ownerId !== userId) {
      await this.notificationsService.create(
        store.ownerId,
        'STORE_FOLLOWED',
        `${user.name || 'Alguém'} começou a seguir tua banca`,
        {
          followerId: user.id,
          followerName: user.name ?? undefined,
          storeId: store.id,
          storeName: store.name,
        },
      );
    }

    return follow;
  } catch {
    throw new BadRequestException('Já segue esta banca');
  }
}

async unfollowStore(userId: string, storeId: string) {
  await this.prisma.storeFollow.deleteMany({
    where: {
      userId,
      storeId,
    },
  });

  return { success: true };
}

async myFollows(userId: string) {
  return this.prisma.storeFollow.findMany({
    where: { userId },
    include: {
      store: true,
    },
  });
}
}
