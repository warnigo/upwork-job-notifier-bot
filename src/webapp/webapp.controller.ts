import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UpworkSessionService } from '../upwork/upwork-session.service';

@Controller('webapp')
export class WebappController {
  constructor(
    private readonly sessionService: UpworkSessionService,
  ) {}

  @Get()
  getWebapp(@Query('userId') userId: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upwork Login</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--tg-theme-bg-color, #ffffff);
            color: var(--tg-theme-text-color, #000000);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .header p {
            color: var(--tg-theme-hint-color, #999999);
            font-size: 14px;
        }
        .status {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .status.connected {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.disconnected {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .button {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 10px;
            transition: opacity 0.2s;
        }
        .button:active {
            opacity: 0.8;
        }
        .button-primary {
            background: var(--tg-theme-button-color, #3390ec);
            color: var(--tg-theme-button-text-color, #ffffff);
        }
        .button-secondary {
            background: var(--tg-theme-secondary-bg-color, #f0f0f0);
            color: var(--tg-theme-text-color, #000000);
        }
        .button-danger {
            background: #dc3545;
            color: #ffffff;
        }
        .iframe-container {
            width: 100%;
            height: 600px;
            border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
            border-radius: 10px;
            overflow: hidden;
            margin-top: 20px;
            display: none;
        }
        .iframe-container.active {
            display: block;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: var(--tg-theme-hint-color, #999999);
        }
        .notification-settings {
            margin-top: 20px;
            padding: 15px;
            background: var(--tg-theme-secondary-bg-color, #f0f0f0);
            border-radius: 10px;
        }
        .notification-settings h3 {
            margin-bottom: 15px;
            font-size: 18px;
        }
        .radio-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .radio-option {
            display: flex;
            align-items: center;
            padding: 10px;
            background: var(--tg-theme-bg-color, #ffffff);
            border-radius: 8px;
            cursor: pointer;
        }
        .radio-option input {
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Connect Upwork</h1>
            <p>Login to your Upwork account to receive job notifications</p>
        </div>
        
        <div id="status" class="status disconnected">
            <div id="statusText">Not Connected</div>
        </div>
        
        <button id="connectBtn" class="button button-primary" onclick="openUpworkLogin()">
            🔐 Login to Upwork
        </button>
        
        <button id="disconnectBtn" class="button button-danger" onclick="disconnect()" style="display: none;">
            ❌ Disconnect
        </button>
        
        <div id="instructions" style="display: none; padding: 15px; background: #fff3cd; border-radius: 10px; margin-top: 20px;">
            <h3 style="margin-bottom: 10px;">📋 How to Connect:</h3>
            <ol style="padding-left: 20px; line-height: 1.8;">
                <li>Open <a href="https://www.upwork.com/ab/account-security/login" target="_blank">Upwork Login</a> in a new tab</li>
                <li>Login to your Upwork account</li>
                <li>After login, open browser Developer Tools (F12)</li>
                <li>Go to Application/Storage tab → Cookies → https://www.upwork.com</li>
                <li>Copy all cookie values (especially oauth2_access_token, oauth2_refresh_token, oauth2_csrf_token)</li>
                <li>Paste them in the textarea below</li>
            </ol>
            <textarea id="cookieInput" placeholder="Paste cookies here (format: name1=value1; name2=value2; ...)" style="width: 100%; min-height: 100px; padding: 10px; border-radius: 5px; margin-top: 10px; font-family: monospace;"></textarea>
            <button class="button button-primary" onclick="saveCookiesFromInput()" style="margin-top: 10px;">
                💾 Save Cookies
            </button>
        </div>
        
        <div id="notificationSettings" class="notification-settings" style="display: none;">
            <h3>📬 Notification Preferences</h3>
            <div class="radio-group">
                <label class="radio-option">
                    <input type="radio" name="preference" value="best-matches" checked>
                    <span>Best Matches Only</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="preference" value="most-recent">
                    <span>Most Recent Only</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="preference" value="both">
                    <span>Both (Best Matches & Most Recent)</span>
                </label>
            </div>
            <button class="button button-primary" onclick="savePreferences()" style="margin-top: 15px;">
                💾 Save Preferences
            </button>
        </div>
    </div>

    <script>
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
        }
        
        const userId = '${userId}';
        let isConnected = false;
        
        async function checkStatus() {
            try {
                const response = await fetch(\`/webapp/status?userId=\${userId}\`);
                const data = await response.json();
                isConnected = data.connected;
                updateUI();
            } catch (error) {
                console.error('Error checking status:', error);
            }
        }
        
        function updateUI() {
            const statusDiv = document.getElementById('status');
            const statusText = document.getElementById('statusText');
            const connectBtn = document.getElementById('connectBtn');
            const disconnectBtn = document.getElementById('disconnectBtn');
            const notificationSettings = document.getElementById('notificationSettings');
            
            if (isConnected) {
                statusDiv.className = 'status connected';
                statusText.textContent = '✅ Connected to Upwork';
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'block';
                notificationSettings.style.display = 'block';
            } else {
                statusDiv.className = 'status disconnected';
                statusText.textContent = '❌ Not Connected';
                connectBtn.style.display = 'block';
                disconnectBtn.style.display = 'none';
                notificationSettings.style.display = 'none';
            }
        }
        
        function openUpworkLogin() {
            const instructions = document.getElementById('instructions');
            instructions.style.display = 'block';
        }
        
        async function saveCookiesFromInput() {
            const cookieInput = document.getElementById('cookieInput');
            const cookies = cookieInput.value.trim();
            
            if (!cookies) {
                if (tg) {
                    tg.showAlert('Please paste cookies first!');
                }
                return;
            }
            
            await saveCookies(cookies);
        }
        
        async function saveCookies(cookies) {
            try {
                const response = await fetch('/webapp/save-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: userId,
                        cookies: cookies,
                    }),
                });
                
                if (response.ok) {
                    isConnected = true;
                    updateUI();
                    const iframeContainer = document.getElementById('iframeContainer');
                    iframeContainer.classList.remove('active');
                    
                    if (tg) {
                        tg.showAlert('Successfully connected to Upwork!');
                    }
                }
            } catch (error) {
                console.error('Error saving cookies:', error);
                if (tg) {
                    tg.showAlert('Error connecting. Please try again.');
                }
            }
        }
        
        async function disconnect() {
            try {
                const response = await fetch(\`/webapp/disconnect?userId=\${userId}\`, {
                    method: 'POST',
                });
                
                if (response.ok) {
                    isConnected = false;
                    updateUI();
                    if (tg) {
                        tg.showAlert('Disconnected from Upwork');
                    }
                }
            } catch (error) {
                console.error('Error disconnecting:', error);
            }
        }
        
        async function savePreferences() {
            const selected = document.querySelector('input[name="preference"]:checked');
            if (!selected) return;
            
            try {
                const response = await fetch('/webapp/preferences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: userId,
                        preference: selected.value,
                    }),
                });
                
                if (response.ok && tg) {
                    tg.showAlert('Preferences saved!');
                }
            } catch (error) {
                console.error('Error saving preferences:', error);
            }
        }
        
        checkStatus();
        setInterval(checkStatus, 5000);
    </script>
</body>
</html>
    `;
    res.send(html);
  }

  @Get('status')
  async getStatus(@Query('userId') userId: string) {
    const session = await this.sessionService.getSession(userId);
    return { connected: session.connected };
  }

  @Post('save-session')
  async saveSession(
    @Body() body: { userId: string; cookies: string },
  ) {
    await this.sessionService.saveSession(body.userId, body.cookies);
    return { success: true };
  }

  @Post('disconnect')
  async disconnect(@Query('userId') userId: string) {
    await this.sessionService.disconnect(userId);
    return { success: true };
  }

  @Post('preferences')
  async savePreferences(
    @Body() body: { userId: string; preference: string },
  ) {
    await this.sessionService.setNotificationPreference(
      body.userId,
      body.preference as 'best-matches' | 'most-recent' | 'both',
    );
    return { success: true };
  }
}

