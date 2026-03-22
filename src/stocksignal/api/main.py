import joblib
import shap
import numpy as np
import httpx
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stocksignal.model.predict import predict
from stocksignal.data.fetcher import fetch_stock_data
from stocksignal.features.build_features import build_features

app = FastAPI(title="StockSignal API")




# allow React frontend to talk to the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://stock-signal-ml.vercel.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

FEATURE_COLS = [
    "sma_20", "sma_50", "ema_12", "ema_26",
    "rsi", "macd", "macd_signal",
    "bb_upper", "bb_lower", "atr",
    "volume_ratio", "return_1w", "return_1m", "return_3m"
]



# simple in-memory cache {key: (result, timestamp)}
cache = {}
CACHE_DURATION = timedelta(hours=1)

def get_cached(key: str):
    if key in cache:
        result, timestamp = cache[key]
        if datetime.now() - timestamp < CACHE_DURATION:
            return result
    return None

def set_cached(key: str, result):
    cache[key] = (result, datetime.now())


class SignalResponse(BaseModel):
    ticker: str
    signal: str
    confidence: dict[str, float]


@app.get("/predict/{ticker}", response_model=SignalResponse)
def get_signal(ticker: str):
    try:
        # check cache first
        cached = get_cached(f"predict_{ticker}")
        if cached:
            return cached
        result = predict(ticker.upper())
        set_cached(f"predict_{ticker}", result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stockinfo/{ticker}")
async def get_stock_info(ticker: str):
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1mo"
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5.0)
            return res.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/explain/{ticker}")
def explain_signal(ticker: str):
    try:
        # check cache first
        cached = get_cached(f"explain_{ticker}")
        if cached:
            return cached

        model = joblib.load("model.pkl")
        le = joblib.load("label_encoder.pkl")

        df = fetch_stock_data(ticker, period="6mo")
        df = build_features(df)
        df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]

        latest = df[FEATURE_COLS].iloc[[-1]]

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(latest)

        # get predicted class index
        pred_enc = int(model.predict(latest)[0])
        signal = le.inverse_transform([pred_enc])[0]

        # handle both 2D and 3D shap value arrays
        if isinstance(shap_values, list):
            # list of arrays (one per class) — index by predicted class
            class_shap = shap_values[pred_enc][0]
        elif len(shap_values.shape) == 3:
            # 3D array (samples, features, classes)
            class_shap = shap_values[0, :, pred_enc]
        else:
            # 2D array (samples, features)
            class_shap = shap_values[0]

        # pair each feature with its SHAP value
        explanation = {
            feature: round(float(value), 4)
            for feature, value in zip(FEATURE_COLS, class_shap)
        }

        # sort by absolute importance
        explanation = dict(sorted(explanation.items(), key=lambda x: abs(x[1]), reverse=True))

        result = {
            "ticker": ticker.upper(),
            "signal": signal,
            "explanation": explanation
        }

        set_cached(f"explain_{ticker}", result)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
SECTORS = {
    "tech": ["AAPL", "MSFT", "GOOGL", "NVDA", "META", "AMD", "INTC"],
    "finance": ["JPM", "BAC", "GS", "MS", "WFC", "C", "BLK"],
    "energy": ["XOM", "CVX", "COP", "SLB", "EOG", "PSX", "MPC"],
    "healthcare": ["JNJ", "UNH", "PFE", "ABBV", "MRK", "TMO", "ABT"],
    "consumer": ["AMZN", "TSLA", "NKE", "MCD", "SBUX", "TGT", "HD"],
}

@app.get("/sector/{sector}")
def get_sector_signals(sector: str):
    try:
        tickers = SECTORS.get(sector.lower())
        if not tickers:
            raise HTTPException(status_code=404, detail=f"Sector '{sector}' not found. Available: {list(SECTORS.keys())}")

        results = []
        for ticker in tickers:
            try:
                cached = get_cached(f"predict_{ticker}")
                if cached:
                    results.append(cached)
                else:
                    result = predict(ticker)
                    set_cached(f"predict_{ticker}", result)
                    results.append(result)
            except:
                results.append({"ticker": ticker, "signal": "Error", "confidence": {}})

        return {"sector": sector, "results": results}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))