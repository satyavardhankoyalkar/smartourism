import math
import json
import pandas as pd
from dateutil.parser import isoparse

# ---------------------------------------------------
# Distance helpers
# ---------------------------------------------------
def haversine(a, b):
    """Distance in meters between two (lat, lon) points."""
    lat1, lon1 = a
    lat2, lon2 = b
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    h = (math.sin(dphi/2)**2 +
         math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2)
    return 2 * R * math.asin(math.sqrt(h))

def point_line_distance(p, a, b):
    """Perpendicular distance from point p to line segment a-b (meters)."""
    def to_xy(lat, lon):
        x = lon * 111320 * math.cos(math.radians(lat))
        y = lat * 110540
        return x, y
    px, py = to_xy(*p)
    ax, ay = to_xy(*a)
    bx, by = to_xy(*b)
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx*dx + dy*dy)))
    projx = ax + t * dx
    projy = ay + t * dy
    return math.hypot(px - projx, py - projy)

# ---------------------------------------------------
# Core feature calculations
# ---------------------------------------------------
def compute_speeds(points):
    speeds = []
    for i in range(1, len(points)):
        t0 = isoparse(points[i-1]['ts'])
        t1 = isoparse(points[i]['ts'])
        dt = (t1 - t0).total_seconds()
        if dt <= 0:
            continue
        d = haversine((points[i-1]['lat'], points[i-1]['lon']),
                      (points[i]['lat'], points[i]['lon']))
        speeds.append(d / dt)
    return speeds

def compute_stop_durations(points, stop_threshold_m=10, min_stop_seconds=120):
    """
    Returns:
        max_stop_duration (seconds),
        stop_count (number of distinct stops > min_stop_seconds)
    """
    max_stop = 0
    stop_count = 0
    current_start = None
    for i in range(1, len(points)):
        d = haversine((points[i-1]['lat'], points[i-1]['lon']),
                      (points[i]['lat'], points[i]['lon']))
        dt = (isoparse(points[i]['ts']) - isoparse(points[i-1]['ts'])).total_seconds()
        if d <= stop_threshold_m:
            if current_start is None:
                current_start = isoparse(points[i-1]['ts'])
            duration = (isoparse(points[i]['ts']) - current_start).total_seconds()
            max_stop = max(max_stop, duration)
        else:
            if current_start:
                duration = (isoparse(points[i-1]['ts']) - current_start).total_seconds()
                if duration >= min_stop_seconds:
                    stop_count += 1
            current_start = None
    return max_stop, stop_count

def count_missing_updates(points, expected_interval=120, tolerance=30):
    """Count gaps longer than expected interval + tolerance (seconds)."""
    misses = 0
    for i in range(1, len(points)):
        dt = (isoparse(points[i]['ts']) - isoparse(points[i-1]['ts'])).total_seconds()
        if dt > expected_interval + tolerance:
            misses += 1
    return misses

def avg_distance_from_route(points):
    """Average distance of all points from straight line start→end (meters)."""
    if len(points) < 3:
        return 0.0
    start = (points[0]['lat'], points[0]['lon'])
    end = (points[-1]['lat'], points[-1]['lon'])
    return sum(point_line_distance((p['lat'], p['lon']), start, end)
               for p in points) / len(points)

def bearing(p1, p2):
    """Bearing in degrees from p1 to p2."""
    lat1, lon1 = map(math.radians, [p1[0], p1[1]])
    lat2, lon2 = map(math.radians, [p2[0], p2[1]])
    dlon = lon2 - lon1
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    return (math.degrees(math.atan2(x, y)) + 360) % 360

def bearing_change_variance(points):
    if len(points) < 3:
        return 0.0
    bearings = [bearing((points[i-1]['lat'], points[i-1]['lon']),
                        (points[i]['lat'], points[i]['lon']))
                for i in range(1, len(points))]
    diffs = []
    for i in range(1, len(bearings)):
        diff = abs(bearings[i] - bearings[i-1])
        if diff > 180:  # shortest angle
            diff = 360 - diff
        diffs.append(diff)
    if not diffs:
        return 0.0
    mean = sum(diffs) / len(diffs)
    return sum((d - mean)**2 for d in diffs) / len(diffs)

# ---------------------------------------------------
# Master extractor
# ---------------------------------------------------
def extract_features(points):
    speeds = compute_speeds(points)
    total_distance = sum(
        haversine((points[i-1]['lat'], points[i-1]['lon']),
                  (points[i]['lat'], points[i]['lon']))
        for i in range(1, len(points))
    )
    avg_speed = (sum(speeds) / len(speeds)) if speeds else 0.0
    max_speed = max(speeds) if speeds else 0.0
    trip_duration = (
        (isoparse(points[-1]['ts']) - isoparse(points[0]['ts'])).total_seconds()
        if len(points) > 1 else 0.0
    )
    straight_line_dist = haversine(
        (points[0]['lat'], points[0]['lon']),
        (points[-1]['lat'], points[-1]['lon'])
    )
    straightness_ratio = total_distance / straight_line_dist if straight_line_dist > 0 else 0.0
    max_stop_duration, stop_count = compute_stop_durations(points)
    start_hour = isoparse(points[0]['ts']).hour
    end_hour = isoparse(points[-1]['ts']).hour

    return {
        "avg_distance_from_route": avg_distance_from_route(points),
        "speed_variance": (sum((s - avg_speed)**2 for s in speeds) / len(speeds)) if speeds else 0.0,
        "max_stop_duration": max_stop_duration,
        "num_missing_updates": count_missing_updates(points),
        "total_distance": total_distance,
        "avg_speed": avg_speed,
        "max_speed": max_speed,
        "trip_duration": trip_duration,
        "straightness_ratio": straightness_ratio,
        "stop_count": stop_count,
        "start_hour": start_hour,
        "end_hour": end_hour,
        "bearing_change_variance": bearing_change_variance(points)
    }

# ---------------------------------------------------
# Script entry
# ---------------------------------------------------
if __name__ == "__main__":
    with open("synthetic_trips.json") as f:
        trips = json.load(f)

    rows = []
    for trip in trips:
        feats = extract_features(trip["points"])
        feats["label"] = trip.get("label", 0)
        rows.append(feats)

    pd.DataFrame(rows).to_csv("features.csv", index=False)
    print("Extracted", len(rows), "trips → features.csv")
