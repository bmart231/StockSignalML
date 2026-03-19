import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

from stocksignal.data.fetcher import fetch_stock_data
from stocksignal.features.build_features import build_features
from stocksignal.features.assign_labels import add_labels

FEATURE_COLS: list[str] = [
    "sma_20", "sma_50", "ema_12", "ema_26",
    "rsi", "macd", "macd_signal",
    "bb_upper", "bb_lower", "atr",
    "volume_ratio", "return_1w", "return_1m", "return_3m"
]
"""trains forest classifier to predict hold/buy/sell labels for a given stock ticket based on data
retrieved from yahoo finance (done in fetch -> build_features)"""
def train(ticker: str = "AAPL"):
    df = fetch_stock_data(ticker) # gets the raw data from the yfinance api
    df = build_features(df) # calls build features  
    df = add_labels(df)   # assign labels using add_labels function from earlier

    # create feature table output 
    X = df[FEATURE_COLS] 
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )
    # use random forest classifier to extract data
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    # calls prediction
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred)) # output date

    joblib.dump(model, "model.pkl")
    print("saved to model.pkl") # saved data

if __name__ == "__main__":
    train() # call to train 