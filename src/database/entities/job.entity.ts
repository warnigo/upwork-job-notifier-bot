import { User } from './user.entity';

export class Job {
  id: number;
  userId: string;
  upworkId: string;
  title: string;
  description: string;
  url: string;
  budget: number | null;
  category: string | null;
  skills: string | null;
  postedAt: Date;
  createdAt: Date;
  user?: User;
}
