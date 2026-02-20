import { Bot } from "grammy";
import { registerCommands } from "./commands/loader.js";
import { registerAgent } from "./features/agent.js";

export async function createBot(token) {
  const bot = new Bot(token);

  // Commands first
  await registerCommands(bot);

  // Agent last (must not swallow /commands)
  registerAgent(bot);

  return bot;
}
