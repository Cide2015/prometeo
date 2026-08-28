import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Módulo 5: Gestión de Ganadas (Project Delivery)
 * - Creación automática del proyecto operativo desde la oferta adjudicada
 * - Hitos/entregables, documentos contractuales, control de SLAs
 */
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Get()
  async list(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const items = await this.prisma.contractProject.findMany({
      where: { tenantId },
      include: {
        bid: { include: { opportunity: true, rfiRfp: true } },
        milestones: true,
        documents: true,
        ledgers: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items, total: items.length };
  }

  /** Crear proyecto ganado desde una oferta (bid) presentada */
  @Post()
  async create(
    @Headers('authorization') authorization: string,
    @Body() body: {
      bidId: string;
      numeroContrato?: string;
      fechaInicio?: string;
      fechaFin?: string;
      valorTotal?: number;
    },
  ) {
    const { tenantId } = this.resolve(authorization);
    const bid = await this.prisma.bid.findFirst({ where: { id: body.bidId, tenantId } });
    if (!bid) throw new UnauthorizedException('Oferta no encontrada');

    const project = await this.prisma.contractProject.create({
      data: {
        tenantId,
        bidId: body.bidId,
        numeroContrato: body.numeroContrato,
        fechaInicio: body.fechaInicio ? new Date(body.fechaInicio) : null,
        fechaFin: body.fechaFin ? new Date(body.fechaFin) : null,
        valorTotal: body.valorTotal,
        estado: 'activo',
      },
    });

    // Crear hitos iniciales por defecto (gobernanza post-adjudicación)
    const hitosBase = [
      { nombre: 'Acta de inicio', dias: 5 },
      { nombre: 'Primer entregable', dias: 30 },
      { nombre: 'Informe de supervisión', dias: 60 },
      { nombre: 'Acta de liquidación', dias: 90 },
    ];
    const base = body.fechaInicio ? new Date(body.fechaInicio) : new Date();
    for (const h of hitosBase) {
      const fecha = new Date(base);
      fecha.setDate(fecha.getDate() + h.dias);
      await this.prisma.projectMilestone.create({
        data: { tenantId, projectId: project.id, nombre: h.nombre, fechaPrevista: fecha },
      });
    }

    return { success: true, project };
  }

  /** Crear hito en un proyecto */
  @Post(':id/hitos')
  async addHito(
    @Headers('authorization') authorization: string,
    @Body() body: { id: string; nombre: string; fechaPrevista?: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    const project = await this.prisma.contractProject.findFirst({ where: { id: body.id, tenantId } });
    if (!project) throw new UnauthorizedException('Proyecto no encontrado');
    const hito = await this.prisma.projectMilestone.create({
      data: {
        tenantId,
        projectId: project.id,
        nombre: body.nombre,
        fechaPrevista: body.fechaPrevista ? new Date(body.fechaPrevista) : null,
      },
    });
    return { success: true, hito };
  }

  /** Registrar documento contractual (acta, informe) */
  @Post(':id/documentos')
  async addDocumento(
    @Headers('authorization') authorization: string,
    @Body() body: { id: string; tipo: string; nombre: string; url: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    const project = await this.prisma.contractProject.findFirst({ where: { id: body.id, tenantId } });
    if (!project) throw new UnauthorizedException('Proyecto no encontrado');
    const doc = await this.prisma.contractDocument.create({
      data: { tenantId, projectId: project.id, tipo: body.tipo, nombre: body.nombre, url: body.url },
    });
    return { success: true, documento: doc };
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
