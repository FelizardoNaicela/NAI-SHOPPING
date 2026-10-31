
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  createHash,
  randomBytes,
  randomInt,
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

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashVerificationCode(code: string, salt: string): string {
    return createHash('sha256')
      .update(salt + code)
      .digest('hex');
  }

  // REGISTO: cria apenas um registo pendente.
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

    if (region) {
      const validRegions = REGIONS[normalizedCountryCode];

      if (!validRegions || !validRegions.includes(region)) {
        throw new BadRequestException('Região inválida para o país');
      }
    }

    // Verifica se já existe uma conta definitiva.
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

    // Token longo e aleatório para confirmação através do link.
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = this.hashToken(verificationToken);

    // Código numérico de seis dígitos.
    const verificationCode = randomInt(0, 1_000_000)
      .toString()
      .padStart(6, '0');

    // O código é guardado com um salt individual.
    const verificationCodeSalt = randomBytes(16).toString('hex');
    const verificationCodeHash = this.hashVerificationCode(
      verificationCode,
      verificationCodeSalt,
    );

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Guarda os dados provisoriamente, sem criar User.
    // Se já existir um registo pendente para este email,
    // os dados e os códigos anteriores são substituídos.
    await this.prisma.pendingRegistration.upsert({
      where: {
        email: normalizedEmail,
      },
      create: {
        email: normalizedEmail,
        passwordHash,
        name: name || null,
        phone: phone || null,
        countryCode: normalizedCountryCode,
        region: region || null,
        verificationTokenHash,
        verificationCodeHash,
        verificationCodeSalt,
        attempts: 0,
        expiresAt,
        lastSentAt: new Date(),
      },
      update: {
        passwordHash,
        name: name || null,
        phone: phone || null,
        countryCode: normalizedCountryCode,
        region: region || null,
        verificationTokenHash,
        verificationCodeHash,
        verificationCodeSalt,
        attempts: 0,
        expiresAt,
        lastSentAt: new Date(),
      },
    });

    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:5173';

    const verificationUrl =
      `${frontendUrl}/verify-email?token=${verificationToken}`;

    // O email contém o link e o código.
    // Se o envio falhar, o registo pendente permanece guardado.
    await this.emailService.sendVerificationEmail(
      normalizedEmail,
      verificationUrl,
      verificationCode,
    );

    return {
      email: normalizedEmail,
      emailVerified: false,
      message:
        'Enviámos um email com o link e o código de confirmação. Confirma o teu endereço para concluir o registo.',
    };
  }

  // FINALIZA O REGISTO DEPOIS DA CONFIRMAÇÃO.
  
  private async finalizePendingRegistration(pendingId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.pendingRegistration.findUnique({
        where: { id: pendingId },
      });

      if (!pending) {
        throw new BadRequestException(
          'Este registo já foi confirmado ou deixou de estar disponível.',
        );
      }

      const deleted = await tx.pendingRegistration.deleteMany({
        where: { id: pendingId },
      });

      if (deleted.count !== 1) {
        throw new BadRequestException(
          'Este registo já foi confirmado ou deixou de estar disponível.',
        );
      }

      const user = await tx.user.create({
        data: {
          email: pending.email,
          passwordHash: pending.passwordHash,
          name: pending.name,
          phone: pending.phone,
          countryCode: pending.countryCode,
          region: pending.region,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.notificationPreference.create({
        data: {
          userId: user.id,
          newProduct: true,
          bancaFollowed: true,
          system: true,
          inApp: true,
          email: false,
          whatsapp: false,
        },
      });

      return {
        id: user.id,
        email: user.email,
      };
    });
  }

  // CONFIRMAÇÃO DO EMAIL PELO LINK.
  async verifyEmail(token: string) {
    if (!token || !token.trim()) {
      throw new BadRequestException(
        'Token de confirmação obrigatório',
      );
    }

    const tokenHash = this.hashToken(token.trim());

    const pending = await this.prisma.pendingRegistration.findUnique({
      where: {
        verificationTokenHash: tokenHash,
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    if (!pending || pending.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Link de confirmação inválido ou expirado. Solicita um novo email.',
      );
    }

    const user = await this.finalizePendingRegistration(pending.id);

    return {
      id: user.id,
      email: user.email,
      message: 'Email confirmado com sucesso. Já podes iniciar sessão.',
    };
  }

  // CONFIRMAÇÃO DO EMAIL PELO CÓDIGO DE SEIS DÍGITOS.
  async verifyEmailCode(email: string, code: string) {
    if (!email || !code) {
      throw new BadRequestException(
        'Email e código de confirmação são obrigatórios',
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new BadRequestException(
        'O código deve conter exatamente seis dígitos.',
      );
    }

    const pending = await this.prisma.pendingRegistration.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!pending || pending.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Código inválido ou expirado. Solicita um novo email de confirmação.',
      );
    }

    if (pending.attempts >= 5) {
      throw new BadRequestException(
        'Excedeste o número de tentativas. Solicita um novo email de confirmação.',
      );
    }

    const receivedHash = this.hashVerificationCode(
      normalizedCode,
      pending.verificationCodeSalt,
    );

    const expectedBuffer = Buffer.from(
      pending.verificationCodeHash,
      'hex',
    );

    const receivedBuffer = Buffer.from(receivedHash, 'hex');

    const codeIsValid =
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!codeIsValid) {
      const updated = await this.prisma.pendingRegistration.updateMany({
        where: {
          id: pending.id,
          attempts: { lt: 5 },
        },
        data: {
          attempts: { increment: 1 },
        },
      });

      if (updated.count === 1 && pending.attempts + 1 >= 5) {
        await this.prisma.pendingRegistration.deleteMany({
          where: {
            id: pending.id,
            attempts: { gte: 5 },
          },
        });

        throw new BadRequestException(
          'Excedeste o número de tentativas. Inicia novamente o registo.',
        );
      }

      throw new BadRequestException(
        'Código de confirmação incorreto.',
      );
    }

    const user = await this.finalizePendingRegistration(pending.id);

    return {
      id: user.id,
      email: user.email,
      message: 'Email confirmado com sucesso. Já podes iniciar sessão.',
    };
  }

  // LOGIN
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

    // Nesta fase não bloqueamos contas existentes que ainda não tenham
    // emailVerifiedAt preenchido.

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
