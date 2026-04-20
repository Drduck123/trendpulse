"use client";
import { useState, useEffect } from "react";

const MARKET_CODES = { Nigeria: "NG", Ghana: "GH", Kenya: "KE", "West Africa": "NG", Global: "US" };

const SOURCES = [
  { id: "aliexpress", label: "AliExpress", icon: "🛒", color: "#FF6B35",
    searchUrl: (q) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}&SortType=total_tranpro_desc` },
  { id: "temu", label: "Temu", icon: "🎯", color: "#FF9F43",
    searchUrl: (q) => `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(q)}&sort_type=best_seller` },
  { id: "meta_ads", label: "Meta Ads", icon: "📱", color: "#4ECDC4",
    searchUrl: (q, market) => `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${MARKET_CODES[market]||"NG"}&q=${encodeURIComponent(q)}&search_type=keyword_unordered&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped` },
  { id: "google", label: "Google Trends", icon: "📈", color: "#2ED573",
    searchUrl: (q, market) => `https://trends.google.com/trends/explore?q=${encodeURIComponent(q)}&geo=${MARKET_CODES[market]||"NG"}` },
  { id: "tiktok", label: "TikTok", icon: "🎵", color: "#FF4757",
    searchUrl: (q) => `https://www.tiktok.com/search?q=${encodeURIComponent(q)}` },
  { id: "pinterest", label: "Pinterest", icon: "📌", color: "#FF6B9D",
    searchUrl: (q) => `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}&rs=typed` },
  { id: "youtube", label: "YouTube", icon: "▶️", color: "#FF4757",
    searchUrl: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}+review+2025&sp=CAMSAhAB` },
];

const CATEGORIES = [
  "Health & Wellness", "Beauty & Skincare", "Weight Loss", "Teeth Whitening",
  "Waist Trainers", "Massage Devices", "Hair Care", "Footwear Accessories",
  "Supplements", "Anti-Aging", "Acne Treatment", "Natural / Organic Beauty",
];

const MARKETS = ["Nigeria", "Ghana", "Kenya", "West Africa", "Global"];
const HISTORY_KEY = "trendpulse_history_v2";

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
        <div key={i} style={{
          width: 3, borderRadius: 2,
          background: active ? (i % 2 === 0 ? "#FFB800" : "rgba(255,184,0,0.45)") : "rgba(255,255,255,0.12)",
          animation: active ? `pulse-bar 1.1s ease-in-out ${i*0.15}s infinite` : "none",
          height: active ? undefined : 8,
          transition: "all 0.3s"
        }} />
      ))}
    </div>
  );
}

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
  const trendColor = lastVal > firstVal ? "#2ED573" : lastVal < firstVal ? "#FF4757" : "#FFB800";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <polyline points={`${pad},${h} ${pts} ${w-pad},${h}`} fill={color} fillOpacity="0.07" stroke="none" />
        {data.map((v, i) => {
          const x = pad + (i / (data.length - 1)) * (w - pad * 2);
          const y = pad + ((max - v) / range) * (h - pad * 2);
          return <circle key={i} cx={x} cy={y} r="2" fill={color} opacity="0.7" />;
        })}
      </svg>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: trendColor, fontFamily: "'DM Mono', monospace" }}>{trend}</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>{lastVal}/100</div>
      </div>
    </div>
  );
}

function LinkBadge({ source, productName, market }) {
  const s = SOURCES.find(x => x.id === source);
  if (!s) return null;
  return (
    <a href={s.searchUrl(productName, market)} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, padding: "3px 9px", borderRadius: 20,
        background: `${s.color}15`, color: s.color,
        border: `1px solid ${s.color}35`, textDecoration: "none",
        transition: "all 0.15s", fontWeight: 600,
        fontFamily: "'Outfit', sans-serif"
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${s.color}28`; e.currentTarget.style.transform = "scale(1.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${s.color}15`; e.currentTarget.style.transform = "scale(1)"; }}>
      {s.icon} {s.label} ↗
    </a>
  );
}

function TrendCard({ product, index, compact = false, market = "Nigeria" }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const heat = product.heatScore || 75;
  const heatColor = heat >= 85 ? "#FFB800" : heat >= 70 ? "#FF6B35" : "#2ED573";

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${expanded ? heatColor + "55" : hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
        borderLeft: `3px solid ${expanded || hovered ? heatColor : "transparent"}`,
        borderRadius: 12, padding: compact ? "10px 12px" : "14px 16px",
        cursor: "pointer", transition: "all 0.25s",
        boxShadow: expanded ? `0 8px 40px ${heatColor}18` : "none",
        animation: `slide-in 0.4s ease ${index * 0.06}s both`,
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          minWidth: 30, height: 30, borderRadius: 8,
          background: `${heatColor}14`,
          border: `1px solid ${heatColor}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: heatColor,
          fontFamily: "'DM Mono', monospace", flexShrink: 0
        }}>
          {String(index + 1).padStart(2, "0")}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: "#FFFFFF", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{product.name}</span>
            {product.isHot && (
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(255,71,87,0.14)", color: "#FF4757", fontWeight: 700, border: "1px solid rgba(255,71,87,0.28)", letterSpacing: "0.5px" }}>🔥 HOT</span>
            )}
            {product.isRising && (
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(46,213,115,0.12)", color: "#2ED573", fontWeight: 700, border: "1px solid rgba(46,213,115,0.25)", letterSpacing: "0.5px" }}>↑ RISING</span>
            )}
          </div>

          <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
            {(product.sources || []).map(src => <LinkBadge key={src} source={src} productName={product.name} market={market} />)}
            {product.category && (
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "rgba(166,124,255,0.12)", color: "#A67CFF", border: "1px solid rgba(166,124,255,0.22)" }}>{product.category}</span>
            )}
          </div>

          {!compact && product.trendData && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginBottom: 4, letterSpacing: "0.8px", textTransform: "uppercase" }}>12-week trend</div>
              <TrendSparkline data={product.trendData} color={heatColor} />
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", minWidth: 44, flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: heatColor, fontFamily: "'DM Mono', monospace", lineHeight: 1, textShadow: `0 0 18px ${heatColor}55` }}>{heat}</div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", marginTop: 2, letterSpacing: "1px", textTransform: "uppercase" }}>heat</div>
          <div style={{ width: 36, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginTop: 5 }}>
            <div style={{ width: `${heat}%`, height: "100%", background: `linear-gradient(90deg, ${heatColor}70, ${heatColor})`, borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {product.insight && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.58)", lineHeight: 1.7, marginBottom: 12 }}>
              <div style={{ color: "rgba(255,255,255,0.88)", fontWeight: 600, marginBottom: 5, fontSize: 11, letterSpacing: "0.5px" }}>💡 AI Insight</div>
              {product.insight}
            </div>
          )}

          {product.trendData && (
            <div style={{ marginBottom: 12, padding: "12px 14px", background: "rgba(255,255,255,0.025)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 8, letterSpacing: "0.8px", textTransform: "uppercase" }}>📈 Trend over time (12 weeks)</div>
              <TrendGraph data={product.trendData} color={heatColor} weeks={product.trendWeeks} />
            </div>
          )}

          {product.competitors && product.competitors.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#FFB800", fontWeight: 600, marginBottom: 8, letterSpacing: "0.3px" }}>🏪 Competitors / Dropshippers</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {product.competitors.map((c, i) => (
                  <div key={i} style={{ padding: "9px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 12, color: "#FFFFFF", fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{c.platform} · {c.detail}</div>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ fontSize: 10, color: "#4ECDC4", textDecoration: "none", marginTop: 4, display: "block" }}>
                        View Store ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.suggestedAction && (
            <div style={{ padding: "10px 12px", background: "rgba(46,213,115,0.07)", borderRadius: 9, color: "#2ED573", fontSize: 11, border: "1px solid rgba(46,213,115,0.2)", marginBottom: 12, lineHeight: 1.6 }}>
              <strong>→ Action for Fabian Stores:</strong> {product.suggestedAction}
            </div>
          )}

          <div style={{ paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 8, letterSpacing: "0.5px" }}>🔗 Search all platforms:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SOURCES.map(src => <LinkBadge key={src.id} source={src.id} productName={product.name} market={market} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill="url(#tg)" />
        <polyline points={polyPts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === peakIdx ? "2.5" : "1.5"} fill={i === peakIdx ? "#FFB800" : color} opacity="0.9" />
        ))}
        <text x={pts[peakIdx]?.x} y={pts[peakIdx]?.y - 4} textAnchor="middle" fontSize="3.5" fill="#FFB800">PEAK</text>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        {[0, Math.floor(data.length / 3), Math.floor(data.length * 2 / 3), data.length - 1].map(i => (
          <span key={i} style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontFamily: "'DM Mono', monospace" }}>{labels[i]}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontFamily: "'DM Mono', monospace" }}>Low: {min}</span>
        <span style={{ fontSize: 9, color: "#FFB800", fontFamily: "'DM Mono', monospace" }}>Peak: {max}</span>
        <span style={{ fontSize: 9, color, fontFamily: "'DM Mono', monospace" }}>Now: {data[data.length - 1]}</span>
      </div>
    </div>
  );
}

function CompareColumn({ scan, index, onRemove }) {
  const colColors = ["#FFB800", "#4ECDC4", "#2ED573", "#A67CFF"];
  const color = colColors[index % colColors.length];
  return (
    <div style={{ flex: "0 0 295px", background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ background: `${color}0e`, borderBottom: `1px solid ${color}1a`, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{scan.category}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{scan.market} · {scan.timestamp}</div>
        </div>
        <button onClick={() => onRemove(index)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, color: "rgba(255,255,255,0.35)", fontSize: 10, cursor: "pointer", padding: "2px 7px" }}>✕</button>
      </div>
      {scan.results?.topInsight && (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>🎯 {scan.results.topInsight}</div>
      )}
      <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 6 }}>
        {(scan.results?.products || []).slice(0, 10).map((p, i) => <TrendCard key={i} product={p} index={i} compact market={scan.market} />)}
      </div>
    </div>
  );
}

function HistoryCard({ scan, onLoad, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const topProduct = scan.results?.products?.[0];
  const heatAvg = Math.round((scan.results?.products || []).reduce((a, p) => a + (p.heatScore || 0), 0) / Math.max((scan.results?.products || []).length, 1));
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,184,0,0.22)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 11, padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 12,
        transition: "all 0.2s"
      }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{scan.category}</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.22)" }}>{scan.market}</span>
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 3, fontFamily: "'DM Mono', monospace" }}>{scan.timestamp} · {scan.results?.products?.length || 0} products · avg heat {heatAvg}</div>
        {topProduct && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>🥇 {topProduct.name}</div>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onLoad(scan)} style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.25)", color: "#FFB800", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Load</button>
        <button onClick={() => onDelete(scan.id)} style={{ padding: "5px 8px", borderRadius: 7, background: "transparent", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer" }}>✕</button>
      </div>
    </div>
  );
}

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
    (scan.results?.products||[]).map((p,i) => `<tr><td>${i+1}</td><td><strong>${p.name}</strong></td><td style="color:${p.heatScore>=85?"#FFB800":"#FF6B35"};font-weight:700">${p.heatScore}</td><td>${p.isHot?"🔥":""}${p.isRising?" ↑":""}</td><td>${scan.category}</td><td>${scan.market}</td><td style="font-size:12px">${p.insight||""}</td><td style="font-size:12px;color:#2ED573">${p.suggestedAction||""}</td><td style="font-size:11px">${(p.competitors||[]).map(c=>`${c.name} (${c.platform})`).join(", ")}</td></tr>`)
  ).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>TrendPulse — Fabian Stores</title><style>body{font-family:sans-serif;padding:24px;background:#06071A;color:#fff}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0f102e;color:#FFB800;padding:10px}td{padding:9px;border-bottom:1px solid rgba(255,255,255,0.07);vertical-align:top}tr:hover{background:rgba(255,255,255,0.03)}</style></head><body><h1 style="color:#FFB800">📡 TrendPulse — Fabian Stores</h1><p style="color:rgba(255,255,255,0.4)">Generated: ${new Date().toLocaleString()}</p><table><thead><tr><th>#</th><th>Product</th><th>Heat</th><th>Status</th><th>Category</th><th>Market</th><th>Insight</th><th>Action</th><th>Competitors</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
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
    navigator.clipboard.writeText(text).then(() => alert("Report copied to clipboard!"));
  }
}

function whatsappShare(scan) {
  if (!scan) return;
  const top5 = (scan.results?.products||[]).slice(0,5).map((p,i) => `${i+1}. *${p.name}* — Heat: ${p.heatScore}${p.isHot?" 🔥":""}${p.isRising?" ↑":""}`).join("\n");
  const text = `📡 *TrendPulse Report*\n📂 *${scan.category}* — ${scan.market}\n🕐 ${scan.timestamp}\n\n🔥 *Top 5 Trending Products:*\n${top5}\n\n💡 *Key Insight:*\n${scan.results?.topInsight||""}\n\n_Powered by Fabian Stores TrendPulse_`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

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
      const prompt = `You are an expert e-commerce product trend analyst for West African markets (Nigeria, Ghana, Kenya).\n\nResearch the TOP 10 fastest-selling, trending products RIGHT NOW in the "${category}" niche for the "${market}" market.\nSources: ${sourcesList}\n\nIMPORTANT RULES:\n- For AliExpress: find products with the HIGHEST order counts (100,000+ orders preferred)\n- For Temu: find actual best-selling products with high purchase numbers\n- For Meta Ads: find products with the most active ads running right now\n- Be SPECIFIC with product names — include brand names, model numbers, specifications\n- Find REAL competitor stores or dropshippers selling each product\n\nFor EACH product provide ALL of these fields:\n1. name: specific product name with brand/model\n2. heatScore: 0-100 based on actual sales velocity and search volume\n3. isHot: boolean (true if trending strongly right now)\n4. isRising: boolean (true if newer, growing trend)\n5. sources: array using ONLY these IDs: aliexpress, temu, meta_ads, google, tiktok, pinterest, youtube\n6. category: short 2-3 word tag\n7. insight: 2-3 sentences on WHY it's trending with specific data\n8. suggestedAction: specific action for "Fabian Stores" (${market} health & wellness e-commerce)\n9. trendData: array of 12 numbers (0-100) representing weekly trend over last 12 weeks\n10. trendWeeks: array of 12 short week labels\n11. competitors: array of 2-3 objects with: name, platform, detail, url\n\nRespond ONLY with valid JSON, no markdown, no code fences:\n{\n  "scanTime":"ISO",\n  "topInsight":"one sentence about biggest opportunity",\n  "products":[{\n    "name":"",\n    "heatScore":0,\n    "isHot":true,\n    "isRising":false,\n    "sources":[],\n    "category":"",\n    "insight":"",\n    "suggestedAction":"",\n    "trendData":[45,48,52,55,60,65,72,78,82,85,88,90],\n    "trendWeeks":["Dec W1","Dec W2","Dec W3","Dec W4","Jan W1","Jan W2","Jan W3","Jan W4","Feb W1","Feb W2","Feb W3","Mar W1"],\n    "competitors":[{"name":"","platform":"","detail":"","url":""}]\n  }]\n}`;

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
      setSavedScans(prev => [newScan, ...prev].slice(0,4));
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
    { id: "results", label: "Results" },
    { id: "compare", label: `Compare${savedScans.length > 0 ? ` (${savedScans.length})` : ""}` },
    { id: "history", label: `History${history.length > 0 ? ` (${history.length})` : ""}` },
    { id: "export", label: "Export" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Outfit:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#06071A}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,184,0,0.3);border-radius:2px}
        @keyframes pulse-bar{0%,100%{height:6px}50%{height:20px}}
        @keyframes slide-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(255,184,0,0.2),0 4px 15px rgba(255,184,0,0.15)}50%{box-shadow:0 0 45px rgba(255,184,0,0.5),0 4px 25px rgba(255,184,0,0.3)}}
        .scan-btn:hover:not(:disabled){transform:translateY(-2px)!important;box-shadow:0 16px 50px rgba(255,184,0,0.4)!important}
        .src-chip:hover{transform:scale(0.97)}
        select{appearance:none;-webkit-appearance:none}
        select option{background:#0D0E2A;color:#FFFFFF}
        ::selection{background:rgba(255,184,0,0.2);color:#FFFFFF}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#06071A", fontFamily: "'Outfit', sans-serif", color: "#FFFFFF", paddingBottom: 60 }}>

        <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: 700, height: 280, background: "radial-gradient(ellipse, rgba(255,184,0,0.055) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* HEADER */}
        <div style={{
          background: "rgba(6,7,26,0.88)", borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "14px 20px", position: "sticky", top: 0, zIndex: 100,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)"
        }}>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: "linear-gradient(135deg, #FFB800, #FF7A00)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, boxShadow: "0 4px 20px rgba(255,184,0,0.4)",
                  animation: "float 3s ease-in-out infinite", flexShrink: 0
                }}>📡</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", lineHeight: 1 }}>
                    Trend<span style={{ color: "#FFB800" }}>Pulse</span>
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "2px", textTransform: "uppercase", marginTop: 2 }}>by Fabian Stores</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <PulseBar active={loading} />
                {lastRun && !loading && (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "'DM Mono', monospace" }}>{lastRun.toLocaleTimeString()}</span>
                )}
                {currentScan && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => whatsappShare(currentScan)} style={{ padding: "5px 11px", borderRadius: 7, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.22)", color: "#25D366", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>📲 WhatsApp</button>
                    <button onClick={() => shareReport(currentScan)} style={{ padding: "5px 11px", borderRadius: 7, background: "rgba(78,205,196,0.1)", border: "1px solid rgba(78,205,196,0.22)", color: "#4ECDC4", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>🔗 Share</button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: 3, border: "1px solid rgba(255,255,255,0.07)" }}>
                  {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setView(tab.id)} style={{
                      padding: "5px 11px", borderRadius: 7, border: "none",
                      fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                      background: view === tab.id ? "#FFB800" : "transparent",
                      color: view === tab.id ? "#06071A" : "rgba(255,255,255,0.38)",
                      fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap"
                    }}>{tab.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 980, margin: "0 auto", padding: "20px 16px 0", position: "relative", zIndex: 1 }}>

          {/* RESULTS VIEW */}
          {view === "results" && <>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "1.5px", display: "block", marginBottom: 6 }}>Category</label>
                  <div style={{ position: "relative" }}>
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 32px 9px 12px", color: "#FFFFFF", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "border-color 0.2s" }}
                      onFocus={e => e.target.style.borderColor = "rgba(255,184,0,0.4)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.28)", pointerEvents: "none", fontSize: 10 }}>▾</div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "1.5px", display: "block", marginBottom: 6 }}>Market</label>
                  <div style={{ position: "relative" }}>
                    <select value={market} onChange={e => setMarket(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 32px 9px 12px", color: "#FFFFFF", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "border-color 0.2s" }}
                      onFocus={e => e.target.style.borderColor = "rgba(255,184,0,0.4)"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}>
                      {MARKETS.map(m => <option key={m}>{m}</option>)}
                    </select>
                    <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.28)", pointerEvents: "none", fontSize: 10 }}>▾</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "1.5px", display: "block", marginBottom: 8 }}>Sources</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {SOURCES.map(src => {
                    const active = activeSources.includes(src.id);
                    return (
                      <button key={src.id} onClick={() => toggleSource(src.id)} className="src-chip" style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", background: active ? `${src.color}15` : "rgba(255,255,255,0.03)", border: `1px solid ${active ? src.color + "45" : "rgba(255,255,255,0.08)"}`, color: active ? src.color : "rgba(255,255,255,0.32)", fontFamily: "'Outfit', sans-serif" }}>{src.icon} {src.label}</button>
                    );
                  })}
                </div>
              </div>

              <button onClick={runSearch} disabled={loading || activeSources.length === 0} className="scan-btn" style={{ width: "100%", padding: "13px", borderRadius: 11, border: "none", background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #FFB800, #FF8C00)", color: loading ? "rgba(255,255,255,0.28)" : "#06071A", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Bricolage Grotesque', sans-serif", transition: "all 0.25s", animation: !loading && !currentResults ? "glow 2.5s infinite" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? (
                  <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.6)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span style={{ fontSize: 13 }}>{statusMsg}</span></>
                ) : (
                  <>📡 Run Trend Scan</>
                )}
              </button>
            </div>

            {error && (
              <div style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.22)", borderRadius: 11, padding: "11px 15px", marginBottom: 14, color: "#FF4757", fontSize: 12 }}>⚠️ {error}</div>
            )}

            {currentResults && (
              <div style={{ animation: "slide-in 0.4s ease" }}>
                {currentResults.topInsight && (
                  <div style={{ background: "rgba(46,213,115,0.07)", border: "1px solid rgba(46,213,115,0.18)", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🎯</span>
                    <div>
                      <div style={{ fontSize: 9, color: "#2ED573", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>Top Opportunity</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: 1.6 }}>{currentResults.topInsight}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  {[
                    { label: "Products", val: currentResults.products?.length || 0, color: "#FFB800" },
                    { label: "Sources", val: activeSources.length, color: "#4ECDC4" },
                    { label: "Market", val: market, color: "#2ED573" },
                    { label: "Hot", val: (currentResults.products || []).filter(p => p.isHot).length, color: "#FF4757" }
                  ].map(st => (
                    <div key={st.label} style={{ flex: 1, minWidth: 80, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: st.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{st.val}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 3, letterSpacing: "1px", textTransform: "uppercase" }}>{st.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Tap to expand · Links sorted by sales volume</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(currentResults.products || []).map((p, i) => <TrendCard key={i} product={p} index={i} market={market} />)}
                </div>

                <button onClick={runSearch} style={{ marginTop: 16, width: "100%", padding: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.28)", fontSize: 12, cursor: "pointer", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif" }}
                  onMouseEnter={e => { e.target.style.borderColor = "rgba(255,184,0,0.35)"; e.target.style.color = "#FFB800"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.color = "rgba(255,255,255,0.28)"; }}>↻ Refresh Scan</button>
              </div>
            )}

            {!currentResults && !loading && !error && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2, animation: "float 3s ease-in-out infinite" }}>📡</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.28)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Ready to scan</div>
                <div style={{ fontSize: 12, marginTop: 6, color: "rgba(255,255,255,0.18)" }}>Select category & market, then hit Run Trend Scan</div>
                {history.length > 0 && (
                  <button onClick={() => setView("history")} style={{ marginTop: 16, padding: "8px 18px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.32)", fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.target.style.borderColor = "rgba(255,184,0,0.3)"; e.target.style.color = "#FFB800"; }}
                    onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.color = "rgba(255,255,255,0.32)"; }}>
                    View Past Scans ({history.length})
                  </button>
                )}
              </div>
            )}
          </>}

          {/* HISTORY VIEW */}
          {view === "history" && (
            <div>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif" }}>Scan History</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 3 }}>Last 10 scans — click Load to revisit</div>
                </div>
                {history.length > 0 && <button onClick={() => { setHistory([]); saveHistory([]); }} style={{ padding: "6px 13px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.32)", fontSize: 11, cursor: "pointer" }}>Clear All</button>}
              </div>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.18 }}>🕐</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.22)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>No history yet</div>
                  <button onClick={() => setView("results")} style={{ marginTop: 14, padding: "8px 18px", background: "#FFB800", border: "none", borderRadius: 8, color: "#06071A", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Start Scanning →</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {history.map(scan => <HistoryCard key={scan.id} scan={scan} onLoad={loadFromHistory} onDelete={deleteFromHistory} />)}
                </div>
              )}
            </div>
          )}

          {/* COMPARE VIEW */}
          {view === "compare" && (
            <div>
              <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif" }}>Comparison</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 3 }}>Run multiple scans to compare side by side</div>
                </div>
                {savedScans.length > 0 && <button onClick={() => setSavedScans([])} style={{ padding: "6px 13px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.32)", fontSize: 11, cursor: "pointer" }}>Clear All</button>}
              </div>
              {savedScans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.18 }}>⚖️</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.22)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>No scans to compare</div>
                  <button onClick={() => setView("results")} style={{ marginTop: 14, padding: "8px 18px", background: "#FFB800", border: "none", borderRadius: 8, color: "#06071A", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Run a Scan →</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, alignItems: "flex-start" }}>
                  {savedScans.map((scan, i) => <CompareColumn key={scan.id} scan={scan} index={i} onRemove={(idx) => setSavedScans(prev => prev.filter((_, ii) => ii !== idx))} />)}
                </div>
              )}
            </div>
          )}

          {/* EXPORT VIEW */}
          {view === "export" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif" }}>Export & Share</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 3 }}>Download or share your trend data</div>
              </div>
              {savedScans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.18 }}>📂</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.22)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>No data yet</div>
                  <button onClick={() => setView("results")} style={{ marginTop: 14, padding: "8px 18px", background: "#FFB800", border: "none", borderRadius: 8, color: "#06071A", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Go to Results →</button>
                </div>
              ) : (
                <>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>Saved Scans ({savedScans.length})</div>
                    {savedScans.map(scan => (
                      <div key={scan.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 7, marginBottom: 6, alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{scan.category}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginLeft: 8, fontFamily: "'DM Mono', monospace" }}>{scan.market} · {scan.timestamp}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: "#FFB800", fontFamily: "'DM Mono', monospace" }}>{scan.results?.products?.length || 0} products</span>
                          <button onClick={() => whatsappShare(scan)} style={{ padding: "3px 8px", borderRadius: 5, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.22)", color: "#25D366", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>📲</button>
                          <button onClick={() => shareReport(scan)} style={{ padding: "3px 8px", borderRadius: 5, background: "rgba(78,205,196,0.1)", border: "1px solid rgba(78,205,196,0.22)", color: "#4ECDC4", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>🔗</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { icon: "📊", label: "Export as CSV", sub: "Open in Excel or Google Sheets", color: "#2ED573", action: () => exportToCSV(savedScans) },
                      { icon: "🌐", label: "Export as HTML Report", sub: "Formatted report with clickable links", color: "#4ECDC4", action: () => exportToHTML(savedScans) },
                      { icon: "📋", label: "Export as JSON", sub: "Raw data for developers", color: "#A67CFF", action: () => exportToJSON(savedScans) },
                    ].map(opt => (
                      <button key={opt.label} onClick={opt.action} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${opt.color}1a`, borderRadius: 12, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${opt.color}08`; e.currentTarget.style.borderColor = `${opt.color}38`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = `${opt.color}1a`; e.currentTarget.style.transform = "translateY(0)"; }}>
                        <div style={{ width: 38, height: 38, borderRadius: 9, background: `${opt.color}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{opt.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: opt.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{opt.sub}</div>
                        </div>
                        <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.18)", fontSize: 14 }}>↓</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
