export default function register(bot) {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      [
        "Roast Critic is a brutally honest but constructive startup critic.",
        "Send me 2–8 sentences about your project (what it is, who it’s for, what pain it solves), and optionally a URL.",
        "I’ll roast the idea, not you: savage about the product, respectful to the person.",
        "",
        "Roast Score is 1–10.",
        "1 = This will die quietly",
        "10 = Annoyingly good idea",
      ].join("\n")
    );
  });
}
