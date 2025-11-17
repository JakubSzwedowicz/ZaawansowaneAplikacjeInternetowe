import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.series import Series
from app.models.sensor import Sensor
from app.models.measurement import Measurement
from app.utils.security import get_password_hash


def add_test_data():
    db = SessionLocal()

    try:
        print("Adding test data...")

        # Create users
        print("Creating users...")
        admin = User(
            username="admin",
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            is_admin=True
        )
        db.add(admin)
        db.commit()
        print(f"✓ Created admin user: admin (admin123)")

        # Create series
        print("\nCreating series...")
        series_data = [
            {
                "name": "Living Room Temperature",
                "description": "Temperature sensor in living room",
                "unit": "°C",
                "min_value": 0,
                "max_value": 50,
                "color": "#FF6384",
                "icon": "thermometer"
            },
            {
                "name": "Kitchen Energy Consumption",
                "description": "Energy meter for kitchen appliances",
                "unit": "kWh",
                "min_value": 0,
                "max_value": 100,
                "color": "#36A2EB",
                "icon": "lightning"
            },
            {
                "name": "Bedroom Humidity",
                "description": "Humidity sensor in bedroom",
                "unit": "%",
                "min_value": 0,
                "max_value": 100,
                "color": "#4BC0C0",
                "icon": "droplet"
            },
            {
                "name": "Office CO2 Level",
                "description": "CO2 concentration in office",
                "unit": "ppm",
                "min_value": 0,
                "max_value": 5000,
                "color": "#FFCE56",
                "icon": "wind"
            }
        ]

        series_objects = []
        for s_data in series_data:
            series = Series(**s_data)
            db.add(series)
            series_objects.append(series)

        db.commit()
        print(f"✓ Created {len(series_objects)} series")

        # Create sensors
        print("\nCreating sensors...")
        sensor1 = Sensor(
            name="Living Room Temp Sensor v1",
            series_id=series_objects[0].id,
            api_key="sensor_test_key_001",
            is_active=True
        )
        sensor2 = Sensor(
            name="Kitchen Energy Meter",
            series_id=series_objects[1].id,
            api_key="sensor_test_key_002",
            is_active=True
        )
        sensor3 = Sensor(
            name="Bedroom Humidity Sensor (disabled)",
            series_id=series_objects[2].id,
            api_key="sensor_test_key_003",
            is_active=False
        )
        db.add_all([sensor1, sensor2, sensor3])
        db.commit()
        print(f"✓ Created 3 sensors")

        # Create measurements
        print("\nCreating measurements...")
        now = datetime.utcnow()
        measurement_count = 0

        # Helper function to generate realistic data
        def generate_value(series_idx, hour_offset):
            if series_idx == 0:  # Temperature
                base = 22
                daily_variation = 3 * (1 + 0.5 * ((hour_offset % 24) / 12 - 1))
                return base + daily_variation + random.uniform(-1, 1)
            elif series_idx == 1:  # Energy
                if hour_offset % 24 < 6 or hour_offset % 24 > 22:  # Night
                    return random.uniform(2, 8)
                else:  # Day
                    return random.uniform(10, 30)
            elif series_idx == 2:  # Humidity
                return random.uniform(40, 65)
            else:  # CO2
                if hour_offset % 24 < 8 or hour_offset % 24 > 18:  # Outside work hours
                    return random.uniform(400, 600)
                else:  # Work hours
                    return random.uniform(600, 1200)

        # Generate measurements for past 7 days
        for series_idx, series in enumerate(series_objects):
            for i in range(50):  # 50 measurements per series
                hours_ago = i * 3  # Every 3 hours
                timestamp = now - timedelta(hours=hours_ago)
                value = generate_value(series_idx, hours_ago)

                # Clamp value to series min/max
                value = max(series.min_value, min(series.max_value, value))

                # Use sensor for some measurements
                sensor_id = None
                if series_idx == 0:
                    sensor_id = sensor1.id if random.random() > 0.3 else None
                elif series_idx == 1:
                    sensor_id = sensor2.id if random.random() > 0.2 else None

                measurement = Measurement(
                    series_id=series.id,
                    sensor_id=sensor_id,
                    value=round(value, 2),
                    timestamp=timestamp
                )
                db.add(measurement)
                measurement_count += 1

        db.commit()
        print(f"✓ Created {measurement_count} measurements")

        print("\n" + "="*50)
        print("Test data added successfully!")
        print("="*50)
        print("\nLogin credentials:")
        print("  Admin: username='admin', password='admin123'")
        print("  (Unauthenticated users can view data without login)")
        print("\nSensor API keys:")
        print(f"  Sensor 1: sensor_test_key_001")
        print(f"  Sensor 2: sensor_test_key_002")
        print(f"  Sensor 3: sensor_test_key_003 (disabled)")
        print("\nAPI Documentation: http://localhost:8000/docs")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_test_data()
