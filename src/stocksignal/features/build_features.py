# build features for ML training 
import pandas as pd 
import pandas_ta as ta

def build_features(df: pd.DataFrame) -> pd.DataFrame | None:
    df = df.copy()
    
    close = pd.Series(df["Close"].squeeze().values, index=df.index)
    high = pd.Series(df["High"].squeeze().values, index=df.index)
    low = pd.Series(df["Low"].squeeze().values, index=df.index)
    volume = pd.Series(df["Volume"].squeeze().values, index=df.index)
    
    # get the trends (simple moving average)
    df["sma_20"] = ta.sma(close, length=20)
    df["sma_50"] = ta.sma(close, length=50)
    df["ema_12"] = ta.ema(close, length=12)
    df["ema_26"] = ta.ema(close, length=26)
    
    # get the momentum
    df["rsi"] = ta.rsi(close, length=14)
    macd = ta.macd(close)
    df["macd"] = macd["MACD_12_26_9"]
    df["macd_signal"] = macd["MACDs_12_26_9"]

    # volatility
    bb = ta.bbands(close, length=20)
    print(bb.columns.tolist())  # temporary - see actual column names
    df["bb_upper"] = bb.iloc[:, 2]  # upper band
    df["bb_lower"] = bb.iloc[:, 0]  # lower band
    df["atr"] = ta.atr(high, low, close, length=14)

    # Volume
    df["volume_sma_20"] = ta.sma(volume, length=20)
    df["volume_ratio"] = volume / df["volume_sma_20"]

    # Price momentum
    df["return_1w"] = close.pct_change(5)
    df["return_1m"] = close.pct_change(21)
    df["return_3m"] = close.pct_change(63)

    df.dropna(inplace=True)
    return df

if __name__ == "__main__":
    from stocksignal.data.fetcher import fetch_stock_data
    df = fetch_stock_data("AAPL")
    df = build_features(df)
    print(df.tail())
