#!/usr/bin/env python3
import requests
import time
import random
from datetime import datetime
from config import API_BASE_URL, SENSORS


class SensorSimulator:
    def __init__(self, sensor_config):
        self.sensor_id = sensor_config["id"]
        self.name = sensor_config["name"]
        self.api_key = sensor_config["api_key"]
        self.series_id = sensor_config["series_id"]
        self.sensor_type = sensor_config["type"]
        self.min_value = sensor_config["min_value"]
        self.max_value = sensor_config["max_value"]
        self.interval = sensor_config["interval"]
        self.current_value = (self.min_value + self.max_value) / 2

    def generate_value(self):
        """Generate realistic sensor reading"""
        if self.sensor_type == "temperature":
            # Temperature changes slowly
            change = random.uniform(-0.5, 0.5)
            self.current_value += change
            # Keep within bounds
            self.current_value = max(self.min_value, min(self.max_value, self.current_value))
            return round(self.current_value, 2)

        elif self.sensor_type == "energy":
            # Energy consumption varies more
            hour = datetime.now().hour
            if 6 <= hour <= 22:  # Daytime - higher consumption
                base = (self.min_value + self.max_value) / 1.5
            else:  # Night - lower consumption
                base = self.min_value + 3

            value = base + random.uniform(-3, 3)
            value = max(self.min_value, min(self.max_value, value))
            return round(value, 2)

        else:
            # Generic sensor - random within range
            return round(random.uniform(self.min_value, self.max_value), 2)

    def send_measurement(self):
        """Send measurement to API"""
        value = self.generate_value()
        timestamp = datetime.now().astimezone().isoformat()

        url = f"{API_BASE_URL}/api/sensors/{self.sensor_id}/measurements"
        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        data = {
            "series_id": self.series_id,
            "value": value,
            "timestamp": timestamp
        }

        try:
            response = requests.post(url, json=data, headers=headers, timeout=5)

            if response.status_code == 201:
                print(f"✓ [{self.name}] Sent: {value} (Status: {response.status_code})")
                return True
            else:
                print(f"✗ [{self.name}] Error: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            print(f"✗ [{self.name}] Connection error: {e}")
            return False

    def run(self):
        """Run sensor in loop"""
        print(f"Starting {self.name} (every {self.interval}s)")
        while True:
            self.send_measurement()
            time.sleep(self.interval)


def run_all_sensors():
    """Run all sensors (simple version - one at a time)"""
    print("=" * 50)
    print("IoT Sensor Simulator")
    print("=" * 50)
    print(f"API: {API_BASE_URL}")
    print(f"Active sensors: {len(SENSORS)}")
    print("=" * 50)
    print("\nPress Ctrl+C to stop\n")

    simulators = [SensorSimulator(config) for config in SENSORS]

    try:
        while True:
            for sim in simulators:
                sim.send_measurement()

            # Wait before next round
            time.sleep(5)

    except KeyboardInterrupt:
        print("\n\nStopping simulator...")


if __name__ == "__main__":
    run_all_sensors()
