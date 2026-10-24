
import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";

import type {
  PaymentGateway,
  PaymentGatewayCheckoutRequest,
  PaymentGatewayCheckoutResponse,
  PaymentGatewayVerificationResponse,
} from "./payment-gateway.interface";

@Injectable()
export class PaymentGatewayService {
  constructor(
    private readonly gateway: PaymentGateway,
  ) {}

  /**
   * Retorna o nome do provedor ativo.
   */
  getProviderName(): string {
    return this.gateway.providerName
      .trim()
      .toUpperCase();
  }

  /**
   * Cria um checkout no provedor configurado.
   */
  async createCheckout(
    request: PaymentGatewayCheckoutRequest,
  ): Promise<PaymentGatewayCheckoutResponse> {
    const normalizedRequest =
      this.validateCheckoutRequest(request);

    const response =
      await this.gateway.createCheckout(
        normalizedRequest,
      );

    this.validateCheckoutResponse(response);

    return response;
  }

  /**
   * Consulta o estado de um pagamento no provedor.
   */
  async verifyPayment(
    reference: string,
  ): Promise<PaymentGatewayVerificationResponse> {
    const normalizedReference =
      reference?.trim();

    if (!normalizedReference) {
      throw new BadRequestException(
        "A referência do pagamento é obrigatória.",
      );
    }

    const response =
      await this.gateway.verifyPayment(
        normalizedReference,
      );

    this.validateVerificationResponse(
      response,
    );

    return response;
  }

  /**
   * Valida e normaliza os dados básicos
   * antes de criar o checkout.
   */
  private validateCheckoutRequest(
    request: PaymentGatewayCheckoutRequest,
  ): PaymentGatewayCheckoutRequest {
    if (!request) {
      throw new BadRequestException(
        "Os dados do checkout são obrigatórios.",
      );
    }

    const paymentId =
      request.paymentId?.trim();

    if (!paymentId) {
      throw new BadRequestException(
        "O ID do pagamento é obrigatório.",
      );
    }

    if (
      !Number.isInteger(request.amount) ||
      request.amount <= 0
    ) {
      throw new BadRequestException(
        "O valor do pagamento deve ser um inteiro positivo.",
      );
    }

    const currency =
      request.currency
        ?.trim()
        .toUpperCase();

    if (!currency) {
      throw new BadRequestException(
        "A moeda do pagamento é obrigatória.",
      );
    }

    return {
      ...request,

      paymentId,

      currency,
    };
  }

  /**
   * Valida a resposta recebida ao criar checkout.
   */
  private validateCheckoutResponse(
    response: PaymentGatewayCheckoutResponse,
  ): void {
    if (!response) {
      throw new BadRequestException(
        "O provedor não devolveu uma resposta válida.",
      );
    }

    if (!response.provider?.trim()) {
      throw new BadRequestException(
        "A resposta do provedor não contém o nome do provedor.",
      );
    }

    if (!response.reference?.trim()) {
      throw new BadRequestException(
        "A resposta do provedor não contém uma referência.",
      );
    }

    if (
      !response.status ||
      ![
        "PENDING",
        "PAID",
        "FAILED",
      ].includes(response.status)
    ) {
      throw new BadRequestException(
        "O provedor devolveu um estado de pagamento inválido.",
      );
    }
  }

  /**
   * Valida a resposta recebida ao consultar
   * o estado de um pagamento.
   */
  private validateVerificationResponse(
    response: PaymentGatewayVerificationResponse,
  ): void {
    if (!response) {
      throw new BadRequestException(
        "O provedor não devolveu uma resposta válida.",
      );
    }

    if (!response.reference?.trim()) {
      throw new BadRequestException(
        "A resposta do provedor não contém uma referência.",
      );
    }

    if (
      !response.status ||
      ![
        "PENDING",
        "PAID",
        "FAILED",
      ].includes(response.status)
    ) {
      throw new BadRequestException(
        "O provedor devolveu um estado de pagamento inválido.",
      );
    }

    if (
      response.amount !== undefined &&
      (
        !Number.isInteger(response.amount) ||
        response.amount <= 0
      )
    ) {
      throw new BadRequestException(
        "O provedor devolveu um valor de pagamento inválido.",
      );
    }

    if (
      response.currency !== undefined &&
      !response.currency.trim()
    ) {
      throw new BadRequestException(
        "O provedor devolveu uma moeda inválida.",
      );
    }
  }
}