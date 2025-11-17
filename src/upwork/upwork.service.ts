import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { UpworkSessionService } from './upwork-session.service';

export interface UpworkJob {
  id: string;
  title: string;
  description: string;
  url: string;
  budget?: number;
  category?: string;
  skills?: string[];
  postedAt: Date;
}

@Injectable()
export class UpworkService {
  private readonly logger = new Logger(UpworkService.name);
  private readonly baseUrl = 'https://www.upwork.com';

  constructor(private readonly sessionService: UpworkSessionService) {}

  async getBestMatches(telegramId: string): Promise<UpworkJob[]> {
    const session = await this.sessionService.getSession(telegramId);
    if (!session.connected || !session.cookies) {
      this.logger.warn(`User ${telegramId} not connected to Upwork`);
      return [];
    }

    try {
      const url = `${this.baseUrl}/nx/find-work/best-matches`;
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Cookie: session.cookies,
        },
      });

      if (!response.ok) {
        this.logger.warn(`Failed to fetch Best Matches: ${response.status}`);
        return [];
      }

      const html = await response.text();
      return this.parseJobs(html);
    } catch (error) {
      this.logger.error(`Error fetching Best Matches: ${error.message}`);
      return [];
    }
  }

  async getMostRecent(telegramId: string): Promise<UpworkJob[]> {
    const session = await this.sessionService.getSession(telegramId);
    if (!session.connected || !session.cookies) {
      this.logger.warn(`User ${telegramId} not connected to Upwork`);
      return [];
    }

    try {
      const url = `${this.baseUrl}/nx/find-work/most-recent`;
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Cookie: session.cookies,
        },
      });

      if (!response.ok) {
        this.logger.warn(`Failed to fetch Most Recent: ${response.status}`);
        return [];
      }

      const html = await response.text();
      return this.parseJobs(html);
    } catch (error) {
      this.logger.error(`Error fetching Most Recent: ${error.message}`);
      return [];
    }
  }

  async searchJobs(
    keywords: string,
    excludeKeywords?: string,
  ): Promise<UpworkJob[]> {
    try {
      const searchUrl = this.buildSearchUrl(keywords);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Failed to fetch Upwork: ${response.status}`);
        return [];
      }

      const html = await response.text();
      return this.parseJobs(html, excludeKeywords);
    } catch (error) {
      this.logger.error(`Error fetching Upwork jobs: ${error.message}`);
      return [];
    }
  }

  private buildSearchUrl(keywords: string): string {
    const params = new URLSearchParams({
      q: keywords,
      sort: 'recency',
    });
    return `${this.baseUrl}/nx/jobs/search/?${params.toString()}`;
  }

  private parseJobs(html: string, excludeKeywords?: string): UpworkJob[] {
    const $ = cheerio.load(html);
    const jobs: UpworkJob[] = [];

    $('[data-test="JobTile"]').each((_, element) => {
      try {
        const $el = $(element);
        const jobId = $el.attr('data-job-id') || this.extractJobId($el);
        const title = $el.find('[data-test="JobTitle"]').text().trim();
        const description = $el
          .find('[data-test="JobDescription"]')
          .text()
          .trim();
        const url = $el.find('a').attr('href') || '';

        if (!jobId || !title) {
          return;
        }

        if (excludeKeywords) {
          const excludeLower = excludeKeywords.toLowerCase();
          const text = `${title} ${description}`.toLowerCase();
          if (excludeLower.split(',').some((kw) => text.includes(kw.trim()))) {
            return;
          }
        }

        const budgetText = $el.find('[data-test="Budget"]').text();
        const budget = this.parseBudget(budgetText);

        const skills: string[] = [];
        $el.find('[data-test="Skills"]').each((_, skillEl) => {
          const skill = $(skillEl).text().trim();
          if (skill) skills.push(skill);
        });

        const postedText = $el.find('[data-test="PostedOn"]').text();
        const postedAt = this.parsePostedDate(postedText);

        jobs.push({
          id: jobId,
          title,
          description: description.substring(0, 500),
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
          budget,
          skills: skills.length > 0 ? skills : undefined,
          postedAt,
        });
      } catch (error) {
        this.logger.warn(`Error parsing job: ${error.message}`);
      }
    });

    return jobs;
  }

  private extractJobId($el: cheerio.Cheerio): string {
    const href = $el.find('a').attr('href') || '';
    const match = href.match(/\/jobs\/([^/]+)/);
    return match ? match[1] : '';
  }

  private parseBudget(text: string): number | undefined {
    if (!text) return undefined;

    const match = text.match(/[\d,]+/);
    if (!match) return undefined;

    const amount = parseInt(match[0].replace(/,/g, ''), 10);
    return isNaN(amount) ? undefined : amount;
  }

  private parsePostedDate(text: string): Date {
    const now = new Date();
    const lower = text.toLowerCase();

    if (lower.includes('hour')) {
      const hours = parseInt(text.match(/\d+/)?.[0] || '0', 10);
      now.setHours(now.getHours() - hours);
      return now;
    }

    if (lower.includes('day')) {
      const days = parseInt(text.match(/\d+/)?.[0] || '0', 10);
      now.setDate(now.getDate() - days);
      return now;
    }

    if (lower.includes('minute')) {
      const minutes = parseInt(text.match(/\d+/)?.[0] || '0', 10);
      now.setMinutes(now.getMinutes() - minutes);
      return now;
    }

    return now;
  }
}
