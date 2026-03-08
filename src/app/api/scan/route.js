import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { category, market, sources } = await req.json();

    const sourcesList = sources.join(", ");

    const prompt = `You are a product trend analyst specialising in e-commerce for West African markets.

Research and identify the TOP 10 fastest-selling, trending products RIGHT NOW in the "${category}" niche for the "${market}" market.
Sources to consider: ${sourcesList}

For each product provide:
1. Specific product name (include brand names)
2. Heat score (0-100)
3. isHot boolean
4. isRising boolean
5. Sources array (ONLY use: aliexpress, temu, meta_ads, google)
6. Short category tag
7. 2-3 sentence insight on WHY it's trending
8. Specific action for "Fabian Stores" (small ${market} health & wellness e-commerce store)

Respond ONLY with valid JSON, no markdown, no code fences:
{"scanTime":"ISO","topInsight":"one sentence","products":[{"name":"","heatScore":0,"isHot":true,"isRising":false,"sources":[],"category":"","insight":"","suggestedAction":""}]}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const textBlocks = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonMatch = textBlocks.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
