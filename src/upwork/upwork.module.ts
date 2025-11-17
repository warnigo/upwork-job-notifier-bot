import { Module } from '@nestjs/common';
import { UpworkService } from './upwork.service';
import { UpworkSessionService } from './upwork-session.service';
import { JsonDatabaseModule } from '../database/json-database.module';

@Module({
  imports: [JsonDatabaseModule],
  providers: [UpworkService, UpworkSessionService],
  exports: [UpworkService, UpworkSessionService],
})
export class UpworkModule {}
