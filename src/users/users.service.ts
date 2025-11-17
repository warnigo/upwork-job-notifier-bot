import { Injectable } from '@nestjs/common';
import { User } from '../database/entities/user.entity';
import { UserFilter } from '../database/entities/user-filter.entity';
import { JsonDatabaseService } from '../database/json-database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: JsonDatabaseService) {}

  async findOrCreate(telegramId: string): Promise<User> {
    let user = await this.db.findUser(telegramId);

    if (!user) {
      user = {
        telegramId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        filters: [],
        jobs: [],
      };
      await this.db.createUser(user);
    }

    return user;
  }

  async toggleActive(telegramId: string): Promise<boolean> {
    const user = await this.db.findUser(telegramId);

    if (!user) {
      return false;
    }

    user.isActive = !user.isActive;
    await this.db.updateUser(telegramId, { isActive: user.isActive });
    return user.isActive;
  }

  async getActiveUsers(): Promise<User[]> {
    const users = await this.db.getActiveUsers();
    return Promise.all(
      users.map(async (user) => {
        const filters = await this.db.findFiltersByUser(user.telegramId);
        return { ...user, filters };
      }),
    );
  }

  async addFilter(
    telegramId: string,
    filterData: Partial<UserFilter>,
  ): Promise<UserFilter> {
    const user = await this.findOrCreate(telegramId);
    const filter: UserFilter = {
      id: 0,
      userId: user.telegramId,
      keywords: filterData.keywords || '',
      excludeKeywords: filterData.excludeKeywords ?? null,
      minBudget: filterData.minBudget ?? null,
      maxBudget: filterData.maxBudget ?? null,
      category: filterData.category ?? null,
      isActive: true,
      createdAt: new Date(),
      user: user,
    };
    return this.db.createFilter(filter);
  }

  async getFilters(telegramId: string): Promise<UserFilter[]> {
    const user = await this.findOrCreate(telegramId);
    return this.db.findFiltersByUser(user.telegramId);
  }

  async removeFilter(filterId: number, telegramId: string): Promise<boolean> {
    const filter = await this.db.findFilter(filterId);

    if (!filter || filter.userId !== telegramId) {
      return false;
    }

    return this.db.deleteFilter(filterId);
  }

  async updateFilter(
    filterId: number,
    telegramId: string,
    updateData: Partial<UserFilter>,
  ): Promise<UserFilter | null> {
    const filter = await this.db.findFilter(filterId);

    if (!filter || filter.userId !== telegramId) {
      return null;
    }

    return this.db.updateFilter(filterId, updateData);
  }
}
