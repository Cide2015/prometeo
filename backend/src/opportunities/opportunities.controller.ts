import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecopService } from './secop.service';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secop: SecopService,
  ) {}

  /** Listar oportunidades del tenant (con filtros opcionales) */
  @Get()
  async list(
    @Query('tenantId') tenantId: string,
    @Query('estado') estado?: string,
    @Query('entidad') entidad?: string,
  ) {
    if (!tenantId) {
      return { items: [], message: 'tenantId requerido' };
    }
    const items = await this.prisma.opportunity.findMany({
      where: {
        tenantId,
        ...(estado ? { estado } : {}),
        ...(entidad ? { entidad: { contains: entidad, mode: 'insensitive' } } : {}),
      },
      orderBy: { cuantiaCop: 'desc' },
      take: 100,
    });
    return { items, total: items.length };
  }

  /** Sincronizar oportunidades desde SECOP II (SODA API) */
  @Post('sync')
  async sync(@Body() body: { tenantId: string }) {
    if (!body.tenantId) return { error: 'tenantId requerido' };
    const result = await this.secop.ingest(body.tenantId);
    const total = await this.prisma.opportunity.count({
      where: { tenantId: body.tenantId, estado: 'disponible' },
    });
    return { ...result, totalDisponibles: total };
  }

  /** Estado del dashboard del tenant */
  @Get('stats')
  async stats(@Query('tenantId') tenantId: string) {
    if (!tenantId) return { error: 'tenantId requerido' };
    const [disponibles, aplicadas, descartadas] = await Promise.all([
      this.prisma.opportunity.count({ where: { tenantId, estado: 'disponible' } }),
      this.prisma.opportunity.count({ where: { tenantId, estado: 'aplicada' } }),
      this.prisma.opportunity.count({ where: { tenantId, estado: 'descartada' } }),
    ]);
    return { disponibles, aplicadas, descartadas };
  }
}
