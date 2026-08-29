import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Copilot RAG (Dif D + benchmark Alicia chat con pliegos):
 * indexa pliegos y documentos corporativos, responde preguntas
 * en lenguaje natural citando la fuente. Usa la config IA del tenant.
 */
@Injectable()
export class CopilotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Responde una pregunta usando el texto indexado de los pliegos
   * del tenant + la biblioteca corporativa. Búsqueda por relevancia
   * de palabras clave (embeddings pgvector en fase posterior con IA real).
   */
  async ask(tenantId: string, pregunta: string, opportunityId?: string): Promise<any> {
    const pliegos = await this.prisma.pliegoDocument.findMany({
      where: { tenantId, ...(opportunityId ? { opportunityId } : {}) },
    });
    const documentos = await this.prisma.documentLibrary.findMany({ where: { tenantId } });

    if (pliegos.length === 0 && documentos.length === 0) {
      return {
        respuesta: 'Aún no hay pliegos ni documentos indexados. Sube el pliego de una oportunidad o documentos de tu empresa en Configuración.',
        fuentes: [],
      };
    }

    // Búsqueda simple por relevancia de términos de la pregunta
    const terminos = pregunta
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3);

    const resultados: { fuente: string; texto: string; score: number }[] = [];

    for (const p of pliegos) {
      if (!p.texto) continue;
      const texto = p.texto.toLowerCase();
      const hits = terminos.filter((t) => texto.includes(t)).length;
      if (hits > 0) {
        resultados.push({
          fuente: p.nombre,
          texto: this.extractContext(p.texto, pregunta),
          score: hits / terminos.length,
        });
      }
    }

    resultados.sort((a, b) => b.score - a.score);

    // Respuesta sintetizada (con IA real en fase posterior; por ahora extrae contexto)
    const top = resultados.slice(0, 3);
    return {
      pregunta,
      respuesta:
        top.length > 0
          ? `Encontré ${top.length} fragmento(s) relevante(s) en los pliegos. Los más cercanos a tu consulta:`
          : 'No encontré información directamente relacionada en los pliegos indexados. Reformula la pregunta o sube más documentos.',
      fuentes: top.map((r) => ({ fuente: r.fuente, texto: r.texto, score: Math.round(r.score * 100) })),
      documentosIndexados: pliegos.length + documentos.length,
    };
  }

  private extractContext(texto: string, pregunta: string, chars = 400): string {
    const idx = texto.toLowerCase().indexOf(pregunta.toLowerCase().split(/\s+/)[0] || '');
    const start = Math.max(0, idx - 150);
    const end = Math.min(texto.length, start + chars);
    const snippet = texto.slice(start, end).replace(/\s+/g, ' ').trim();
    return snippet.length > 0 ? snippet : texto.slice(0, chars).replace(/\s+/g, ' ').trim();
  }

  /** Registrar un pliego (texto extraído de PDF) para indexar */
  async indexPliego(tenantId: string, data: { nombre: string; url: string; texto: string; opportunityId?: string }) {
    return this.prisma.pliegoDocument.create({
      data: {
        tenantId,
        nombre: data.nombre,
        url: data.url,
        texto: data.texto.slice(0, 100000), // limitar a ~100KB de texto
        tamano: data.texto.length,
        opportunityId: data.opportunityId,
      },
    });
  }
}
