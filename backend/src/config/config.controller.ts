import {
  Body,
  Controller,
  Get,
  Headers,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface SecopConfig {
  sodaEndpoint?: string;
  datasets?: { procesos?: string; contratos?: string; tiendaVirtual?: string };
  appToken?: string;
  filtros?: {
    unspsc?: string[];
    cuantiaMin?: number;
    cuantiaMax?: number;
    departamento?: string;
    municipio?: string;
    modalidad?: string;
    estados?: string[];
  };
  syncCron?: string;
}

/**
 * Configuración SECOP del tenant (Módulo 7 → tab "API SECOP").
 * El usuario coloca aquí las direcciones (endpoint + dataset id) y el App Token
 * que extrae de su cuenta en Datos Abiertos Colombia, más sus filtros de negocio.
 */
@Controller('config')
export class ConfigController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Get('secop')
  async getSecop(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new UnauthorizedException('Tenant no encontrado');

    const cfg = (tenant.configuracionesJson as any)?.secop || {};
    // Nunca devolver el appToken completo al cliente (solo indicar si está configurado)
    return {
      ...cfg,
      appTokenSet: !!cfg.appToken,
      unspsc: (tenant.configuracionesJson as any)?.unspsc || [],
    };
  }

  @Put('secop')
  async saveSecop(
    @Headers('authorization') authorization: string,
    @Body() body: SecopConfig,
  ) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new UnauthorizedException('Tenant no encontrado');

    const configs = (tenant.configuracionesJson as any) || {};
    const currentSecop = configs.secop || {};

    // Si llega appToken nuevo (no vacío), se guarda; si no, se conserva el existente
    const nextAppToken = body.appToken
      ? body.appToken
      : currentSecop.appToken;

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        configuracionesJson: {
          ...configs,
          secop: {
            sodaEndpoint: body.sodaEndpoint || currentSecop.sodaEndpoint || 'https://www.datos.gov.co/resource',
            datasets: {
              procesos: body.datasets?.procesos || currentSecop.datasets?.procesos || 'p6dx-8zbt',
              contratos: body.datasets?.contratos || currentSecop.datasets?.contratos || 'jbjy-vk9h',
              tiendaVirtual: body.datasets?.tiendaVirtual || currentSecop.datasets?.tiendaVirtual || 'rgxm-mmea',
            },
            appToken: nextAppToken,
            filtros: body.filtros || currentSecop.filtros || {},
            syncCron: body.syncCron || currentSecop.syncCron || '0 */6 * * *',
          },
        },
      },
    });
    return {
      success: true,
      message: 'Configuración SECOP guardada',
      appTokenSet: !!(updated.configuracionesJson as any)?.secop?.appToken,
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
