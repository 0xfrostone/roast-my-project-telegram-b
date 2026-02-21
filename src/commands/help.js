export default function register(bot) {
  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "Send a short pitch and I’ll reply in a compact investor format.",
        "Best inputs include: ICP, pricing/ACV, and acquisition channel (plus any traction).",
        "",
        "Examples:",
        "1) “We automate insurance verification for dental clinics. Buyer: office manager. $299/mo/location. Channel: partnerships with PMS consultants. 12 paying clinics.”",
        "2) “AI triage for support inboxes. ICP: 50–500 seat SaaS support teams. $40/agent/mo. Channel: Zendesk marketplace + outbound to support leaders.”",
        "",
        "Output sections (always in this order):",
        "A) Verdict",
        "B) Roast Score (1–10)",
        "C) TAM",
        "D) CAC and payback",
        "E) Moat",
        "F) GTM",
        "G) Biggest risk",
        "H) Next step",
        "I) Up to 2 questions (only if needed)",
        "",
        "Use /reset to clear your stored memory for this chat.",
      ].join("\n")
    );
  });
}
