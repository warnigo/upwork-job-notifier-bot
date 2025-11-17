import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { User } from './entities/user.entity';
import { UserFilter } from './entities/user-filter.entity';
import { Job } from './entities/job.entity';

interface DatabaseData {
  users: User[];
  filters: UserFilter[];
  jobs: Job[];
}

@Injectable()
export class JsonDatabaseService {
  private readonly logger = new Logger(JsonDatabaseService.name);
  private readonly dbPath: string;
  private data: DatabaseData = {
    users: [],
    filters: [],
    jobs: [],
  };

  constructor(private readonly configService: ConfigService) {
    const dbFileName = this.configService.get<string>('DATABASE_PATH', 'data.json');
    this.dbPath = path.resolve(process.cwd(), dbFileName);
    this.loadData();
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(fileContent);
        this.logger.log(`Database loaded from ${this.dbPath}`);
      } else {
        this.saveData();
        this.logger.log(`New database created at ${this.dbPath}`);
      }
    } catch (error) {
      this.logger.error(`Error loading database: ${error.message}`);
      this.data = { users: [], filters: [], jobs: [] };
      this.saveData();
    }
  }

  private saveData(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error(`Error saving database: ${error.message}`);
    }
  }

  // Users
  async findUser(telegramId: string): Promise<User | null> {
    return this.data.users.find((u) => u.telegramId === telegramId) || null;
  }

  async createUser(user: User): Promise<User> {
    const existing = await this.findUser(user.telegramId);
    if (existing) {
      return existing;
    }
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  async updateUser(telegramId: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.findUser(telegramId);
    if (!user) return null;
    Object.assign(user, updates);
    user.updatedAt = new Date();
    this.saveData();
    return user;
  }

  async getActiveUsers(): Promise<User[]> {
    return this.data.users.filter((u) => u.isActive);
  }

  // Filters
  async findFilter(id: number): Promise<UserFilter | null> {
    return this.data.filters.find((f) => f.id === id) || null;
  }

  async findFiltersByUser(userId: string): Promise<UserFilter[]> {
    return this.data.filters.filter((f) => f.userId === userId && f.isActive);
  }

  async createFilter(filter: UserFilter): Promise<UserFilter> {
    const maxId = this.data.filters.reduce((max, f) => Math.max(max, f.id || 0), 0);
    filter.id = maxId + 1;
    this.data.filters.push(filter);
    this.saveData();
    return filter;
  }

  async updateFilter(id: number, updates: Partial<UserFilter>): Promise<UserFilter | null> {
    const filter = await this.findFilter(id);
    if (!filter) return null;
    Object.assign(filter, updates);
    this.saveData();
    return filter;
  }

  async deleteFilter(id: number): Promise<boolean> {
    const index = this.data.filters.findIndex((f) => f.id === id);
    if (index === -1) return false;
    this.data.filters.splice(index, 1);
    this.saveData();
    return true;
  }

  // Jobs
  async findJob(upworkId: string, userId: string): Promise<Job | null> {
    return (
      this.data.jobs.find((j) => j.upworkId === upworkId && j.userId === userId) || null
    );
  }

  async createJob(job: Job): Promise<Job> {
    const maxId = this.data.jobs.reduce((max, j) => Math.max(max, j.id || 0), 0);
    job.id = maxId + 1;
    this.data.jobs.push(job);
    this.saveData();
    return job;
  }

  async getRecentJobs(userId: string, limit = 10): Promise<Job[]> {
    return this.data.jobs
      .filter((j) => j.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

