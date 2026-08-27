import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SecopProcess {
  referencia_del_proceso?: string;
  nombre_de_la_entidad?: string;
  descripcion_del_proceso?: string;
  valor_del_contrato?: string | number;
  fecha_de_publicacion_del_proceso?: string;
  fecha_de_cierre_del_proceso?: string;
  estado_del_proceso?: string;
  codigos_unspsc?: string;
  modalidad_de_contratacion?: string;
  departamento?: string;
  municipio?: string;
}

@Injectable()
export class SecopService {
  constructor(private readonly prisma: PrismaService) {}

  private getEndpoint(): string {
    return 'https://www.datos.gov.co/resource/p6dx-8zbt.json';
  }

  /**
   * Ingiesta oportunidades SECOP II (SODA API) para un tenant,
   * filtrando por los códigos UNSPSC configurados del tenant.
   */
  async ingest(tenantId: string): Promise<{ ingested: number; skipped: number }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant no encontrado');

    const unspsc = await this.prisma.unspscProfile.findMany({ where: { tenantId } });
    const codes = unspsc.map((u) => u.codigoUnspsc);
    if (codes.length === 0) return { ingested: 0, skipped: 0 };

    // Consulta SOQL: procesos en presentación de ofertas con los primeros UNSPSC
    const where = [
      `estado_del_proceso='Presentación de ofertas'`,
      `valor_del_contrato > 0`,
    ].join(' AND ');

    const url = `${this.getEndpoint()}?$where=${encodeURIComponent(where)}&$limit=100&$order=valor_del_contrato DESC`;
    const res = await fetch(url, {
      headers: {
        'X-App-Token': (tenant.configuracionesJson as any)?.secop?.appToken || '',
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`SODA API error ${res.status}: ${await res.text()}`);
    }
    const items: SecopProcess[] = await res.json();

    let ingested = 0;
    let skipped = 0;
    for (const it of items) {
      // Filtrar por UNSPSC del tenant
      const itemCodes = (it.codigos_unspsc || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const match = itemCodes.some((c) => codes.some((uc) => uc.startsWith(c.slice(0, 8)) || c.startsWith(uc)));
      if (!match) {
        skipped++;
        continue;
      }

      const cuantia = typeof it.valor_del_contrato === 'string'
        ? parseFloat(it.valor_del_contrato.replace(/[^\d.-]/g, ''))
        : Number(it.valor_del_contrato || 0);

      const existing = await this.prisma.opportunity.findFirst({
        where: { tenantId, secopId: it.referencia_del_proceso || undefined },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await this.prisma.opportunity.create({
        data: {
          tenantId,
          secopId: it.referencia_del_proceso,
          entidad: it.nombre_de_la_entidad,
          objeto: it.descripcion_del_proceso,
          cuantiaCop: isNaN(cuantia) ? null : cuantia,
          fechaCierre: it.fecha_de_cierre_del_proceso ? new Date(it.fecha_de_cierre_del_proceso) : null,
          estado: 'disponible',
          metadataJson: {
            unspsc: itemCodes,
            modalidad: it.modalidad_de_contratacion,
            departamento: it.departamento,
            municipio: it.municipio,
            fechaPublicacion: it.fecha_de_publicacion_del_proceso,
          },
        },
      });
      ingested++;
    }

    return { ingested, skipped };
  }
}
