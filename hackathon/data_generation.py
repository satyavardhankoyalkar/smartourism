import random
import math
import json
from datetime import datetime, timedelta

# City center to start routes (example: Bangalore)
CITY_CENTER = (12.9716, 77.5946)

def jitter(coord, meters):
    """Return coord shifted randomly within given meters."""
    lat, lon = coord
    dlat = (random.uniform(-1, 1) * meters) / 111000.0
    dlon = (random.uniform(-1, 1) * meters) / (111000.0 * math.cos(math.radians(lat)))
    return lat + dlat, lon + dlon

def generate_route(num_points=20, start_ts=None):
    """Generate a roughly straight route of num_points points."""
    if start_ts is None:
        start_ts = datetime.utcnow()
    route = []
    base = CITY_CENTER
    for i in range(num_points):
        lat = base[0] + i * 0.0002 + random.uniform(-0.00005, 0.00005)
        lon = base[1] + i * 0.0002 + random.uniform(-0.00005, 0.00005)
        ts = (start_ts + timedelta(minutes=2 * i)).isoformat()
        route.append({"lat": lat, "lon": lon, "ts": ts})
    return route

def insert_anomalies(route, anomaly_types):
    """Insert anomalies into a base route."""
    trip = [p.copy() for p in route]

    if "geofence" in anomaly_types:
        # Add a far-away point (~5 km offset)
        far_point = jitter((route[0]['lat'], route[0]['lon']), meters=5000)
        trip.insert(
            random.randint(1, len(trip) - 1),
            {"lat": far_point[0], "lon": far_point[1],
             "ts": (datetime.fromisoformat(route[0]['ts']) + timedelta(minutes=10)).isoformat()}
        )

    if "long_stop" in anomaly_types:
        # Repeat the same location with long time gaps to mimic a stop >30 min
        idx = random.randint(2, len(trip) - 2)
        stop_point = trip[idx].copy()
        base_ts = datetime.fromisoformat(stop_point['ts'])
        for j in range(1, 4):
            trip.insert(
                idx + 1,
                {"lat": stop_point['lat'], "lon": stop_point['lon'],
                 "ts": (base_ts + timedelta(minutes=10 * j)).isoformat()}
            )

    if "missing" in anomaly_types:
        # Drop some intermediate points to create large time gaps
        for _ in range(int(len(trip) * 0.15)):
            if len(trip) > 4:
                trip.pop(random.randint(1, len(trip) - 2))

    return trip

def generate_trip(with_anomalies=False):
    """Return (trip_points, label)."""
    base_route = generate_route(num_points=random.randint(12, 25))
    if not with_anomalies:
        return base_route, 0
    types = random.sample(['geofence', 'long_stop', 'missing'], k=random.randint(1, 2))
    return insert_anomalies(base_route, types), 1

if __name__ == "__main__":
    # Create dataset: 200 normal + 80 anomalous
    dataset = []
    for _ in range(200):
        trip, label = generate_trip(False)
        dataset.append({"points": trip, "label": label})
    for _ in range(80):
        trip, label = generate_trip(True)
        dataset.append({"points": trip, "label": label})

    with open("synthetic_trips.json", "w") as f:
        json.dump(dataset, f, indent=2)

    print("Generated", len(dataset), "trips → synthetic_trips.json")
