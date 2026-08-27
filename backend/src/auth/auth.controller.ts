import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  /** Cambio de contraseña (obligatorio en primer ingreso) */
  @Post('change-password')
  async changePassword(
    @Headers('authorization') authorization: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const userId = this.resolveUserId(authorization);
    return this.auth.changePassword(userId, body.currentPassword, body.newPassword);
  }

  /** Datos del usuario autenticado */
  @Get('me')
  async me(@Headers('authorization') authorization: string) {
    const userId = this.resolveUserId(authorization);
    return this.auth.me(userId);
  }

  private resolveUserId(authorization: string): string {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    const token = authorization.slice(7);
    try {
      const payload = this.jwt.verify(token);
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
