import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SIGNAL_COLORS = {
  Buy: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  Sell: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  Hold: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
};

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

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
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
      <p style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>{value}</p>
    </div>
  );
}

export default function App() {
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch() {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStockInfo(null);

    try {
      // fetch signal from our API first
      const res = await fetch(
        `http://localhost:8000/predict/${ticker.toUpperCase()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch signal");
      const data = await res.json();
      setResult(data);
      setLoading(false);

      // fetch chart data separately so it doesn't block the signal
      try {
        const yahooRes = await fetch(
          `http://localhost:8000/stockinfo/${ticker.toUpperCase()}`,
        );
        if (yahooRes.ok) {
          const yahooData = await yahooRes.json();
          const meta = yahooData.chart.result[0].meta;
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
      } catch {
        // chart failed silently, signal still shows
      }
    } catch (err) {
      setError("Could not fetch signal. Make sure the API is running.");
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  const colors = result ? SIGNAL_COLORS[result.signal] : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "560px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
            StockSignal
          </h1>
          <p style={{ color: "#6b7280", marginTop: "8px", fontSize: "15px" }}>
            ML-powered buy / sell / hold signals
          </p>
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
              border: "1px solid #e5e7eb",
              fontSize: "16px",
              outline: "none",
              background: "white",
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

        {/* Result Card */}
        {result && colors && (
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            {/* Ticker + Signal */}
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
                  }}
                >
                  {result.ticker}
                </h2>
                {stockInfo && (
                  <p style={{ margin: 0, fontSize: "22px", fontWeight: 600 }}>
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
              <span
                style={{
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  padding: "8px 20px",
                  borderRadius: "999px",
                  fontWeight: 700,
                  fontSize: "16px",
                }}
              >
                {result.signal}
              </span>
            </div>

            {/* Stat Cards */}
            {stockInfo && (
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}
              >
                <StatCard label="1mo High" value={`$${stockInfo.high}`} />
                <StatCard label="1mo Low" value={`$${stockInfo.low}`} />
                <StatCard
                  label="1mo Change"
                  value={`${stockInfo.isPositive ? "+" : ""}${stockInfo.change}`}
                />
              </div>
            )}

            {/* Price Chart */}
            {stockInfo && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
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
                      contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
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

            {/* Confidence Bars */}
            <div
              style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1.25rem" }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
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
          </div>
        )}

        {/* Disclaimer */}
        {result && (
          <p
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              textAlign: "center",
              lineHeight: "1.5",
            }}
          >
            NOT FINANCIAL ADVICE THIS IS JUST A PROJECT.
          </p>
        )}
      </div>
    </div>
  );
}
