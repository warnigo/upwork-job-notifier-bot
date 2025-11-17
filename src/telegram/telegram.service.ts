import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, Context, InlineKeyboard } from 'grammy';
import { UsersService } from '../users/users.service';
import { JobsService } from '../jobs/jobs.service';
import { UpworkService } from '../upwork/upwork.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Bot;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jobsService: JobsService,
    private readonly upworkService: UpworkService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not set');
      return;
    }

    this.bot = new Bot(token);
    this.setupHandlers();
    this.setupErrorHandler();
    await this.bot.start();
    this.logger.log('Telegram bot started');
  }

  private setupErrorHandler() {
    this.bot.catch = (err) => {
      this.logger.error('Error in bot:', err);
    };
  }

  private setupHandlers() {
    this.bot.command('start', async (ctx) => {
      await this.handleStart(ctx);
    });

    this.bot.command('help', async (ctx) => {
      await this.handleHelp(ctx);
    });

    this.bot.command('filters', async (ctx) => {
      await this.handleFilters(ctx);
    });

    this.bot.command('addfilter', async (ctx) => {
      await this.handleAddFilter(ctx);
    });

    this.bot.command('toggle', async (ctx) => {
      await this.handleToggle(ctx);
    });

    this.bot.command('recent', async (ctx) => {
      await this.handleRecent(ctx);
    });

    this.bot.callbackQuery(/^filter_(.+)$/, async (ctx) => {
      await this.handleFilterCallback(ctx);
    });

    this.bot.callbackQuery(/^delete_filter_(\d+)$/, async (ctx) => {
      await this.handleDeleteFilter(ctx);
    });

    this.bot.callbackQuery(/^job_(.+)$/, async (ctx) => {
      await this.handleJobCallback(ctx);
    });

    this.bot.on('message', async (ctx) => {
      if (ctx.message.text && !ctx.message.text.startsWith('/')) {
        await this.handleMessage(ctx);
      }
    });
  }

  private async handleStart(ctx: Context) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    await this.usersService.findOrCreate(userId);

    const webAppUrl = this.configService.get<string>(
      'WEBAPP_URL',
      `http://localhost:${process.env.PORT || 3000}`,
    );
    const fullWebAppUrl = `${webAppUrl}/api/webapp?userId=${userId}`;
    const isHttps = webAppUrl.startsWith('https://');

    const keyboard = new InlineKeyboard();

    if (isHttps) {
      keyboard.webApp('🔗 Connect Upwork', fullWebAppUrl).row();
    }

    keyboard
      .text('➕ Add Filter', 'filter_add')
      .text('📋 My Filters', 'filter_list')
      .row()
      .text('🔔 Toggle Notifications', 'filter_toggle')
      .text('📊 Recent Jobs', 'filter_recent');

    if (!isHttps) {
      const welcomeText = `👋 Welcome to Upwork Job Notifier Bot!\n\n` +
        `I'll monitor Upwork for new jobs matching your filters and send you instant notifications.\n\n` +
        `⚠️ <b>Note:</b> To connect your Upwork account, you need HTTPS.\n` +
        `For local development, visit: <code>${fullWebAppUrl}</code>\n\n` +
        `Use /help to see all commands.`;
      
      await ctx.reply(welcomeText, { 
        parse_mode: 'HTML',
        reply_markup: keyboard 
      });
      return;
    }

    await ctx.reply(
      `👋 Welcome to Upwork Job Notifier Bot!\n\n` +
        `I'll monitor Upwork for new jobs matching your filters and send you instant notifications.\n\n` +
        `Use /help to see all commands.`,
      { reply_markup: keyboard, parse_mode: 'HTML' },
    );
  }

  private async handleHelp(ctx: Context) {
    const helpText = `
📖 <b>Available Commands:</b>

/start - Start the bot
/help - Show this help message
/filters - List your filters
/addfilter - Add a new filter
/toggle - Toggle notifications on/off
/recent - Show recent jobs

<b>How to add a filter:</b>
1. Use /addfilter command
2. Send keywords separated by commas
3. Optionally send exclude keywords
4. Optionally send budget range (min-max)

<b>Example:</b>
/addfilter
Then send: React, TypeScript, Node.js
Exclude: PHP, WordPress
Budget: 500-5000

Use inline buttons for quick actions!
    `;

    await ctx.reply(helpText, { parse_mode: 'HTML' });
  }

  private async handleFilters(ctx: Context) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const filters = await this.usersService.getFilters(userId);

    if (filters.length === 0) {
      const keyboard = new InlineKeyboard().text('➕ Add Filter', 'filter_add');
      await ctx.reply(
        'No filters found. Add one to start receiving notifications!',
        {
          reply_markup: keyboard,
        },
      );
      return;
    }

    let text = '📋 <b>Your Filters:</b>\n\n';
    const keyboard = new InlineKeyboard();

    filters.forEach((filter, index) => {
      text += `${index + 1}. <b>Keywords:</b> ${filter.keywords}\n`;
      if (filter.excludeKeywords) {
        text += `   <b>Exclude:</b> ${filter.excludeKeywords}\n`;
      }
      if (filter.minBudget || filter.maxBudget) {
        text += `   <b>Budget:</b> $${filter.minBudget || 0} - $${filter.maxBudget || '∞'}\n`;
      }
      text += '\n';

      keyboard
        .text(`🗑️ Delete ${index + 1}`, `delete_filter_${filter.id}`)
        .row();
    });

    keyboard.text('➕ Add New Filter', 'filter_add');

    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  private async handleAddFilter(ctx: Context) {
    await ctx.reply(
      '📝 <b>Add New Filter</b>\n\n' +
        'Send your filter in this format:\n\n' +
        '<code>Keywords: React, TypeScript\n' +
        'Exclude: PHP, WordPress\n' +
        'Budget: 500-5000</code>\n\n' +
        'Or just send keywords separated by commas.',
      { parse_mode: 'HTML' },
    );
  }

  private async handleToggle(ctx: Context) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const isActive = await this.usersService.toggleActive(userId);
    const status = isActive ? '✅ enabled' : '❌ disabled';
    await ctx.reply(`Notifications are now ${status}`);
  }

  private async handleRecent(ctx: Context) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const jobs = await this.jobsService.getRecentJobs(userId, 5);

    if (jobs.length === 0) {
      await ctx.reply('No recent jobs found.');
      return;
    }

    for (const job of jobs) {
      await this.sendJobMessage(ctx, job);
    }
  }

  private async handleFilterCallback(ctx: Context) {
    const action = ctx.callbackQuery?.data?.replace('filter_', '');

    switch (action) {
      case 'add':
        await this.handleAddFilter(ctx);
        break;
      case 'list':
        await this.handleFilters(ctx);
        break;
      case 'toggle':
        await this.handleToggle(ctx);
        break;
      case 'recent':
        await this.handleRecent(ctx);
        break;
    }

    await ctx.answerCallbackQuery();
  }

  private async handleDeleteFilter(ctx: Context) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const match = ctx.callbackQuery?.data?.match(/^delete_filter_(\d+)$/);
    if (!match) return;

    const filterId = parseInt(match[1], 10);
    const deleted = await this.usersService.removeFilter(filterId, userId);

    if (deleted) {
      await ctx.answerCallbackQuery('Filter deleted');
      await this.handleFilters(ctx);
    } else {
      await ctx.answerCallbackQuery('Filter not found');
    }
  }

  private async handleJobCallback(ctx: Context) {
    await ctx.answerCallbackQuery();
  }

  private async handleMessage(ctx: Context) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    if (!ctx.message || !('text' in ctx.message)) return;

    const text = ctx.message.text || '';
    const lines = text.split('\n').map((l) => l.trim());

    let keywords = '';
    let excludeKeywords: string | undefined;
    let minBudget: number | undefined;
    let maxBudget: number | undefined;

    for (const line of lines) {
      if (line.toLowerCase().startsWith('keywords:')) {
        keywords = line.replace(/^keywords:\s*/i, '');
      } else if (line.toLowerCase().startsWith('exclude:')) {
        excludeKeywords = line.replace(/^exclude:\s*/i, '');
      } else if (line.toLowerCase().startsWith('budget:')) {
        const budgetMatch = line.match(/(\d+)\s*-\s*(\d+)/i);
        if (budgetMatch) {
          minBudget = parseInt(budgetMatch[1], 10);
          maxBudget = parseInt(budgetMatch[2], 10);
        }
      } else if (!keywords && line.length > 0) {
        keywords = line;
      }
    }

    if (!keywords) {
      await ctx.reply('Please provide keywords for the filter.');
      return;
    }

    const filter = await this.usersService.addFilter(userId, {
      keywords,
      excludeKeywords,
      minBudget,
      maxBudget,
    });

    await ctx.reply(
      `✅ Filter added successfully!\n\n` +
        `<b>Keywords:</b> ${filter.keywords}\n` +
        (filter.excludeKeywords
          ? `<b>Exclude:</b> ${filter.excludeKeywords}\n`
          : '') +
        (filter.minBudget || filter.maxBudget
          ? `<b>Budget:</b> $${filter.minBudget || 0} - $${filter.maxBudget || '∞'}\n`
          : ''),
      { parse_mode: 'HTML' },
    );
  }

  private async sendJobMessage(ctx: Context, job: any) {
    const keyboard = new InlineKeyboard().url('🔗 View Job', job.url);

    let text = `🎯 <b>${job.title}</b>\n\n`;
    text += `${job.description.substring(0, 300)}...\n\n`;

    if (job.budget) {
      text += `💰 <b>Budget:</b> $${job.budget}\n`;
    }

    if (job.skills) {
      text += `🛠️ <b>Skills:</b> ${job.skills}\n`;
    }

    text += `\n📅 Posted: ${new Date(job.postedAt).toLocaleDateString()}`;

    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  async sendJobNotification(userId: string, job: any) {
    try {
      const keyboard = new InlineKeyboard().url('🔗 View Job', job.url);

      let text = `🔔 <b>New Job Found!</b>\n\n`;
      text += `🎯 <b>${job.title}</b>\n\n`;
      text += `${job.description.substring(0, 300)}...\n\n`;

      if (job.budget) {
        text += `💰 <b>Budget:</b> $${job.budget}\n`;
      }

      if (job.skills) {
        text += `🛠️ <b>Skills:</b> ${job.skills.join(', ')}\n`;
      }

      await this.bot.api.sendMessage(userId, text, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send notification to ${userId}: ${error.message}`,
      );
    }
  }
}
