import joblib
import pandas as pd
from stocksignal.data.fetcher import fetch_stock_data
from stocksignal.features.build_features import build_features

FEATURE_COLS = [
    "sma_20", "sma_50", "ema_12", "ema_26",
    "rsi", "macd", "macd_signal",
    "bb_upper", "bb_lower", "atr",
    "volume_ratio", "return_1w", "return_1m", "return_3m"
]

def predict(ticker: str) -> dict:
    model = joblib.load("model.pkl")

    df = fetch_stock_data(ticker, period="6mo")
    df = build_features(df)

    latest = df[FEATURE_COLS].iloc[[-1]]
    signal = model.predict(latest)[0]
    proba = model.predict_proba(latest)[0]
    classes = model.classes_

    confidence = {c: round(float(p), 3) for c, p in zip(classes, proba)}

    return {
        "ticker": ticker.upper(),
        "signal": signal,
        "confidence": confidence
    }

if __name__ == "__main__":
    import sys
    ticker = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    result = predict(ticker)
    print(f"\nTicker:     {result['ticker']}")
    print(f"Signal:     {result['signal']}")
    print(f"Confidence: {result['confidence']}\n")