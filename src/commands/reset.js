import { cfg } from "../lib/config.js";
import { clearUserMemory } from "../lib/memory.js";

export default function register(bot) {
  bot.command("reset", async (ctx) => {
    const userId = String(ctx.from?.id || "");
    const chatId = String(ctx.chat?.id || "");

    await clearUserMemory({
      mongoUri: cfg.MONGODB_URI,
      platform: "telegram",
      userId,
      chatId,
    });

    await ctx.reply("Done. I’ve cleared your memory for this chat.");
  });
}
