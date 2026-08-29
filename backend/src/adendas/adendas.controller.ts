import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AdendaMonitorService } from './adenda-monitor.service';

/**
 * Monitor de Adendas (Dif C) — endpoints para el tenant.
 */
@Controller('adendas')
export class AdendasController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly monitor: AdendaMonitorService,
  ) {}

  @Get()
  async list(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const items = await this.monitor.alerts(tenantId);
    return { items, total: items.length };
  }

  @Post('check')
  async check(
    @Headers('authorization') authorization: string,
    @Body() body: { procesos: { secopId: string; fechaAnterior?: string; estadoAnterior?: string }[] },
  ) {
    const { tenantId } = this.resolve(authorization);
    return this.monitor.check(tenantId, body.procesos || []);
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
