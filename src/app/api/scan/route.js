import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { category, market, prompt: customPrompt } = body;

    const prompt = customPrompt || `You are an expert e-commerce product trend analyst for West African markets.
Research the TOP 10 fastest-selling trending products in "${category}" for "${market}".
Respond ONLY with valid JSON no markdown: {"scanTime":"ISO","topInsight":"","products":[{"name":"","heatScore":0,"isHot":true,"isRising":false,"sources":[],"category":"","insight":"","suggestedAction":"","trendData":[45,50,55,60,65,70,72,75,78,80,85,88],"trendWeeks":["Dec W1","Dec W2","Dec W3","Dec W4","Jan W1","Jan W2","Jan W3","Jan W4","Feb W1","Feb W2","Feb W3","Mar W1"],"competitors":[{"name":"","platform":"","detail":"","url":""}]}]}`;

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
