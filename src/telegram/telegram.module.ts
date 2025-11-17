import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UsersModule } from '../users/users.module';
import { JobsModule } from '../jobs/jobs.module';
import { UpworkModule } from '../upwork/upwork.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    JobsModule,
    UpworkModule,
    forwardRef(() => NotificationsModule),
  ],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
