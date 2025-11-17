import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { UsersModule } from '../users/users.module';
import { JobsModule } from '../jobs/jobs.module';
import { UpworkModule } from '../upwork/upwork.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UsersModule,
    JobsModule,
    UpworkModule,
    forwardRef(() => TelegramModule),
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
