import { Body, Controller, Get, Post } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Endpoints de setup/onboarding (estilo Argos-RMM):
 * permiten crear o consultar el registro inicial de la empresa (tenant)
 * y su usuario administrador desde el modal de registro.
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
      return { initialized: false, message: 'No existe registro de empresa. Crear desde el modal de registro.' };
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

  /**
   * Crear el registro inicial de la empresa desde el modal de registro:
   * crea el tenant + usuario administrador + perfiles UNSPSC.
   * El admin arranca con mustChangePassword=true (cambio obligatorio).
   */
  @Post('init')
  async init(@Body() body: {
    nombreComercial?: string;
    nit?: string;
    email?: string;
    password?: string;
    unspsc?: string[];
  }) {
    const nombre = body.nombreComercial || 'CIDE SOLUCIONES PRÁCTICAS EMPRESARIALES S.A.S.';
    const nit = body.nit || '900.858.048-0';
    const email = body.email || 'admin@cidesas.com';
    const password = body.password || 'Prometeo2026!';
    const unspsc = body.unspsc || [];

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
          secop: {
            sodaEndpoint: 'https://www.datos.gov.co/resource',
            datasets: { procesos: 'p6dx-8zbt', contratos: 'jbjy-vk9h', tiendaVirtual: 'rgxm-mmea' },
            appToken: '',
            filtros: {},
            syncCron: '0 */6 * * *',
          },
          unspsc,
          smmlv2026: 1450000,
        },
      },
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        nombre: 'Administrador',
        rol: 'Admin',
        isActive: true,
        mustChangePassword: true,
      },
    });

    // Perfiles UNSPSC
    for (const codigo of unspsc) {
      await this.prisma.unspscProfile.create({
        data: { tenantId: tenant.id, codigoUnspsc: codigo, descripcion: `UNSPSC ${codigo}` },
      });
    }

    return {
      initialized: true,
      tenantId: tenant.id,
      nombreComercial: nombre,
      nit,
      adminEmail: user.email,
      message: 'Empresa y administrador creados correctamente',
    };
  }
}
