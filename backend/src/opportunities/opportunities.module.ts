import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller';
import { SecopService } from './secop.service';

@Module({
  controllers: [OpportunitiesController],
  providers: [SecopService],
})
export class OpportunitiesModule {}
