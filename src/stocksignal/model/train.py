from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder
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

TICKERS = ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "AMZN", "META", "RR"]

def train():
    import pandas as pd
    all_dfs = []

    for ticker in TICKERS:
        print(f"Fetching {ticker}...")
        df = fetch_stock_data(ticker)
        df = build_features(df)
        df = add_labels(df)
        # flatten multi-level columns
        df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]
        df["ticker"] = ticker
        all_dfs.append(df)

    # combine all tickers into one dataset
    combined = pd.concat(all_dfs)

    X = combined[FEATURE_COLS]
    y = combined["label"]

    # encode string labels to numbers for XGBoost
    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, shuffle=False
    )

    # train XGBoost classifier
    model = XGBClassifier(n_estimators=100, random_state=42, eval_metric="mlogloss")
    model.fit(X_train, y_train)

    # decode predictions back to Buy/Sell/Hold for the report
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # save both model and label encoder
    joblib.dump(model, "model.pkl")
    joblib.dump(le, "label_encoder.pkl")
    print("Saved to model.pkl and label_encoder.pkl")

if __name__ == "__main__":
    train()