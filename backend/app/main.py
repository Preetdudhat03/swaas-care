from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
import time

# --- STARTUP DIAGNOSTICS ---
print("="*40)
print("SWAASCARE BACKEND - CONNECTIVITY LOCKDOWN")
print(f"DEBUG - NUMBA_DISABLE_JIT: {os.environ.get('NUMBA_DISABLE_JIT')}")
print(f"DEBUG - OMP_NUM_THREADS:   {os.environ.get('OMP_NUM_THREADS')}")
print(f"DEBUG - Server PID:        {os.getpid()}")
print("="*40)

app = FastAPI(
    title="Voice Biomarker API",
    description="MVP Backend for Voice Health Monitoring System",
    version="1.0.0"
)

# --- GLOBAL TRAFFIC TRACKER ---
@app.middleware("http")
async def track_incoming_traffic(request: Request, call_next):
    start_time = time.time()
    print(f"[TRACKER] Incoming: {request.method} {request.url.path}")
    response = await call_next(request)
    process_time = time.time() - start_time
    print(f"[TRACKER] Completed: {request.method} {request.url.path} ({process_time:.2f}s)")
    return response

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

# Defer router import to ensure environment is fully loaded
from routers import analyze
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
