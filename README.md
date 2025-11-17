# IoT Measurement Platform

Smart home sensor data collection and visualization system.

## Tech Stack

- **Backend**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 15
- **Frontend**: React + Vite (coming soon)
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git

### Running the Application

1. Clone the repository and navigate to project directory

2. Start the backend and database:
```bash
docker-compose up -d
```

3. Wait for services to start (check with `docker-compose logs -f`)

4. Add test data:
```bash
docker-compose exec backend python scripts/add_test_data.py
```

5. Access the API:
   - API: http://localhost:8000
   - Swagger Docs: http://localhost:8000/docs
   - Interactive API testing: http://localhost:8000/docs

### Test Credentials

**Admin User**:
- Username: `admin`
- Password: `admin123`

**Note**: Unauthenticated users can view data without logging in. Only admins need to log in for CRUD operations.

### API Overview

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/series` - Get all measurement series
- `GET /api/measurements` - Get measurements (with filters)
- `POST /api/measurements` - Create measurement (admin only)
- `POST /api/sensors/{id}/measurements` - Sensor data submission

See full API documentation at `/docs` endpoint.

## Development

### Backend Setup (without Docker)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API endpoints
│   │   ├── utils/           # Auth, security
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Database migrations
│   ├── scripts/             # Utility scripts
│   └── requirements.txt
├── docs/
│   └── diagrams/
│       └── erd.puml         # Database ERD
└── docker-compose.yml
```

## Features

- ✅ User authentication (JWT)
- ✅ Role-based access (Admin/Reader)
- ✅ CRUD operations for series and measurements
- ✅ Data validation (min/max ranges)
- ✅ Sensor API with API key authentication
- ✅ Time-range filtering for measurements
- ✅ Automatic Swagger documentation
- ⏳ Frontend (React) - coming soon
