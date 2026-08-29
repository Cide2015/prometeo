import { Module } from '@nestjs/common';
import { SearchProfilesController } from './search-profiles.controller';

@Module({
  controllers: [SearchProfilesController],
})
export class SearchProfilesModule {}
