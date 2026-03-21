# StockSignal ML

An end-to-end machine learning pipeline that predicts **Buy / Hold / Sell**
signals for stocks using technical indicators and a XGBoost classifier, served
via a FastAPI backend and visualized in a React frontend.

![StockSignal Demo](docs/demo.png)

---

## Quickstart

### 1. Clone and install

```bash
git clone https://github.com/bmart231/StockSignalML.git
cd StockSignalML

python -m venv venv
source venv/bin/activate
pip install -e .
pip install -r requirements.txt
```

### 2. Train the model

```bash
python src/stocksignal/model/train.py
```

### 3. Run the API

```bash
uvicorn stocksignal.api.main:app --reload
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` and enter any stock ticker.

---

### Feature Engineering

14 technical indicators are computed from raw OHLCV data:

- **Trend**: SMA(20), SMA(50), EMA(12), EMA(26)
- **Momentum**: RSI(14), MACD, MACD Signal
- **Volatility**: Bollinger Bands upper/lower, ATR(14)
- **Volume**: Volume ratio (vs 20-day average)
- **Price momentum**: 1-week, 1-month, 3-month returns

### Labeling

Each row is labeled by looking 10 days forward:

- **Buy** → future return > +3%
- **Sell** → future return < -3%
- **Hold** → otherwise

### Model

A XGBoost gradient boosting classifier trained on 7 tickers × 5 years of daily
data (~8,750 samples). Train/test split is 80/20 with no shuffling to respect
time ordering.

### Backtesting

Strategy simulates entering on Buy signals and exiting on Sell signals,
comparing cumulative returns against a buy-and-hold baseline on the held-out
test set.

---
