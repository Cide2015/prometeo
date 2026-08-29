import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { CompetitionService } from './competition.service';
import { CopilotService } from './copilot.service';

@Module({
  controllers: [InsightsController],
  providers: [CompetitionService, CopilotService],
  exports: [CopilotService],
})
export class InsightsModule {}
