import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CompetitionService } from './competition.service';

/**
 * Insights de alto valor (benchmark Alicia + Dif A-E):
 * - Análisis de competencia (P3)
 * - Sugerencia de uniones temporales (P3)
 * - Fechas clave / alertas de vencimiento (P1)
 * - BI ejecutivo (Dif E)
 */
@Controller('insights')
export class InsightsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly competition: CompetitionService,
  ) {}

  /** Análisis de competencia: quién gana en un entidad/UNSPSC */
  @Get('competencia')
  async competencia(
    @Headers('authorization') authorization: string,
    @Query('entidad') entidad?: string,
    @Query('unspsc') unspsc?: string,
  ) {
    const { tenantId } = this.resolve(authorization);
    return this.competition.analyze(tenantId, entidad, unspsc);
  }

  /** Fechas clave: oportunidades con fecha de cierre próxima */
  @Get('fechas-clave')
  async fechasClave(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const now = new Date();
    const en30dias = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    const items = await this.prisma.opportunity.findMany({
      where: {
        tenantId,
        estado: 'disponible',
        fechaCierre: { gte: now, lte: en30dias },
      },
      orderBy: { fechaCierre: 'asc' },
      take: 50,
    });
    return { items, total: items.length, proximas24h: items.filter((o) => o.fechaCierre && o.fechaCierre <= new Date(now.getTime() + 24 * 3600 * 1000)).length };
  }

  /** Sugerencia de uniones temporales (P3): cuando el tenant no cumple solo */
  @Post('uniones-temporales')
  async sugerirUnionTemporal(
    @Headers('authorization') authorization: string,
    @Body() body: { cuantiaCop: number; capacidad?: number },
  ) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const finanzas = (tenant?.configuracionesJson as any)?.finanzas;
    const capacidad = body.capacidad ?? 70;

    if (capacidad < 100) {
      return {
        sugerida: true,
        message: 'La capacidad operativa actual no cubre el 100% del proceso. Se sugiere conformar una Unión Temporal o Consorcio.',
        estrategias: [
          'Conformar Unión Temporal con socio que aporte la experiencia faltante.',
          'Conformar Consorcio para dividir el alcance técnico.',
          'Subcontratar el % de capacidad faltante a un proveedor especializado.',
        ],
        porcentajeCubierto: capacidad,
        porcentajeFaltante: 100 - capacidad,
        finanzasCumplen: finanzas ? this.cumpleFinanzas(finanzas, body.cuantiaCop) : 'sin datos',
      };
    }
    return { sugerida: false, message: 'Capacidad suficiente. No se requiere unión temporal.' };
  }

  /** BI ejecutivo (Dif E): pipeline, win-rate, rentabilidad */
  @Get('bi')
  async bi(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);

    const [opportunities, bids, projects, analyses, ledgers, rfi] = await Promise.all([
      this.prisma.opportunity.findMany({ where: { tenantId } }),
      this.prisma.bid.findMany({ where: { tenantId } }),
      this.prisma.contractProject.findMany({ where: { tenantId }, include: { ledgers: true } }),
      this.prisma.analysis.findMany({ where: { tenantId } }),
      this.prisma.financialLedger.findMany({ where: { tenantId } }),
      this.prisma.rfiRfp.findMany({ where: { tenantId } }),
    ]);

    // Pipeline: valor total de oportunidades disponibles
    const pipelineValue = opportunities
      .filter((o) => o.estado === 'disponible')
      .reduce((a, o) => a + Number(o.cuantiaCop || 0), 0);

    // Win-rate: proyectos ganados / total ofertas presentadas
    const presentadas = bids.filter((b) => b.faseFunnel === 'presentada').length;
    const ganadas = projects.length;
    const winRate = presentadas > 0 ? Math.round((ganadas / presentadas) * 100) : 0;

    // Rentabilidad: ingresos vs egresos
    const totalIngresos = ledgers.filter((l) => l.tipoMovimiento === 'ingreso').reduce((a, l) => a + Number(l.montoCop), 0);
    const totalEgresos = ledgers.filter((l) => l.tipoMovimiento === 'egreso').reduce((a, l) => a + Number(l.montoCop), 0);
    const margen = totalIngresos - totalEgresos;

    // Decisiones Go/No-Go
    const goCount = analyses.filter((a) => a.decision === 'go').length;
    const nogoCount = analyses.filter((a) => a.decision === 'nogo').length;
    const pWinPromedio = analyses.length > 0
      ? analyses.reduce((a, x) => a + Number(x.pWin || 0), 0) / analyses.length
      : 0;

    return {
      pipeline: { oportunidades: opportunities.filter((o) => o.estado === 'disponible').length, valorTotal: pipelineValue },
      funnel: { borrador: bids.filter((b) => b.faseFunnel === 'borrador').length, analisis: bids.filter((b) => b.faseFunnel === 'analisis').length, documental: bids.filter((b) => b.faseFunnel === 'documental').length, firma: bids.filter((b) => b.faseFunnel === 'firma').length, presentadas },
      winRate,
      proyectosGanados: ganadas,
      rfiRecibidas: rfi.length,
      rentabilidad: { ingresos: totalIngresos, egresos: totalEgresos, margen },
      analisis: { go: goCount, nogo: nogoCount, pWinPromedio: Math.round(pWinPromedio * 10) / 10 },
    };
  }

  private cumpleFinanzas(finanzas: any, cuantia: number): boolean {
    const liquidez = finanzas.activoCorriente / finanzas.pasivoCorriente;
    const endeudamiento = finanzas.pasivoCorriente / finanzas.activoTotal;
    // Regla: cuantía no debe superar ~2x patrimonio (criterio prudencial)
    return cuantia <= finanzas.patrimonioTotal * 2 && liquidez >= 1 && endeudamiento <= 1;
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
