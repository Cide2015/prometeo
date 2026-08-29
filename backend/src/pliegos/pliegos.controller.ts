import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CopilotService } from '../insights/copilot.service';

/**
 * Copilot RAG (Dif D): indexa pliegos PDF y responde preguntas
 * con citas. También genera resumen IA del pliego (benchmark Alicia).
 */
@Controller('pliegos')
export class PliegosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly copilot: CopilotService,
  ) {}

  /** Listar pliegos indexados del tenant */
  @Get()
  async list(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const items = await this.prisma.pliegoDocument.findMany({
      where: { tenantId },
      include: { opportunity: { select: { entidad: true, objeto: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { items, total: items.length };
  }

  /** Indexar un pliego (texto extraído) para el RAG */
  @Post('indexar')
  async indexar(
    @Headers('authorization') authorization: string,
    @Body() body: { nombre: string; url: string; texto: string; opportunityId?: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    const doc = await this.copilot.indexPliego(tenantId, body);
    return { success: true, doc };
  }

  /** Chat RAG: preguntar sobre los pliegos indexados */
  @Post('chat')
  async chat(
    @Headers('authorization') authorization: string,
    @Body() body: { pregunta: string; opportunityId?: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    if (!body.pregunta) return { error: 'Pregunta requerida' };
    return this.copilot.ask(tenantId, body.pregunta, body.opportunityId);
  }

  /** Resumen IA del pliego: requisitos habilitantes + financieros + experiencia */
  @Post('resumen')
  async resumen(
    @Headers('authorization') authorization: string,
    @Body() body: { opportunityId?: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const finanzas = (tenant?.configuracionesJson as any)?.finanzas;

    // En esta fase genera un resumen estructurado con la línea base financiera del tenant
    // y los requisitos típicos de un pliego (con IA real en la siguiente iteración).
    const pliegos = await this.prisma.pliegoDocument.findMany({
      where: { tenantId, ...(body.opportunityId ? { opportunityId: body.opportunityId } : {}) },
      take: 3,
    });

    return {
      resumen: {
        requisitosHabilitantes: [
          'RUT actualizado',
          'Cámara de Comercio con actividad económica vigente',
          'Estados financieros con corte vigente',
          'Certificado de existencia y representación legal',
          'Paz y salvo de aportes parafiscales',
        ],
        indicadoresFinancierosExigidos: finanzas ? {
          liquidez: finanzas.liquidez,
          endeudamiento: finanzas.endeudamiento,
          roe: finanzas.roe,
          roa: finanzas.roa,
        } : 'Línea base financiera no configurada',
        experienciaRequerida: 'Revisar matriz de experiencia obligatoria del pliego (mínima requerida según objeto).',
        pliegosIndexados: pliegos.map((p) => p.nombre),
        notas: 'Resumen generado por el Agente Auditor. Con IA real (OpenRouter/Gemini) se detalla el análisis del pliego.',
      },
    };
  }

  private resolve(authorization: string): { userId: string; tenantId: string } {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    try {
      const payload = this.jwt.verify(authorization.slice(7));
      return { userId: payload.sub, tenantId: payload.tenantId };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
