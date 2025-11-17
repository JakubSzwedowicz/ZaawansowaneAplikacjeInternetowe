# Sensor Simulator

Simulates IoT sensors sending measurement data to the API.

## Setup

```bash
cd sensor-simulator
python3 -m venv .venv
source .venv/bin/acitivate
pip install -r requirements.txt
```

## Configuration

Edit `config.py` to configure sensors:
- API URL
- Sensor IDs and API keys
- Measurement intervals
- Value ranges

## Running

Make sure the backend is running first:
Then run the simulator:
```bash
python simulator.py
```

## How It Works

Each sensor:
1. Generates a measurement value based on its type
2. Creates a timestamp
3. Sends POST request to `/api/sensors/{id}/measurements`
4. Authenticates using API key in `X-API-Key` header
5. Waits for configured interval
6. Repeats
