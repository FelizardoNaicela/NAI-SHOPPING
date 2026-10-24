import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getByUser(userId: string) {
  if (!userId) {
    throw new Error('userId ausente no contexto de autenticação');
  }

  return this.prisma.notificationPreference.findFirst({
    where: { userId },
  });
}

  async update(
  userId: string,
  data: {
    newProduct?: boolean;
    bancaFollowed?: boolean;
    system?: boolean;
    inApp?: boolean;
    email?: boolean;
    whatsapp?: boolean;
  },
) {
  return this.prisma.notificationPreference.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      newProduct: data.newProduct ?? true,
      bancaFollowed: data.bancaFollowed ?? true,
      system: data.system ?? true,
      inApp: data.inApp ?? true,
      email: data.email ?? false,
      whatsapp: data.whatsapp ?? false,
    },
  });
}
}
