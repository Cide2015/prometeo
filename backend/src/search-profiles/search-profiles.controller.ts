import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Perfiles de búsqueda (benchmark Alicia): hasta 3 por tenant según
 * líneas de negocio o equipos. Cada perfil tiene sus palabras clave,
 * UNSPSC, cuantías, ubicación y modalidad.
 */
@Controller('search-profiles')
export class SearchProfilesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Get()
  async list(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    const items = await this.prisma.searchProfile.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return { items, total: items.length, maxPerTenant: 3 };
  }

  @Post()
  async create(
    @Headers('authorization') authorization: string,
    @Body() body: {
      nombre: string;
      palabrasClave?: string;
      unspsc?: string[];
      cuantiaMin?: number;
      cuantiaMax?: number;
      departamento?: string;
      municipio?: string;
      modalidad?: string;
    },
  ) {
    const { tenantId } = this.resolve(authorization);
    // Límite: hasta 3 perfiles por tenant
    const count = await this.prisma.searchProfile.count({ where: { tenantId } });
    if (count >= 3) {
      return { error: 'Límite de 3 perfiles por empresa alcanzado' };
    }
    const profile = await this.prisma.searchProfile.create({
      data: {
        tenantId,
        nombre: body.nombre,
        palabrasClave: body.palabrasClave,
        unspsc: body.unspsc ? body.unspsc : undefined,
        cuantiaMin: body.cuantiaMin,
        cuantiaMax: body.cuantiaMax,
        departamento: body.departamento,
        municipio: body.municipio,
        modalidad: body.modalidad,
      },
    });
    return { success: true, profile };
  }

  @Patch(':id')
  async update(
    @Headers('authorization') authorization: string,
    @Body() body: any,
  ) {
    const { tenantId } = this.resolve(authorization);
    const exist = await this.prisma.searchProfile.findFirst({ where: { id: body.id, tenantId } });
    if (!exist) throw new UnauthorizedException('Perfil no encontrado');
    const profile = await this.prisma.searchProfile.update({
      where: { id: body.id },
      data: {
        ...(body.nombre ? { nombre: body.nombre } : {}),
        ...(body.palabrasClave !== undefined ? { palabrasClave: body.palabrasClave } : {}),
        ...(body.unspsc ? { unspsc: body.unspsc } : {}),
        ...(body.cuantiaMin !== undefined ? { cuantiaMin: body.cuantiaMin } : {}),
        ...(body.cuantiaMax !== undefined ? { cuantiaMax: body.cuantiaMax } : {}),
        ...(body.departamento !== undefined ? { departamento: body.departamento } : {}),
        ...(body.municipio !== undefined ? { municipio: body.municipio } : {}),
        ...(body.modalidad !== undefined ? { modalidad: body.modalidad } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
    return { success: true, profile };
  }

  @Delete(':id')
  async delete(@Headers('authorization') authorization: string, @Body() body: { id: string }) {
    const { tenantId } = this.resolve(authorization);
    const exist = await this.prisma.searchProfile.findFirst({ where: { id: body.id, tenantId } });
    if (!exist) throw new UnauthorizedException('Perfil no encontrado');
    await this.prisma.searchProfile.delete({ where: { id: body.id } });
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
