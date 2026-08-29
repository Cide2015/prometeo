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

  /** Listar oportunidades del tenant autenticado (búsqueda por palabras clave + filtros avanzados).
   *  Con useProfiles=true (espejo SECOP), filtra por las áreas de interés activas y agrupa el
   *  resultado por área: cada oportunidad se asigna al área cuyo código UNSPSC coincide (segmento). */
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
    @Query('useProfiles') useProfiles?: string,
  ) {
    const { tenantId } = this.resolve(authorization);

    const min = cuantiaMin ? Number(cuantiaMin) : undefined;
    const max = cuantiaMax ? Number(cuantiaMax) : undefined;

    // Áreas de interés activas del tenant (perfiles espejo SECOP)
    const profiles = await this.prisma.searchProfile.findMany({
      where: { tenantId, isActive: true },
    });
    const useEspejo = useProfiles === 'true' && profiles.length > 0;

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
      take: 5000,
    });

    // Filtro espejo + agrupación por área de interés (match por segmento = 4 dígitos)
    if (useEspejo) {
      // Solo oportunidades ACTIVAS (disponibles) — excluye descartadas, aplicadas, adjudicadas
      const disponibles = items.filter((o) => o.estado === 'disponible');
      // Para cada área, sus códigos UNSPSC normalizados
      const areas = profiles.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        codigos: (p.unspsc as string[]) || [],
      }));

      // Asignar cada oportunidad al primer área que coincida (segmento)
      const conArea = disponibles
        .map((o) => {
          const itemCodes = ((o.metadataJson as any)?.unspsc as string[]) || [];
          const area = areas.find((a) =>
            a.codigos.some((uc) =>
              itemCodes.some((c) => uc.slice(0, 4) === c.slice(0, 4)),
            ),
          );
          return { ...o, areaId: area?.id || null, areaNombre: area?.nombre || null };
        })
        .filter((o) => o.areaId);

      // Agrupar por área de interés
      const grupos = areas
        .map((a) => ({
          areaId: a.id,
          areaNombre: a.nombre,
          codigos: a.codigos,
          items: conArea.filter((o) => o.areaId === a.id),
        }))
        .filter((g) => g.items.length > 0);

      return {
        items: conArea,
        total: conArea.length,
        filtroEspejo: profiles.reduce((n, p) => n + ((p.unspsc as string[]) || []).length, 0),
        grupos,
        useEspejo: true,
      };
    }

    return { items, total: items.length, filtroEspejo: 0, grupos: [], useEspejo: false };
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
