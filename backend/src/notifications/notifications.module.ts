import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationPreferencesService } from './notifications-preferences.service';
import { NotificationPreferencesController } from './notifications-preferences.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule,
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationPreferencesService,
  ],
  controllers: [
    NotificationsController,
    NotificationPreferencesController,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
