import { Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';

/**
 * Notificaciones diarias (P1 + benchmark Alicia).
 */
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly jwt: JwtService,
  ) {}

  @Get()
  async historial(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    return this.notifications.historial(tenantId);
  }

  /** Generar resumen diario manualmente (también lo invoca n8n en cron) */
  @Post('diaria')
  async diaria(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    return this.notifications.generarDiario(tenantId);
  }

  private resolve(authorization: string): { userId: string; tenantId: string } {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    try {
      const payload = this.jwt.verify(authorization.slice(7));
      return { userId: payload.sub, tenantId: payload.tenantId };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
