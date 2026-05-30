import { useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── カラーパレット ─────────────────────────────────────────────────────────
const C = {
  bg:     "#0a0c12",
  panel:  "#10131e",
  border: "#1e2335",
  accent: "#00d4ff",
  green:  "#00e5a0",
  red:    "#ff4d6d",
  yellow: "#ffc107",
  text:   "#e8ecf4",
  muted:  "#5a6280",
};

// ── 小コンポーネント ───────────────────────────────────────────────────────
function Badge({ children, color = C.accent }) {
  return (
    <span style={{
      background: color + "22", color,
      border: `1px solid ${color}55`,
      borderRadius: 4, padding: "2px 7px",
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function KpiCard({ label, value, sub, color = C.accent, icon }) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "16px 18px",
      flex: "1 1 130px", minWidth: 120,
    }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.08em", marginBottom: 5 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "monospace", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#14172a", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 12 }}>
      <div style={{ color: C.muted, marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.text }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

// ── Topics セクション ──────────────────────────────────────────────────────
const TOPIC_META = {
  "2026-05-27": { sentiment: "強気", score: 8, headline: "日経 史上初 66,000円超え", summary: "日経平均が史上初の66,000円台突破。政府の成長投資促進指針も追い風。全体強気だが高値警戒感あり。" },
  "2026-05-28": { sentiment: "中立", score: 5, headline: "材料乏しく検索タイムアウト多発", summary: "大手賃上げは好材料も個別材料乏しく様子見ムード。#codeSearch タイムアウト多発で全候補への発注試行失敗。エントリー0件。" },
  "2026-05-29": { sentiment: "中立", score: 4, headline: "銘柄名不一致エラー多発 エントリー0件", summary: "三菱電機IR Day・トクヤマ中計発表など材料あり。しかし銘柄名不一致エラー頻発で全候補スキップ。トヨタ次世代EV開発中止・JAL緊急着陸などネガティブ材料散見。" },
};
const AVOID_META = {
  "2026-05-27": [{ code:"7011", name:"三菱重工業", reason:"北朝鮮ミサイル発射で防衛関連期待も高値圏。材料の新鮮さ欠如" }],
  "2026-05-28": [{ code:"9201", name:"日本航空",  reason:"客室乗務員飲酒問題でネガティブ材料継続" }],
  "2026-05-29": [{ code:"7203", name:"トヨタ自動車", reason:"次世代EV開発中止報道でネガティブ" },
                 { code:"9201", name:"日本航空",     reason:"緊急着陸・飲酒問題のダブルパンチ" }],
};

function TopicsSection({ picksByDate }) {
  const dates = Object.keys(picksByDate).sort();
  const [active, setActive] = useState(dates[dates.length - 1] ?? "");

  if (!dates.length) return <div style={{ color: C.muted, padding: 20 }}>データなし</div>;

  const picks = picksByDate[active] ?? [];
  const meta  = TOPIC_META[active] ?? { sentiment:"不明", score:5, headline:"", summary:"" };
  const avoid = AVOID_META[active] ?? [];
  const sColor = meta.score >= 7 ? C.green : meta.score >= 5 ? C.yellow : C.red;

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>📰</span>
        <span style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:"0.05em" }}>DAILY TOPICS</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:6, flexWrap:"wrap" }}>
          {dates.map(d => (
            <button key={d} onClick={() => setActive(d)} style={{
              background: d === active ? C.accent+"22" : "transparent",
              border: `1px solid ${d === active ? C.accent : C.border}`,
              color: d === active ? C.accent : C.muted,
              borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600,
            }}>
              {d.slice(5).replace("-","/")}
            </button>
          ))}
        </div>
      </div>

      {/* Headline row */}
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ flex:"1 1 0", minWidth:180 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:6 }}>{meta.headline}</div>
          <div style={{ fontSize:12, color:"#8a90a8", lineHeight:1.75 }}>{meta.summary}</div>
        </div>
        <div style={{
          background: sColor+"18", border:`1px solid ${sColor}44`,
          borderRadius:8, padding:"10px 16px", textAlign:"center", minWidth:88,
        }}>
          <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>相場観</div>
          <div style={{ fontSize:15, fontWeight:800, color:sColor }}>{meta.sentiment}</div>
          <div style={{ fontSize:18, marginTop:4, letterSpacing:2 }}>
            {"●".repeat(Math.round(meta.score/2))}{"○".repeat(5-Math.round(meta.score/2))}
          </div>
        </div>
      </div>

      {/* Picks */}
      <div style={{ marginBottom:picks.length ? 12 : 0 }}>
        <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.07em", marginBottom:7 }}>📈 TOP PICKS (スコア7+)</div>
        {picks.length === 0 && <div style={{ fontSize:12, color:C.muted }}>この日はスコア7以上の候補なし</div>}
        {picks.map((p, i) => (
          <div key={i} style={{
            background:"#0d1020", borderRadius:7, padding:"9px 12px",
            border:`1px solid ${C.border}`, display:"flex", gap:10, alignItems:"center",
            flexWrap:"wrap", marginBottom:5,
          }}>
            <Badge color={C.green}>{p.code}</Badge>
            <span style={{ fontSize:13, fontWeight:600, color:C.text, minWidth:110 }}>{p.name}</span>
            <div style={{ background:C.green+"22", color:C.green, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700 }}>
              ★{p.score}
            </div>
          </div>
        ))}
      </div>

      {/* Avoids */}
      {avoid.length > 0 && (
        <>
          <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.07em", marginBottom:7 }}>⚠️ AVOID</div>
          {avoid.map((a, i) => (
            <div key={i} style={{
              background:"#0d1020", borderRadius:7, padding:"8px 12px",
              border:`1px solid #2a1520`, display:"flex", gap:10, alignItems:"center",
              flexWrap:"wrap", marginBottom:5,
            }}>
              <Badge color={C.red}>{a.code}</Badge>
              <span style={{ fontSize:12, fontWeight:600, color:"#cc8090" }}>{a.name}</span>
              <span style={{ fontSize:12, color:C.muted, flex:1 }}>{a.reason}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── 保有株式セクション ─────────────────────────────────────────────────────
function HoldingsSection({ holdings }) {
  if (!holdings.length) return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20, color:C.muted, fontSize:13 }}>
      現在保有株式なし
    </div>
  );

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
        <span>📦</span> 保有株式
      </div>
      {holdings.map(h => {
        const pts = h.priceHistory ?? [];
        // currentPrice があればそれを優先（holdings_live.json から取得した最新値）
        const current = h.currentPrice ?? (pts.length ? pts[pts.length-1].p : h.avgCost);
        const pnl = h.pnl ?? (current - h.avgCost) * h.qty;
        const pnlPct = h.pnlPct ?? ((current - h.avgCost) / h.avgCost * 100).toFixed(2);
        const pc = pnl >= 0 ? C.green : C.red;

        return (
          <div key={h.code} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:12 }}>
            {/* Info row */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
              <div style={{ background:"#0d1020", borderRadius:8, padding:"12px 14px", border:`1px solid ${C.border}`, flex:"2 1 160px" }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>銘柄</div>
                <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{h.code} {h.name}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{h.qty}株 ｜ 取得単価 {h.avgCost.toLocaleString()}円</div>
              </div>
              <div style={{ background:"#0d1020", borderRadius:8, padding:"12px 14px", border:`1px solid ${pc}44`, flex:"1 1 100px" }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>評価損益</div>
                <div style={{ fontSize:20, fontWeight:800, color:pc }}>{pnl>=0?"+":""}{pnl.toLocaleString()}円</div>
                <div style={{ fontSize:11, color:pc, marginTop:2 }}>({pnlPct>=0?"+":""}{pnlPct}%)</div>
              </div>
              <div style={{ background:"#0d1020", borderRadius:8, padding:"12px 14px", border:`1px solid ${C.border}`, flex:"1 1 100px" }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>損切</div>
                <div style={{ fontSize:17, fontWeight:700, color:C.red }}>{h.sl.toLocaleString()}円</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>現値まで {((current-h.sl)/h.sl*100).toFixed(1)}%</div>
              </div>
              <div style={{ background:"#0d1020", borderRadius:8, padding:"12px 14px", border:`1px solid ${C.border}`, flex:"1 1 100px" }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>利確</div>
                <div style={{ fontSize:17, fontWeight:700, color:C.green }}>{h.tp.toLocaleString()}円</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>残り +{((h.tp-current)/current*100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Chart */}
            {pts.length > 1 && (
              <>
                <div style={{ fontSize:10, color:C.muted, marginBottom:6 }}>価格推移（監視ログ値）</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={pts} margin={{ left:0, right:14, top:8, bottom:0 }}>
                    <defs>
                      <linearGradient id={`pg${h.code}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={C.accent} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="t" tick={{ fill:C.muted, fontSize:9 }} interval="preserveStartEnd" />
                    <YAxis domain={["auto","auto"]} tick={{ fill:C.muted, fontSize:9 }} tickFormatter={v=>v.toLocaleString()} width={52} />
                    <Tooltip content={<Tip />} />
                    <ReferenceLine y={h.sl} stroke={C.red}   strokeDasharray="5 3" label={{ value:"損切", fill:C.red,   fontSize:9, position:"insideTopRight" }} />
                    <ReferenceLine y={h.tp} stroke={C.green} strokeDasharray="5 3" label={{ value:"利確", fill:C.green, fontSize:9, position:"insideTopRight" }} />
                    <Area type="monotone" dataKey="p" name="株価" stroke={C.accent} fill={`url(#pg${h.code})`} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── トレード履歴セクション ────────────────────────────────────────────────
function TradeHistorySection({ trades }) {
  const [filter, setFilter] = useState("ALL");
  const filters = ["ALL","BUY","SELL","✅成功"];

  const filtered = trades.filter(t => {
    if (filter === "ALL") return true;
    if (filter === "BUY")  return t.dir === "BUY";
    if (filter === "SELL") return t.dir === "SELL";
    if (filter === "✅成功") return t.status.includes("✅");
    return true;
  });

  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>📋</span>
        <span style={{ fontSize:13, fontWeight:700, color:C.text }}>トレード履歴</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:5, flexWrap:"wrap" }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: f===filter ? C.accent+"22" : "transparent",
              border: `1px solid ${f===filter ? C.accent : C.border}`,
              color: f===filter ? C.accent : C.muted,
              borderRadius:5, padding:"3px 9px", fontSize:11, cursor:"pointer", fontWeight:600,
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:560 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["日時","コード","銘柄","方向","株数","単価","損切","利確","ステータス"].map(h=>(
                <th key={h} style={{ padding:"6px 8px", textAlign:"left", color:C.muted, fontWeight:600, fontSize:10, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t,i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${C.border}22` }}>
                <td style={{ padding:"7px 8px", color:C.muted, whiteSpace:"nowrap", fontSize:11 }}>{t.datetime}</td>
                <td style={{ padding:"7px 8px" }}><Badge color={C.accent}>{t.code}</Badge></td>
                <td style={{ padding:"7px 8px", color:C.text, fontWeight:600, whiteSpace:"nowrap" }}>{t.name}</td>
                <td style={{ padding:"7px 8px" }}><Badge color={t.dir==="BUY"?C.green:C.red}>{t.dir}</Badge></td>
                <td style={{ padding:"7px 8px", color:C.text, fontFamily:"monospace" }}>{t.qty}</td>
                <td style={{ padding:"7px 8px", color:C.text, fontFamily:"monospace" }}>{t.entry?.toLocaleString()}</td>
                <td style={{ padding:"7px 8px", color:C.red,   fontFamily:"monospace" }}>{t.sl?.toLocaleString()}</td>
                <td style={{ padding:"7px 8px", color:C.green, fontFamily:"monospace" }}>{t.tp?.toLocaleString()}</td>
                <td style={{ padding:"7px 8px", fontSize:11, color: t.status.includes("✅") ? C.green : t.status.includes("失敗") ? C.red : C.muted, whiteSpace:"nowrap" }}>
                  {t.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── アナリティクスセクション ──────────────────────────────────────────────
function AnalyticsSection({ data }) {
  const scoreDist = [
    { score:"9-10", count: Object.values(data.picksByDate).flat().filter(p=>p.score>=9).length },
    { score:"8",    count: Object.values(data.picksByDate).flat().filter(p=>p.score===8).length },
    { score:"7",    count: Object.values(data.picksByDate).flat().filter(p=>p.score===7).length },
  ].filter(r=>r.count>0);

  const balance = data.balanceHist.map(b => ({ d: b.t.slice(0,5), v: b.v }));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px,1fr))", gap:14, marginBottom:20 }}>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:12 }}>📊 スコア分布 (7+)</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={scoreDist} margin={{ left:-10, right:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="score" tick={{ fill:C.muted, fontSize:11 }} />
            <YAxis tick={{ fill:C.muted, fontSize:11 }} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="count" name="件数" fill={C.accent} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:12 }}>💴 買付余力推移</div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={balance} margin={{ left:0, right:10 }}>
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.green} stopOpacity={0.3}/>
                <stop offset="100%" stopColor={C.green} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="d" tick={{ fill:C.muted, fontSize:11 }} />
            <YAxis tick={{ fill:C.muted, fontSize:10 }} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} width={38} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="v" name="余力(円)" stroke={C.green} fill="url(#bg)" strokeWidth={2} dot={{ fill:C.green, r:4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── メインダッシュボード ───────────────────────────────────────────────────
export default function Dashboard({ data }) {
  const [tab, setTab] = useState("overview");
  const s = data.summary;
  const now = new Date().toLocaleString("ja-JP", { timeZone:"Asia/Tokyo", hour12:false });

  const TABS = [
    { id:"overview", label:"概要" },
    { id:"topics",   label:"Topics" },
    { id:"holdings", label:"保有" },
    { id:"history",  label:"履歴" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Noto Sans JP', sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        background:"#0d101a", borderBottom:`1px solid ${C.border}`,
        padding:"0 16px", position:"sticky", top:0, zIndex:100,
        display:"flex", alignItems:"center", height:50, gap:12,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <div style={{
            width:28, height:28, borderRadius:6,
            background:`linear-gradient(135deg,${C.accent},#0066ff)`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
          }}>⚡</div>
          <div>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:"0.06em" }}>DAYTRADE BOT</div>
            <div style={{ fontSize:9, color:C.muted }}>SBI × Claude AI</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display:"flex", gap:2, marginLeft:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab===t.id ? C.accent+"18" : "transparent",
              border:`1px solid ${tab===t.id ? C.accent+"55" : "transparent"}`,
              color: tab===t.id ? C.accent : C.muted,
              borderRadius:5, padding:"4px 11px", fontSize:11, cursor:"pointer", fontWeight:600,
            }}>{t.label}</button>
          ))}
        </nav>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:10, color:C.muted, display:"none" }}
                className="time-display">{now}</span>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.yellow, boxShadow:`0 0 5px ${C.yellow}` }} />
            <span style={{ fontSize:11, color:C.yellow, fontWeight:600 }}>待機中</span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main style={{ maxWidth:1080, margin:"0 auto", padding:"16px 14px" }}>

        {/* KPI */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}>
          <KpiCard icon="💹" label="確定損益"   value={`¥${s.totalPnl?.toLocaleString?.() ?? 0}`}   sub="累計" color={s.totalPnl >= 0 ? C.green : C.red} />
          <KpiCard icon="📦" label="保有銘柄"   value={`${data.holdings.length}銘柄`}               sub={data.holdings[0]?.name ?? "—"} color={C.accent} />
          <KpiCard icon="💴" label="買付余力"   value={`¥${s.latestBalance?.toLocaleString?.() ?? 0}`} sub="最終取得値" color={C.yellow} />
          <KpiCard icon="✅" label="発注成功"   value={`${s.successTrades}件`}  sub={`全${s.totalTrades}試行`} color={C.green} />
          <KpiCard icon="📡" label="リアルタイム更新"
            value={data.liveUpdatedAt ? "接続中" : "未接続"}
            sub={data.liveUpdatedAt ? data.liveUpdatedAt.slice(0,16).replace("T"," ") : "Bot起動で自動連携"}
            color={data.liveUpdatedAt ? C.green : C.muted} />
        </div>

        {tab === "overview" && (
          <>
            <AnalyticsSection data={data} />
            <HoldingsSection  holdings={data.holdings} />
            <TradeHistorySection trades={data.trades} />
          </>
        )}
        {tab === "topics"   && <TopicsSection   picksByDate={data.picksByDate} />}
        {tab === "holdings" && <HoldingsSection  holdings={data.holdings} />}
        {tab === "history"  && <TradeHistorySection trades={data.trades} />}

        {/* Footer */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14, marginTop:8, display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:6, fontSize:10, color:C.muted }}>
          <span>Daytrade Bot BI Dashboard | ログ: {Object.keys(data.picksByDate).join(" 〜 ")}</span>
          <span>生成: {data.generatedAt?.slice(0,16)?.replace("T"," ")}</span>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        body { background: #0a0c12; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:#0a0c12; }
        ::-webkit-scrollbar-thumb { background:#1e2335; border-radius:3px; }
        button { transition:all 0.12s; border:none; cursor:pointer; }
        @media (min-width:520px) { .time-display { display:inline !important; } }
      `}</style>
    </div>
  );
}
