import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

if __name__ == "__main__":
    # 1) Load data
    df = pd.read_csv("features.csv")

    # Separate label (0 = normal, 1 = anomaly) if present
    labels = df.get("label")  # may be NaN if unlabeled
    X = df.drop(columns=["label"], errors="ignore")

    # 2) Train/test split (only for evaluation; IF is unsupervised)
    X_train, X_test, y_train, y_test = train_test_split(
        X, labels, test_size=0.3, random_state=42, stratify=labels
    )

    # 3) Fit Isolation Forest
    model = IsolationForest(
        n_estimators=200,
        contamination=0.15,   # tweak based on expected anomaly %
        random_state=42
    )
    model.fit(X_train)

    # 4) Get raw anomaly scores (lower = more anomalous)
    raw_scores = model.decision_function(X_test)

    # Convert to 0–1 risk_score (higher = riskier)
    scaler = MinMaxScaler()
    risk_scores = scaler.fit_transform(-raw_scores.reshape(-1, 1)).ravel()

    # 5) Optional evaluation if labels exist
    if y_test is not None and not y_test.isnull().all():
        preds = model.predict(X_test)
        # IsolationForest: -1 = anomaly, 1 = normal → map to 1/0
        preds = (preds == -1).astype(int)
        print("\n=== Classification report ===")
        print(classification_report(y_test, preds, digits=3))

    # 6) Save model + scaler for later API usage
    joblib.dump(model, "if_model.joblib")
    joblib.dump(scaler, "scaler.joblib")
    print("Saved model → if_model.joblib and scaler → scaler.joblib")
