from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import joblib
from features import extract_features
from datetime import datetime
import math

# -------------------------------
# Request & Response Modelscurl -X POST "http://localhost:8000/risk-score" \

# -------------------------------
class Point(BaseModel):
    lat: float
    lon: float
    ts: str

class Trip(BaseModel):
    points: List[Point]

# -------------------------------
# Load model & scaler
# -------------------------------
model = joblib.load("if_model.joblib")
scaler = joblib.load("scaler.joblib")

# -------------------------------
# Rule engine
# -------------------------------
def geo_fence_alert(points, center=(12.9716, 77.5946), radius_m=5000):
    alerts = []
    for p in points:
        d = math.hypot((p.lat - center[0]) * 111000, (p.lon - center[1]) * 111000)
        if d > radius_m:
            alerts.append("Geo-fence breach")
            break
    return alerts

def long_stop_alert(points, threshold_min=30):
    max_stop = 0
    current_start = None
    alerts = []
    for i in range(1, len(points)):
        d = math.hypot((points[i].lat - points[i-1].lat) * 111000,
                       (points[i].lon - points[i-1].lon) * 111000)
        dt = (datetime.fromisoformat(points[i].ts) - datetime.fromisoformat(points[i-1].ts)).total_seconds() / 60
        if d < 10:
            if current_start is None:
                current_start = datetime.fromisoformat(points[i-1].ts)
            max_stop = max(max_stop, (datetime.fromisoformat(points[i].ts) - current_start).total_seconds()/60)
        else:
            current_start = None
    if max_stop > threshold_min:
        alerts.append("Long stop > {} min".format(threshold_min))
    return alerts

def missing_update_alert(points, threshold_min=5):
    alerts = []
    for i in range(1, len(points)):
        dt = (datetime.fromisoformat(points[i].ts) - datetime.fromisoformat(points[i-1].ts)).total_seconds() / 60
        if dt > threshold_min:
            alerts.append("Missing location update > {} min".format(threshold_min))
            break
    return alerts

def apply_rule_engine(points):
    alerts = []
    alerts.extend(geo_fence_alert(points))
    alerts.extend(long_stop_alert(points))
    alerts.extend(missing_update_alert(points))
    return alerts

# -------------------------------
# Risk label
# -------------------------------
def label_from_score(score):
    if score > 0.7:
        return "high"
    elif score > 0.4:
        return "medium"
    else:
        return "low"

# -------------------------------
# FastAPI app
# -------------------------------
app = FastAPI(title="Tourist Risk-Score API")

@app.post("/risk-score")
def risk_score(trip: Trip):
    points_list = [{"lat": p.lat, "lon": p.lon, "ts": p.ts} for p in trip.points]
    features = extract_features(points_list)
    # convert to single-row dataframe
    import pandas as pd
    X = pd.DataFrame([features])
    # predict anomaly score
    raw_score = model.decision_function(X)[0]
    score = scaler.transform([[-raw_score]])[0][0]
    risk_label = label_from_score(score)
    alerts = apply_rule_engine(trip.points)
    return {
        "risk_score": round(float(score), 3),
        "label": risk_label,
        "alerts": alerts,
        "features": features
    }
