"use client";
import { useState } from "react";

const SOURCES = [
  { id: "aliexpress", label: "AliExpress", icon: "🛒", color: "#FF6010", searchUrl: (q) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}` },
  { id: "temu", label: "Temu", icon: "🎯", color: "#FF5400", searchUrl: (q) => `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(q)}` },
  { id: "meta_ads", label: "Meta Ads", icon: "📱", color: "#1877F2", searchUrl: (q, market) => `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${market === "Ghana" ? "GH" : "NG"}&q=${encodeURIComponent(q)}&search_type=keyword_unordered` },
  { id: "google", label: "Google Trends", icon: "📈", color: "#34A853", searchUrl: (q) => `https://trends.google.com/trends/explore?q=${encodeURIComponent(q)}` },
];

const CATEGORIES = [
  "Health & Wellness", "Beauty & Skincare", "Weight Loss", "Teeth Whitening",
  "Waist Trainers", "Massage Devices", "Hair Care", "Footwear Accessories",
  "Supplements", "Anti-Aging", "Acne Treatment", "Natural / Organic Beauty",
];

const MARKETS = ["Nigeria", "Ghana", "West Africa", "Global"];
const PULSE_COLORS = ["#FF6010", "#FF5400", "#1877F2", "#34A853", "#9333EA", "#EC4899"];

function PulseBar({ active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 20 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          background: active ? PULSE_COLORS[i % PULSE_COLORS.length] : "#2a2a3a",
          animation: active ? `pulse-bar 1.1s ease-in-out ${i * 0.15}s infinite` : "none",
          height: active ? undefined : 8,
        }} />
      ))}
    </div>
  );
}

function LinkBadge({ source, productName, market }) {
  const s = SOURCES.find((x) => x.id === source);
  if (!s) return null;
  return (
    <a href={s.searchUrl(productName, market)} target="_blank" rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30`, textDecoration: "none", transition: "all 0.15s", fontWeight: 600 }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${s.color}35`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${s.color}15`; }}>
      {s.icon} {s.label} ↗
    </a>
  );
}

function TrendCard({ product, index, compact = false, market = "Nigeria" }) {
  const [expanded, setExpanded] = useState(false);
  const heat = product.heatScore || 75;
  const heatColor = heat >= 85 ? "#FF6010" : heat >= 70 ? "#FBBF24" : "#34A853";
  return (
    <div onClick={() => setExpanded(!expanded)} style={{
      background: "linear-gradient(135deg,#1a1a2e,#16213e)",
      border: `1px solid ${expanded ? heatColor : "#2a2a4a"}`,
      borderRadius: 12, padding: compact ? "11px 13px" : "15px 17px",
      cursor: "pointer", transition: "all 0.25s",
      boxShadow: expanded ? `0 8px 30px ${heatColor}30` : "0 2px 8px #00000040",
      animation: `slide-in 0.4s ease ${index * 0.07}s both`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <div style={{ minWidth: 30, height: 30, borderRadius: 7, background: `${heatColor}20`, border: `1px solid ${heatColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: heatColor, fontFamily: "monospace" }}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: "#e8e8f5", fontFamily: "'Syne',sans-serif" }}>{product.name}</span>
            {product.isHot && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: "#FF601020", color: "#FF6010", fontWeight: 700, border: "1px solid #FF601040" }}>🔥 HOT</span>}
            {product.isRising && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: "#34A85320", color: "#34A853", fontWeight: 700, border: "1px solid #34A85340" }}>↑ RISING</span>}
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
            {(product.sources || []).map((src) => <LinkBadge key={src} source={src} productName={product.name} market={market} />)}
            {product.category && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#9333EA15", color: "#A855F7", border: "1px solid #9333EA30" }}>{product.category}</span>}
          </div>
        </div>
        <div style={{ textAlign: "center", minWidth: 44 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: heatColor, fontFamily: "monospace", lineHeight: 1 }}>{heat}</div>
          <div style={{ fontSize: 8, color: "#6b6b8a", marginTop: 2 }}>HEAT</div>
          <div style={{ width: 36, height: 3, background: "#2a2a4a", borderRadius: 2, marginTop: 3 }}>
            <div style={{ width: `${heat}%`, height: "100%", background: heatColor, borderRadius: 2 }} />
          </div>
        </div>
      </div>
      {expanded && product.insight && (
        <div style={{ marginTop: 13, paddingTop: 13, borderTop: "1px solid #2a2a4a", fontSize: 12, color: "#a0a0c0", lineHeight: 1.65 }}>
          <div style={{ color: "#e8e8f5", fontWeight: 600, marginBottom: 5, fontSize: 11 }}>💡 AI Insight</div>
          {product.insight}
          {product.suggestedAction && (
            <div style={{ marginTop: 9, padding: "8px 11px", background: "#0f4c2a", borderRadius: 8, color: "#4ade80", fontSize: 11, border: "1px solid #16803450" }}>
              <strong>→ Action for Fabian Stores:</strong> {product.suggestedAction}
            </div>
          )}
          <div style={{ marginTop: 11, paddingTop: 10, borderTop: "1px solid #1e1e3a" }}>
            <div style={{ fontSize: 10, color: "#6b6b8a", marginBottom: 6 }}>🔗 Search directly on:</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {["aliexpress", "temu", "meta_ads", "google"].map((src) => <LinkBadge key={src} source={src} productName={product.name} market={market} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareColumn({ scan, index, onRemove }) {
  const colColors = ["#FF6010", "#1877F2", "#34A853", "#9333EA"];
  const color = colColors[index % colColors.length];
  return (
    <div style={{ flex: "0 0 300px", background: "#12122a", border: `1px solid ${color}40`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ background: `${color}18`, borderBottom: `1px solid ${color}30`, padding: "11px 13px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "'Syne',sans-serif" }}>{scan.category}</div>
          <div style={{ fontSize: 10, color: "#6b6b8a", marginTop: 2 }}>{scan.market} · {scan.timestamp}</div>
        </div>
        <button onClick={() => onRemove(index)} style={{ background: "transparent", border: "1px solid #2a2a4a", borderRadius: 5, color: "#6b6b8a", fontSize: 10, cursor: "pointer", padding: "2px 7px" }}>✕</button>
      </div>
      {scan.results?.topInsight && (
        <div style={{ padding: "9px 13px", borderBottom: "1px solid #1e1e3a", fontSize: 10.5, color: "#a0a0c0", lineHeight: 1.5 }}>🎯 {scan.results.topInsight}</div>
      )}
      <div style={{ padding: "9px", display: "flex", flexDirection: "column", gap: 7 }}>
        {(scan.results?.products || []).slice(0, 10).map((p, i) => (
          <TrendCard key={i} product={p} index={i} compact market={scan.market} />
        ))}
      </div>
    </div>
  );
}

function exportToCSV(scans) {
  const rows = [["Rank", "Product", "Heat", "Hot", "Rising", "Sources", "Category", "Market", "Insight", "Action"]];
  scans.forEach((scan) => {
    (scan.results?.products || []).forEach((p, i) => {
      rows.push([i + 1, `"${p.name}"`, p.heatScore, p.isHot ? "Yes" : "No", p.isRising ? "Yes" : "No",
        `"${(p.sources || []).join(", ")}"`, `"${p.category || ""}"`, scan.market,
        `"${(p.insight || "").replace(/"/g, "'")}"`, `"${(p.suggestedAction || "").replace(/"/g, "'")}"`]);
    });
  });
  const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fabian_trends.csv"; a.click();
}

function exportToJSON(scans) {
  const blob = new Blob([JSON.stringify(scans, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fabian_trends.json"; a.click();
}

function exportToHTML(scans) {
  const rows = scans.flatMap((scan) =>
    (scan.results?.products || []).map((p, i) => `<tr><td>${i + 1}</td><td><strong>${p.name}</strong></td><td style="color:${p.heatScore >= 85 ? "#FF6010" : "#d97706"};font-weight:700">${p.heatScore}</td><td>${p.isHot ? "🔥" : ""}${p.isRising ? " ↑" : ""}</td><td>${scan.category}</td><td>${scan.market}</td><td style="font-size:12px">${p.insight || ""}</td><td style="font-size:12px;color:#16a34a">${p.suggestedAction || ""}</td></tr>`)
  ).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fabian Stores Trend Report</title><style>body{font-family:sans-serif;padding:24px;background:#f8fafc}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0f172a;color:#fff;padding:10px}td{padding:9px;border-bottom:1px solid #e2e8f0;vertical-align:top}tr:hover{background:#f1f5f9}</style></head><body><h1>📡 TrendPulse — Fabian Stores</h1><p>Generated: ${new Date().toLocaleString()}</p><table><thead><tr><th>#</th><th>Product</th><th>Heat</th><th>Status</th><th>Category</th><th>Market</th><th>Insight</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fabian_trend_report.html"; a.click();
}

export default function TrendTracker() {
  const [category, setCategory] = useState("Beauty & Skincare");
  const [market, setMarket] = useState("Ghana");
  const [activeSources, setActiveSources] = useState(["aliexpress", "temu", "meta_ads", "google"]);
  const [loading, setLoading] = useState(false);
  const [currentResults, setCurrentResults] = useState(null);
  const [savedScans, setSavedScans] = useState([]);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [lastRun, setLastRun] = useState(null);
  const [view, setView] = useState("results");

  const toggleSource = (id) => setActiveSources((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const runSearch = async () => {
    if (loading) return;
    setLoading(true); setCurrentResults(null); setError(null); setStatusMsg("Initialising trend scan...");
    const msgs = ["Scanning AliExpress bestsellers...", "Checking Temu trending products...", "Querying Meta Ads Library...", "Analysing Google search trends...", "Running AI analysis...", "Scoring & ranking products..."];
    let mi = 0;
    const ticker = setInterval(() => { if (mi < msgs.length) setStatusMsg(msgs[mi++]); }, 1800);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, market, sources: activeSources.map((id) => SOURCES.find((s) => s.id === id)?.label).filter(Boolean) }),
      });
      clearInterval(ticker);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const parsed = await response.json();
      if (parsed.error) throw new Error(parsed.error);
      setCurrentResults(parsed);
      setSavedScans((prev) => [{ id: Date.now(), category, market, timestamp: new Date().toLocaleTimeString(), results: parsed }, ...prev].slice(0, 4));
      setLastRun(new Date()); setStatusMsg("");
    } catch (e) { clearInterval(ticker); setError(e.message); setStatusMsg(""); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#1a1a2e}
        ::-webkit-scrollbar-thumb{background:#3a3a6a;border-radius:2px}
        @keyframes pulse-bar{0%,100%{height:6px}50%{height:20px}}
        @keyframes slide-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes glow-pulse{0%,100%{box-shadow:0 0 20px #FF601040}50%{box-shadow:0 0 40px #FF601080}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        .scan-btn:hover:not(:disabled){transform:translateY(-2px)!important;box-shadow:0 12px 40px #FF601050!important}
        .src-chip:hover{opacity:.85;transform:scale(.97)}
        .tab-btn:hover{background:#2a2a4a!important}
        .exp-btn:hover{transform:translateY(-2px)!important;border-color:inherit!important}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0d0d1a", fontFamily: "'DM Sans',sans-serif", color: "#e8e8f5", paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(180deg,#12122a,#0d0d1a)", borderBottom: "1px solid #1e1e3a", padding: "18px 18px 14px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
          <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#FF6010,#FF3C00)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 4px 15px #FF601050", animation: "float 3s ease-in-out infinite" }}>📡</div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "'Syne',sans-serif", letterSpacing: "-0.5px" }}>Trend<span style={{ color: "#FF6010" }}>Pulse</span></div>
                <div style={{ fontSize: 9, color: "#6b6b8a", letterSpacing: 1, textTransform: "uppercase" }}>by Fabian Stores</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <PulseBar active={loading} />
              {lastRun && !loading && <span style={{ fontSize: 10, color: "#6b6b8a" }}>Last scan: {lastRun.toLocaleTimeString()}</span>}
              <div style={{ display: "flex", gap: 3, background: "#1a1a2e", borderRadius: 8, padding: 3 }}>
                {[{ id: "results", label: "📊 Results" }, { id: "compare", label: `⚖️ Compare${savedScans.length > 0 ? ` (${savedScans.length})` : ""}` }, { id: "export", label: "⬇️ Export" }].map((tab) => (
                  <button key={tab.id} onClick={() => setView(tab.id)} className="tab-btn" style={{ padding: "5px 11px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", background: view === tab.id ? "#FF6010" : "transparent", color: view === tab.id ? "#fff" : "#6b6b8a", fontFamily: "'DM Sans',sans-serif" }}>{tab.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 15px 0" }}>

          {view === "results" && <>
            <div style={{ background: "linear-gradient(135deg,#1a1a2e,#12122a)", border: "1px solid #2a2a4a", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 170 }}>
                  <label style={{ fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a4a", borderRadius: 7, padding: "8px 10px", color: "#e8e8f5", fontSize: 12, outline: "none" }}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Market</label>
                  <select value={market} onChange={(e) => setMarket(e.target.value)} style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a4a", borderRadius: 7, padding: "8px 10px", color: "#e8e8f5", fontSize: 12, outline: "none" }}>
                    {MARKETS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 13 }}>
                <label style={{ fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Sources</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {SOURCES.map((src) => { const active = activeSources.includes(src.id); return (
                    <button key={src.id} onClick={() => toggleSource(src.id)} className="src-chip" style={{ padding: "5px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: active ? `${src.color}20` : "#1a1a2e", border: `1px solid ${active ? src.color : "#2a2a4a"}`, color: active ? src.color : "#6b6b8a" }}>{src.icon} {src.label}</button>
                  ); })}
                </div>
              </div>
              <button onClick={runSearch} disabled={loading || activeSources.length === 0} className="scan-btn" style={{ width: "100%", padding: "12px", borderRadius: 9, background: loading ? "#2a2a4a" : "linear-gradient(135deg,#FF6010,#FF3C00)", border: "none", color: loading ? "#6b6b8a" : "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Syne',sans-serif", transition: "all 0.2s", animation: !loading && !currentResults ? "glow-pulse 2s infinite" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><div style={{ width: 15, height: 15, border: "2px solid #6b6b8a", borderTopColor: "#e8e8f5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />{statusMsg}</> : <>📡 Run Trend Scan</>}
              </button>
            </div>

            {error && <div style={{ background: "#2a0f0f", border: "1px solid #7f1d1d", borderRadius: 11, padding: "11px 15px", marginBottom: 14, color: "#fca5a5", fontSize: 12 }}>⚠️ {error}</div>}

            {currentResults && <div style={{ animation: "slide-in 0.4s ease" }}>
              {currentResults.topInsight && (
                <div style={{ background: "linear-gradient(135deg,#1a2f1a,#122a12)", border: "1px solid #16803440", borderRadius: 11, padding: "11px 15px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 9 }}>
                  <span style={{ fontSize: 17 }}>🎯</span>
                  <div>
                    <div style={{ fontSize: 9, color: "#4ade80", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Top Opportunity</div>
                    <div style={{ fontSize: 12, color: "#d1fae5", lineHeight: 1.55 }}>{currentResults.topInsight}</div>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
                {[{ label: "Products", val: currentResults.products?.length || 0, color: "#FF6010" }, { label: "Sources", val: activeSources.length, color: "#1877F2" }, { label: "Market", val: market, color: "#34A853" }, { label: "🔥 Hot", val: (currentResults.products || []).filter((p) => p.isHot).length, color: "#FBBF24" }].map((st) => (
                  <div key={st.label} style={{ flex: 1, minWidth: 90, background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 9, padding: "8px 11px" }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: st.color, fontFamily: "monospace" }}>{st.val}</div>
                    <div style={{ fontSize: 9, color: "#6b6b8a", marginTop: 1 }}>{st.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 9, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>Tap product for insights · Badges = direct links ↗</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(currentResults.products || []).map((p, i) => <TrendCard key={i} product={p} index={i} market={market} />)}
              </div>
              <button onClick={runSearch} style={{ marginTop: 18, width: "100%", padding: "10px", background: "transparent", border: "1px solid #2a2a4a", borderRadius: 9, color: "#6b6b8a", fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.target.style.borderColor = "#FF6010"; e.target.style.color = "#FF6010"; }}
                onMouseLeave={(e) => { e.target.style.borderColor = "#2a2a4a"; e.target.style.color = "#6b6b8a"; }}>↻ Refresh Scan</button>
            </div>}

            {!currentResults && !loading && !error && (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 44, marginBottom: 13, opacity: .4 }}>📡</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#3a3a6a", fontFamily: "'Syne',sans-serif" }}>Ready to scan</div>
                <div style={{ fontSize: 11, marginTop: 4, color: "#3a3a6a" }}>Select category & market, then hit Run Trend Scan</div>
              </div>
            )}
          </>}

          {view === "compare" && <div>
            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>⚖️ Comparison View</div>
                <div style={{ fontSize: 11, color: "#6b6b8a", marginTop: 3 }}>Run scans across different categories or markets to compare side by side</div>
              </div>
              {savedScans.length > 0 && <button onClick={() => setSavedScans([])} style={{ padding: "5px 12px", borderRadius: 7, background: "transparent", border: "1px solid #2a2a4a", color: "#6b6b8a", fontSize: 11, cursor: "pointer" }}>Clear All</button>}
            </div>
            {savedScans.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 38, marginBottom: 13, opacity: .4 }}>⚖️</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3a3a6a", fontFamily: "'Syne',sans-serif" }}>No scans to compare yet</div>
                <div style={{ fontSize: 11, color: "#3a3a6a", marginTop: 4 }}>Run 2+ scans from Results tab — they auto-save here</div>
                <button onClick={() => setView("results")} style={{ marginTop: 14, padding: "8px 18px", background: "#FF6010", border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Go to Results →</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10, alignItems: "flex-start" }}>
                {savedScans.map((scan, i) => <CompareColumn key={scan.id} scan={scan} index={i} onRemove={(idx) => setSavedScans((prev) => prev.filter((_, ii) => ii !== idx))} />)}
              </div>
            )}
          </div>}

          {view === "export" && <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>⬇️ Export Data</div>
              <div style={{ fontSize: 11, color: "#6b6b8a", marginTop: 3 }}>Download your trend scan results</div>
            </div>
            {savedScans.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 38, marginBottom: 13, opacity: .4 }}>📂</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3a3a6a", fontFamily: "'Syne',sans-serif" }}>No data to export yet</div>
                <button onClick={() => setView("results")} style={{ marginTop: 14, padding: "8px 18px", background: "#FF6010", border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Go to Results →</button>
              </div>
            ) : (
              <>
                <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 11, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 9 }}>Saved Scans ({savedScans.length})</div>
                  {savedScans.map((scan) => (
                    <div key={scan.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", background: "#12122a", borderRadius: 7, marginBottom: 6 }}>
                      <div><span style={{ fontSize: 12, fontWeight: 700, color: "#e8e8f5" }}>{scan.category}</span><span style={{ fontSize: 10, color: "#6b6b8a", marginLeft: 7 }}>{scan.market} · {scan.timestamp}</span></div>
                      <span style={{ fontSize: 10, color: "#FF6010" }}>{scan.results?.products?.length || 0} products</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {[
                    { icon: "📊", label: "Export as CSV", sub: "Open in Excel or Google Sheets", color: "#34A853", action: () => exportToCSV(savedScans) },
                    { icon: "🌐", label: "Export as HTML Report", sub: "Formatted report with clickable links", color: "#1877F2", action: () => exportToHTML(savedScans) },
                    { icon: "📋", label: "Export as JSON", sub: "Raw data for developers", color: "#9333EA", action: () => exportToJSON(savedScans) },
                  ].map((opt) => (
                    <button key={opt.label} onClick={opt.action} className="exp-btn" style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", background: "linear-gradient(135deg,#1a1a2e,#12122a)", border: `1px solid ${opt.color}40`, borderRadius: 11, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = opt.color; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${opt.color}40`; }}>
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: `${opt.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>{opt.icon}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: opt.color }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: "#6b6b8a", marginTop: 2 }}>{opt.sub}</div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "#6b6b8a", fontSize: 15 }}>↓</div>
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
