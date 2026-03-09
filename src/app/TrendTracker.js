"use client";
import { useState, useEffect } from "react";

// ── MARKET COUNTRY CODES ──────────────────────────────────────────────────────
const MARKET_CODES = { Nigeria: "NG", Ghana: "GH", Kenya: "KE", "West Africa": "NG", Global: "US" };

// ── SOURCES ───────────────────────────────────────────────────────────────────
const SOURCES = [
  { id: "aliexpress", label: "AliExpress", icon: "🛒", color: "#0891B2",
    // Sort by orders descending for high sales volume
    searchUrl: (q) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}&SortType=total_tranpro_desc` },
  { id: "temu", label: "Temu", icon: "🎯", color: "#0891B2",
    // Best sellers sort
    searchUrl: (q) => `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(q)}&sort_type=best_seller` },
  { id: "meta_ads", label: "Meta Ads", icon: "📱", color: "#1877F2",
    searchUrl: (q, market) => `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${MARKET_CODES[market]||"NG"}&q=${encodeURIComponent(q)}&search_type=keyword_unordered&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped` },
  { id: "google", label: "Google Trends", icon: "📈", color: "#34A853",
    searchUrl: (q, market) => `https://trends.google.com/trends/explore?q=${encodeURIComponent(q)}&geo=${MARKET_CODES[market]||"NG"}` },
  { id: "tiktok", label: "TikTok", icon: "🎵", color: "#EE1D52",
    searchUrl: (q) => `https://www.tiktok.com/search?q=${encodeURIComponent(q)}` },
  { id: "pinterest", label: "Pinterest", icon: "📌", color: "#E60023",
    searchUrl: (q) => `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}&rs=typed` },
  { id: "youtube", label: "YouTube", icon: "▶️", color: "#FF0000",
    searchUrl: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}+review+2025&sp=CAMSAhAB` },
];

const CATEGORIES = [
  "Health & Wellness", "Beauty & Skincare", "Weight Loss", "Teeth Whitening",
  "Waist Trainers", "Massage Devices", "Hair Care", "Footwear Accessories",
  "Supplements", "Anti-Aging", "Acne Treatment", "Natural / Organic Beauty",
];

const MARKETS = ["Nigeria", "Ghana", "Kenya", "West Africa", "Global"];
const PULSE_COLORS = ["#0891B2", "#0891B2", "#1877F2", "#34A853", "#9333EA", "#EC4899"];
const HISTORY_KEY = "trendpulse_history_v2";

// ── HELPERS ───────────────────────────────────────────────────────────────────
function saveHistory(scans) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(scans)); } catch {}
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

function PulseBar({ active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 20 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{ width: 3, borderRadius: 2, background: active ? PULSE_COLORS[i % PULSE_COLORS.length] : "#CBD5E1", animation: active ? `pulse-bar 1.1s ease-in-out ${i*0.15}s infinite` : "none", height: active ? undefined : 8 }} />
      ))}
    </div>
  );
}

// ── TREND SPARKLINE ───────────────────────────────────────────────────────────
function TrendSparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 120, h = 36, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const lastVal = data[data.length - 1];
  const firstVal = data[0];
  const trend = lastVal > firstVal ? "↑" : lastVal < firstVal ? "↓" : "→";
  const trendColor = lastVal > firstVal ? "#34A853" : lastVal < firstVal ? "#DC2626" : "#D97706";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        <polyline points={`${pad},${h} ${pts} ${w-pad},${h}`} fill={color} fillOpacity="0.1" stroke="none" />
        {data.map((v, i) => {
          const x = pad + (i / (data.length - 1)) * (w - pad * 2);
          const y = pad + ((max - v) / range) * (h - pad * 2);
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} opacity="0.7" />;
        })}
      </svg>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: trendColor, fontFamily: "monospace" }}>{trend}</div>
        <div style={{ fontSize: 9, color: "#64748B" }}>{lastVal}/100</div>
      </div>
    </div>
  );
}

// ── LINK BADGE ────────────────────────────────────────────────────────────────
function LinkBadge({ source, productName, market }) {
  const s = SOURCES.find(x => x.id === source);
  if (!s) return null;
  return (
    <a href={s.searchUrl(productName, market)} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30`, textDecoration: "none", transition: "all 0.15s", fontWeight: 600 }}
      onMouseEnter={e => { e.currentTarget.style.background = `${s.color}35`; e.currentTarget.style.transform = "scale(1.05)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${s.color}15`; e.currentTarget.style.transform = "scale(1)"; }}>
      {s.icon} {s.label} ↗
    </a>
  );
}

// ── TREND CARD ────────────────────────────────────────────────────────────────
function TrendCard({ product, index, compact = false, market = "Nigeria" }) {
  const [expanded, setExpanded] = useState(false);
  const heat = product.heatScore || 75;
  const heatColor = heat >= 85 ? "#0891B2" : heat >= 70 ? "#D97706" : "#34A853";

  return (
    <div onClick={() => setExpanded(!expanded)} style={{
      background: "linear-gradient(135deg,#F1F5F9,#E8EEF4)",
      border: `1px solid ${expanded ? heatColor : "#CBD5E1"}`,
      borderRadius: 12, padding: compact ? "10px 12px" : "14px 16px",
      cursor: "pointer", transition: "all 0.25s",
      boxShadow: expanded ? `0 8px 30px ${heatColor}30` : "0 2px 8px #00000040",
      animation: `slide-in 0.4s ease ${index * 0.06}s both`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Rank */}
        <div style={{ minWidth: 28, height: 28, borderRadius: 7, background: `${heatColor}20`, border: `1px solid ${heatColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: heatColor, fontFamily: "monospace" }}>
          {String(index + 1).padStart(2, "0")}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: "#0F172A", fontFamily: "'Syne',sans-serif" }}>{product.name}</span>
            {product.isHot && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: "#0891B220", color: "#0891B2", fontWeight: 700, border: "1px solid #0891B240" }}>🔥 HOT</span>}
            {product.isRising && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: "#34A85320", color: "#34A853", fontWeight: 700, border: "1px solid #34A85340" }}>↑ RISING</span>}
          </div>

          {/* Source links - now sorted by high sales volume */}
          <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
            {(product.sources || []).map(src => <LinkBadge key={src} source={src} productName={product.name} market={market} />)}
            {product.category && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#9333EA15", color: "#A855F7", border: "1px solid #9333EA30" }}>{product.category}</span>}
          </div>

          {/* Sparkline if available */}
          {!compact && product.trendData && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, color: "#64748B", marginBottom: 4 }}>TREND (12 weeks)</div>
              <TrendSparkline data={product.trendData} color={heatColor} />
            </div>
          )}
        </div>

        {/* Heat score */}
        <div style={{ textAlign: "center", minWidth: 42 }}>
          <div style={{ fontSize: 19, fontWeight: 900, color: heatColor, fontFamily: "monospace", lineHeight: 1 }}>{heat}</div>
          <div style={{ fontSize: 8, color: "#64748B", marginTop: 1 }}>HEAT</div>
          <div style={{ width: 34, height: 3, background: "#CBD5E1", borderRadius: 2, marginTop: 3 }}>
            <div style={{ width: `${heat}%`, height: "100%", background: heatColor, borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ marginTop: 13, paddingTop: 13, borderTop: "1px solid #CBD5E1" }}>

          {/* AI Insight */}
          {product.insight && (
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65, marginBottom: 10 }}>
              <div style={{ color: "#0F172A", fontWeight: 600, marginBottom: 5, fontSize: 11 }}>💡 AI Insight</div>
              {product.insight}
            </div>
          )}

          {/* Trend graph expanded */}
          {product.trendData && (
            <div style={{ marginBottom: 10, padding: "10px 12px", background: "#F8FAFC", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 8 }}>📈 TREND OVER TIME (12 weeks)</div>
              <TrendGraph data={product.trendData} color={heatColor} weeks={product.trendWeeks} />
            </div>
          )}

          {/* Competitors */}
          {product.competitors && product.competitors.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#D97706", fontWeight: 600, marginBottom: 6 }}>🏪 Competitors / Dropshippers</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {product.competitors.map((c, i) => (
                  <div key={i} style={{ padding: "7px 10px", background: "#F8FAFC", borderRadius: 7, border: "1px solid #CBD5E1" }}>
                    <div style={{ fontSize: 11, color: "#0F172A", fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{c.platform} · {c.detail}</div>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ fontSize: 10, color: "#1877F2", textDecoration: "none", marginTop: 3, display: "block" }}>
                        View Store ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action */}
          {product.suggestedAction && (
            <div style={{ padding: "8px 11px", background: "#0f4c2a", borderRadius: 8, color: "#16A34A", fontSize: 11, border: "1px solid #16803450", marginBottom: 10 }}>
              <strong>→ Action for Fabian Stores:</strong> {product.suggestedAction}
            </div>
          )}

          {/* All platform links */}
          <div style={{ paddingTop: 10, borderTop: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 10, color: "#64748B", marginBottom: 6 }}>🔗 Search on all platforms (sorted by sales volume):</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SOURCES.map(src => <LinkBadge key={src.id} source={src.id} productName={product.name} market={market} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TREND GRAPH (full) ────────────────────────────────────────────────────────
function TrendGraph({ data, color, weeks }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 100, h = 60, pad = 6;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / range) * (h - pad * 2);
    return { x, y, v };
  });
  const polyPts = pts.map(p => `${p.x},${p.y}`).join(" ");
  const fillPts = `${pad},${h} ${polyPts} ${w - pad},${h}`;
  const peakIdx = data.indexOf(max);
  const labels = weeks || data.map((_, i) => `W${i + 1}`);

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 80 }}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill="url(#tg)" />
        <polyline points={polyPts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === peakIdx ? "2.5" : "1.5"} fill={i === peakIdx ? "#D97706" : color} opacity="0.9" />
        ))}
        {/* Peak label */}
        <text x={pts[peakIdx]?.x} y={pts[peakIdx]?.y - 4} textAnchor="middle" fontSize="3.5" fill="#D97706">PEAK</text>
      </svg>
      {/* X-axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        {[0, Math.floor(data.length / 3), Math.floor(data.length * 2 / 3), data.length - 1].map(i => (
          <span key={i} style={{ fontSize: 9, color: "#64748B" }}>{labels[i]}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 9, color: "#64748B" }}>Low: {min}</span>
        <span style={{ fontSize: 9, color: "#D97706" }}>Peak: {max}</span>
        <span style={{ fontSize: 9, color: color }}>Now: {data[data.length - 1]}</span>
      </div>
    </div>
  );
}

// ── COMPARE COLUMN ────────────────────────────────────────────────────────────
function CompareColumn({ scan, index, onRemove }) {
  const colColors = ["#0891B2", "#1877F2", "#34A853", "#9333EA"];
  const color = colColors[index % colColors.length];
  return (
    <div style={{ flex: "0 0 295px", background: "#FFFFFF", border: `1px solid ${color}40`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ background: `${color}18`, borderBottom: `1px solid ${color}30`, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color, fontFamily: "'Syne',sans-serif" }}>{scan.category}</div>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{scan.market} · {scan.timestamp}</div>
        </div>
        <button onClick={() => onRemove(index)} style={{ background: "transparent", border: "1px solid #CBD5E1", borderRadius: 5, color: "#64748B", fontSize: 10, cursor: "pointer", padding: "2px 7px" }}>✕</button>
      </div>
      {scan.results?.topInsight && (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #E2E8F0", fontSize: 10, color: "#475569", lineHeight: 1.5 }}>🎯 {scan.results.topInsight}</div>
      )}
      <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 6 }}>
        {(scan.results?.products || []).slice(0, 10).map((p, i) => <TrendCard key={i} product={p} index={i} compact market={scan.market} />)}
      </div>
    </div>
  );
}

// ── HISTORY CARD ──────────────────────────────────────────────────────────────
function HistoryCard({ scan, onLoad, onDelete }) {
  const topProduct = scan.results?.products?.[0];
  const heatAvg = Math.round((scan.results?.products || []).reduce((a, p) => a + (p.heatScore || 0), 0) / Math.max((scan.results?.products || []).length, 1));
  return (
    <div style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 11, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", fontFamily: "'Syne',sans-serif" }}>{scan.category}</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "#0891B215", color: "#0891B2", border: "1px solid #0891B230" }}>{scan.market}</span>
        </div>
        <div style={{ fontSize: 10, color: "#64748B", marginTop: 3 }}>{scan.timestamp} · {scan.results?.products?.length || 0} products · avg heat {heatAvg}</div>
        {topProduct && <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>🥇 {topProduct.name}</div>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onLoad(scan)} style={{ padding: "5px 12px", borderRadius: 7, background: "#0891B220", border: "1px solid #0891B240", color: "#0891B2", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Load</button>
        <button onClick={() => onDelete(scan.id)} style={{ padding: "5px 8px", borderRadius: 7, background: "transparent", border: "1px solid #CBD5E1", color: "#64748B", fontSize: 11, cursor: "pointer" }}>✕</button>
      </div>
    </div>
  );
}

// ── EXPORT HELPERS ────────────────────────────────────────────────────────────
function exportToCSV(scans) {
  const rows = [["Rank","Product","Heat","Hot","Rising","Sources","Category","Market","Insight","Action","Competitors"]];
  scans.forEach(scan => {
    (scan.results?.products || []).forEach((p, i) => {
      rows.push([i+1, `"${p.name}"`, p.heatScore, p.isHot?"Yes":"No", p.isRising?"Yes":"No",
        `"${(p.sources||[]).join(", ")}"`, `"${p.category||""}"`, scan.market,
        `"${(p.insight||"").replace(/"/g,"'")}"`, `"${(p.suggestedAction||"").replace(/"/g,"'")}"`,
        `"${(p.competitors||[]).map(c=>c.name).join(", ")}"`]);
    });
  });
  const blob = new Blob([rows.map(r=>r.join(",")).join("\n")], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fabian_trends.csv"; a.click();
}

function exportToJSON(scans) {
  const blob = new Blob([JSON.stringify(scans,null,2)], {type:"application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fabian_trends.json"; a.click();
}

function exportToHTML(scans) {
  const rows = scans.flatMap(scan =>
    (scan.results?.products||[]).map((p,i) => `<tr><td>${i+1}</td><td><strong>${p.name}</strong></td><td style="color:${p.heatScore>=85?"#0891B2":"#d97706"};font-weight:700">${p.heatScore}</td><td>${p.isHot?"🔥":""}${p.isRising?" ↑":""}</td><td>${scan.category}</td><td>${scan.market}</td><td style="font-size:12px">${p.insight||""}</td><td style="font-size:12px;color:#16a34a">${p.suggestedAction||""}</td><td style="font-size:11px">${(p.competitors||[]).map(c=>`${c.name} (${c.platform})`).join(", ")}</td></tr>`)
  ).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fabian Stores Trend Report</title><style>body{font-family:sans-serif;padding:24px;background:#f8fafc}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0f172a;color:#fff;padding:10px}td{padding:9px;border-bottom:1px solid #e2e8f0;vertical-align:top}tr:hover{background:#f1f5f9}</style></head><body><h1>📡 TrendPulse — Fabian Stores</h1><p>Generated: ${new Date().toLocaleString()}</p><table><thead><tr><th>#</th><th>Product</th><th>Heat</th><th>Status</th><th>Category</th><th>Market</th><th>Insight</th><th>Action</th><th>Competitors</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const blob = new Blob([html],{type:"text/html"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fabian_trend_report.html"; a.click();
}

function shareReport(scan) {
  if (!scan) return;
  const top5 = (scan.results?.products||[]).slice(0,5).map((p,i) => `${i+1}. ${p.name} (Heat: ${p.heatScore})`).join("\n");
  const text = `📡 TrendPulse Report\n📂 ${scan.category} — ${scan.market}\n🕐 ${scan.timestamp}\n\n🔥 Top 5 Trending:\n${top5}\n\n💡 ${scan.results?.topInsight||""}\n\n— Fabian Stores TrendPulse`;
  if (navigator.share) {
    navigator.share({ title: "TrendPulse Report", text });
  } else {
    navigator.clipboard.writeText(text).then(() => alert("Report copied to clipboard! Paste it in WhatsApp or anywhere."));
  }
}

function whatsappShare(scan) {
  if (!scan) return;
  const top5 = (scan.results?.products||[]).slice(0,5).map((p,i) => `${i+1}. *${p.name}* — Heat: ${p.heatScore}${p.isHot?" 🔥":""}${p.isRising?" ↑":""}`).join("\n");
  const text = `📡 *TrendPulse Report*\n📂 *${scan.category}* — ${scan.market}\n🕐 ${scan.timestamp}\n\n🔥 *Top 5 Trending Products:*\n${top5}\n\n💡 *Key Insight:*\n${scan.results?.topInsight||""}\n\n_Powered by Fabian Stores TrendPulse_`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function TrendTracker() {
  const [category, setCategory] = useState("Beauty & Skincare");
  const [market, setMarket] = useState("Ghana");
  const [activeSources, setActiveSources] = useState(["aliexpress","temu","meta_ads","google","tiktok"]);
  const [loading, setLoading] = useState(false);
  const [currentResults, setCurrentResults] = useState(null);
  const [currentScan, setCurrentScan] = useState(null);
  const [savedScans, setSavedScans] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [lastRun, setLastRun] = useState(null);
  const [view, setView] = useState("results");

  // Load history on mount
  useEffect(() => { setHistory(loadHistory()); }, []);

  const toggleSource = (id) => setActiveSources(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);

  const runSearch = async () => {
    if (loading) return;
    setLoading(true); setCurrentResults(null); setError(null); setStatusMsg("Initialising trend scan...");
    const msgs = [
      "Scanning AliExpress by sales volume...",
      "Checking Temu best sellers...",
      "Querying Meta Ads Library...",
      "Scanning TikTok trends...",
      "Checking Pinterest & YouTube...",
      "Finding competitor stores...",
      "Building trend timelines...",
      "Scoring & ranking products...",
    ];
    let mi = 0;
    const ticker = setInterval(() => { if (mi < msgs.length) setStatusMsg(msgs[mi++]); }, 1600);
    try {
      const sourcesList = activeSources.map(id => SOURCES.find(s=>s.id===id)?.label).filter(Boolean).join(", ");
      const prompt = `You are an expert e-commerce product trend analyst for West African markets (Nigeria, Ghana, Kenya).

Research the TOP 10 fastest-selling, trending products RIGHT NOW in the "${category}" niche for the "${market}" market.
Sources: ${sourcesList}

IMPORTANT RULES:
- For AliExpress: find products with the HIGHEST order counts (100,000+ orders preferred)
- For Temu: find actual best-selling products with high purchase numbers
- For Meta Ads: find products with the most active ads running right now
- Be SPECIFIC with product names — include brand names, model numbers, specifications
- Find REAL competitor stores or dropshippers selling each product

For EACH product provide ALL of these fields:
1. name: specific product name with brand/model
2. heatScore: 0-100 based on actual sales velocity and search volume
3. isHot: boolean (true if trending strongly right now)
4. isRising: boolean (true if newer, growing trend)
5. sources: array using ONLY these IDs: aliexpress, temu, meta_ads, google, tiktok, pinterest, youtube
6. category: short 2-3 word tag
7. insight: 2-3 sentences on WHY it's trending with specific data (order counts, ad numbers, etc.)
8. suggestedAction: specific action for "Fabian Stores" (${market} health & wellness e-commerce)
9. trendData: array of 12 numbers (0-100) representing weekly trend over last 12 weeks — be realistic, show actual rise/fall pattern
10. trendWeeks: array of 12 short week labels like ["Jan W1","Jan W2",...,"Mar W4"]
11. competitors: array of 2-3 objects with: name (store/seller name), platform (AliExpress/Temu/Shopify/Instagram), detail (brief description), url (actual search URL)

Respond ONLY with valid JSON, no markdown, no code fences:
{
  "scanTime":"ISO",
  "topInsight":"one sentence about biggest opportunity",
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

      const response = await fetch("/api/scan", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ category, market, sources: sourcesList, prompt }),
      });
      clearInterval(ticker);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const parsed = await response.json();
      if (parsed.error) throw new Error(parsed.error);

      setCurrentResults(parsed);
      const newScan = { id: Date.now(), category, market, timestamp: new Date().toLocaleString(), results: parsed };
      setCurrentScan(newScan);

      // Save to compare (max 4)
      setSavedScans(prev => [newScan, ...prev].slice(0,4));

      // Save to history (max 10)
      const newHistory = [newScan, ...history].slice(0,10);
      setHistory(newHistory);
      saveHistory(newHistory);

      setLastRun(new Date()); setStatusMsg("");
    } catch(e) { clearInterval(ticker); setError(e.message); setStatusMsg(""); }
    finally { setLoading(false); }
  };

  const loadFromHistory = (scan) => {
    setCurrentResults(scan.results);
    setCurrentScan(scan);
    setCategory(scan.category);
    setMarket(scan.market);
    setView("results");
  };

  const deleteFromHistory = (id) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  const TABS = [
    { id: "results", label: "📊 Results" },
    { id: "compare", label: `⚖️ Compare${savedScans.length > 0 ? ` (${savedScans.length})` : ""}` },
    { id: "history", label: `🕐 History${history.length > 0 ? ` (${history.length})` : ""}` },
    { id: "export", label: "⬇️ Export" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#F1F5F9}
        ::-webkit-scrollbar-thumb{background:#94A3B8;border-radius:2px}
        @keyframes pulse-bar{0%,100%{height:6px}50%{height:20px}}
        @keyframes slide-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes glow-pulse{0%,100%{box-shadow:0 0 20px #0891B240}50%{box-shadow:0 0 40px #0891B280}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        .scan-btn:hover:not(:disabled){transform:translateY(-2px)!important;box-shadow:0 12px 40px #0891B250!important}
        .src-chip:hover{opacity:.85;transform:scale(.97)}
        .tab-btn:hover{background:#CBD5E1!important}
        .exp-btn:hover{transform:translateY(-2px)!important}
        select option{background:#F1F5F9;color:#0F172A}
      `}</style>

      <div style={{minHeight:"100vh",background:"#F8FAFC",fontFamily:"'DM Sans',sans-serif",color:"#0F172A",paddingBottom:40}}>

        {/* ── HEADER ── */}
        <div style={{background:"linear-gradient(180deg,#FFFFFF,#F8FAFC)",borderBottom:"1px solid #E2E8F0",padding:"16px 16px 12px",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"}}>
          <div style={{maxWidth:980,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#0891B2,#0E7490)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:"0 4px 15px #0891B250",animation:"float 3s ease-in-out infinite"}}>📡</div>
                <div>
                  <div style={{fontSize:18,fontWeight:900,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.5px"}}>Trend<span style={{color:"#0891B2"}}>Pulse</span></div>
                  <div style={{fontSize:9,color:"#64748B",letterSpacing:1,textTransform:"uppercase"}}>by Fabian Stores</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <PulseBar active={loading} />
                {lastRun && !loading && <span style={{fontSize:10,color:"#64748B"}}>Last scan: {lastRun.toLocaleTimeString()}</span>}
                {/* Share buttons */}
                {currentScan && (
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={() => whatsappShare(currentScan)} style={{padding:"4px 10px",borderRadius:6,background:"#25D36620",border:"1px solid #25D36640",color:"#25D366",fontSize:10,fontWeight:700,cursor:"pointer"}}>📲 WhatsApp</button>
                    <button onClick={() => shareReport(currentScan)} style={{padding:"4px 10px",borderRadius:6,background:"#1877F220",border:"1px solid #1877F240",color:"#1877F2",fontSize:10,fontWeight:700,cursor:"pointer"}}>🔗 Share</button>
                  </div>
                )}
                {/* Tabs */}
                <div style={{display:"flex",gap:2,background:"#F1F5F9",borderRadius:8,padding:3}}>
                  {TABS.map(tab => (
                    <button key={tab.id} onClick={()=>setView(tab.id)} className="tab-btn" style={{padding:"4px 9px",borderRadius:5,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",transition:"all 0.15s",background:view===tab.id?"#0891B2":"transparent",color:view===tab.id?"#fff":"#64748B",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{tab.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{maxWidth:980,margin:"0 auto",padding:"16px 14px 0"}}>

          {/* ── RESULTS VIEW ── */}
          {view==="results" && <>
            {/* Controls */}
            <div style={{background:"linear-gradient(135deg,#FFFFFF,#F8FAFC)",border:"1px solid #CBD5E1",borderRadius:13,padding:15,marginBottom:14}}>
              <div style={{display:"flex",gap:9,marginBottom:11,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:160}}>
                  <label style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4}}>Category</label>
                  <select value={category} onChange={e=>setCategory(e.target.value)} style={{width:"100%",background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:7,padding:"7px 9px",color:"#0F172A",fontSize:12,outline:"none"}}>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{flex:1,minWidth:110}}>
                  <label style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4}}>Market</label>
                  <select value={market} onChange={e=>setMarket(e.target.value)} style={{width:"100%",background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:7,padding:"7px 9px",color:"#0F172A",fontSize:12,outline:"none"}}>
                    {MARKETS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Sources */}
              <div style={{marginBottom:12}}>
                <label style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Sources</label>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {SOURCES.map(src=>{const active=activeSources.includes(src.id);return(
                    <button key={src.id} onClick={()=>toggleSource(src.id)} className="src-chip" style={{padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:600,cursor:"pointer",transition:"all 0.2s",background:active?`${src.color}20`:"#F1F5F9",border:`1px solid ${active?src.color:"#CBD5E1"}`,color:active?src.color:"#64748B"}}>{src.icon} {src.label}</button>
                  );})}
                </div>
              </div>

              <button onClick={runSearch} disabled={loading||activeSources.length===0} className="scan-btn" style={{width:"100%",padding:"11px",borderRadius:9,background:loading?"#CBD5E1":"linear-gradient(135deg,#0891B2,#0E7490)",border:"none",color:loading?"#64748B":"#fff",fontSize:14,fontWeight:800,cursor:loading?"not-allowed":"pointer",fontFamily:"'Syne',sans-serif",transition:"all 0.2s",animation:!loading&&!currentResults?"glow-pulse-teal 2s infinite":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {loading?<><div style={{width:14,height:14,border:"2px solid #64748B",borderTopColor:"#0F172A",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>{statusMsg}</>:<>📡 Run Trend Scan</>}
              </button>
            </div>

            {error && <div style={{background:"#2a0f0f",border:"1px solid #7f1d1d",borderRadius:10,padding:"10px 14px",marginBottom:12,color:"#fca5a5",fontSize:12}}>⚠️ {error}</div>}

            {currentResults && <div style={{animation:"slide-in 0.4s ease"}}>
              {currentResults.topInsight && (
                <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"flex-start",gap:8}}>
                  <span style={{fontSize:16}}>🎯</span>
                  <div>
                    <div style={{fontSize:9,color:"#16A34A",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Top Opportunity</div>
                    <div style={{fontSize:12,color:"#166534",lineHeight:1.55}}>{currentResults.topInsight}</div>
                  </div>
                </div>
              )}

              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {[{label:"Products",val:currentResults.products?.length||0,color:"#0891B2"},{label:"Sources",val:activeSources.length,color:"#1877F2"},{label:"Market",val:market,color:"#34A853"},{label:"🔥 Hot",val:(currentResults.products||[]).filter(p=>p.isHot).length,color:"#D97706"}].map(st=>(
                  <div key={st.label} style={{flex:1,minWidth:80,background:"#F1F5F9",border:"1px solid #CBD5E1",borderRadius:8,padding:"7px 10px"}}>
                    <div style={{fontSize:16,fontWeight:900,color:st.color,fontFamily:"monospace"}}>{st.val}</div>
                    <div style={{fontSize:9,color:"#64748B",marginTop:1}}>{st.label}</div>
                  </div>
                ))}
              </div>

              <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Tap product · Links sorted by sales volume · Expand for trend graph & competitors</div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {(currentResults.products||[]).map((p,i)=><TrendCard key={i} product={p} index={i} market={market}/>)}
              </div>
              <button onClick={runSearch} style={{marginTop:16,width:"100%",padding:"9px",background:"transparent",border:"1px solid #CBD5E1",borderRadius:8,color:"#64748B",fontSize:12,cursor:"pointer",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.target.style.borderColor="#0891B2";e.target.style.color="#0891B2";}}
                onMouseLeave={e=>{e.target.style.borderColor="#CBD5E1";e.target.style.color="#64748B";}}>↻ Refresh Scan</button>
            </div>}

            {!currentResults&&!loading&&!error&&(
              <div style={{textAlign:"center",padding:"44px 20px"}}>
                <div style={{fontSize:42,marginBottom:12,opacity:.4}}>📡</div>
                <div style={{fontSize:13,fontWeight:700,color:"#94A3B8",fontFamily:"'Syne',sans-serif"}}>Ready to scan</div>
                <div style={{fontSize:11,marginTop:4,color:"#94A3B8"}}>Select category & market, then hit Run Trend Scan</div>
                {history.length > 0 && <button onClick={()=>setView("history")} style={{marginTop:14,padding:"7px 16px",background:"transparent",border:"1px solid #CBD5E1",borderRadius:7,color:"#64748B",fontSize:11,cursor:"pointer"}}>🕐 View Past Scans ({history.length})</button>}
              </div>
            )}
          </>}

          {/* ── HISTORY VIEW ── */}
          {view==="history" && <div>
            <div style={{marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,fontFamily:"'Syne',sans-serif"}}>🕐 Scan History</div>
                <div style={{fontSize:11,color:"#64748B",marginTop:2}}>Last 10 scans — click Load to revisit any scan</div>
              </div>
              {history.length>0&&<button onClick={()=>{setHistory([]);saveHistory([]);}} style={{padding:"5px 11px",borderRadius:7,background:"transparent",border:"1px solid #CBD5E1",color:"#64748B",fontSize:11,cursor:"pointer"}}>Clear All</button>}
            </div>
            {history.length===0?(
              <div style={{textAlign:"center",padding:"44px 20px"}}>
                <div style={{fontSize:36,marginBottom:12,opacity:.4}}>🕐</div>
                <div style={{fontSize:13,fontWeight:700,color:"#94A3B8",fontFamily:"'Syne',sans-serif"}}>No history yet</div>
                <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>Run your first scan to start building history</div>
                <button onClick={()=>setView("results")} style={{marginTop:13,padding:"7px 16px",background:"#0891B2",border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Go to Results →</button>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {history.map(scan=><HistoryCard key={scan.id} scan={scan} onLoad={loadFromHistory} onDelete={deleteFromHistory}/>)}
              </div>
            )}
          </div>}

          {/* ── COMPARE VIEW ── */}
          {view==="compare" && <div>
            <div style={{marginBottom:13,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,fontFamily:"'Syne',sans-serif"}}>⚖️ Comparison View</div>
                <div style={{fontSize:11,color:"#64748B",marginTop:2}}>Run multiple scans to compare side by side</div>
              </div>
              {savedScans.length>0&&<button onClick={()=>setSavedScans([])} style={{padding:"5px 11px",borderRadius:7,background:"transparent",border:"1px solid #CBD5E1",color:"#64748B",fontSize:11,cursor:"pointer"}}>Clear All</button>}
            </div>
            {savedScans.length===0?(
              <div style={{textAlign:"center",padding:"44px 20px"}}>
                <div style={{fontSize:36,marginBottom:12,opacity:.4}}>⚖️</div>
                <div style={{fontSize:13,fontWeight:700,color:"#94A3B8",fontFamily:"'Syne',sans-serif"}}>No scans to compare</div>
                <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>Run 2+ scans — they auto-save here for comparison</div>
                <button onClick={()=>setView("results")} style={{marginTop:13,padding:"7px 16px",background:"#0891B2",border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Go to Results →</button>
              </div>
            ):(
              <div style={{display:"flex",gap:11,overflowX:"auto",paddingBottom:10,alignItems:"flex-start"}}>
                {savedScans.map((scan,i)=><CompareColumn key={scan.id} scan={scan} index={i} onRemove={(idx)=>setSavedScans(prev=>prev.filter((_,ii)=>ii!==idx))}/>)}
              </div>
            )}
          </div>}

          {/* ── EXPORT VIEW ── */}
          {view==="export" && <div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:800,fontFamily:"'Syne',sans-serif"}}>⬇️ Export & Share</div>
              <div style={{fontSize:11,color:"#64748B",marginTop:2}}>Download or share your trend data</div>
            </div>
            {savedScans.length===0?(
              <div style={{textAlign:"center",padding:"44px 20px"}}>
                <div style={{fontSize:36,marginBottom:12,opacity:.4}}>📂</div>
                <div style={{fontSize:13,fontWeight:700,color:"#94A3B8",fontFamily:"'Syne',sans-serif"}}>No data yet</div>
                <button onClick={()=>setView("results")} style={{marginTop:13,padding:"7px 16px",background:"#0891B2",border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Go to Results →</button>
              </div>
            ):(
              <>
                <div style={{background:"#F1F5F9",border:"1px solid #CBD5E1",borderRadius:10,padding:13,marginBottom:14}}>
                  <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Saved Scans ({savedScans.length})</div>
                  {savedScans.map(scan=>(
                    <div key={scan.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 9px",background:"#FFFFFF",borderRadius:6,marginBottom:5}}>
                      <div><span style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{scan.category}</span><span style={{fontSize:10,color:"#64748B",marginLeft:7}}>{scan.market} · {scan.timestamp}</span></div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#0891B2"}}>{scan.results?.products?.length||0} products</span>
                        <button onClick={()=>whatsappShare(scan)} style={{padding:"3px 8px",borderRadius:5,background:"#25D36620",border:"1px solid #25D36640",color:"#25D366",fontSize:9,fontWeight:700,cursor:"pointer"}}>📲</button>
                        <button onClick={()=>shareReport(scan)} style={{padding:"3px 8px",borderRadius:5,background:"#1877F220",border:"1px solid #1877F240",color:"#1877F2",fontSize:9,fontWeight:700,cursor:"pointer"}}>🔗</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    {icon:"📊",label:"Export as CSV",sub:"Open in Excel or Google Sheets",color:"#34A853",action:()=>exportToCSV(savedScans)},
                    {icon:"🌐",label:"Export as HTML Report",sub:"Formatted report with clickable links",color:"#1877F2",action:()=>exportToHTML(savedScans)},
                    {icon:"📋",label:"Export as JSON",sub:"Raw data for developers",color:"#9333EA",action:()=>exportToJSON(savedScans)},
                  ].map(opt=>(
                    <button key={opt.label} onClick={opt.action} className="exp-btn" style={{display:"flex",alignItems:"center",gap:12,padding:"13px 15px",background:"linear-gradient(135deg,#FFFFFF,#F8FAFC)",border:`1px solid ${opt.color}40`,borderRadius:10,cursor:"pointer",transition:"all 0.2s",textAlign:"left"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=opt.color;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=`${opt.color}40`;}}>
                      <div style={{width:36,height:36,borderRadius:8,background:`${opt.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{opt.icon}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:opt.color}}>{opt.label}</div>
                        <div style={{fontSize:10,color:"#64748B",marginTop:1}}>{opt.sub}</div>
                      </div>
                      <div style={{marginLeft:"auto",color:"#64748B",fontSize:14}}>↓</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>}

        </div>
      </div>
    </>
  );
}
