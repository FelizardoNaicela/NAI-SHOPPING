import { AuthService } from './auth.service';
import { Controller, Post, Body, Get, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../admin/admin.guard';
import { PermissionGuard } from '../admin/permission.guard';

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService,
    private authService: AuthService,) {}

  @Post('register')
register(
  @Body('email') email: string,
  @Body('password') password: string,
  @Body('name') name: string,
  @Body('phone') phone: string,
  @Body('countryCode') countryCode: string,
  @Body('region') region: string, // 👈 adicionar
) {
  return this.authService.register(
    email,
    password,
    name,
    phone,
    countryCode,
    region, // 👈 passar
  );
}
   @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }
  @Get("me")
@UseGuards(JwtAuthGuard)
async getMe(@Req() req: any) {

  const user = await this.prisma.user.findUnique({

    where: {
      id: req.user.sub,
    },

    include: {
      stores: {
        select: {
          id: true,
        },
      },
    },

  });

  if (!user) {
    throw new UnauthorizedException("Utilizador não encontrado");
  }

  return {

    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    countryCode: user.countryCode,
    region: user.region,
    role: user.role,
    storeId: user.stores[0]?.id ?? null,
    username: user.username,
bio: user.bio,
avatarUrl: user.avatarUrl,

  };

}
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('admin-only')
adminTest() {
  return { message: 'Só admin vê isso' };}
    @Get('users')
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
  PermissionGuard,
)
@Roles('ADMIN')
async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
