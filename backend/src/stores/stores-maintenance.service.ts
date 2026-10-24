import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoresMaintenanceService {
  constructor(private prisma: PrismaService) {}

  async deactivateInactiveStores(days = 30) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);

    const result = await this.prisma.store.updateMany({
      where: {
        isActive: true,
        OR: [
          { lastActivity: null },
          { lastActivity: { lt: limitDate } },
        ],
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  }
}
