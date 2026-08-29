import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Agente Drafter (Dif B): genera la propuesta técnica y documental.
 * En esta fase genera plantillas estructuradas de los anexos oficiales
 * de Colombia Compra Eficiente; con IA real (OpenRouter/Gemini) se redacta
 * el contenido en la siguiente iteración.
 */
@Injectable()
export class DrafterService {
  constructor(private readonly prisma: PrismaService) {}

  /** Genera la carta de presentación a partir de la oportunidad */
  async cartaPresentacion(tenantId: string, bidId: string): Promise<{ titulo: string; contenido: string }> {
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, tenantId },
      include: { opportunity: true, rfiRfp: true, tenant: true },
    });
    if (!bid) throw new Error('Oferta no encontrada');

    const tenant = bid.tenant;
    const entidad = bid.opportunity?.entidad || bid.rfiRfp?.entidad || '[Entidad]';
    const objeto = bid.opportunity?.objeto || bid.rfiRfp?.asunto || '[Objeto del proceso]';

    const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    const representante = 'Representante Legal';

    return {
      titulo: 'Carta de Presentación',
      contenido: `[Lugar y fecha: ${fecha}]\n\nSeñores\n${entidad}\nCiudad\n\nAsunto: Presentación de propuesta para el proceso "${objeto}"\n\nRespetados señores:\n\nReciban un cordial saludo. ${tenant.nombreComercial} (NIT ${tenant.nit}), en cumplimiento de los requisitos del proceso de la referencia, presenta formalmente su propuesta para el objeto contractual indicado.\n\nManifestamos que conocemos y aceptamos los términos de los pliegos de condiciones, los estudios previos y sus anexos, y nos comprometemos a ejecutar el objeto contractual en las condiciones, plazos y calidad exigidos.\n\nAdjuntamos los documentos de la propuesta, según el formato de verificación del pliego.\n\nCordialmente,\n\n${representante}\n${tenant.nombreComercial}\nNIT ${tenant.nit}`,
    };
  }

  /** Genera el formato de experiencia a partir de proyectos ganados del tenant */
  async formatoExperiencia(tenantId: string): Promise<{ titulo: string; contenido: string }> {
    const projects = await this.prisma.contractProject.findMany({
      where: { tenantId },
      include: { bid: { include: { opportunity: true } } },
      take: 5,
    });

    const lineas = projects.length
      ? projects.map(
          (p, i) =>
            `${i + 1}. ${p.bid?.opportunity?.entidad || '[Entidad]'} — ${p.bid?.opportunity?.objeto || '[Objeto]'} — Contrato ${p.numeroContrato || 'N/A'} — Valor: $${Number(p.valorTotal || 0).toLocaleString('es-CO')}`,
        ).join('\n')
      : '1. [Registrar experiencia previa en el Módulo 5 - Ganadas]';

    return {
      titulo: 'Formato de Experiencia',
      contenido: `Experiencia de ${(await this.prisma.tenant.findUnique({ where: { id: tenantId } }))?.nombreComercial}\n\n${lineas}\n\nSe anexan certificados de ejecución y actas de liquidación.`,
    };
  }

  /** Genera la declaración de inhabilidades e incompatibilidades */
  async declaracionInhabilidades(tenantId: string): Promise<{ titulo: string; contenido: string }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    return {
      titulo: 'Declaración de Inhabilidades e Incompatibilidades',
      contenido: `Declaración bajo la gravedad del juramento que presenta ${tenant?.nombreComercial}, identificada con NIT ${tenant?.nit}:\n\n- No nos encontramos incursos en las causales de inhabilidad e incompatibilidad previstas en la Constitución Política y la Ley 80 de 1993 y normas concordantes.\n- No tenemos conflictos de interés con la entidad contratante.\n- La información suministrada es veraz y verificable.`,
    };
  }
}
