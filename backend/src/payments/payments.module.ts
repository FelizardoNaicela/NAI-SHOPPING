import {
  Module,
} from "@nestjs/common";

import { PaymentsController } from "./payments.controller";

import { PaymentsService } from "./payments.service";

import { PaymentGatewayService } from "./gateways/payment-gateway.service";

import { PaymentGatewayRegistry } from "./gateways/payment-gateway.registry";

import { MockPaymentGateway } from "./gateways/mock-payment.gateway";

import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    PaymentsController,
  ],

  providers: [
    PaymentsService,

    MockPaymentGateway,

    PaymentGatewayRegistry,

    {
      provide: PaymentGatewayService,

      useFactory: (
        paymentGatewayRegistry: PaymentGatewayRegistry,
      ) => {
        const activeGateway =
          paymentGatewayRegistry.getActiveGateway();

        return new PaymentGatewayService(
          activeGateway,
        );
      },

      inject: [
        PaymentGatewayRegistry,
      ],
    },
  ],

  exports: [
    PaymentsService,

    PaymentGatewayService,

    PaymentGatewayRegistry,

    MockPaymentGateway,
  ],
})
export class PaymentsModule {}