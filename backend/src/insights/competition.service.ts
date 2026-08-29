import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ContractRecord {
  nombre_de_la_entidad?: string;
  nombre_del_proveedor?: string;
  nit_del_proveedor?: string;
  valor_del_contrato?: string | number;
  estado_contrato?: string;
  referencia_del_contrato?: string;
  fecha_de_firma?: string;
}

/**
 * Análisis de Competencia (P3 + benchmark Alicia BETA):
 * consulta el dataset SECOP II Contratos (jbjy-vk9h) para identificar
 * quién gana, montos, frecuencia y patrones por entidad.
 */
@Injectable()
export class CompetitionService {
  constructor(private readonly prisma: PrismaService) {}

  private getEndpoint(): string {
    return 'https://www.datos.gov.co/resource/jbjy-vk9h.json';
  }

  /**
   * Historial de adjudicaciones para una entidad o código UNSPSC.
   */
  async analyze(tenantId: string, entidad?: string, unspsc?: string): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const secopCfg = (tenant?.configuracionesJson as any)?.secop || {};
    const appToken = secopCfg.appToken || '';
    const endpoint = secopCfg.sodaEndpoint || 'https://www.datos.gov.co/resource';

    const where: string[] = [];
    if (entidad) where.push(`nombre_de_la_entidad='${entidad}'`);
    if (unspsc) where.push(`categoria_principal='${unspsc}'`);

    const url = `${endpoint}/jbjy-vk9h.json?$limit=100&$order=fecha_de_firma DESC${
      where.length ? `&$where=${encodeURIComponent(where.join(' AND '))}` : ''
    }`;

    const res = await fetch(url, {
      headers: {
        ...(appToken ? { 'X-App-Token': appToken } : {}),
        Accept: 'application/json',
      },
    });
    if (!res.ok) return { error: `Error consultando SECOP contratos: ${res.status}`, total: 0 };

    const items: ContractRecord[] = await res.json();

    // Agregar por proveedor
    const porProveedor = new Map<string, { contratos: number; total: number }>();
    for (const it of items) {
      const proveedor = it.nombre_del_proveedor || 'Desconocido';
      const valor = typeof it.valor_del_contrato === 'string'
        ? parseFloat(it.valor_del_contrato.replace(/[^\d.-]/g, ''))
        : Number(it.valor_del_contrato || 0);
      const cur = porProveedor.get(proveedor) || { contratos: 0, total: 0 };
      cur.contratos += 1;
      cur.total += isNaN(valor) ? 0 : valor;
      porProveedor.set(proveedor, cur);
    }

    const competidores = [...porProveedor.entries()]
      .map(([proveedor, v]) => ({
        proveedor,
        contratos: v.contratos,
        totalAdjudicado: v.total,
        promedio: v.total / v.contratos,
      }))
      .sort((a, b) => b.totalAdjudicado - a.totalAdjudicado)
      .slice(0, 10);

    return { total: items.length, competidores, entidad: entidad || 'todas' };
  }
}
