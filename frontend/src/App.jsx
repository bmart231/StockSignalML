import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SIGNAL_COLORS = {
  "Strong Buy": { bg: "#14532d", text: "#dcfce7", border: "#166534" },
  Buy: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  Hold: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  Sell: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  "Strong Sell": { bg: "#7f1d1d", text: "#fee2e2", border: "#991b1b" },
};

const SECTORS = ["tech", "finance", "energy", "healthcare", "consumer"];

function getStrengthSignal(signal, confidence) {
  const score = confidence[signal];
  if (signal === "Buy") return score >= 0.6 ? "Strong Buy" : "Buy";
  if (signal === "Sell") return score >= 0.6 ? "Strong Sell" : "Sell";
  return "Hold";
}

function Skeleton({ width = "100%", height = "16px", borderRadius = "6px" }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

function SkeletonCard({ dark }) {
  return (
    <div
      style={{
        background: dark ? "#1f2937" : "white",
        borderRadius: "12px",
        border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
        padding: "1.5rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Skeleton width="80px" height="28px" />
          <Skeleton width="120px" height="22px" />
        </div>
        <Skeleton width="80px" height="36px" borderRadius="999px" />
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
        <Skeleton height="60px" borderRadius="8px" />
        <Skeleton height="60px" borderRadius="8px" />
        <Skeleton height="60px" borderRadius="8px" />
      </div>
      <Skeleton height="140px" borderRadius="8px" />
      <div
        style={{
          marginTop: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <Skeleton height="12px" width="120px" />
        <Skeleton height="8px" />
        <Skeleton height="8px" />
        <Skeleton height="8px" />
      </div>
    </div>
  );
}

function ConfidenceBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontSize: "13px", fontWeight: 600 }}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div
        style={{ background: "#f3f4f6", borderRadius: "999px", height: "6px" }}
      >
        <div
          style={{
            width: `${value * 100}%`,
            background: color,
            height: "6px",
            borderRadius: "999px",
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

function ExplanationBar({ feature, value }) {
  const isPositive = value >= 0;
  const width = Math.min(Math.abs(value) * 300, 100);
  const label = feature.replace(/_/g, " ").toUpperCase();
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontSize: "12px", color: "#6b7280" }}>{label}</span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: isPositive ? "#16a34a" : "#dc2626",
          }}
        >
          {isPositive ? "+" : ""}
          {value.toFixed(3)}
        </span>
      </div>
      <div
        style={{ background: "#f3f4f6", borderRadius: "999px", height: "5px" }}
      >
        <div
          style={{
            width: `${width}%`,
            background: isPositive ? "#22c55e" : "#ef4444",
            height: "5px",
            borderRadius: "999px",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, dark }) {
  return (
    <div
      style={{
        background: dark ? "#111827" : "#f9fafb",
        border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
        borderRadius: "8px",
        padding: "12px 16px",
        flex: 1,
      }}
    >
      <p
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          margin: "0 0 4px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "16px",
          fontWeight: 600,
          margin: 0,
          color: dark ? "#f9fafb" : "#111827",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SectorGrid({ sectorData, dark, onTickerClick }) {
  const textPrimary = dark ? "#f9fafb" : "#111827";
  const cardBg = dark ? "#1f2937" : "white";
  const cardBorder = dark ? "#374151" : "#e5e7eb";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "10px",
        marginTop: "1rem",
      }}
    >
      {sectorData.map((item) => {
        const ss = getStrengthSignal(item.signal, item.confidence);
        const colors = SIGNAL_COLORS[ss];
        return (
          <div
            key={item.ticker}
            onClick={() => onTickerClick(item.ticker)}
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: "10px",
              padding: "14px",
              cursor: "pointer",
              transition: "transform 0.1s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.02)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <p
              style={{
                fontSize: "15px",
                fontWeight: 700,
                margin: "0 0 8px",
                color: textPrimary,
              }}
            >
              {item.ticker}
            </p>
            <span
              style={{
                background: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                padding: "4px 10px",
                borderRadius: "999px",
                fontWeight: 600,
                fontSize: "12px",
                display: "inline-block",
                marginBottom: "8px",
              }}
            >
              {ss}
            </span>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {["Buy", "Hold", "Sell"].map((label) => (
                <div
                  key={label}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      height: "4px",
                      width: `${(item.confidence[label] || 0) * 100}%`,
                      background:
                        label === "Buy"
                          ? "#22c55e"
                          : label === "Hold"
                            ? "#eab308"
                            : "#ef4444",
                      borderRadius: "999px",
                      flex: 1,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#9ca3af",
                      minWidth: "28px",
                    }}
                  >
                    {((item.confidence[label] || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dark, setDark] = useState(true);

  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem("watchlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [watchlistData, setWatchlistData] = useState({});

  const [activeSector, setActiveSector] = useState(null);
  const [sectorData, setSectorData] = useState(null);
  const [sectorLoading, setSectorLoading] = useState(false);

  useEffect(() => {
    if (watchlist.length > 0) refreshWatchlist();
  }, []);

  async function refreshWatchlist() {
    const results = {};
    await Promise.all(
      watchlist.map(async (t) => {
        try {
          const res = await fetch(`${API}/predict/${t}`);
          if (res.ok) results[t] = await res.json();
        } catch {}
      }),
    );
    setWatchlistData(results);
  }

  function addToWatchlist() {
    if (!result || watchlist.includes(result.ticker)) return;
    const updated = [...watchlist, result.ticker];
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));
    setWatchlistData((prev) => ({ ...prev, [result.ticker]: result }));
  }

  function removeFromWatchlist(t) {
    const updated = watchlist.filter((w) => w !== t);
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));
    setWatchlistData((prev) => {
      const next = { ...prev };
      delete next[t];
      return next;
    });
  }

  async function loadSector(sector) {
    if (activeSector === sector) {
      setActiveSector(null);
      setSectorData(null);
      return;
    }
    setActiveSector(sector);
    setSectorData(null);
    setSectorLoading(true);
    try {
      const res = await fetch(`${API}/sector/${sector}`);
      if (res.ok) {
        const data = await res.json();
        setSectorData(data.results);
      }
    } catch {}
    setSectorLoading(false);
  }

  function handleTickerClick(t) {
    setTicker(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSearch() {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStockInfo(null);
    setExplanation(null);

    try {
      const res = await fetch(`${API}/predict/${ticker.toUpperCase()}`);
      if (!res.ok) throw new Error("Failed to fetch signal");
      const data = await res.json();
      setResult(data);
      setLoading(false);

      try {
        const yahooRes = await fetch(
          `${API}/stockinfo/${ticker.toUpperCase()}`,
        );
        if (yahooRes.ok) {
          const yahooData = await yahooRes.json();
          const timestamps = yahooData.chart.result[0].timestamp;
          const closes = yahooData.chart.result[0].indicators.quote[0].close;
          const chartData = timestamps
            .map((t, i) => ({
              date: new Date(t * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              price: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
            }))
            .filter((d) => d.price !== null);
          const firstPrice = chartData[0]?.price;
          const lastPrice = chartData[chartData.length - 1]?.price;
          const change = lastPrice - firstPrice;
          const changePct = ((change / firstPrice) * 100).toFixed(2);
          setStockInfo({
            price: lastPrice?.toFixed(2),
            change: change.toFixed(2),
            changePct,
            high: Math.max(...chartData.map((d) => d.price)).toFixed(2),
            low: Math.min(...chartData.map((d) => d.price)).toFixed(2),
            chartData,
            isPositive: change >= 0,
          });
        }
      } catch {}

      try {
        const explainRes = await fetch(
          `${API}/explain/${ticker.toUpperCase()}`,
        );
        if (explainRes.ok) {
          const explainData = await explainRes.json();
          setExplanation(explainData.explanation);
        }
      } catch {}
    } catch (err) {
      setError("Could not fetch signal. Make sure the API is running.");
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  const strengthSignal = result
    ? getStrengthSignal(result.signal, result.confidence)
    : null;
  const colors = strengthSignal ? SIGNAL_COLORS[strengthSignal] : null;

  const bg = dark ? "#111827" : "#f9fafb";
  const cardBg = dark ? "#1f2937" : "white";
  const cardBorder = dark ? "#374151" : "#e5e7eb";
  const textPrimary = dark ? "#f9fafb" : "#111827";
  const textMuted = dark ? "#9ca3af" : "#6b7280";
  const divider = dark ? "#374151" : "#f3f4f6";

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: bg,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "3rem 2rem",
          transition: "background 0.3s ease",
        }}
      >
        <div style={{ width: "100%", maxWidth: "560px" }}>
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "2rem",
              position: "relative",
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                margin: 0,
                color: textPrimary,
              }}
            >
              StockSignal
            </h1>
            <p style={{ color: textMuted, marginTop: "8px", fontSize: "15px" }}>
              ML-powered buy / sell / hold signals
            </p>
            <button
              onClick={() => setDark((d) => !d)}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "8px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>

          {/* Search */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Enter ticker (e.g. AAPL)"
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "8px",
                border: `1px solid ${cardBorder}`,
                fontSize: "16px",
                outline: "none",
                background: cardBg,
                color: textPrimary,
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading ? "#9ca3af" : "#111827",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 500,
              }}
            >
              {loading ? "Loading..." : "Analyze"}
            </button>
          </div>

          {/* Sector Pills */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => loadSector(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: `1px solid ${activeSector === s ? "#111827" : cardBorder}`,
                  background: activeSector === s ? "#111827" : cardBg,
                  color: activeSector === s ? "white" : textMuted,
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: activeSector === s ? 600 : 400,
                  textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sector Dashboard */}
          {activeSector && (
            <div
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                padding: "1.25rem",
                marginBottom: "1.5rem",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: textMuted,
                  margin: "0 0 4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {activeSector} sector
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: textMuted,
                  margin: "0 0 8px",
                }}
              >
                Click any ticker to analyze it
              </p>
              {sectorLoading ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      style={{
                        background: dark ? "#111827" : "#f9fafb",
                        borderRadius: "10px",
                        padding: "14px",
                      }}
                    >
                      <Skeleton width="60px" height="18px" />
                      <div style={{ marginTop: "8px" }}>
                        <Skeleton height="24px" borderRadius="999px" />
                      </div>
                      <div
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <Skeleton height="4px" />
                        <Skeleton height="4px" />
                        <Skeleton height="4px" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sectorData ? (
                <SectorGrid
                  sectorData={sectorData}
                  dark={dark}
                  onTickerClick={handleTickerClick}
                />
              ) : null}
            </div>
          )}

          {/* Error */}
          {error && (
            <p
              style={{
                color: "#991b1b",
                textAlign: "center",
                marginBottom: "1rem",
              }}
            >
              {error}
            </p>
          )}

          {/* Skeleton */}
          {loading && <SkeletonCard dark={dark} />}

          {/* Result Card */}
          {result && colors && !loading && (
            <div
              style={{
                background: cardBg,
                borderRadius: "12px",
                border: `1px solid ${cardBorder}`,
                padding: "1.5rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: "0 0 4px",
                      fontSize: "24px",
                      fontWeight: 700,
                      color: textPrimary,
                    }}
                  >
                    {result.ticker}
                  </h2>
                  {stockInfo && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "22px",
                        fontWeight: 600,
                        color: textPrimary,
                      }}
                    >
                      ${stockInfo.price}
                      <span
                        style={{
                          fontSize: "14px",
                          marginLeft: "8px",
                          color: stockInfo.isPositive ? "#16a34a" : "#dc2626",
                          fontWeight: 500,
                        }}
                      >
                        {stockInfo.isPositive ? "▲" : "▼"}{" "}
                        {Math.abs(stockInfo.changePct)}%
                      </span>
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      padding: "8px 20px",
                      borderRadius: "999px",
                      fontWeight: 700,
                      fontSize: "15px",
                    }}
                  >
                    {strengthSignal}
                  </span>
                  <button
                    onClick={addToWatchlist}
                    disabled={watchlist.includes(result.ticker)}
                    style={{
                      padding: "5px 12px",
                      fontSize: "12px",
                      background: watchlist.includes(result.ticker)
                        ? dark
                          ? "#374151"
                          : "#f3f4f6"
                        : "#111827",
                      color: watchlist.includes(result.ticker)
                        ? "#9ca3af"
                        : "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: watchlist.includes(result.ticker)
                        ? "default"
                        : "pointer",
                    }}
                  >
                    {watchlist.includes(result.ticker)
                      ? "✓ In watchlist"
                      : "+ Watchlist"}
                  </button>
                </div>
              </div>

              {stockInfo && (
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "1.25rem",
                  }}
                >
                  <StatCard
                    label="1mo High"
                    value={`$${stockInfo.high}`}
                    dark={dark}
                  />
                  <StatCard
                    label="1mo Low"
                    value={`$${stockInfo.low}`}
                    dark={dark}
                  />
                  <StatCard
                    label="1mo Change"
                    value={`${stockInfo.isPositive ? "+" : ""}${stockInfo.change}`}
                    dark={dark}
                  />
                </div>
              )}

              {stockInfo && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      color: textMuted,
                      margin: "0 0 8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    30-day price
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={stockInfo.chartData}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        formatter={(v) => [`$${v}`, "Price"]}
                        contentStyle={{
                          fontSize: "12px",
                          borderRadius: "6px",
                          background: cardBg,
                          border: `1px solid ${cardBorder}`,
                          color: textPrimary,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={stockInfo.isPositive ? "#22c55e" : "#ef4444"}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div
                style={{
                  borderTop: `1px solid ${divider}`,
                  paddingTop: "1.25rem",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: textMuted,
                    margin: "0 0 12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Model confidence
                </p>
                <ConfidenceBar
                  label="Buy"
                  value={result.confidence.Buy}
                  color="#22c55e"
                />
                <ConfidenceBar
                  label="Hold"
                  value={result.confidence.Hold}
                  color="#eab308"
                />
                <ConfidenceBar
                  label="Sell"
                  value={result.confidence.Sell}
                  color="#ef4444"
                />
              </div>

              {explanation && (
                <div
                  style={{
                    borderTop: `1px solid ${divider}`,
                    paddingTop: "1.25rem",
                    marginTop: "1.25rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      color: textMuted,
                      margin: "0 0 12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Why {strengthSignal}? — top indicators
                  </p>
                  {Object.entries(explanation)
                    .slice(0, 7)
                    .map(([feature, value]) => (
                      <ExplanationBar
                        key={feature}
                        feature={feature}
                        value={value}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {result && !loading && (
            <p
              style={{
                fontSize: "11px",
                color: textMuted,
                textAlign: "center",
                lineHeight: "1.5",
                marginBottom: "2rem",
              }}
            >
              Not financial advice. Signals are generated by an ML model trained
              on historical technical indicators.
            </p>
          )}

          {/* Watchlist */}
          {watchlist.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 600,
                    color: textPrimary,
                  }}
                >
                  Watchlist
                </h3>
                <button
                  onClick={refreshWatchlist}
                  style={{
                    fontSize: "12px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${cardBorder}`,
                    background: cardBg,
                    cursor: "pointer",
                    color: textPrimary,
                  }}
                >
                  Refresh
                </button>
              </div>
              {watchlist.map((t) => {
                const data = watchlistData[t];
                const ws = data
                  ? getStrengthSignal(data.signal, data.confidence)
                  : null;
                const wColors = ws ? SIGNAL_COLORS[ws] : null;
                return (
                  <div
                    key={t}
                    style={{
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: "10px",
                      padding: "12px 16px",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setTicker(t)}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "15px",
                        color: textPrimary,
                      }}
                    >
                      {t}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {data && wColors ? (
                        <span
                          style={{
                            background: wColors.bg,
                            color: wColors.text,
                            border: `1px solid ${wColors.border}`,
                            padding: "4px 12px",
                            borderRadius: "999px",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          {ws}
                        </span>
                      ) : (
                        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                          Loading...
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchlist(t);
                        }}
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px 6px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
