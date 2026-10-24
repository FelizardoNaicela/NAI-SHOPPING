import {
  PaymentType,
} from '@prisma/client';

export class CreatePaymentDto {
  type!: PaymentType;

  amount!: number;

  currency?: string;

  description?: string;

  /**
   * Referência externa do pagamento.
   *
   * Exemplo futuro:
   * - ID da transação M-Pesa
   * - referência bancária
   * - ID do pagamento do gateway
   */
  reference?: string;

  /**
   * Provedor utilizado.
   *
   * Exemplos futuros:
   * MPESA
   * EMOLA
   * CARD
   * BANK_TRANSFER
   */
  provider?: string;

  /**
   * Relações opcionais.
   *
   * Apenas uma delas normalmente será
   * utilizada de acordo com o tipo de pagamento.
   */
  promotionId?: string;

  rankingAuctionId?: string;

  verificationRequestId?: string;

metadata?: Record<string, unknown>;
}