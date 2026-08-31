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
  fecha_de_ultima_publicaci?: string;
  fecha_de_publicacion_fase_3?: string;
  urlproceso?: string;
  adjudicado?: string;
  estado_de_apertura_del_proceso?: string;
  estado_resumen?: string;
  tipo_de_contrato?: string;
  subtipo_de_contrato?: string;
  duracion?: string;
  unidad_de_duracion?: string;
  numero_de_lotes?: string;
  respuestas_al_procedimiento?: string;
  visualizaciones_del?: string;
  codigo_entidad?: string;
  nit_entidad?: string;
  nombre_de_la_unidad_de?: string;
}

@Injectable()
export class SecopService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ingiesta oportunidades SECOP II (SODA API) para un tenant usando
   * la configuración del tenant (endpoint, dataset, App Token y filtros).
   * La consulta es ABIERTA: trae los procesos vigentes (Abierto/Publicado)
   * sin filtrar por UNSPSC — el filtro por áreas de interés se aplica
   * en el listado (espejo SECOP, agrupado por área).
   */
  async ingest(tenantId: string): Promise<{ ingested: number; skipped: number }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant no encontrado');

    // Configuración del tenant (Módulo 7 → tab API SECOP)
    const secopCfg = (tenant.configuracionesJson as any)?.secop || {};
    const sodaEndpoint = secopCfg.sodaEndpoint || 'https://www.datos.gov.co/resource';
    const dataset = secopCfg.datasets?.procesos || 'p6dx-8zbt';
    const appToken = secopCfg.appToken || '';
    const filtros = secopCfg.filtros || {};

    const whereClauses: string[] = [];
    // Estados vigentes configurados (default: Abierto/Publicado)
    const estados = filtros.estados?.length ? filtros.estados : ['Abierto', 'Publicado'];
    whereClauses.push(`estado_del_procedimiento in (${estados.map((e) => `'${e}'`).join(',')})`);
    whereClauses.push(`precio_base > 0`);
    if (filtros.cuantiaMin) whereClauses.push(`precio_base >= ${filtros.cuantiaMin}`);
    if (filtros.cuantiaMax) whereClauses.push(`precio_base <= ${filtros.cuantiaMax}`);
    if (filtros.departamento) whereClauses.push(`departamento_entidad='${filtros.departamento}'`);
    if (filtros.modalidad) whereClauses.push(`modalidad_de_contratacion='${filtros.modalidad}'`);

    // ===== FILTRO DE OPORTUNIDADES ACTIVAS =====
    // Solo procesos vigentes y activos: NO adjudicados, NO cerrados, en fase de ofertas.
    // Excluye cancelados, adjudicados, cerrados, borrador, observaciones, etc.
    whereClauses.push(`adjudicado = 'No'`);
    whereClauses.push(`estado_de_apertura_del_proceso = 'Abierto'`);
    // Fases activas en las que se puede participar (presentación de ofertas / ofertas)
    const fasesActivas = [
      'Presentación de oferta',
      'Presentación de oferta (precalificación)',
      'Fase de ofertas',
      'Fase de Selección (Presentación de ofertas)',
      'Proceso de ofertas',
      'Manifestación de interés (Menor Cuantía)',
      'Manifestación de interés',
    ];
    whereClauses.push(`fase in (${fasesActivas.map((f) => `'${f}'`).join(',')})`);

    // Áreas de interés ACTIVAS del tenant: sus códigos UNSPSC (segmento 4 dígitos)
    const areas = await this.prisma.searchProfile.findMany({
      where: { tenantId, isActive: true },
    });
    const areaCodigos = areas.flatMap((a) => (a.unspsc as string[]) || []);
    // Segmentos únicos (4 primeros dígitos) para acotar la consulta a los intereses del tenant
    const segmentos = [...new Set(areaCodigos.map((c) => c.slice(0, 4)))];

    if (segmentos.length > 0) {
      // Acotar por categoría principal O categorías adicionales (formato "V1.81111500")
      const catOr = segmentos
        .map((s) => `codigo_principal_de_categoria like 'V1.${s}%'`)
        .join(' OR ');
      const catAdOr = segmentos
        .map((s) => `categorias_adicionales like '%${s}%'`)
        .join(' OR ');
      whereClauses.push(`(${catOr} OR ${catAdOr})`);
    }

    const where = whereClauses.join(' AND ');
    // Consulta acotada por áreas de interés del tenant (hasta 1000 procesos vigentes recientes).
    // $limit máximo por request SODA es 1000; para más se paginaría con $offset.
    const url = `${sodaEndpoint}/${dataset}.json?$where=${encodeURIComponent(where)}&$limit=1000&$order=fecha_de_publicacion_del DESC`;
    const res = await fetch(url, {
      headers: {
        ...(appToken ? { 'X-App-Token': appToken } : {}),
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
      // Normalizar: el dataset usa formato "V1.80111500" → extraer los 8 dígitos
      const normalize = (c: string) => c.replace(/^V\d+\./, '').slice(0, 8);
      const itemCodes = [
        it.codigo_principal_de_categoria,
        ...(it.categorias_adicionales || '').split(','),
      ]
        .map((c) => (c || '').trim())
        .filter((c) => c && c !== 'No definido' && c !== 'UNSPECIFIED')
        .map(normalize);

      const cuantia = typeof it.precio_base === 'string'
        ? parseFloat(it.precio_base.replace(/[^\d.-]/g, ''))
        : Number(it.precio_base || 0);

      const existing = await this.prisma.opportunity.findFirst({
        where: { tenantId, secopId: it.referencia_del_proceso || undefined },
      });

      // Metadata enriquecido (se guarda igual en creación y actualización)
      const esActiva = it.adjudicado === 'No' && it.estado_de_apertura_del_proceso === 'Abierto';
      const metadataNuevo = {
        unspsc: itemCodes,
        modalidad: it.modalidad_de_contratacion,
        departamento: it.departamento_entidad,
        ciudad: it.ciudad_entidad,
        fase: it.fase,
        url: it.urlproceso,
        adjudicado: it.adjudicado,
        estadoApertura: it.estado_de_apertura_del_proceso,
        activa: esActiva,
        // Fechas importantes
        fechaPublicacion: it.fecha_de_publicacion_del || null,
        fechaUltimaPublicacion: it.fecha_de_ultima_publicaci || null,
        fechaPublicacionFase3: it.fecha_de_publicacion_fase_3 || null,
        // Detalle ampliado para el modal
        estadoResumen: it.estado_resumen,
        tipoContrato: it.tipo_de_contrato,
        subtipoContrato: it.subtipo_de_contrato,
        duracion: it.duracion,
        unidadDuracion: it.unidad_de_duracion,
        numeroLotes: it.numero_de_lotes,
        respuestas: it.respuestas_al_procedimiento,
        visualizaciones: it.visualizaciones_del,
        codigoEntidad: it.codigo_entidad,
        nitEntidad: it.nit_entidad,
        unidadCompra: it.nombre_de_la_unidad_de,
      };

      if (existing) {
        // Reconciliación: sincronizar estado con su actividad real PERO conservar favorito.
        const esActiva = it.adjudicado === 'No' && it.estado_de_apertura_del_proceso === 'Abierto';
        const estadoCorrecto = esActiva ? 'disponible' : 'descartada';
        const oldMetadata = (existing.metadataJson as any) || {};
        const hayCambios =
          existing.estado !== estadoCorrecto ||
          (it.descripcion_del_proceso || it.nombre_del_procedimiento) !== existing.objeto ||
          (typeof it.precio_base === 'string'
            ? parseFloat(it.precio_base.replace(/[^\d.-]/g, ''))
            : Number(it.precio_base || 0)) !== Number(existing.cuantiaCop || 0) ||
          (it.modalidad_de_contratacion || '') !== (oldMetadata.modalidad || '') ||
          (it.fecha_de_publicacion_del || null) !== (oldMetadata.fechaPublicacion || null);

        if (hayCambios) {
          // Solo actualizar si hubo cambios reales — NUNCA tocar `favorito`
          await this.prisma.opportunity.update({
            where: { id: existing.id },
            data: {
              entidad: it.entidad,
              objeto: it.descripcion_del_proceso || it.nombre_del_procedimiento,
              cuantiaCop: isNaN(cuantia) ? null : cuantia,
              fechaCierre: it.fecha_de_publicacion_del ? new Date(it.fecha_de_publicacion_del) : null,
              estado: estadoCorrecto,
              metadataJson: { ...oldMetadata, ...metadataNuevo },
            },
          });
        }
        skipped++;
        continue;
      }

      const esActivaNueva = it.adjudicado === 'No' && it.estado_de_apertura_del_proceso === 'Abierto';
      await this.prisma.opportunity.create({
        data: {
          tenantId,
          secopId: it.referencia_del_proceso,
          entidad: it.entidad,
          objeto: it.descripcion_del_proceso || it.nombre_del_procedimiento,
          cuantiaCop: isNaN(cuantia) ? null : cuantia,
          fechaCierre: it.fecha_de_publicacion_del ? new Date(it.fecha_de_publicacion_del) : null,
          estado: esActivaNueva ? 'disponible' : 'descartada',
          metadataJson: metadataNuevo,
        },
      });
      ingested++;
    }

    return { ingested, skipped };
  }
}
