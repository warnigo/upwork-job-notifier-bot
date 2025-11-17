import { User } from './user.entity';

export class UserFilter {
  id: number;
  userId: string;
  keywords: string;
  excludeKeywords: string | null;
  minBudget: number | null;
  maxBudget: number | null;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  user?: User;
}
