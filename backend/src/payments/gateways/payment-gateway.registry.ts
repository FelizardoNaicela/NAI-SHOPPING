import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import type { PaymentGateway } from "./payment-gateway.interface";

import { MockPaymentGateway } from "./mock-payment.gateway";

@Injectable()
export class PaymentGatewayRegistry {
  constructor(
    private readonly configService: ConfigService,

    private readonly mockPaymentGateway: MockPaymentGateway,
  ) {}

  /**
   * Retorna o gateway configurado no .env.
   */
  getActiveGateway(): PaymentGateway {
    const configuredProvider =
      this.configService
        .get<string>("PAYMENT_PROVIDER")
        ?.trim()
        .toUpperCase() || "MOCK";

    switch (configuredProvider) {
      case "MOCK":
        return this.mockPaymentGateway;

      default:
        throw new BadRequestException(
          `O provedor de pagamento "${configuredProvider}" ainda não está implementado.`,
        );
    }
  }
}