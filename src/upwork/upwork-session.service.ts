import { Injectable, Logger } from '@nestjs/common';
import { JsonDatabaseService } from '../database/json-database.service';

@Injectable()
export class UpworkSessionService {
  private readonly logger = new Logger(UpworkSessionService.name);

  constructor(private readonly db: JsonDatabaseService) {}

  async saveSession(
    telegramId: string,
    cookies: string,
    sessionId?: string,
  ): Promise<void> {
    const user = await this.db.findUser(telegramId);
    if (!user) {
      this.logger.warn(`User ${telegramId} not found`);
      return;
    }

    await this.db.updateUser(telegramId, {
      upworkCookies: cookies,
      upworkSessionId: sessionId,
      upworkConnected: true,
    });

    this.logger.log(`Session saved for user ${telegramId}`);
  }

  async getSession(telegramId: string): Promise<{
    cookies?: string;
    sessionId?: string;
    connected: boolean;
  }> {
    const user = await this.db.findUser(telegramId);
    if (!user) {
      return { connected: false };
    }

    return {
      cookies: user.upworkCookies,
      sessionId: user.upworkSessionId,
      connected: user.upworkConnected || false,
    };
  }

  async disconnect(telegramId: string): Promise<void> {
    await this.db.updateUser(telegramId, {
      upworkCookies: undefined,
      upworkSessionId: undefined,
      upworkConnected: false,
    });
    this.logger.log(`Disconnected Upwork for user ${telegramId}`);
  }

  async setNotificationPreference(
    telegramId: string,
    preference: 'best-matches' | 'most-recent' | 'both',
  ): Promise<void> {
    await this.db.updateUser(telegramId, {
      notificationPreference: preference,
    });
  }
}

