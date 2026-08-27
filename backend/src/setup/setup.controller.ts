import { Body, Controller, Get, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Endpoints de setup/onboarding (estilo Argos-RMM):
 * permiten crear o consultar el registro inicial de la empresa (tenant).
 * En producción queda detrás de autenticación; el primer admin lo usa una vez.
 */
@Controller('setup')
export class SetupController {
  constructor(private readonly prisma: PrismaService) {}

  /** Estado del registro inicial: ¿existe la empresa? */
  @Get('status')
  async status() {
    const tenant = await this.prisma.tenant.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!tenant) {
      return { initialized: false, message: 'No existe registro de empresa. Ejecutar bootstrap.' };
    }
    const userCount = await this.prisma.user.count({ where: { tenantId: tenant.id } });
    const unspscCount = await this.prisma.unspscProfile.count({ where: { tenantId: tenant.id } });
    return {
      initialized: true,
      tenantId: tenant.id,
      nombreComercial: tenant.nombreComercial,
      nit: tenant.nit,
      users: userCount,
      unspscProfiles: unspscCount,
      secopConfigurado: !!(tenant.configuracionesJson as any)?.secop,
    };
  }

  /** Crear (o re-crear) el registro inicial de la empresa desde cero */
  @Post('init')
  async init(@Body() body: {
    nombreComercial?: string;
    nit?: string;
    email?: string;
    password?: string;
  }) {
    const nombre = body.nombreComercial || 'CIDE SOLUCIONES PRÁCTICAS EMPRESARIALES S.A.S.';
    const nit = body.nit || '900.858.048-0';

    // Idempotente: si ya existe la empresa, no duplicar
    const existing = await this.prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
    if (existing) {
      return { initialized: true, tenantId: existing.id, message: 'La empresa ya está registrada' };
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        nombreComercial: nombre,
        nit,
        configuracionesJson: {
          secop: { sodaEndpoint: 'https://www.datos.gov.co/resource/p6dx-8zbt.json', appToken: '', estadoFiltro: 'Presentación de ofertas' },
          smmlv2026: 1450000,
        },
      },
    });
    return { initialized: true, tenantId: tenant.id, nombreComercial: nombre, nit };
  }
}
