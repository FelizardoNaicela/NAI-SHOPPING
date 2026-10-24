
import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  PaymentGateway,
  PaymentGatewayCheckoutRequest,
  PaymentGatewayCheckoutResponse,
  PaymentGatewayVerificationResponse,
} from "./payment-gateway.interface";

type MockPaymentRecord = {
  paymentId: string;
  reference: string;
  amount: number;
  currency: string;
  description?: string;
  status: "PENDING" | "PAID" | "FAILED";
  metadata?: Record<string, unknown>;
  createdAt: Date;
  paidAt?: Date;
};

@Injectable()
export class MockPaymentGateway
  implements PaymentGateway
{
  readonly providerName = "MOCK";

  private readonly payments = new Map<
    string,
    MockPaymentRecord
  >();

  /**
   * Cria um checkout de desenvolvimento.
   *
   * Não existe qualquer comunicação com um banco,
   * operadora móvel ou provedor externo.
   */
  async createCheckout(
    request: PaymentGatewayCheckoutRequest,
  ): Promise<PaymentGatewayCheckoutResponse> {
    const existingPayment =
      this.findByPaymentId(
        request.paymentId,
      );

    if (existingPayment) {
      return this.toCheckoutResponse(
        existingPayment,
      );
    }

    const reference =
      this.generateReference();

    const payment: MockPaymentRecord = {
      paymentId: request.paymentId,
      reference,
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      status: "PENDING",
      metadata: request.metadata,
      createdAt: new Date(),
    };

    this.payments.set(
      reference,
      payment,
    );

    return this.toCheckoutResponse(
      payment,
    );
  }

  /**
   * Consulta o estado de um pagamento simulado.
   */
  async verifyPayment(
    reference: string,
  ): Promise<PaymentGatewayVerificationResponse> {
    const payment =
      this.getPaymentOrThrow(reference);

    return {
      reference: payment.reference,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      metadata: payment.metadata,
    };
  }

  /**
   * Confirma manualmente um pagamento simulado.
   *
   * Este método serve apenas para testes locais.
   *
   * Não deve ser exposto através de um
   * endpoint público.
   */
  confirmPayment(
    reference: string,
  ): MockPaymentRecord {
    const payment =
      this.getPaymentOrThrow(reference);

    if (payment.status === "FAILED") {
      throw new Error(
        "Não é possível confirmar um pagamento que falhou.",
      );
    }

    /**
     * Operação idempotente:
     * se já estiver pago, não altera paidAt.
     */
    if (payment.status === "PAID") {
      return payment;
    }

    payment.status = "PAID";
    payment.paidAt = new Date();

    this.payments.set(
      payment.reference,
      payment,
    );

    return payment;
  }

  /**
   * Marca manualmente um pagamento simulado
   * como falhado.
   *
   * Este método serve apenas para testes locais.
   */
  failPayment(
    reference: string,
  ): MockPaymentRecord {
    const payment =
      this.getPaymentOrThrow(reference);

    if (payment.status === "PAID") {
      throw new Error(
        "Não é possível marcar como falhado um pagamento já pago.",
      );
    }

    payment.status = "FAILED";

    this.payments.set(
      payment.reference,
      payment,
    );

    return payment;
  }

  /**
   * Procura um pagamento simulado pela referência.
   *
   * Utilizado apenas durante o desenvolvimento.
   */
  getPaymentByReference(
    reference: string,
  ): MockPaymentRecord | undefined {
    const normalizedReference =
      reference.trim();

    return this.payments.get(
      normalizedReference,
    );
  }

  /**
   * Lista os pagamentos simulados.
   *
   * Útil durante o desenvolvimento e debugging.
   */
  getAllPayments(): MockPaymentRecord[] {
    return Array.from(
      this.payments.values(),
    );
  }

  /**
   * Procura um pagamento através do ID interno
   * do SitePayment.
   */
  private findByPaymentId(
    paymentId: string,
  ): MockPaymentRecord | undefined {
    return Array.from(
      this.payments.values(),
    ).find(
      (payment) =>
        payment.paymentId === paymentId,
    );
  }

  /**
   * Obtém um pagamento ou lança um erro.
   */
  private getPaymentOrThrow(
    reference: string,
  ): MockPaymentRecord {
    const normalizedReference =
      reference.trim();

    const payment =
      this.payments.get(
        normalizedReference,
      );

    if (!payment) {
      throw new NotFoundException(
        "Pagamento simulado não encontrado.",
      );
    }

    return payment;
  }

  /**
   * Converte o registo interno para a resposta
   * esperada pelo PaymentGateway.
   */
  private toCheckoutResponse(
    payment: MockPaymentRecord,
  ): PaymentGatewayCheckoutResponse {
    return {
      provider: this.providerName,
      reference: payment.reference,
      checkoutUrl: null,
      instructions:
        `Pagamento de desenvolvimento. ` +
        `Utilize a referência: ${payment.reference}`,
      status: payment.status,
      metadata: payment.metadata,
    };
  }

  /**
   * Gera uma referência legível para testes.
   */
  private generateReference(): string {
    const randomPart =
      Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

    return `MOCK-${Date.now()}-${randomPart}`;
  }
}