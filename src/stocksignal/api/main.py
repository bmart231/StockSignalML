from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from stocksignal.model.predict import predict

# initialize the FastAPI app
app = FastAPI(title="StockSignal API")

# define the response structure
class SignalResponse(BaseModel):
    ticker: str
    signal: str
    confidence: dict[str, float]

@app.get("/predict/{ticker}", response_model=SignalResponse)
def get_signal(ticker: str):
    try:
        # call the predict function from predict.py
        result = predict(ticker.upper())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}