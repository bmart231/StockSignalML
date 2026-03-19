"""Looks at future returns and assigns Buy / Sell / Hold to each row"""

import pandas as pd

"""Assigns Buy/Sell/Hold labels based on forward returns over a fixed horizon. With these
labels you can determine whether the stock is a good buy/sell or best to just hold."""
def add_labels(df: pd.DataFrame, forward_days: int = 10, buy_threshold: float = 0.03, sell_threshold: float = -0.03) -> pd.DataFrame:
    df = df.copy()
    close = df["Close"].squeeze()
    
    # calculates the future returns of the stock over a specified numbers of days
    future_return = close.shift(-forward_days) / close - 1

    """"classifies a forward return into a buy/sell/hold label where r is the forward
    return. Here it returns the classified label/suggested action. """
    def classify(r):
        if r > buy_threshold: # if return above threshold -> buy
            return "Buy"
        elif r < sell_threshold: # below -> sell
            return "Sell"
        else:                    # else -> hold
            return "Hold"

    df["label"] = future_return.apply(classify) # add label to returns 
    df = df.iloc[:-forward_days]  # drop last rows with no future data
    return df

if __name__ == "__main__":
    from stocksignal.data.fetcher import fetch_stock_data
    from stocksignal.features.build_features import build_features
    df = fetch_stock_data("AAPL")
    df = build_features(df)
    df = add_labels(df)
    print(df["label"].value_counts())