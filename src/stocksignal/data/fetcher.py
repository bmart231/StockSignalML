# get public data from yahoo finance
import yfinance as yf
import pandas as pd

def fetch_stock_data(ticker: str, period: str = "5y", interval: str = "1d") -> pd.DataFrame:
    df = yf.download(ticker, period=period, interval=interval, auto_adjust=True)
    df.dropna(inplace=True)
    return df

if __name__ == "__main__":
    df = fetch_stock_data("AAPL")
    print(df.tail())
    print(df.shape)