
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
   createHash,
  randomInt,
  
randomBytes,
  timingSafeEqual,
} from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { REGIONS } from '../common/regions';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
 ) {}

  private hashVerificationCode(code: string, salt: string): string {
    return createHash('sha256')
      .update(salt + code)
      .digest('hex');
  }

  private compareHashes(expectedHash: string, receivedHash: string): boolean {
    const expected = Buffer.from(expectedHash, 'hex');
    const received = Buffer.from(receivedHash, 'hex');

    return (
      expected.length === received.length &&
      expected.length > 0 &&
      timingSafeEqual(expected, received)
    );
  }

  // =====================================================
  // REGISTO DIRECTO
  // =====================================================

  async register(
    email: string,
    password: string,
    name: string,
    phone: string,
    countryCode: string,
    region?: string,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email e senha são obrigatórios');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCountryCode = countryCode || 'MZ';

    if (password.length < 8) {
      throw new BadRequestException(
        'A senha deve ter pelo menos 8 caracteres.',
      );
    }

    if (region) {
      const validRegions = REGIONS[normalizedCountryCode];

      if (!validRegions || !validRegions.includes(region)) {
        throw new BadRequestException('Região inválida para o país');
      }
    } 
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'Este endereço de email já está registado',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            name: name || null,
            phone: phone || null,
            countryCode: normalizedCountryCode,
            region: region || null,
          },
        });

        await tx.notificationPreference.create({
          data: {
            userId: createdUser.id,
            newProduct: true,
            bancaFollowed: true,
            system: true,
            inApp: true,
            email: false,
            whatsapp: false,
          },
        });

        return createdUser;
      });

      return {
        id: user.id,
        email: user.email,
        message: 'Conta criada com sucesso. Já podes iniciar sessão.',
      };
    } catch (error: any) {
      // Protege contra dois cadastros simultâneos com o mesmo email.
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'Este endereço de email já está registado',
        );
      }

      throw error;
    }
  }

  // =====================================================
  // SOLICITAR CÓDIGO DE RECUPERAÇÃO DE SENHA
  // =====================================================

  async forgotPassword(email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email obrigatório');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const genericResponse = {
      success: true,
      message:
        'Se existir uma conta associada a este email, receberás um código de recuperação.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        deletedAt: true,
        passwordResetLastSentAt: true,
      },
    });

    // Não revela se o email está registado.
    if (!user || user.deletedAt) {
      return genericResponse;
    }

    const now = new Date();

    // Intervalo mínimo de 60 segundos entre envios.
    if (user.passwordResetLastSentAt) {
      const elapsed =
        now.getTime() - user.passwordResetLastSentAt.getTime();

      if (elapsed < 60 * 1000) {
        return genericResponse;
      }
    }

    const code = randomInt(0, 1_000_000)
      .toString()
      .padStart(6, '0');

    const salt = randomBytes(16).toString('hex');

    const codeHash = this.hashVerificationCode(code, salt);

    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: codeHash,
        passwordResetExpiresAt: expiresAt,
        passwordResetCodeSalt: salt,
        passwordResetAttempts: 0,
        passwordResetLastSentAt: now,
      },
    });

    try {
      await this.emailService.sendPasswordResetCode(
        normalizedEmail,
        code,
      );
    } catch (error) {
      // Invalida o código se o envio falhar.
      await this.prisma.user.updateMany({
  where: {
    id: user.id,
    passwordResetTokenHash: codeHash,
  },
  data: {
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    passwordResetCodeSalt: null,
    passwordResetAttempts: 0,
    passwordResetLastSentAt: null,
  },
});

      throw new BadRequestException(
        'Não foi possível enviar o email de recuperação. Tenta novamente mais tarde.',
      );
    }

    return genericResponse;
  }

  // =====================================================
  // VALIDAR CÓDIGO E DEFINIR NOVA SENHA
  // =====================================================

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ) {
    if (!email || !code || !newPassword) {
      throw new BadRequestException(
        'Email, código e nova senha são obrigatórios.',
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new BadRequestException(
        'O código deve conter exatamente seis dígitos.',
      );
    }

    if (newPassword.length < 8) {
      throw new BadRequestException(
        'A nova senha deve ter pelo menos 8 caracteres.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        deletedAt: true,
        passwordResetTokenHash: true,
        passwordResetExpiresAt: true,
        passwordResetCodeSalt: true,
        passwordResetAttempts: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new BadRequestException(
        'Código inválido ou expirado. Solicita um novo código.',
      );
    }

    if (
      !user.passwordResetTokenHash ||
      !user.passwordResetExpiresAt ||
      !user.passwordResetCodeSalt ||
      user.passwordResetExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'Código inválido ou expirado. Solicita um novo código.',
      );
    }

    if (user.passwordResetAttempts >= 5) {
      throw new BadRequestException(
        'Excedeste o número de tentativas. Solicita um novo código.',
      );
    }

    const receivedHash = this.hashVerificationCode(
      normalizedCode,
      user.passwordResetCodeSalt,
    );

    const codeIsValid = this.compareHashes(
      user.passwordResetTokenHash,
      receivedHash,
    );

    if (!codeIsValid) {
      const updated = await this.prisma.user.updateMany({
        where: {
          id: user.id,
          passwordResetTokenHash: user.passwordResetTokenHash,
          passwordResetAttempts: { lt: 5 },
        },
        data: {
          passwordResetAttempts: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException(
          'Código inválido ou expirado. Solicita um novo código.',
        );
      }

      throw new BadRequestException(
        updated.count === 1 && user.passwordResetAttempts + 1 >= 5
          ? 'Excedeste o número de tentativas. Solicita um novo código.'
          : 'Código de recuperação incorreto.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualiza a senha e invalida o código numa única transacção.
    const result = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        passwordResetTokenHash: user.passwordResetTokenHash,
        passwordResetExpiresAt: { gt: new Date() },
        passwordResetAttempts: { lt: 5 },
      },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetCodeSalt: null,
        passwordResetAttempts: 0,
        passwordResetLastSentAt: null,
      },
    });

    if (result.count !== 1) {
      throw new BadRequestException(
        'O código já não está disponível. Solicita um novo código.',
      );
    }

    return {
      success: true,
      message: 'Senha alterada com sucesso. Já podes iniciar sessão.',
    };
  }

  // =====================================================
  // LOGIN
  // =====================================================

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email e senha são obrigatórios');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        stores: {
          select: { id: true },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
   }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        countryCode: user.countryCode,
        region: user.region,
        role: user.role,
        storeId: user.stores?.[0]?.id || null,
      },
    };
  }
}
