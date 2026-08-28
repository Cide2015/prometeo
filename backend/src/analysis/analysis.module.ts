import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { GoNoGoService } from './go-nogo.service';

@Module({
  controllers: [AnalysisController],
  providers: [GoNoGoService],
})
export class AnalysisModule {}
