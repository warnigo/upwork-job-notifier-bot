# Upwork Job Notifier Bot

A Telegram bot that monitors Upwork for newly posted jobs and sends real-time alerts based on your custom keywords and filters. Helps freelancers catch fresh opportunities instantly without manually checking the platform.

## Features

- **Upwork Account Integration**: Connect your Upwork account via Telegram WebApp
- **Best Matches & Most Recent**: Get notifications from your personalized Upwork feed
- **Real-time Job Monitoring**: Automatically monitors Upwork for new job postings every 5 minutes
- **Custom Keywords & Filters**: Set up personalized search criteria to match your skills
- **Telegram Notifications**: Receive instant alerts directly in Telegram when matching jobs are found
- **Inline Buttons**: Quick actions with inline keyboard buttons for better UX
- **Smart Filtering**: Filter jobs by budget range, exclude keywords, and more
- **Multiple Filters**: Create and manage multiple filters per user
- **Job History**: View your recent job notifications
- **Toggle Notifications**: Enable/disable notifications anytime
- **Notification Preferences**: Choose between Best Matches, Most Recent, or Both

## Tech Stack

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Grammy.js](https://grammy.dev/) - Telegram Bot framework
- JSON File Database - Simple file-based storage (no SQL required)
- [Cheerio](https://cheerio.js.org/) - HTML parsing and web scraping
- TypeScript - Type-safe JavaScript

## Prerequisites

- Node.js (v18 or higher)
- pnpm (package manager)
- Telegram Bot Token (get it from [@BotFather](https://t.me/botfather))

## Installation

```bash
# Install dependencies
$ pnpm install
```

## Configuration

Create a `.env` file in the root directory:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
DATABASE_PATH=data.json
PORT=3000
WEBAPP_URL=http://localhost:3000
```

**Note:** For production, set `WEBAPP_URL` to your HTTPS domain (Telegram WebApp requires HTTPS).

**Getting Telegram Bot Token:**

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the token and paste it in `.env` file

## Running the App

```bash
# development
$ pnpm run start

# watch mode (recommended for development)
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root application module
├── database/
│   ├── database.module.ts    # Database configuration
│   └── entities/              # TypeORM entities
│       ├── user.entity.ts
│       ├── user-filter.entity.ts
│       └── job.entity.ts
├── users/
│   ├── users.module.ts
│   └── users.service.ts       # User management service
├── jobs/
│   ├── jobs.module.ts
│   └── jobs.service.ts        # Job history service
├── upwork/
│   ├── upwork.module.ts
│   └── upwork.service.ts      # Upwork scraping service
├── telegram/
│   ├── telegram.module.ts
│   └── telegram.service.ts    # Telegram bot handlers
└── notifications/
    ├── notifications.module.ts
    └── notification.service.ts # Job monitoring & notification service
```

## Available Scripts

```bash
# Build the project
$ pnpm run build

# Run linter
$ pnpm run lint

# Format code
$ pnpm run format

# Run unit tests
$ pnpm run test

# Run e2e tests
$ pnpm run test:e2e

# Test coverage
$ pnpm run test:cov
```

## Usage

### Starting the Bot

1. Create `.env` file with your Telegram bot token
2. Run `pnpm run start:dev`
3. Open Telegram and find your bot
4. Send `/start` command

### Commands

- `/start` - Start the bot and see welcome message
- `/help` - Show help message with all commands
- `/filters` - List all your active filters
- `/addfilter` - Add a new job filter
- `/toggle` - Toggle notifications on/off
- `/recent` - Show recent job notifications

### Connecting to Upwork

1. Click the **"🔗 Connect Upwork"** button in the bot
2. Follow the instructions in the WebApp to login
3. After logging in to Upwork, copy your browser cookies
4. Paste cookies in the WebApp textarea
5. Choose your notification preference (Best Matches, Most Recent, or Both)
6. Save and you're done! The bot will now monitor your Upwork feed

### Adding a Filter

You can add filters in two ways:

**Method 1: Using command**

```
/addfilter
```

Then send your filter in this format:

```
Keywords: React, TypeScript, Node.js
Exclude: PHP, WordPress
Budget: 500-5000
```

**Method 2: Direct message**
Just send the filter format directly:

```
Keywords: React, TypeScript
Exclude: PHP
Budget: 1000-10000
```

### Filter Format

- **Keywords**: Required. Comma-separated keywords to search for
- **Exclude**: Optional. Comma-separated keywords to exclude
- **Budget**: Optional. Format: `min-max` (e.g., `500-5000`)

### Inline Buttons

The bot provides inline keyboard buttons for quick actions:

- ➕ Add Filter
- 📋 My Filters
- 🔔 Toggle Notifications
- 📊 Recent Jobs
- 🗑️ Delete Filter

## How It Works

1. **User Setup**: Users add filters with keywords and preferences
2. **Monitoring**: Bot checks Upwork every 5 minutes for new jobs
3. **Matching**: Jobs are matched against user filters
4. **Notification**: Matching jobs are sent as Telegram messages with inline buttons
5. **History**: All notified jobs are saved in database

## Architecture

The project follows SOLID principles:

- **Single Responsibility**: Each service/module has one clear purpose
- **Dependency Injection**: Services are injected via NestJS DI
- **Modular Design**: Features are separated into modules
- **Type Safety**: Full TypeScript support

## Development

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Jest** for testing
- **JSON File Database** for data storage

## Notes

- The bot uses web scraping to fetch jobs from Upwork
- Jobs are checked every 5 minutes automatically
- Each user can have multiple filters
- Duplicate jobs are automatically filtered
- Database is JSON file-based (stored in `data.json` file)
- No native dependencies required - works on any platform

## License

This project is [UNLICENSED](LICENSE).
