import { Module } from '@nestjs/common';

import { AdminController } from './admin.controller';

import { AdminService } from './admin.service';

import { AdminGuard } from './admin.guard';

import { PermissionGuard } from './permission.guard';

import { PrismaModule } from '../prisma/prisma.module';

import { VerificationController } from './verification.controller';

import { VerificationService } from './verification.service';

import { VerificationHistoryCleanupService } from './verification-history-cleanup.service';
import {
  PaymentsModule,
} from '../payments/payments.module';

@Module({

  imports: [
    PrismaModule,
    PaymentsModule,
  ],

  controllers: [
    AdminController,
    VerificationController,
  ],

  providers: [
    AdminService,
    AdminGuard,
    PermissionGuard,
    VerificationService,
    VerificationHistoryCleanupService,
  ],

  exports: [
    AdminService,
    AdminGuard,
    PermissionGuard,
  ],

})

export class AdminModule {}