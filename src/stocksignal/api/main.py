from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stocksignal.model.predict import predict

app = FastAPI(title="StockSignal API")

# allow React frontend to talk to the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SignalResponse(BaseModel):
    ticker: str
    signal: str
    confidence: dict[str, float]

@app.get("/predict/{ticker}", response_model=SignalResponse)
def get_signal(ticker: str):
    try:
        result = predict(ticker.upper())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}

import httpx

@app.get("/stockinfo/{ticker}")
async def get_stock_info(ticker: str):
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1mo"
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            return res.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))