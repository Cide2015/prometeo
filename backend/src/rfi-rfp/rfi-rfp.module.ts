import { Module } from '@nestjs/common';
import { RfiRfpController } from './rfi-rfp.controller';

@Module({
  controllers: [RfiRfpController],
})
export class RfiRfpModule {}
