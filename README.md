# IoT Measurement Platform

Community archive for collecting, browsing, and visualizing time-series sensor measurements. Supports hierarchical location browsing, tag-based search, three-theme UI (light/dark/high-contrast), and role-based access control.

## Tech Stack

- **Backend**: FastAPI (Python 3.11) + SQLAlchemy + Alembic
- **Database**: PostgreSQL 15
- **Frontend**: React 19 + Vite + React Query + Chart.js
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose

### Run

```bash
docker-compose up -d
```

Wait ~15 s for PostgreSQL to become healthy, then seed test data:

```bash
docker-compose exec -T backend python scripts/add_test_data.py
```

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000        |
| Backend    | http://localhost:8000        |
| Swagger UI | http://localhost:8000/docs   |

### Test Accounts

| Username | Password   | Role        |
|----------|------------|-------------|
| admin    | admin123   | Admin       |
| alice    | alice123   | Contributor |
| bob      | bob123     | Contributor |
| viewer   | viewer123  | Viewer      |

### Fresh Rebuild

If you need to wipe the database and start clean:

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
docker-compose exec -T backend python scripts/add_test_data.py
```

## Roles

| Role        | Capabilities |
|-------------|--------------|
| Viewer      | Browse locations, search by tag/keyword, view measurements and charts |
| Contributor | All Viewer permissions + create/edit/delete own series and measurements |
| Admin       | All Contributor permissions + manage all content, block users, view new-content feed |

## Features

- **Hierarchical browsing** — locations organized as a tree (building → floor → room); breadcrumb navigation
- **Search & filter** — full-text search, tag filtering, date range, quality filter (good / uncertain / bad)
- **Charts & tables** — time-series chart with point-click highlighting, cross-linked data table
- **Themes** — light, dark, high-contrast; persisted in `localStorage`, respects `prefers-color-scheme`
- **WCAG 2.1 AA** — skip link, semantic landmarks, `aria-*` attributes, sufficient contrast in all themes
- **Sensor API** — hardware sensors push data via `X-API-Key` without JWT

## API Overview

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/series` | List series (supports `q`, `tag`, `location_id` filters) |
| GET | `/api/measurements` | List measurements (supports `series_ids`, date range, `quality`) |
| GET | `/api/locations` | Location tree |
| GET | `/api/tags` | All tags |

### Authenticated (JWT Bearer)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login → JWT token |
| POST | `/api/series` | Create series (contributor+) |
| PUT | `/api/series/{id}` | Update series (owner or admin) |
| DELETE | `/api/series/{id}` | Delete series (owner or admin) |
| POST | `/api/measurements` | Add measurement (owner or admin) |
| PUT | `/api/measurements/{id}` | Edit measurement (owner or admin) |
| DELETE | `/api/measurements/{id}` | Delete measurement (owner or admin) |
| GET | `/api/users/me/new-content` | Content added since last login (admin) |
| PATCH | `/api/users/{id}/block` | Block user (admin) |
| PATCH | `/api/users/{id}/unblock` | Unblock user (admin) |

### Sensor (API Key)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensors/{id}/measurements` | Push measurement via `X-API-Key` header |

## Development

### Backend (without Docker)

```bash
cd backend
cp .env.example .env.local   # fill in DATABASE_URL and SECRET_KEY
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

New migration after model changes:

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Frontend (without Docker)

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000/api npm run dev
```

### Sensor Simulator

```bash
cd sensor-simulator
pip install -r requirements.txt
python simulator.py
```

## Project Structure

```
backend/
  app/
    routers/      # auth, series, measurements, sensors, locations, tags, users
    models/       # User, Series, Measurement, Sensor, Location, Tag
    schemas/      # Pydantic request/response schemas
    utils/        # JWT, password hashing, FastAPI dependencies
  alembic/        # DB migrations
  scripts/        # add_test_data.py

frontend/src/
  context/        # AuthContext, ThemeContext
  pages/          # Dashboard, BrowsePage, SearchPage, MySeriesPage, AdminPage, ...
  components/     # charts, tables, forms, ui, layout
  services/       # api.js (Axios), dataService.js, authService.js

sensor-simulator/ # Python script that POSTs to sensor API
```
