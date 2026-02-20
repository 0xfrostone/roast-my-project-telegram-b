export default function register(bot) {
  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "Send a short project description and I’ll reply in a compact VC-style format.",
        "",
        "Good submission examples:",
        "1) “We sell compliance automation to dental clinics. $299/mo per location. Acquisition via partnerships with practice management software consultants. Early: 12 paying customers.”",
        "2) “B2B: AI inbox triage for customer support teams. ICP: 50–500 seat SaaS. Pricing: $40/agent/mo. Channel: app marketplace + outbound to support leaders. https://example.com”",
        "",
        "What you’ll get back:",
        "Verdict, Roast Score (1–10), TAM snapshot, unit economics & CAC check, moat, GTM wedge, up to 3 red flags, and 2 next steps.",
        "",
        "If you leave out critical info (buyer, pricing, channel, usage frequency, traction), I’ll ask up to 2 questions.",
        "Need a fresh slate? Use /reset.",
      ].join("\n")
    );
  });
}
