import pandas as pd
import numpy as np
import joblib
from stocksignal.data.fetcher import fetch_stock_data
from stocksignal.features.build_features import build_features
from stocksignal.features.assign_labels import add_labels


# cols of information needed for model
FEATURE_COLS = [
    "sma_20", "sma_50", "ema_12", "ema_26",
    "rsi", "macd", "macd_signal",
    "bb_upper", "bb_lower", "atr",
    "volume_ratio", "return_1w", "return_1m", "return_3m"
]

def backtest(ticker: str = "AAPL"):
    model = joblib.load("model.pkl") # load the trained model data
    df = fetch_stock_data(ticker) # get the 5 year data 
    df = build_features(df) # train
    df = add_labels(df) # assign labels (buy/hold/sell)
    df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]
    close = df["Close"].squeeze() # get just the closing prices
    
    
    # since we want only the latest information we can just get the 20% percent
    # of data for testing 
    split = int(len(df) * 0.8)
    test_df = df.iloc[split:].copy()
    test_close = close.iloc[split:]
    
    # run the model again and get predicted features 
    X_test = test_df[FEATURE_COLS]
    test_df["predicted"] = model.predict(X_test)
    
    # compute the daily percentage change in price for the test period
    daily_returns = test_close.pct_change().fillna(0)
    
    # track whether we are currently holding the stock or not 1 = hold, 0 = no
    position = 0
    
    # store each day's return based on our position
    model_returns = []
    
    for i, (idx, row) in enumerate(test_df.iterrows()):
        signal = row["predicted"].item() if hasattr(row["predicted"], "item") else row["predicted"]
    
        signal = row["predicted"]
        if signal == "Buy":
            position = 1
        elif signal == "Sell":
            position = 0

        # using next days returns
        rets = daily_returns.iloc[i + 1] * position if i + 1 < len(daily_returns) else 0
        model_returns.append(rets)
        
    # convert the data to pandas Series 
    model_returns = pd.Series(model_returns, index = test_df.index)
    
    # now we get the raw daily returns for the same test period (buy and hold baseline)
    buyhold_returns = daily_returns.loc[test_df.index]
    
    # compound the daily returns to get a cumulative growth curve
    cumulative_strategy = (1+ model_returns).cumprod()
    cumulative_buyhold = (1 + buyhold_returns).cumprod()
    
    # convert final cumulative value to a percentage return
    # get latest feature subtract 1 and multiply by 100 for percentages, 2 decimal place
    total_strategy = round((cumulative_strategy.iloc[-1] - 1) * 100, 2) 
    total_buyhold = round((cumulative_buyhold.iloc[-1] - 1) * 100, 2)
    
    # count the number of times the model predicted Buy
    buy_prediction = (test_df["predicted"] == "Buy")
    n_trades = buy_prediction.sum()
    # count how many times the buy predictions were actually correct
    label_prediction = (test_df['label'] == "Buy")  
    wins = 0
    in_trade = False
    entry_price = 0

    for i, (idx, row) in enumerate(test_df.iterrows()):
        if row["predicted"] == "Buy" and not in_trade:
            in_trade = True
            entry_price = test_close.iloc[i]
        elif row["predicted"] == "Sell" and in_trade:
            in_trade = False
            if test_close.iloc[i] > entry_price:
                wins += 1

    n_trades = wins  # recount based on completed trades
    win_rate = round(wins / n_trades * 100, 1) if n_trades > 0 else 0
    
    # print the final summary
    print(f"\n{'='*40}")
    print(f"Backtest Results — {ticker.upper()}")
    print(f"{'='*40}")
    print(f"Strategy Return:   {total_strategy}%")
    print(f"Buy & Hold Return: {total_buyhold}%")
    print(f"Total Trades:      {n_trades}")
    print(f"Win Rate:          {win_rate}%")
    print(f"{'='*40}\n")
    
if __name__ == "__main__":
    import sys
    # allow passing a ticker from the command line, default to AAPL
    ticker = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    backtest(ticker)