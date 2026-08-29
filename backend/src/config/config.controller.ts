import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

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
 * Configuración del tenant (Módulo 7 → tabs Configuración).
 * - Empresa: datos importantes de la empresa (estilo Fenix-SGCN)
 * - SECOP: endpoint + datasets + App Token + filtros + UNSPSC desde áreas de interés
 * - IA: proveedor OpenRouter/Gemini (patrón cide-ia-config)
 * - Usuarios y roles (estilo Argos-RMM)
 * - API propia (api keys, estilo Argos-RMM)
 */
@Controller('config')
export class ConfigController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** ===== TAB EMPRESA ===== */

  @Get('empresa')
  async getEmpresa(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new UnauthorizedException('Tenant no encontrado');
    const cfg = (tenant.configuracionesJson as any)?.empresa || {};
    return {
      nombreComercial: tenant.nombreComercial,
      nit: tenant.nit,
      sector: cfg.sector || '',
      representanteLegal: cfg.representanteLegal || '',
      direccion: cfg.direccion || '',
      ciudad: cfg.ciudad || '',
      telefono: cfg.telefono || '',
      correoContacto: cfg.correoContacto || '',
      web: cfg.web || '',
      descripcion: cfg.descripcion || '',
      lineaBaseFinanciera: cfg.lineaBaseFinanciera || {},
    };
  }

  @Put('empresa')
  async saveEmpresa(
    @Headers('authorization') authorization: string,
    @Body() body: any,
  ) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new UnauthorizedException('Tenant no encontrado');

    const configs = (tenant.configuracionesJson as any) || {};
    const current = configs.empresa || {};

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        configuracionesJson: {
          ...configs,
          empresa: {
            sector: body.sector ?? current.sector,
            representanteLegal: body.representanteLegal ?? current.representanteLegal,
            direccion: body.direccion ?? current.direccion,
            ciudad: body.ciudad ?? current.ciudad,
            telefono: body.telefono ?? current.telefono,
            correoContacto: body.correoContacto ?? current.correoContacto,
            web: body.web ?? current.web,
            descripcion: body.descripcion ?? current.descripcion,
            lineaBaseFinanciera: body.lineaBaseFinanciera ?? current.lineaBaseFinanciera,
          },
        },
      },
    });
    return { success: true, message: 'Datos de la empresa guardados' };
  }

  /** ===== TAB API SECOP ===== */

  /** Valida la conexión con Datos Abiertos (endpoint + dataset) — online/offline */
  @Get('secop/test')
  async testSecopConnection(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const cfg = (tenant?.configuracionesJson as any)?.secop || {};
    const endpoint = cfg.sodaEndpoint || 'https://www.datos.gov.co/resource';
    const dataset = cfg.datasets?.procesos || 'p6dx-8zbt';
    const appToken = cfg.appToken || '';

    const inicio = Date.now();
    try {
      const url = `${endpoint}/${dataset}.json?$limit=1`;
      const res = await fetch(url, {
        headers: { ...(appToken ? { 'X-App-Token': appToken } : {}), Accept: 'application/json' },
      });
      const latencia = Date.now() - inicio;
      if (!res.ok) {
        return {
          online: false,
          message: `El dataset respondió con error ${res.status}. Revisa el endpoint y dataset configurados.`,
          endpoint: url,
          latenciaMs: latencia,
          estado: 'offline',
        };
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      return {
        online: true,
        message: 'Conexión exitosa con Datos Abiertos Colombia.',
        endpoint: url,
        latenciaMs: latencia,
        estado: 'online',
        procesosDisponibles: items.length >= 1 ? 'verificable' : 0,
        appTokenSet: !!appToken,
      };
    } catch (e: any) {
      return {
        online: false,
        message: `No se pudo conectar: ${e?.message || 'error desconocido'}`,
        latenciaMs: Date.now() - inicio,
        estado: 'offline',
      };
    }
  }

  @Get('secop')
  async getSecop(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new UnauthorizedException('Tenant no encontrado');

    const cfg = (tenant.configuracionesJson as any)?.secop || {};
    // UNSPSC desde áreas de interés (perfiles de búsqueda activos)
    const perfiles = await this.prisma.searchProfile.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    const unspscAreas = perfiles.flatMap((p) => (p.unspsc as string[]) || []);
    const unspscFiltro = cfg.filtros?.unspsc || [];

    return {
      ...cfg,
      appTokenSet: !!cfg.appToken,
      unspsc: (tenant.configuracionesJson as any)?.unspsc || [],
      // UNSPSC definidos en áreas de interés
      unspscAreas,
      areasDeInteres: perfiles.map((p) => ({ id: p.id, nombre: p.nombre, unspsc: p.unspsc, isActive: p.isActive })),
      // UNSPSC seleccionados como filtro activo
      unspscSeleccionados: unspscFiltro,
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

  /** ===== TAB MODELOS DE IA ===== */

  @Get('ia')
  async getIa(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const cfg = (tenant?.configuracionesJson as any)?.ia || {};
    const mask = (k?: string) => (k ? k.slice(0, 4) + '••••' + k.slice(-4) : undefined);
    return {
      defaultProvider: cfg.defaultProvider || 'openrouter',
      openrouterModel: cfg.openrouterModel || 'default',
      geminiModel: cfg.geminiModel || 'gemini-2.5-flash',
      openrouterApiKeySet: !!cfg.openrouterApiKey,
      geminiApiKeySet: !!cfg.geminiApiKey,
      openrouterApiKeyMasked: mask(cfg.openrouterApiKey),
      geminiApiKeyMasked: mask(cfg.geminiApiKey),
    };
  }

  @Put('ia')
  async saveIa(
    @Headers('authorization') authorization: string,
    @Body() body: {
      defaultProvider?: string;
      openrouterModel?: string;
      geminiModel?: string;
      openrouterApiKey?: string;
      geminiApiKey?: string;
    },
  ) {
    const { tenantId } = this.resolve(authorization);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new UnauthorizedException('Tenant no encontrado');

    const configs = (tenant.configuracionesJson as any) || {};
    const currentIa = configs.ia || {};

    // Solo sobrescribir la key si NO trae la máscara '••••' (o viene vacía)
    const nextOpenrouter =
      body.openrouterApiKey && !body.openrouterApiKey.includes('••••')
        ? body.openrouterApiKey
        : currentIa.openrouterApiKey;
    const nextGemini =
      body.geminiApiKey && !body.geminiApiKey.includes('••••')
        ? body.geminiApiKey
        : currentIa.geminiApiKey;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        configuracionesJson: {
          ...configs,
          ia: {
            defaultProvider: body.defaultProvider || currentIa.defaultProvider || 'openrouter',
            openrouterModel: body.openrouterModel || currentIa.openrouterModel || 'default',
            geminiModel: body.geminiModel || currentIa.geminiModel || 'gemini-2.5-flash',
            openrouterApiKey: nextOpenrouter,
            geminiApiKey: nextGemini,
          },
        },
      },
    });
    return { success: true, message: 'Configuración de IA guardada' };
  }

  /** ===== TAB USUARIOS Y ROLES ===== */

  @Get('users')
  async listUsers(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true, nombre: true, rol: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return { items: users, roles: ['admin', 'evaluador_tecnico', 'evaluador_financiero', 'operador_proyecto', 'auditor'] };
  }

  @Post('users')
  async createUser(
    @Headers('authorization') authorization: string,
    @Body() body: { email: string; nombre: string; rol: string; password: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    if (!body.email || !body.nombre || !body.rol || !body.password) {
      return { error: 'Todos los campos son requeridos' };
    }
    const exist = await this.prisma.user.findFirst({ where: { tenantId, email: body.email } });
    if (exist) return { error: 'Ya existe un usuario con ese correo' };

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: body.email,
        nombre: body.nombre,
        rol: body.rol,
        passwordHash,
        isActive: true,
        mustChangePassword: true,
      },
    });
    return { success: true, user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, isActive: user.isActive } };
  }

  @Put('users/:id')
  async updateUser(
    @Headers('authorization') authorization: string,
    @Body() body: any,
  ) {
    const { tenantId } = this.resolve(authorization);
    const exist = await this.prisma.user.findFirst({ where: { id: body.id, tenantId } });
    if (!exist) throw new UnauthorizedException('Usuario no encontrado');

    const bcrypt = require('bcryptjs');
    const data: any = {};
    if (body.nombre) data.nombre = body.nombre;
    if (body.rol) data.rol = body.rol;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

    const user = await this.prisma.user.update({ where: { id: body.id }, data });
    return { success: true, user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, isActive: user.isActive } };
  }

  @Delete('users/:id')
  async deleteUser(
    @Headers('authorization') authorization: string,
    @Body() body: { id: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    const exist = await this.prisma.user.findFirst({ where: { id: body.id, tenantId } });
    if (!exist) throw new UnauthorizedException('Usuario no encontrado');
    await this.prisma.user.delete({ where: { id: body.id } });
    return { success: true };
  }

  /** ===== TAB API PROPIA ===== */

  @Get('api-keys')
  async listApiKeys(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const keys = await this.prisma.apiKey.findMany({
      where: { tenantId, revokedAt: null },
      select: { id: true, name: true, prefix: true, lastUsedAt: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { items: keys };
  }

  @Post('api-keys')
  async createApiKey(
    @Headers('authorization') authorization: string,
    @Body() body: { name: string; expiresAt?: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    if (!body.name) return { error: 'Nombre requerido' };
    const prefix = 'pko_' + crypto.randomBytes(4).toString('hex');
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    await this.prisma.apiKey.create({
      data: {
        tenantId,
        name: body.name,
        prefix,
        keyHash,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    // Mostrar la key raw UNA sola vez
    return { success: true, apiKey: `${prefix}.${rawKey}`, prefix, message: 'Guarda esta clave: no se mostrará de nuevo.' };
  }

  @Delete('api-keys/:id')
  async revokeApiKey(
    @Headers('authorization') authorization: string,
    @Body() body: { id: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    const exist = await this.prisma.apiKey.findFirst({ where: { id: body.id, tenantId } });
    if (!exist) throw new UnauthorizedException('Clave no encontrada');
    await this.prisma.apiKey.update({ where: { id: body.id }, data: { revokedAt: new Date() } });
    return { success: true };
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
