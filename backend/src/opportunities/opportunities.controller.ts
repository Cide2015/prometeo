import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
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

  /**
   * Listar oportunidades del tenant autenticado con paginación, ordenamiento y filtros.
   * Parámetros:
   *  - page (default 1), pageSize (10|20|30|all, default 20)
   *  - sortBy (entidad|objeto|cuantiaCop|fechaCierre|estado|secopId|createdAt, default cuantiaCop)
   *  - sortOrder (asc|desc, default desc)
   *  - Filtros: q, entidad, departamento, modalidad, cuantiaMin, cuantiaMax, estado, favorito
   *  - areaId: filtra por una área de interés específica (sus códigos UNSPSC)
   *  - useProfiles=true: aplica el espejo por áreas de interés activas
   */
  @Get()
  async list(
    @Headers('authorization') authorization: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('estado') estado?: string,
    @Query('entidad') entidad?: string,
    @Query('modalidad') modalidad?: string,
    @Query('q') q?: string,
    @Query('cuantiaMin') cuantiaMin?: string,
    @Query('cuantiaMax') cuantiaMax?: string,
    @Query('departamento') departamento?: string,
    @Query('areaId') areaId?: string,
    @Query('favorito') favorito?: string,
    @Query('useProfiles') useProfiles?: string,
  ) {
    const { tenantId } = this.resolve(authorization);

    // Paginación
    const pageNum = page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const sizeStr = pageSize || '20';
    const pageSizeNum = sizeStr === 'all' ? 10000 : [10, 20, 30].includes(Number(sizeStr)) ? Number(sizeStr) : 20;

    // Ordenamiento (mapa de columnas permitidas)
    const sortMap: Record<string, string> = {
      entidad: 'entidad',
      objeto: 'objeto',
      cuantiaCop: 'cuantiaCop',
      cuantia: 'cuantiaCop',
      fechaCierre: 'fechaCierre',
      estado: 'estado',
      secopId: 'secopId',
      numeroProceso: 'secopId',
      createdAt: 'createdAt',
    };
    const sortField = sortMap[sortBy || ''] || 'cuantiaCop';
    const sortDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const min = cuantiaMin ? Number(cuantiaMin) : undefined;
    const max = cuantiaMax ? Number(cuantiaMax) : undefined;

    // Áreas de interés activas del tenant (perfiles espejo SECOP)
    const profiles = await this.prisma.searchProfile.findMany({
      where: { tenantId, isActive: true },
    });
    const areas = profiles.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigos: (p.unspsc as string[]) || [],
    }));

    // Construcción del where (filtros SQL directos)
    const where: any = {
      tenantId,
      ...(estado ? { estado } : { estado: 'disponible' }), // por defecto solo disponibles (activas)
      ...(entidad ? { entidad: { contains: entidad, mode: 'insensitive' } } : {}),
      ...(modalidad ? { metadataJson: { path: ['modalidad'], equals: modalidad } } : {}),
      ...(q
        ? {
            OR: [
              { objeto: { contains: q, mode: 'insensitive' } },
              { entidad: { contains: q, mode: 'insensitive' } },
              { secopId: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(min !== undefined || max !== undefined
        ? { cuantiaCop: { ...(min !== undefined ? { gte: min } : {}), ...(max !== undefined ? { lte: max } : {}) } }
        : {}),
      ...(departamento ? { metadataJson: { path: ['departamento'], equals: departamento } } : {}),
      ...(favorito === 'true' ? { favorito: true } : {}),
    };

    // Candidatos (hasta 5000) para filtro por área en memoria + paginación correcta
    const candidatos = await this.prisma.opportunity.findMany({
      where,
      orderBy: { [sortField]: sortDir },
      take: 5000,
    });

    // Filtro por área de interés (match segmento 4 dígitos)
    let areaSel: { id: string; nombre: string; codigos: string[] } | undefined;
    if (areaId) areaSel = areas.find((a) => a.id === areaId);

    let conArea = candidatos.map((o) => {
      const itemCodes = ((o.metadataJson as any)?.unspsc as string[]) || [];
      const area = areas.find((a) =>
        a.codigos.some((uc) => itemCodes.some((c) => uc.slice(0, 4) === c.slice(0, 4))),
      );
      return { ...o, areaId: area?.id || null, areaNombre: area?.nombre || null };
    });

    // Si useEspejo o área específica: solo coincidencias con áreas
    if (useProfiles === 'true') {
      conArea = conArea.filter((o) => o.areaId);
    }
    if (areaSel) {
      conArea = conArea.filter((o) => o.areaId === areaSel.id);
    }

    // Paginación sobre el resultado filtrado
    const total = conArea.length;
    const totalPages = Math.ceil(total / pageSizeNum) || 1;
    const safePage = Math.min(pageNum, totalPages);
    const items = conArea.slice((safePage - 1) * pageSizeNum, safePage * pageSizeNum);

    // Grupos por área (para el selector de resumen si aplica)
    const grupos = areas
      .map((a) => ({
        areaId: a.id,
        areaNombre: a.nombre,
        codigos: a.codigos,
        items: conArea.filter((o) => o.areaId === a.id),
      }))
      .filter((g) => g.items.length > 0);

    return {
      items,
      total,
      page: safePage,
      pageSize: pageSizeNum,
      totalPages,
      areas,
      grupos,
      useEspejo: useProfiles === 'true',
      sortBy: sortField,
      sortOrder: sortDir,
      filtroEspejo: profiles.reduce((n, p) => n + ((p.unspsc as string[]) || []).length, 0),
    };
  }

  /** Marcar / desmarcar una oportunidad como favorita (para analizar) */
  @Patch(':id/favorito')
  async toggleFavorito(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Body() body: { favorito?: boolean },
  ) {
    const { tenantId } = this.resolve(authorization);
    const opp = await this.prisma.opportunity.findFirst({ where: { id, tenantId } });
    if (!opp) throw new UnauthorizedException('Oportunidad no encontrada');
    const favorito = typeof body.favorito === 'boolean' ? body.favorito : !opp.favorito;
    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: { favorito },
    });
    return { success: true, id, favorito: updated.favorito };
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
    const [disponibles, aplicadas, descartadas, favoritas] = await Promise.all([
      this.prisma.opportunity.count({ where: { tenantId, estado: 'disponible' } }),
      this.prisma.opportunity.count({ where: { tenantId, estado: 'aplicada' } }),
      this.prisma.opportunity.count({ where: { tenantId, estado: 'descartada' } }),
      this.prisma.opportunity.count({ where: { tenantId, favorito: true } }),
    ]);
    return { disponibles, aplicadas, descartadas, favoritas };
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
