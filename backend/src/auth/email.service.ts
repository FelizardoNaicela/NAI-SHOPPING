
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

  async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    verificationCode: string,
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
      subject: 'Confirma o teu email — NAI-SHOPPING',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #111827;">
          <h2>Confirma o teu email</h2>

          <p>Utiliza o botão ou o código abaixo para confirmar o teu endereço.</p>

          <p>
            <a href="${verificationUrl}"
               style="display: inline-block; padding: 12px 20px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Confirmar email
            </a>
          </p>

          <p style="margin-top: 24px;">Ou introduz este código:</p>

          <div style="display: inline-block; padding: 14px 22px; background: #f3f4f6; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 8px;">
            ${verificationCode}
          </div>

          <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
            Este código e o link expiram em 10 minutos.
            Se não criaste esta conta, ignora esta mensagem.
          </p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(
        `Falha ao enviar email de verificação: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Não foi possível enviar o email de verificação.',
      );
    }
  }
}
