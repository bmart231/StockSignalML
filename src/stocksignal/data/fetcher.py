# get public data from yahoo finance
import yfinance as yf
import pandas as pd

"""Downloads data for price data for a given ticket from yfinance over specific period and interval
and returns as pd frame. Gets the ticker, period(5y), interval (1d), auto_adjust(True to adjust
prices for splits/dividends)"""
def fetch_stock_data(ticker: str, period: str = "5y", interval: str = "1d") -> pd.DataFrame:
    df = yf.download(ticker, period=period, interval=interval, auto_adjust=True)
    df.dropna(inplace=True) # remove nan
    return df

if __name__ == "__main__":
    df = fetch_stock_data("AAPL")
    print(df.tail()) # print latest data 
    print(df.shape) # row x col