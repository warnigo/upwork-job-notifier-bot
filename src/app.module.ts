import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JsonDatabaseModule } from './database/json-database.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { UpworkModule } from './upwork/upwork.module';
import { TelegramModule } from './telegram/telegram.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebappModule } from './webapp/webapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JsonDatabaseModule,
    UsersModule,
    JobsModule,
    UpworkModule,
    TelegramModule,
    NotificationsModule,
    WebappModule,
  ],
})
export class AppModule {}
