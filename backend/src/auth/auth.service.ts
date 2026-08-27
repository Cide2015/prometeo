import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    // El tenant_id viaja en el JWT → fuente del RLS
    const token = await this.jwt.signAsync({
      sub: user.id,
      tenantId: user.tenantId,
      rol: user.rol,
    });
    return {
      accessToken: token,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        tenantId: user.tenantId,
        tenantNombre: user.tenant?.nombreComercial,
        nit: user.tenant?.nit,
      },
    };
  }

  /** Datos del usuario autenticado (para /auth/me) */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      tenantId: user.tenantId,
      mustChangePassword: user.mustChangePassword,
      tenant: {
        nombreComercial: user.tenant?.nombreComercial,
        nit: user.tenant?.nit,
        configuracionesJson: user.tenant?.configuracionesJson,
      },
    };
  }

  /** Cambio de contraseña (obligatorio en primer ingreso) */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('La contraseña actual no es correcta');

    if (newPassword.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
    return { success: true, message: 'Contraseña actualizada correctamente' };
  }
}
