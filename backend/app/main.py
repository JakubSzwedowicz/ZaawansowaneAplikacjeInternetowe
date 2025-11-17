from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, series, measurements, sensors

app = FastAPI(
    title="IoT Measurement Platform API",
    description="REST API for collecting and managing IoT sensor measurements",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(series.router)
app.include_router(measurements.router)
app.include_router(sensors.router)


@app.get("/")
def root():
    return {
        "message": "IoT Measurement Platform API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
