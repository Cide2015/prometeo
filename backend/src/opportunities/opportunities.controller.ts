import { Body, Controller, Get, Headers, Post, Query, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SecopService } from './secop.service';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secop: SecopService,
    private readonly jwt: JwtService,
  ) {}

  /** Listar oportunidades del tenant autenticado (búsqueda por palabras clave + filtros avanzados) */
  @Get()
  async list(
    @Headers('authorization') authorization: string,
    @Query('estado') estado?: string,
    @Query('entidad') entidad?: string,
    @Query('modalidad') modalidad?: string,
    @Query('q') q?: string,
    @Query('cuantiaMin') cuantiaMin?: string,
    @Query('cuantiaMax') cuantiaMax?: string,
    @Query('departamento') departamento?: string,
  ) {
    const { tenantId } = this.resolve(authorization);

    const min = cuantiaMin ? Number(cuantiaMin) : undefined;
    const max = cuantiaMax ? Number(cuantiaMax) : undefined;

    const items = await this.prisma.opportunity.findMany({
      where: {
        tenantId,
        ...(estado ? { estado } : {}),
        ...(entidad ? { entidad: { contains: entidad, mode: 'insensitive' } } : {}),
        ...(modalidad
          ? { metadataJson: { path: ['modalidad'], equals: modalidad } }
          : {}),
        ...(q
          ? { OR: [{ objeto: { contains: q, mode: 'insensitive' } }, { entidad: { contains: q, mode: 'insensitive' } }] }
          : {}),
        ...(min !== undefined || max !== undefined
          ? { cuantiaCop: { ...(min !== undefined ? { gte: min } : {}), ...(max !== undefined ? { lte: max } : {}) } }
          : {}),
        ...(departamento
          ? { metadataJson: { path: ['departamento'], equals: departamento } }
          : {}),
      },
      orderBy: { cuantiaCop: 'desc' },
      take: 100,
    });
    return { items, total: items.length };
  }

  /** Sincronizar oportunidades desde SECOP II (SODA API) usando la config del tenant */
  @Post('sync')
  async sync(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const result = await this.secop.ingest(tenantId);
    const total = await this.prisma.opportunity.count({
      where: { tenantId, estado: 'disponible' },
    });
    return { ...result, totalDisponibles: total };
  }

  /** Estado del dashboard del tenant autenticado */
  @Get('stats')
  async stats(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const [disponibles, aplicadas, descartadas] = await Promise.all([
      this.prisma.opportunity.count({ where: { tenantId, estado: 'disponible' } }),
      this.prisma.opportunity.count({ where: { tenantId, estado: 'aplicada' } }),
      this.prisma.opportunity.count({ where: { tenantId, estado: 'descartada' } }),
    ]);
    return { disponibles, aplicadas, descartadas };
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
