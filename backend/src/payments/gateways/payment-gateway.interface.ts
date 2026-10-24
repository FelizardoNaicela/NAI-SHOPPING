
export type PaymentGatewayStatus =
  | "PENDING"
  | "PAID"
  | "FAILED";

export type PaymentGatewayCheckoutRequest = {
  paymentId: string;

  amount: number;

  currency: string;

  description?: string;

  customerName?: string;

  customerEmail?: string;

  metadata?: Record<string, unknown>;
};

export type PaymentGatewayCheckoutResponse = {
  /**
   * Nome do provedor utilizado.
   *
   * Exemplos:
   * - MOCK
   * - MPESA
   * - EMOLA
   */
  provider: string;

  /**
   * Referência utilizada para consultar
   * o pagamento no provedor.
   */
  reference: string;

  /**
   * URL de checkout, quando o provedor disponibilizar.
   */
  checkoutUrl?: string | null;

  /**
   * Instruções para o utilizador,
   * quando forem necessárias.
   */
  instructions?: string | null;

  /**
   * Estado atual devolvido pelo gateway.
   */
  status: PaymentGatewayStatus;

  /**
   * Dados adicionais devolvidos pelo gateway.
   */
  metadata?: Record<string, unknown>;
};

export type PaymentGatewayVerificationResponse = {
  /**
   * Referência consultada no provedor.
   */
  reference: string;

  /**
   * Estado atual do pagamento no provedor.
   */
  status: PaymentGatewayStatus;

  /**
   * Valor confirmado pelo provedor.
   *
   * Deve ser comparado com SitePayment.amount.
   */
  amount?: number;

  /**
   * Moeda devolvida pelo provedor.
   *
   * Deve ser comparada com SitePayment.currency.
   */
  currency?: string;

  /**
   * Dados adicionais da consulta.
   */
  metadata?: Record<string, unknown>;
};

export interface PaymentGateway {
  /**
   * Identificador estável do gateway.
   *
   * Exemplos:
   * - MOCK
   * - MPESA
   * - EMOLA
   */
  readonly providerName: string;

  /**
   * Cria uma solicitação de pagamento no provedor.
   */
  createCheckout(
    request: PaymentGatewayCheckoutRequest,
  ): Promise<PaymentGatewayCheckoutResponse>;

  /**
   * Consulta o estado de um pagamento no provedor.
   */
  verifyPayment(
    reference: string,
  ): Promise<PaymentGatewayVerificationResponse>;
}