import mineflayer, { Bot } from 'mineflayer';
import pathfinderPkg from 'mineflayer-pathfinder';
const { pathfinder, Movements, goals } = pathfinderPkg;
import pvp from 'mineflayer-pvp';
import collectBlockPkg from 'mineflayer-collectblock';
const { plugin: collectBlock } = collectBlockPkg;
import * as autoEatPkg from 'mineflayer-auto-eat';
const autoEat = autoEatPkg.loader;

export interface BotConfig {
  host: string;
  port: number;
  username: string;
  version?: string;
  auth?: 'offline' | 'microsoft';
}

export interface BotState {
  bot: Bot | null;
  connected: boolean;
  config: BotConfig | null;
  movements: InstanceType<typeof Movements> | null;
}

class BotManager {
  private state: BotState = {
    bot: null,
    connected: false,
    config: null,
    movements: null,
  };

  async connect(config: BotConfig): Promise<string> {
    if (this.state.connected && this.state.bot) {
      return 'Bot is already connected. Disconnect first before connecting to a new server.';
    }

    return new Promise((resolve, reject) => {
      try {
        const bot = mineflayer.createBot({
          host: config.host,
          port: config.port,
          username: config.username,
          version: config.version || undefined,
          auth: config.auth || 'offline',
        });

        // Load plugins
        bot.loadPlugin(pathfinder);
        bot.loadPlugin(pvp.plugin);
        bot.loadPlugin(collectBlock);
        bot.loadPlugin(autoEat);

        bot.once('spawn', () => {
          // Initialize movements after spawn when we know the version
          const mcData = require('minecraft-data')(bot.version);
          this.state.movements = new Movements(bot);
          bot.pathfinder.setMovements(this.state.movements);

          this.state.bot = bot;
          this.state.connected = true;
          this.state.config = config;

          // Setup auto-eat (using any to bypass type issues)
          (bot as any).autoEat.options = {
            priority: 'foodPoints',
            startAt: 14,
            bannedFood: [],
          };

          resolve(`Successfully connected to ${config.host}:${config.port} as ${config.username}`);
        });

        bot.on('kicked', (reason) => {
          this.state.connected = false;
          console.error('Bot was kicked:', reason);
        });

        bot.on('error', (err) => {
          console.error('Bot error:', err);
          reject(err);
        });

        bot.on('end', () => {
          this.state.connected = false;
          this.state.bot = null;
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): string {
    if (!this.state.bot || !this.state.connected) {
      return 'Bot is not connected.';
    }

    this.state.bot.quit();
    this.state.bot = null;
    this.state.connected = false;
    this.state.config = null;
    this.state.movements = null;

    return 'Bot disconnected successfully.';
  }

  getBot(): Bot | null {
    return this.state.bot;
  }

  isConnected(): boolean {
    return this.state.connected;
  }

  getState(): BotState {
    return this.state;
  }

  getMovements(): InstanceType<typeof Movements> | null {
    return this.state.movements;
  }
}

// Singleton instance
export const botManager = new BotManager();
export { goals };
