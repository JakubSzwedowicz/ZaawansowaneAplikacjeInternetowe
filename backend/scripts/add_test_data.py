import sys
import os
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.location import Location
from app.models.tag import Tag
from app.models.series import Series
from app.models.sensor import Sensor
from app.models.measurement import Measurement
from app.utils.security import get_password_hash


def add_test_data():
    db = SessionLocal()

    try:
        print("Adding test data...")

        # Guard against running twice
        if db.query(User).filter(User.username == "admin").first():
            print("Test data already exists, skipping.")
            return

        # Users
        print("Creating users...")
        admin = User(username="admin", email="admin@example.com", password_hash=get_password_hash("admin123"), role="admin")
        contributor1 = User(username="alice", email="alice@example.com", password_hash=get_password_hash("alice123"), role="contributor")
        contributor2 = User(username="bob", email="bob@example.com", password_hash=get_password_hash("bob123"), role="contributor")
        viewer = User(username="viewer", email="viewer@example.com", password_hash=get_password_hash("viewer123"), role="viewer")
        db.add_all([admin, contributor1, contributor2, viewer])
        db.commit()
        print("✓ Created 4 users")

        # Locations
        print("Creating locations...")
        building = Location(name="Main Building", description="Primary office building", slug="main-building")
        db.add(building)
        db.flush()

        floor1 = Location(name="Ground Floor", slug="ground-floor", parent_id=building.id)
        floor2 = Location(name="First Floor", slug="first-floor", parent_id=building.id)
        db.add_all([floor1, floor2])
        db.flush()

        living_room = Location(name="Living Room", slug="living-room", parent_id=floor1.id)
        kitchen = Location(name="Kitchen", slug="kitchen", parent_id=floor1.id)
        office = Location(name="Office", slug="office", parent_id=floor2.id)
        bedroom = Location(name="Bedroom", slug="bedroom", parent_id=floor2.id)
        db.add_all([living_room, kitchen, office, bedroom])
        db.commit()
        print("✓ Created 7 locations")

        # Tags
        print("Creating tags...")
        tag_names = ["indoor", "temperature", "humidity", "energy", "air-quality", "bedroom", "kitchen"]
        tags = {}
        for name in tag_names:
            t = Tag(name=name, slug=name)
            db.add(t)
            tags[name] = t
        db.commit()
        print(f"✓ Created {len(tags)} tags")

        # Series
        print("Creating series...")
        series_data = [
            {
                "name": "Living Room Temperature",
                "description": "Temperature sensor in living room",
                "unit": "°C",
                "min_value": 0,
                "max_value": 50,
                "color": "#FF6384",
                "icon": "thermometer",
                "location_id": living_room.id,
                "creator_id": contributor1.id,
                "tag_names": ["indoor", "temperature"],
            },
            {
                "name": "Kitchen Energy Consumption",
                "description": "Energy meter for kitchen appliances",
                "unit": "kWh",
                "min_value": 0,
                "max_value": 100,
                "color": "#36A2EB",
                "icon": "lightning",
                "location_id": kitchen.id,
                "creator_id": contributor1.id,
                "tag_names": ["energy", "kitchen"],
            },
            {
                "name": "Bedroom Humidity",
                "description": "Humidity sensor in bedroom",
                "unit": "%",
                "min_value": 0,
                "max_value": 100,
                "color": "#4BC0C0",
                "icon": "droplet",
                "location_id": bedroom.id,
                "creator_id": contributor2.id,
                "tag_names": ["indoor", "humidity", "bedroom"],
            },
            {
                "name": "Office CO2 Level",
                "description": "CO2 concentration in office",
                "unit": "ppm",
                "min_value": 0,
                "max_value": 5000,
                "color": "#FFCE56",
                "icon": "wind",
                "location_id": office.id,
                "creator_id": contributor2.id,
                "tag_names": ["indoor", "air-quality"],
            },
        ]

        series_objects = []
        for s_data in series_data:
            tag_names_list = s_data.pop("tag_names")
            s = Series(**s_data)
            db.add(s)
            db.flush()
            for name in tag_names_list:
                if name in tags:
                    s.tags.append(tags[name])
            series_objects.append(s)

        db.commit()
        print(f"✓ Created {len(series_objects)} series")

        # Sensors
        print("Creating sensors...")
        sensor1 = Sensor(name="Living Room Temp Sensor v1", series_id=series_objects[0].id, api_key="sensor_test_key_001", is_active=True)
        sensor2 = Sensor(name="Kitchen Energy Meter", series_id=series_objects[1].id, api_key="sensor_test_key_002", is_active=True)
        sensor3 = Sensor(name="Bedroom Humidity Sensor", series_id=series_objects[2].id, api_key="sensor_test_key_003", is_active=False)
        db.add_all([sensor1, sensor2, sensor3])
        db.commit()
        print("✓ Created 3 sensors")

        # Measurements
        print("Creating measurements...")
        now = datetime.utcnow()
        measurement_count = 0
        qualities = ["good", "good", "good", "uncertain", "bad"]

        def generate_value(idx, hour_offset):
            if idx == 0:
                return 22 + 3 * (1 + 0.5 * ((hour_offset % 24) / 12 - 1)) + random.uniform(-1, 1)
            elif idx == 1:
                return random.uniform(2, 8) if hour_offset % 24 < 6 or hour_offset % 24 > 22 else random.uniform(10, 30)
            elif idx == 2:
                return random.uniform(40, 65)
            else:
                return random.uniform(400, 600) if hour_offset % 24 < 8 or hour_offset % 24 > 18 else random.uniform(600, 1200)

        notes = [None, "Routine reading", "Spike detected", None, "Sensor calibrated"]

        for idx, series in enumerate(series_objects):
            for i in range(50):
                hours_ago = i * 3
                timestamp = now - timedelta(hours=hours_ago)
                value = generate_value(idx, hours_ago)
                value = max(series.min_value, min(series.max_value, round(value, 2)))

                sensor_id = None
                if idx == 0:
                    sensor_id = sensor1.id if random.random() > 0.3 else None
                elif idx == 1:
                    sensor_id = sensor2.id if random.random() > 0.2 else None

                m = Measurement(
                    series_id=series.id,
                    sensor_id=sensor_id,
                    value=value,
                    timestamp=timestamp,
                    quality=random.choice(qualities),
                    note=random.choice(notes),
                )
                db.add(m)
                measurement_count += 1

        db.commit()
        print(f"✓ Created {measurement_count} measurements")

        print("\n" + "=" * 50)
        print("Test data added successfully!")
        print("=" * 50)
        print("\nLogin credentials:")
        print("  admin / admin123   (admin)")
        print("  alice / alice123   (contributor)")
        print("  bob / bob123       (contributor)")
        print("  viewer / viewer123 (viewer)")
        print("\nSensor API keys:")
        print("  sensor_test_key_001  (active)")
        print("  sensor_test_key_002  (active)")
        print("  sensor_test_key_003  (disabled)")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_test_data()
