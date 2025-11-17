import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JsonDatabaseModule } from '../database/json-database.module';

@Module({
  imports: [JsonDatabaseModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
