export default function register(bot) {
  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "Send a short project description and I’ll reply with a structured roast and a 1–10 score.",
        "",
        "Good submission examples:",
        "1) “We’re building payroll for 20–50 person startups. Setup takes 10 minutes. We charge $99/month. Our edge is instant onboarding via bank sync.”",
        "2) “Landing page copy: Headline: ‘Plan trips in minutes.’ Subhead: ‘AI itinerary with real-time prices.’ CTA: ‘Get my itinerary’. https://example.com”",
        "",
        "What you’ll get back (in order): first impression, problem clarity, differentiation, business model realism, target market focus, biggest red flag, 3–5 concrete improvements, Roast Score (1–10), mic-drop closing line.",
        "",
        "Need a fresh slate? Use /reset to clear your stored memory.",
      ].join("\n")
    );
  });
}
