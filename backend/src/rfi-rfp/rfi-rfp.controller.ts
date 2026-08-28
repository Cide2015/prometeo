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
 * Módulo 2: Gestión de Invitaciones RFI/RFP
 * - Ingesta por correo (webhook n8n) / manual
 * - Aplicar: convierte en borrador de cotización (Bid) a la cola de costeo
 * - Rechazar con elegancia (Smart Decline): registra motivo + genera respuesta
 */
@Controller('rfi-rfp')
export class RfiRfpController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Get()
  async list(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const items = await this.prisma.rfiRfp.findMany({
      where: { tenantId },
      orderBy: { fechaRecibido: 'desc' },
      take: 100,
    });
    return { items, total: items.length };
  }

  /** Registrar una invitación RFI/RFP (manual o webhook n8n) */
  @Post()
  async create(
    @Headers('authorization') authorization: string,
    @Body() body: {
      entidad: string;
      emailOrigen?: string;
      asunto: string;
      descripcion?: string;
      fechaLimite?: string;
    },
  ) {
    const { tenantId } = this.resolve(authorization);
    const item = await this.prisma.rfiRfp.create({
      data: {
        tenantId,
        entidad: body.entidad,
        emailOrigen: body.emailOrigen,
        asunto: body.asunto,
        descripcion: body.descripcion,
        fechaLimite: body.fechaLimite ? new Date(body.fechaLimite) : null,
        estado: 'recibida',
      },
    });
    return { success: true, item };
  }

  /** Aplicar: convierte el RFI/RFP en borrador de cotización (Bid) */
  @Post(':id/aplicar')
  async aplicar(
    @Headers('authorization') authorization: string,
    @Body() body: { id: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    const rfi = await this.prisma.rfiRfp.findFirst({ where: { id: body.id, tenantId } });
    if (!rfi) throw new UnauthorizedException('Invitación no encontrada');

    const bid = await this.prisma.bid.create({
      data: {
        tenantId,
        rfiRfpId: rfi.id,
        faseFunnel: 'borrador',
      },
    });
    await this.prisma.rfiRfp.update({ where: { id: rfi.id }, data: { estado: 'aplicada' } });
    return { success: true, bidId: bid.id, message: 'RFI/RFP aplicado, enviado a costeo rápido' };
  }

  /** Rechazar con elegancia (Smart Decline) */
  @Patch(':id/rechazar')
  async rechazar(
    @Headers('authorization') authorization: string,
    @Body() body: { id: string; motivoRechazo: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    const rfi = await this.prisma.rfiRfp.findFirst({ where: { id: body.id, tenantId } });
    if (!rfi) throw new UnauthorizedException('Invitación no encontrada');

    await this.prisma.rfiRfp.update({
      where: { id: rfi.id },
      data: { estado: 'rechazada', motivoRechazo: body.motivoRechazo },
    });

    // Smart Decline: en una fase posterior el agente Drafter genera el PDF y correo
    return {
      success: true,
      message: 'Invitación rechazada con elegancia',
      sugerenciaRespuesta: [
        'Estimados señores, agradecemos la invitación a participar en el proceso.',
        'Lamentablemente, por nuestra capacidad operativa actual no podemos participar en esta oportunidad.',
        'Reiteramos nuestro interés en mantener la relación comercial y quedar en su base de proveedores.',
        'CIDE SAS · Soluciones Prácticas Empresariales',
      ].join('\n'),
    };
  }
}
