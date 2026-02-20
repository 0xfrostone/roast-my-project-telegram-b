export default function register(bot) {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      [
        "Roast My Project gives VC-style, analytical roasts of startup ideas and landing pages.",
        "Send 2–8 sentences: what it is, who buys, pricing idea, and how you’ll acquire users. Add a URL if you have one.",
        "I’ll be blunt about the business, respectful to you.",
        "",
        "Roast Score is 1–10 (investor-relevant).",
        "1 = not fundable as described",
        "10 = unusually strong for stage",
        "",
        "Commands: /help for examples, /reset to clear memory.",
      ].join("\n")
    );
  });
}
