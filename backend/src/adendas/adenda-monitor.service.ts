import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Monitor de Adendas (Dif C): revisa periódicamente (cada 30 min)
 * los procesos SECOP seguidos por el tenant y detecta cambios en
 * fechas clave o estado, generando alertas de adenda.
 */
@Injectable()
export class AdendaMonitorService {
  constructor(private readonly prisma: PrismaService) {}

  /** Verifica cambios en procesos seguidos (se invoca por cron/n8n) */
  async check(tenantId: string, procesos: { secopId: string; fechaAnterior?: string; estadoAnterior?: string }[]): Promise<{ cambios: number }> {
    let cambios = 0;
    const secopCfg = (await this.prisma.tenant.findUnique({ where: { id: tenantId } }))?.configuracionesJson as any;
    const appToken = secopCfg?.secop?.appToken || '';
    const endpoint = secopCfg?.secop?.sodaEndpoint || 'https://www.datos.gov.co/resource';

    for (const proc of procesos) {
      try {
        const url = `${endpoint}/p6dx-8zbt.json?$where=${encodeURIComponent(`referencia_del_proceso='${proc.secopId}'`)}&$limit=1`;
        const res = await fetch(url, {
          headers: { ...(appToken ? { 'X-App-Token': appToken } : {}), Accept: 'application/json' },
        });
        if (!res.ok) continue;
        const items = await res.json();
        const actual = items[0];
        if (!actual) continue;

        const fechaActual = actual.fecha_de_publicacion_del || actual.fecha_de_publicacion_fase_1 || '';
        const estadoActual = actual.estado_del_procedimiento || '';

        const cambioDetectado: any = {};
        if (proc.fechaAnterior && fechaActual && proc.fechaAnterior !== fechaActual) {
          cambioDetectado.fecha = { anterior: proc.fechaAnterior, actual: fechaActual };
        }
        if (proc.estadoAnterior && estadoActual && proc.estadoAnterior !== estadoActual) {
          cambioDetectado.estado = { anterior: proc.estadoAnterior, actual: estadoActual };
        }

        if (Object.keys(cambioDetectado).length > 0) {
          cambios++;
          await this.prisma.adendaAlert.create({
            data: {
              tenantId,
              opportunityId: proc.secopId, // se mapea a la oportunidad por secopId
              procesoId: proc.secopId,
              fechaAnterior: proc.fechaAnterior ? new Date(proc.fechaAnterior) : null,
              cambioDetectado,
            },
          });
        }
      } catch {
        // continuar con el siguiente
      }
    }
    return { cambios };
  }

  /** Lista alertas de adenda del tenant */
  async alerts(tenantId: string) {
    return this.prisma.adendaAlert.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
