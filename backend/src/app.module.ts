import { Module } from '@nestjs/common';
import { ConfigModule as EnvConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { SetupModule } from './setup/setup.module';
import { ConfigModule } from './config/config.module';
import { RfiRfpModule } from './rfi-rfp/rfi-rfp.module';
import { AnalysisModule } from './analysis/analysis.module';
import { BidsModule } from './bids/bids.module';
import { ProjectsModule } from './projects/projects.module';
import { FinancieroModule } from './financiero/financiero.module';
import { SearchProfilesModule } from './search-profiles/search-profiles.module';
import { InsightsModule } from './insights/insights.module';
import { DrafterModule } from './drafter/drafter.module';
import { PliegosModule } from './pliegos/pliegos.module';
import { AdendasModule } from './adendas/adendas.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    EnvConfigModule.forRoot({ isGlobal: true }),
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
    ConfigModule,
    RfiRfpModule,
    AnalysisModule,
    BidsModule,
    ProjectsModule,
    FinancieroModule,
    SearchProfilesModule,
    InsightsModule,
    DrafterModule,
    PliegosModule,
    AdendasModule,
    NotificationsModule,
  ],
})
export class AppModule {}
