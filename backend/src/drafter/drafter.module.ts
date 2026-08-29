import { Module } from '@nestjs/common';
import { DrafterController } from './drafter.controller';
import { DrafterService } from './drafter.service';

@Module({
  controllers: [DrafterController],
  providers: [DrafterService],
})
export class DrafterModule {}
