import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DrafterService } from './drafter.service';

/**
 * Agente Drafter (Dif B): genera documentos de la propuesta
 * (carta de presentación, formato de experiencia, inhabilidades).
 */
@Controller('drafter')
export class DrafterController {
  constructor(
    private readonly drafter: DrafterService,
    private readonly jwt: JwtService,
  ) {}

  @Post('carta')
  async carta(
    @Headers('authorization') authorization: string,
    @Body() body: { bidId: string },
  ) {
    const { tenantId } = this.resolve(authorization);
    return this.drafter.cartaPresentacion(tenantId, body.bidId);
  }

  @Post('experiencia')
  async experiencia(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    return this.drafter.formatoExperiencia(tenantId);
  }

  @Post('inhabilidades')
  async inhabilidades(@Headers('authorization') authorization: string) {
    const { tenantId } = this.resolve(authorization);
    return this.drafter.declaracionInhabilidades(tenantId);
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
