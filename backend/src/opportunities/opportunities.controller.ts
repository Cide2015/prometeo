import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('tenantId') tenantId: string, @Query('estado') estado?: string) {
    if (!tenantId) {
      return { items: [], message: 'tenantId requerido (por ahora, la autenticación real fija el tenant del JWT)' };
    }
    const items = await this.prisma.opportunity.findMany({
      where: { tenantId, ...(estado ? { estado } : {}) },
      orderBy: { fechaCierre: 'asc' },
      take: 100,
    });
    return { items, total: items.length };
  }
}
