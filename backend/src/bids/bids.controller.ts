import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Módulo 4: Generador de Ofertas (Funnel & Assembly)
 * Etapas: Borrador → Análisis Técnico → Generación Documental → Firma → Presentada
 */
@Controller('bids')
export class BidsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Get()
  async list(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const items = await this.prisma.bid.findMany({
      where: { tenantId },
      include: { opportunity: true, rfiRfp: true, analysis: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items, total: items.length };
  }

  /** Crear oferta desde una oportunidad o RFI/RFP */
  @Post()
  async create(
    @Headers('authorization') authorization: string,
    @Body() body: { opportunityId?: string; rfiRfpId?: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    const bid = await this.prisma.bid.create({
      data: {
        tenantId,
        opportunityId: body.opportunityId,
        rfiRfpId: body.rfiRfpId,
        faseFunnel: 'borrador',
      },
    });
    // Si viene de oportunidad, marcarla como aplicada
    if (body.opportunityId) {
      await this.prisma.opportunity.update({
        where: { id: body.opportunityId },
        data: { estado: 'aplicada' },
      });
    }
    return { success: true, bid };
  }

  /** Mover oferta en el funnel */
  @Patch(':id/fase')
  async moverFase(
    @Headers('authorization') authorization: string,
    @Body() body: { id: string; faseFunnel: string; valorOfertado?: number; margenEstimado?: number; pWin?: number },
  ) {
    const { tenantId } = this.resolve(authorization);
    const exist = await this.prisma.bid.findFirst({ where: { id: body.id, tenantId } });
    if (!exist) throw new UnauthorizedException('Oferta no encontrada');

    const validFases = ['borrador', 'analisis', 'documental', 'firma', 'presentada'];
    if (!validFases.includes(body.faseFunnel)) {
      return { error: `Fase inválida. Válidas: ${validFases.join(', ')}` };
    }

    const bid = await this.prisma.bid.update({
      where: { id: body.id },
      data: {
        faseFunnel: body.faseFunnel,
        ...(body.valorOfertado != null ? { valorOfertado: body.valorOfertado } : {}),
        ...(body.margenEstimado != null ? { margenEstimado: body.margenEstimado } : {}),
        ...(body.pWin != null ? { pWin: body.pWin } : {}),
      },
    });
    return { success: true, bid };
  }
}
