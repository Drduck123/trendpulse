import { NextResponse } from "next/server";

function buildPrompt(category, market, sources) {
  const sourceList = sources || "AliExpress, Temu, Meta Ads, Google Trends, TikTok";

  return `You are an expert e-commerce product trend analyst for West African markets (Nigeria, Ghana, Kenya).

Your task: Find the TOP 10 trending products in "${category}" for the "${market}" market RIGHT NOW.

STEP 1 — Perform a separate web search for each of these sources: ${sourceList}
Use these targeted search queries one by one:
- "${category} best selling ${market} 2025"
- "aliexpress ${category} 100000 orders best seller"
- "temu ${category} top selling products"
- "tiktok trending ${category} west africa 2025"
- "facebook ads library ${category} ${market} active ads"
- "google trends ${category} Nigeria Ghana Kenya"

STEP 2 — For each top product found, do a follow-up search:
- "[product name] buy online Nigeria OR Ghana"
- "[product name] dropship supplier aliexpress"

STEP 3 — Rank all 10 products by evidence strength:
actual order counts > number of active ads > search volume trend

RULES:
- Perform MULTIPLE web searches — do not rely on training data alone
- Be SPECIFIC: include brand names, model numbers, exact specifications
- heatScore must reflect real data found (e.g. 90 = 100k+ orders, 70 = strong ad presence)
- insight must cite SPECIFIC numbers found (e.g. "127k orders on AliExpress, 340 active Meta ads in Nigeria")
- competitors must be REAL stores or pages actually selling the product right now

For EACH product provide:
1. name: specific product name with brand/model
2. heatScore: 0-100 based on actual data found
3. isHot: boolean (true if trending strongly right now)
4. isRising: boolean (true if newer, growing trend)
5. sources: array using ONLY these IDs: aliexpress, temu, meta_ads, google, tiktok, pinterest, youtube
6. category: short 2-3 word tag
7. insight: 2-3 sentences citing SPECIFIC data (order counts, ad numbers, search trends)
8. suggestedAction: specific action for "Fabian Stores" (${market} health & wellness e-commerce)
9. trendData: array of 12 numbers (0-100) representing weekly trend over last 12 weeks
10. trendWeeks: array of 12 short week labels
11. competitors: array of 2-3 objects with: name, platform, detail, url

Respond ONLY with valid JSON, no markdown, no code fences:
{
  "scanTime":"ISO",
  "topInsight":"one sentence about biggest opportunity with specific data",
  "products":[{
    "name":"",
    "heatScore":0,
    "isHot":true,
    "isRising":false,
    "sources":[],
    "category":"",
    "insight":"",
    "suggestedAction":"",
    "trendData":[45,48,52,55,60,65,72,78,82,85,88,90],
    "trendWeeks":["Dec W1","Dec W2","Dec W3","Dec W4","Jan W1","Jan W2","Jan W3","Jan W4","Feb W1","Feb W2","Feb W3","Mar W1"],
    "competitors":[{"name":"","platform":"","detail":"","url":""}]
  }]
}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { category, market, sources } = body;

    const prompt = buildPrompt(category, market, sources);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const textBlocks = data.content.filter(b => b.type === "text").map(b => b.text).join("");
    const jsonMatch = textBlocks.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
