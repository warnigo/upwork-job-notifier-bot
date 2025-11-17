import { Injectable } from '@nestjs/common';
import { Job } from '../database/entities/job.entity';
import { JsonDatabaseService } from '../database/json-database.service';

@Injectable()
export class JobsService {
  constructor(private readonly db: JsonDatabaseService) {}

  async exists(upworkId: string, userId: string): Promise<boolean> {
    const job = await this.db.findJob(upworkId, userId);
    return !!job;
  }

  async create(jobData: Partial<Job>): Promise<Job> {
    const job: Job = {
      id: 0,
      userId: jobData.userId || '',
      upworkId: jobData.upworkId || '',
      title: jobData.title || '',
      description: jobData.description || '',
      url: jobData.url || '',
      budget: jobData.budget ?? null,
      category: jobData.category ?? null,
      skills: jobData.skills ?? null,
      postedAt: jobData.postedAt || new Date(),
      createdAt: new Date(),
      user: jobData.user as any,
    };
    return this.db.createJob(job);
  }

  async getRecentJobs(userId: string, limit = 10): Promise<Job[]> {
    return this.db.getRecentJobs(userId, limit);
  }
}
