from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
import time
import numpy as np

app = FastAPI(
    title="Voice Biomarker API",
    description="MVP Backend for Voice Health Monitoring System",
    version="1.0.0"
)

# Cross-Origin Resource Sharing (CORS) setup
cors_origins = os.environ.get("CORS_ORIGINS", "*")
if cors_origins == "*":
    allow_origins = [
        "https://swaascare-frontend.onrender.com",
        "https://swaascare.onrender.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
else:
    allow_origins = [o.strip() for o in cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import analyze
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])

@app.on_event("startup")
def startup_prewarm():
    """Pre-warm ML models at startup so first request has 0 latency."""
    try:
        from ml.predictor import generate_insights
        dummy = np.zeros(50, dtype=np.float32)
        dummy[40] = 0.04
        dummy[42] = 0.08
        dummy[48] = 135.0
        dummy[49] = 15.0
        generate_insights(dummy)
        print("[STARTUP] ML models pre-warmed successfully.")
    except Exception as e:
        print(f"[STARTUP] Prewarm notice: {e}")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
