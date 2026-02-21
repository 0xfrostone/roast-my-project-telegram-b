export default function register(bot) {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      [
        "Roast My Project does short VC-style analysis of startup pitches.",
        "Send 2–8 sentences with: ICP (who buys), pricing/ACV, and your acquisition channel. Add a URL if relevant.",
        "I’ll stay blunt about the business and keep it tight for Telegram.",
        "",
        "Commands: /help for examples, /reset to clear memory.",
      ].join("\n")
    );
  });
}
