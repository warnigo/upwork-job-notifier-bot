import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';
import { JobsService } from '../jobs/jobs.service';
import { UpworkService } from '../upwork/upwork.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private isRunning = false;

  constructor(
    private readonly usersService: UsersService,
    private readonly jobsService: JobsService,
    private readonly upworkService: UpworkService,
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkForNewJobs() {
    if (this.isRunning) {
      this.logger.debug('Job check already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Checking for new jobs...');

    try {
      const users = await this.usersService.getActiveUsers();

      for (const user of users) {
        if (!user.isActive) {
          continue;
        }

        if (user.upworkConnected) {
          await this.processUpworkJobs(user.telegramId, user.notificationPreference || 'best-matches');
        }

        if (user.filters && user.filters.length > 0) {
          for (const filter of user.filters) {
            if (!filter.isActive) {
              continue;
            }

            await this.processFilter(user.telegramId, filter);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error checking jobs: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async processUpworkJobs(
    userId: string,
    preference: 'best-matches' | 'most-recent' | 'both',
  ) {
    try {
      let jobs: any[] = [];

      if (preference === 'best-matches' || preference === 'both') {
        const bestMatches = await this.upworkService.getBestMatches(userId);
        jobs.push(...bestMatches);
      }

      if (preference === 'most-recent' || preference === 'both') {
        const mostRecent = await this.upworkService.getMostRecent(userId);
        jobs.push(...mostRecent);
      }

      for (const job of jobs) {
        const exists = await this.jobsService.exists(job.id, userId);
        if (exists) {
          continue;
        }

        await this.jobsService.create({
          userId,
          upworkId: job.id,
          title: job.title,
          description: job.description,
          url: job.url,
          budget: job.budget,
          skills: job.skills?.join(', '),
          postedAt: job.postedAt,
        });

        await this.telegramService.sendJobNotification(userId, {
          ...job,
          skills: job.skills,
        });

        this.logger.log(
          `Sent notification for job ${job.id} to user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing Upwork jobs for user ${userId}: ${error.message}`,
      );
    }
  }

  private async processFilter(userId: string, filter: any) {
    try {
      const jobs = await this.upworkService.searchJobs(
        filter.keywords,
        filter.excludeKeywords,
      );

      for (const job of jobs) {
        const exists = await this.jobsService.exists(job.id, userId);
        if (exists) {
          continue;
        }

        if (filter.minBudget && job.budget && job.budget < filter.minBudget) {
          continue;
        }

        if (filter.maxBudget && job.budget && job.budget > filter.maxBudget) {
          continue;
        }

        await this.jobsService.create({
          userId,
          upworkId: job.id,
          title: job.title,
          description: job.description,
          url: job.url,
          budget: job.budget,
          category: filter.category,
          skills: job.skills?.join(', '),
          postedAt: job.postedAt,
        });

        await this.telegramService.sendJobNotification(userId, {
          ...job,
          skills: job.skills,
        });

        this.logger.log(
          `Sent notification for job ${job.id} to user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing filter for user ${userId}: ${error.message}`,
      );
    }
  }
}
