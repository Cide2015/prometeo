import { Module } from '@nestjs/common';
import { AdendasController } from './adendas.controller';
import { AdendaMonitorService } from './adenda-monitor.service';

@Module({
  controllers: [AdendasController],
  providers: [AdendaMonitorService],
})
export class AdendasModule {}
