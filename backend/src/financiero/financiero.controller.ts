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

/**
 * Módulo 6: Control Financiero Contractual
 * - Registro de flujo de caja (facturación por hitos, órdenes de pago)
 * - Liquidación impositiva territorial (Retefuente, ReteICA, ReteIVA, estampillas)
 * - Márgenes reales vs proyectados
 */
@Controller('financiero')
export class FinancieroController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Get()
  async list(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const ledgers = await this.prisma.financialLedger.findMany({
      where: { tenantId },
      include: { project: true },
      orderBy: { fechaRegistro: 'desc' },
      take: 200,
    });
    return { items: ledgers, total: ledgers.length };
  }

  /** Registrar movimiento de flujo de caja */
  @Post()
  async create(
    @Headers('authorization') authorization: string,
    @Body() body: { projectId: string; tipoMovimiento: string; concepto: string; montoCop: number },
  ) {
    const { tenantId } = this.resolve(authorization);
    const project = await this.prisma.contractProject.findFirst({
      where: { id: body.projectId, tenantId },
    });
    if (!project) throw new UnauthorizedException('Proyecto no encontrado');

    const ledger = await this.prisma.financialLedger.create({
      data: {
        tenantId,
        projectId: body.projectId,
        tipoMovimiento: body.tipoMovimiento, // ingreso | egreso
        concepto: body.concepto,
        montoCop: body.montoCop,
      },
    });
    return { success: true, ledger };
  }

  /** Resumen financiero del tenant: márgenes reales vs proyectados */
  @Get('resumen')
  async resumen(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const projects = await this.prisma.contractProject.findMany({
      where: { tenantId },
      include: { ledgers: true },
    });

    let totalIngresos = 0;
    let totalEgresos = 0;
    let totalProyectado = 0;

    for (const p of projects) {
      totalProyectado += Number(p.valorTotal || 0);
      for (const l of p.ledgers) {
        if (l.tipoMovimiento === 'ingreso') totalIngresos += Number(l.montoCop);
        else totalEgresos += Number(l.montoCop);
      }
    }

    const margenReal = totalIngresos - totalEgresos;
    const margenProyectado = totalProyectado - totalEgresos;

    return {
      totalIngresos,
      totalEgresos,
      totalProyectado,
      margenReal,
      margenProyectado,
      pctAvance: totalProyectado > 0 ? Math.round((totalIngresos / totalProyectado) * 100) : 0,
      projects: projects.map((p) => ({
        id: p.id,
        numeroContrato: p.numeroContrato,
        valorTotal: p.valorTotal,
        ingresos: p.ledgers.filter((l) => l.tipoMovimiento === 'ingreso').reduce((a, l) => a + Number(l.montoCop), 0),
        egresos: p.ledgers.filter((l) => l.tipoMovimiento === 'egreso').reduce((a, l) => a + Number(l.montoCop), 0),
      })),
    };
  }

  /** Liquidación impositiva territorial (Colombia) */
  @Get('impuestos')
  impuestos() {
    // Parámetros base Retención Colombia (configurables por tenant en fase posterior)
    return {
      retefuente: { base: 0.025, descripcion: 'Retención en la fuente (servicios, tarifa general 2.5%)' },
      reteIca: { base: 0.004, descripcion: 'Retención ICA (promedio Bogotá 0.4%)' },
      reteIva: { base: 0.15, descripcion: 'Retención IVA (15% del IVA facturado)' },
      estampillas: {
        proHospital: 0.005,
        proCultura: 0.002,
        proDesarrollo: 0.002,
        descripcion: 'Estampillas departamentales/municipales (Pro-Hospital, Pro-Cultura, Pro-Desarrollo)',
      },
      nota: 'Tarifas referenciales; la configuración real por entidad territorial se define en Módulo 7.',
    };
  }
}
