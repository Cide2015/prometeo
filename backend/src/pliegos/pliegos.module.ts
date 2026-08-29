import { Module } from '@nestjs/common';
import { PliegosController } from './pliegos.controller';
import { CopilotService } from '../insights/copilot.service';

@Module({
  controllers: [PliegosController],
  providers: [CopilotService],
})
export class PliegosModule {}
