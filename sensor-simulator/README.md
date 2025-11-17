# Sensor Simulator

Simulates IoT sensors sending measurement data to the API.

## Setup

```bash
cd sensor-simulator
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
```bash
# In main project directory
docker-compose up -d
```

Then run the simulator:
```bash
python simulator.py
```

The simulator will:
- Generate realistic sensor data (temperature, energy consumption)
- Send measurements every few seconds
- Print status of each submission
- Run until stopped with Ctrl+C

## How It Works

Each sensor:
1. Generates a measurement value based on its type
2. Creates a timestamp
3. Sends POST request to `/api/sensors/{id}/measurements`
4. Authenticates using API key in `X-API-Key` header
5. Waits for configured interval
6. Repeats

## Example Output

```
==================================================
IoT Sensor Simulator
==================================================
API: http://localhost:8000
Active sensors: 2
==================================================

Press Ctrl+C to stop

✓ [Living Room Temp Sensor] Sent: 22.3 (Status: 201)
✓ [Kitchen Energy Meter] Sent: 15.7 (Status: 201)
✓ [Living Room Temp Sensor] Sent: 22.5 (Status: 201)
✓ [Kitchen Energy Meter] Sent: 14.2 (Status: 201)
...
```
