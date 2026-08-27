import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { SetupModule } from './setup/setup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL || 60000),
        limit: Number(process.env.THROTTLE_LIMIT || 100),
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    OpportunitiesModule,
    SetupModule,
  ],
})
export class AppModule {}
