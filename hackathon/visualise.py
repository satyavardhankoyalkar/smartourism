import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json

# Optional: interactive map
import folium

# Load features and labels
df = pd.read_csv("features.csv")

# -------------------------
# 1. Risk label distribution
# -------------------------
if "label" in df.columns:
    sns.countplot(x="label", data=df)
    plt.title("Number of Normal vs Anomalous Trips")
    plt.show()

# -------------------------
# 2. Feature comparison
# -------------------------
feature_cols = ["avg_distance_from_route", "speed_variance", "max_stop_duration",
                "num_missing_updates", "total_distance", "avg_speed", "max_speed"]

if "label" in df.columns:
    sns.boxplot(x="label", y="avg_distance_from_route", data=df)
    plt.title("Avg Distance From Route by Label")
    plt.show()

    sns.boxplot(x="label", y="max_stop_duration", data=df)
    plt.title("Max Stop Duration by Label")
    plt.show()

# -------------------------
# 3. Map visualization with Folium
# -------------------------
with open("synthetic_trips.json") as f:
    trips = json.load(f)

# Center map on city
m = folium.Map(location=[12.9716, 77.5946], zoom_start=12)

for trip in trips:
    points = [(p["lat"], p["lon"]) for p in trip["points"]]
    label = trip.get("label", 0)
    color = "red" if label == 1 else "blue"
    folium.PolyLine(points, color=color, weight=2, opacity=0.7).add_to(m)

# Save interactive HTML map
m.save("trips_map.html")
print("Map saved to trips_map.html")

# -------------------------
# 4. Risk score histogram
# -------------------------
# Simulate risk scores (from model predictions)
import joblib
from features import extract_features
import numpy as np

model = joblib.load("if_model.joblib")
scaler = joblib.load("scaler.joblib")

scores = []
for trip in trips:
    feats = extract_features(trip["points"])
    import pandas as pd
    X = pd.DataFrame([feats])
    raw_score = model.decision_function(X)[0]
    score = scaler.transform([[-raw_score]])[0][0]
    scores.append(score)

plt.hist(scores, bins=20, color="skyblue", edgecolor="black")
plt.title("Histogram of Risk Scores")
plt.xlabel("Risk Score")
plt.ylabel("Number of Trips")
plt.show()
