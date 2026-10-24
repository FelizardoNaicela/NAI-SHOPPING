import { Module } from "@nestjs/common";

import { PromotionsController } from "./promotions.controller";

import { PromotionsService } from "./promotions.service";

import { PrismaService } from "../prisma/prisma.service";

import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [
    PaymentsModule,
  ],

  controllers: [
    PromotionsController,
  ],

  providers: [
    PromotionsService,
    PrismaService,
  ],

  exports: [
    PromotionsService,
  ],
})
export class PromotionsModule {}