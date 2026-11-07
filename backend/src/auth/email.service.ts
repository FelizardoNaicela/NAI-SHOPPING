
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY não está configurada. O envio de emails não estará disponível.',
      );
    }

    this.resend = new Resend(apiKey || 're_missing_api_key');
  }

  // =====================================================
  // ENVIAR CÓDIGO DE RECUPERAÇÃO DE SENHA
  // =====================================================

  async sendPasswordResetCode(
    email: string,
    code: string,
  ) {
    const from = process.env.EMAIL_FROM;

    if (!process.env.RESEND_API_KEY || !from) {
      throw new InternalServerErrorException(
        'O serviço de envio de emails não está configurado.',
      );
    }

    const { error } = await this.resend.emails.send({
      from,
      to: email,
      subject: 'Recuperação de senha — NAI-SHOPPING',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #111827; padding: 20px;">

          <h2>Recuperação de senha</h2>

          <p>
            Recebemos um pedido para alterar a senha da tua conta
            no NAI-SHOPPING.
          </p>

          <p>
            Introduz o código abaixo na aplicação para definires
            uma nova senha:
          </p>

          <div style="
            display: inline-block;
            padding: 14px 22px;
            background: #f3f4f6;
            border-radius: 8px;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #111827;
          ">
            ${code}
          </div>

          <p style="margin-top: 24px;">
            Este código é válido durante <strong>10 minutos</strong>.
          </p>

          <p style="font-size: 13px; color: #6b7280;">
            Se não solicitaste a recuperação da tua senha,
            ignora esta mensagem. A tua conta continuará protegida.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 30px;" />

          <p style="font-size: 12px; color: #9ca3af;">
            NAI-SHOPPING — Marketplace
          </p>

        </div>
      `,
    });

    if (error) {
      this.logger.error(
        `Falha ao enviar código de recuperação: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Não foi possível enviar o email de recuperação.',
      );
    }

    this.logger.log(
      `Código de recuperação enviado para ${email}`,
    );
  }
}
