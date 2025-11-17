import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { JsonDatabaseModule } from '../database/json-database.module';

@Module({
  imports: [JsonDatabaseModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
