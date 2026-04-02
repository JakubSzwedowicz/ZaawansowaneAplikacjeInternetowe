from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, series, measurements, sensors, locations, tags

app = FastAPI(
    title="IoT Measurement Platform API",
    description="REST API for collecting and managing IoT sensor measurements",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.railway\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(series.router)
app.include_router(measurements.router)
app.include_router(sensors.router)
app.include_router(locations.router)
app.include_router(tags.router)


@app.get("/")
def root():
    return {"message": "IoT Measurement Platform API", "docs": "/docs", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
