import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { REGIONS } from "../common/regions";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 🔹 REGISTRO
  async register(
  email: string,
  password: string,
  name: string,
  phone: string,
  countryCode: string,
  region?: string,
) {

  if (!email || !password) {
    throw new Error("Email e senha são obrigatórios");
  }

  // ✅ VALIDAÇÃO CORRETA
  if (region) {
    const validRegions = REGIONS[countryCode];

    if (!validRegions || !validRegions.includes(region)) {
      throw new Error("Região inválida para o país");
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await this.prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      phone,
      countryCode: countryCode || "MZ",
    region: region ?? null,
    },
  });

  await this.prisma.notificationPreference.create({
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
}

  // 🔹 LOGIN
  async login(email: string, password: string) {
if (!email || !password) {
  throw new Error("Email e senha são obrigatórios");
}

  const user = await this.prisma.user.findUnique({
    where: { email },
    include: {
      stores: { // 👈 ajusta conforme teu schema
        select: { id: true }
      }
    }
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
  }
};
}
}
