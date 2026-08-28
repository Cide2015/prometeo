import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface Finanzas {
  activoCorriente: number;
  activoTotal: number;
  pasivoCorriente: number;
  patrimonioTotal: number;
  utilidadOperacional: number;
  gastosIntereses: number;
}

interface PliegoRequisitos {
  liquidez?: number;
  endeudamiento?: number;
  roe?: number;
  roa?: number;
}

/**
 * Motor Go/No-Go (Módulo 3 del SRS):
 * 1. Matriz de cumplimiento técnico
 * 2. Validación financiera automática (fórmulas del pliego)
 * 3. Estimación de costos y margen
 * 4. Puntaje de éxito (P_win) → GO / NO-GO
 */
@Injectable()
export class GoNoGoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Validación financiera con las fórmulas del SRS contra la línea base del tenant */
  evaluarFinanciero(finanzas: Finanzas, exigido: PliegoRequisitos = {}) {
    const liquidez = finanzas.activoCorriente / finanzas.pasivoCorriente;
    const endeudamiento = finanzas.pasivoCorriente / finanzas.activoTotal;
    const roe = finanzas.utilidadOperacional / finanzas.patrimonioTotal;
    const roa = finanzas.utilidadOperacional / finanzas.activoTotal;
    const cobertura = finanzas.gastosIntereses > 0
      ? finanzas.utilidadOperacional / finanzas.gastosIntereses
      : null; // Indeterminado: cumple por ausencia de pasivo financiero

    return {
      indicadores: {
        liquidez: { valor: +liquidez.toFixed(2), exigido: exigido.liquidez || 0, cumple: liquidez >= (exigido.liquidez || 0) },
        endeudamiento: { valor: +endeudamiento.toFixed(2), exigido: exigido.endeudamiento || 1, cumple: endeudamiento <= (exigido.endeudamiento || 1) },
        roe: { valor: +roe.toFixed(2), exigido: exigido.roe || 0, cumple: roe >= (exigido.roe || 0) },
        roa: { valor: +roa.toFixed(2), exigido: exigido.roa || 0, cumple: roa >= (exigido.roa || 0) },
        coberturaIntereses: { valor: cobertura === null ? 'Indeterminado' : +cobertura.toFixed(2), cumple: cobertura === null || cobertura >= 1 },
      },
      cumpleFinanciero: true, // se recalcula tras evaluar
    };
  }

  /** Cálculo del puntaje de éxito P_win (0-100%) */
  calcularPWin(input: {
    cumplimientoTecnico: number; // 0-100
    financiero: number; // 0-100
    margen: number; // 0-100
    capacidad: number; // 0-100
  }) {
    // Ponderación del SRS (p.ej.): técnico 30%, financiero 30%, margen 25%, capacidad 15%
    const pWin =
      input.cumplimientoTecnico * 0.3 +
      input.financiero * 0.3 +
      input.margen * 0.25 +
      input.capacidad * 0.15;
    return Math.round(pWin * 10) / 10;
  }

  /** Estima costos y margen (paramétrico) para una oportunidad */
  estimarCostos(cuantiaCop: number, params: { personalPct?: number; viaticosPct?: number; infraPct?: number; margenObjetivoPct?: number }) {
    const personalPct = params.personalPct ?? 0.35;
    const viaticosPct = params.viaticosPct ?? 0.1;
    const infraPct = params.infraPct ?? 0.2;
    const margenObjetivoPct = params.margenObjetivoPct ?? 0.2;

    const personal = cuantiaCop * personalPct;
    const viaticos = cuantiaCop * viaticosPct;
    const infra = cuantiaCop * infraPct;
    const otros = cuantiaCop * (1 - personalPct - viaticosPct - infraPct - margenObjetivoPct);
    const margen = cuantiaCop * margenObjetivoPct;

    return {
      cuantia: cuantiaCop,
      personal: Math.round(personal),
      viaticos: Math.round(viaticos),
      infraestructura: Math.round(infra),
      otros: Math.round(Math.max(otros, 0)),
      margenNeto: Math.round(margen),
      margenPct: margenObjetivoPct * 100,
    };
  }

  /** Genera la decisión sugerida */
  decidir(pWin: number, umbral = 50) {
    return pWin >= umbral ? 'go' : 'nogo';
  }
}
