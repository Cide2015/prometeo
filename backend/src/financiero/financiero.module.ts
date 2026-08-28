import { Module } from '@nestjs/common';
import { FinancieroController } from './financiero.controller';

@Module({
  controllers: [FinancieroController],
})
export class FinancieroModule {}
