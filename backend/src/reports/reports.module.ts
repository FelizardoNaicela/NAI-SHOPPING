
import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
  ],
  controllers: [
    ReportsController,
  ],
  providers: [
    ReportsService,
  ],
  exports: [
    ReportsService,
  ],
})
export class ReportsModule {}
