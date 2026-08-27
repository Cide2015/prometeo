import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SecopProcess {
  referencia_del_proceso?: string;
  entidad?: string;
  departamento_entidad?: string;
  ciudad_entidad?: string;
  nombre_del_procedimiento?: string;
  descripcion_del_proceso?: string;
  precio_base?: string | number;
  fase?: string;
  estado_del_procedimiento?: string;
  modalidad_de_contratacion?: string;
  codigo_principal_de_categoria?: string;
  categorias_adicionales?: string;
  fecha_de_publicacion_del?: string;
  urlproceso?: string;
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
   * Esquema real del dataset p6dx-8zbt (SECOP II Procesos):
   *  - estado_del_procedimiento (estado del proceso)
   *  - precio_base (cuantía)
   *  - codigo_principal_de_categoria / categorias_adicionales (UNSPSC)
   */
  async ingest(tenantId: string): Promise<{ ingested: number; skipped: number }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant no encontrado');

    const unspsc = await this.prisma.unspscProfile.findMany({ where: { tenantId } });
    const codes = unspsc.map((u) => u.codigoUnspsc);
    if (codes.length === 0) return { ingested: 0, skipped: 0 };

    // Consulta SOQL: procesos vigentes (Abierto o Publicado) con cuantía
    const where = [
      `estado_del_procedimiento in ('Abierto','Publicado')`,
      `precio_base > 0`,
    ].join(' AND ');

    const url = `${this.getEndpoint()}?$where=${encodeURIComponent(where)}&$limit=100&$order=precio_base DESC`;
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
      // Filtrar por UNSPSC del tenant (categoría principal + adicionales)
      // Normalizar: el dataset usa formato "V1.80111500" → extraer los 8 dígitos
      const normalize = (c: string) => c.replace(/^V\d+\./, '').slice(0, 8);
      const itemCodes = [
        it.codigo_principal_de_categoria,
        ...(it.categorias_adicionales || '').split(','),
      ]
        .map((c) => (c || '').trim())
        .filter((c) => c && c !== 'No definido' && c !== 'UNSPECIFIED')
        .map(normalize);
      // Match por los primeros 4 dígitos (nivel segmento/familia): el dataset
      // publica categorías de nivel superior (p.ej. 80101600) mientras el tenant
      // configura códigos completos de 8 dígitos (p.ej. 80101601).
      const match = itemCodes.some((c) =>
        codes.some((uc) => uc.slice(0, 4) === c.slice(0, 4) || c.slice(0, 4) === uc.slice(0, 4)),
      );
      if (!match) {
        skipped++;
        continue;
      }

      const cuantia = typeof it.precio_base === 'string'
        ? parseFloat(it.precio_base.replace(/[^\d.-]/g, ''))
        : Number(it.precio_base || 0);

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
          entidad: it.entidad,
          objeto: it.descripcion_del_proceso || it.nombre_del_procedimiento,
          cuantiaCop: isNaN(cuantia) ? null : cuantia,
          fechaCierre: it.fecha_de_publicacion_del ? new Date(it.fecha_de_publicacion_del) : null,
          estado: 'disponible',
          metadataJson: {
            unspsc: itemCodes,
            modalidad: it.modalidad_de_contratacion,
            departamento: it.departamento_entidad,
            ciudad: it.ciudad_entidad,
            fase: it.fase,
            url: it.urlproceso,
          },
        },
      });
      ingested++;
    }

    return { ingested, skipped };
  }
}
