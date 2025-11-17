import { UserFilter } from './user-filter.entity';
import { Job } from './job.entity';

export class User {
  telegramId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  filters?: UserFilter[];
  jobs?: Job[];
  upworkCookies?: string;
  upworkSessionId?: string;
  upworkConnected?: boolean;
  notificationPreference?: 'best-matches' | 'most-recent' | 'both';
}
