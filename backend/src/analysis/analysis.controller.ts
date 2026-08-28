import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GoNoGoService } from './go-nogo.service';

/**
 * Módulo 3: Análisis Inteligente IA (Motor Go/No-Go)
 */
@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly goNoGo: GoNoGoService,
  ) {}

  @Get()
  async list(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const items = await this.prisma.analysis.findMany({
      where: { tenantId },
      include: { opportunity: true, rfiRfp: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items, total: items.length };
  }

  /** Ejecuta el motor Go/No-Go sobre una oportunidad o RFI/RFP */
  @Post()
  async analizar(
    @Headers('authorization') authorization: string,
    @Body() body: {
      opportunityId?: string;
      rfiRfpId?: string;
      cuantiaCop?: number;
      exigidos?: { liquidez?: number; endeudamiento?: number; roe?: number; roa?: number };
      cumplimientoTecnico?: number;
      capacidad?: number;
      margenObjetivoPct?: number;
    },
  ) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new UnauthorizedException('Tenant no encontrado');

    const finanzas = (tenant.configuracionesJson as any)?.finanzas;
    if (!finanzas) {
      return { error: 'No hay línea base financiera configurada para el tenant' };
    }

    // Determinar cuantía (de la oportunidad o del body)
    let cuantia = body.cuantiaCop || 0;
    if (!cuantia && body.opportunityId) {
      const opp = await this.prisma.opportunity.findFirst({
        where: { id: body.opportunityId, tenantId },
      });
      cuantia = opp ? Number(opp.cuantiaCop || 0) : 0;
    }

    // 1. Validación financiera
    const financiero = this.goNoGo.evaluarFinanciero(finanzas, body.exigidos || {});
    const financieroScore = Object.values(financiero.indicadores).filter((i: any) => i.cumple).length /
      Object.keys(financiero.indicadores).length * 100;

    // 2. Estimación de costos y margen
    const costos = this.goNoGo.estimarCostos(cuantia, {
      margenObjetivoPct: body.margenObjetivoPct ?? 0.2,
    });
    const margenScore = Math.min(costos.margenPct / 0.25 * 100, 100);

    // 3. P_win
    const pWin = this.goNoGo.calcularPWin({
      cumplimientoTecnico: body.cumplimientoTecnico ?? 70,
      financiero: financieroScore,
      margen: margenScore,
      capacidad: body.capacidad ?? 70,
    });
    const decision = this.goNoGo.decidir(pWin);

    const analysis = await this.prisma.analysis.create({
      data: {
        tenantId,
        opportunityId: body.opportunityId,
        rfiRfpId: body.rfiRfpId,
        financieroJson: financiero,
        costosJson: costos as any,
        pWin,
        decision,
        justificacion: decision === 'go'
          ? `P_win ${pWin}%: cumple la matriz financiera (${financieroScore.toFixed(0)}%), margen estimado ${costos.margenPct}% y capacidad técnica ${body.capacidad ?? 70}%. GO para licitar.`
          : `P_win ${pWin}%: no alcanza el umbral. Revisar exigidos financieros, margen o capacidad antes de licitar. NO-GO recomendado.`,
      },
    });

    return {
      success: true,
      analysis,
      pWin,
      decision,
      financiero,
      costos,
    };
  }
}
