import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Notificaciones (P1 + benchmark Alicia "correo diario"):
 * genera el resumen diario de nuevas oportunidades que coinciden
 * con los perfiles de búsqueda del tenant, y registra el log.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Genera y registra el resumen diario para un tenant */
  async generarDiario(tenantId: string): Promise<{ enviados: number; oportunidades: number }> {
    const [profiles, opportunities] = await Promise.all([
      this.prisma.searchProfile.findMany({ where: { tenantId, isActive: true } }),
      this.prisma.opportunity.findMany({
        where: { tenantId, estado: 'disponible' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    if (profiles.length === 0) {
      await this.prisma.notificationLog.create({
        data: {
          tenantId,
          tipo: 'diaria',
          asunto: 'Resumen diario de oportunidades',
          contenido: 'No hay perfiles de búsqueda configurados. Crea perfiles en Configuración → Perfiles de búsqueda.',
          enviado: true,
        },
      });
      return { enviados: 1, oportunidades: 0 };
    }

    // Coincidir oportunidades con perfiles (por palabras clave / UNSPSC)
    const matches = opportunities.filter((o) => {
      const objeto = (o.objeto || '').toLowerCase();
      return profiles.some((p) => {
        if (p.palabrasClave) {
          const kws = p.palabrasClave.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
          if (kws.some((k) => objeto.includes(k))) return true;
        }
        const unspsc = (p.unspsc as string[]) || [];
        if (unspsc.length && o.metadataJson && (o.metadataJson as any).unspsc) {
          const itemCodes = ((o.metadataJson as any).unspsc as string[]) || [];
          if (itemCodes.some((c) => unspsc.some((u) => u.slice(0, 4) === c.slice(0, 4)))) return true;
        }
        return false;
      });
    });

    const lineas = matches.length
      ? matches.map((o) => `- ${o.entidad || 'Entidad'}: ${(o.objeto || '').slice(0, 80)} — $${Number(o.cuantiaCop || 0).toLocaleString('es-CO')} — cierre ${o.fechaCierre ? o.fechaCierre.toISOString().slice(0, 10) : 'N/A'}`).join('\n')
      : 'No se encontraron nuevas oportunidades que coincidan con tus perfiles hoy.';

    await this.prisma.notificationLog.create({
      data: {
        tenantId,
        tipo: 'diaria',
        asunto: `Resumen diario de oportunidades (${matches.length} nuevas)`,
        contenido: `Oportunidades relevantes para tus ${profiles.length} perfil(es) de búsqueda:\n\n${lineas}`,
        enviado: true,
      },
    });

    return { enviados: 1, oportunidades: matches.length };
  }

  /** Historial de notificaciones del tenant */
  async historial(tenantId: string) {
    return this.prisma.notificationLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
