
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
    id?: string;
  };
}

@Injectable()
export class LegalInvestigatorGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user) {
      await this.recordDeniedAttempt(
        null,
        'Tentativa de acesso ao módulo jurídico sem utilizador autenticado no contexto do pedido.',
        request,
      );

      throw new UnauthorizedException(
        'Autenticação necessária.',
      );
    }

    const userId = user.sub ?? user.id;

    if (!userId) {
      await this.recordDeniedAttempt(
        null,
        'Tentativa de acesso ao módulo jurídico sem identidade de utilizador válida.',
        request,
      );

      throw new UnauthorizedException(
        'Identidade do usuário não encontrada.',
      );
    }

    const investigator =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          role: true,
          legalInvestigatorProfile: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

    if (!investigator) {
      // O utilizador pode já não existir na base de dados.
      // Usamos null para evitar uma referência inválida na auditoria.
      await this.recordDeniedAttempt(
        null,
        'Tentativa de acesso ao módulo jurídico por utilizador não encontrado.',
        request,
      );

      throw new UnauthorizedException(
        'Usuário não encontrado.',
      );
    }

    /*
     * IMPORTANTE:
     * Somente LEGAL_INVESTIGATOR pode acessar
     * este módulo.
     *
     * ADMIN e SUPER_ADMIN não recebem acesso
     * automático às rotas dos investigadores.
     */
    if (investigator.role !== 'LEGAL_INVESTIGATOR') {
      await this.recordDeniedAttempt(
        investigator.id,
        'Tentativa de acesso ao módulo jurídico por usuário sem papel LEGAL_INVESTIGATOR.',
        request,
      );

      throw new ForbiddenException(
        'Acesso restrito a investigadores legais.',
      );
    }

    if (!investigator.legalInvestigatorProfile) {
      await this.recordDeniedAttempt(
        investigator.id,
        'Tentativa de acesso ao módulo jurídico sem perfil de investigador legal.',
        request,
      );

      throw new ForbiddenException(
        'Perfil de investigador legal não encontrado.',
      );
    }

    if (
      investigator.legalInvestigatorProfile.status !== 'ACTIVE'
    ) {
      await this.recordDeniedAttempt(
        investigator.id,
        'Tentativa de acesso ao módulo jurídico com perfil não ativo.',
        request,
      );

      throw new ForbiddenException(
        'Perfil de investigador legal não está ativo.',
      );
    }

    return true;
  }

  private async recordDeniedAttempt(
    requestedById: string | null,
    reason: string,
    request: Request,
  ): Promise<void> {
    try {
      const userAgent =
        request.get('user-agent')?.slice(0, 1000);

      await this.prisma.legalInvestigationDeniedAttempt.create({
        data: {
          requestedById,

          reason: reason.trim().slice(0, 1000),

          ipAddress:
            request.ip?.slice(0, 100) || null,

          userAgent: userAgent || null,

          method:
            request.method?.slice(0, 20) || null,

          // path não inclui a query string.
          path:
            request.path?.slice(0, 1000) || null,
        },
      });
    } catch {
      /*
       * Uma falha da auditoria nunca deve
       * substituir a resposta de segurança.
       *
       * A tentativa continua recusada.
       */
    }
  }
}
