import time
import httpx
from fastapi import APIRouter, File, UploadFile, HTTPException, Body, Form
from typing import Dict, Any, Optional
from ml.extractor import extract_features
from ml.predictor import generate_insights

router = APIRouter()

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_voice(
    audio_file: Optional[UploadFile] = File(None),
    audio_url: Optional[str] = Form(None)
):
    start_time = time.time()
    audio_bytes = None
    filename = "unknown"

    try:
        # 1. Get Audio Data (Either via direct upload or URL)
        if audio_url:
            print(f"[INFO] Downloading audio from URL: {audio_url}")
            filename = audio_url.split("/")[-1]
            async with httpx.AsyncClient() as client:
                resp = await client.get(audio_url)
                if resp.status_code != 200:
                    raise HTTPException(status_code=400, detail="Could not download audio from URL")
                audio_bytes = resp.content
        elif audio_file:
            print(f"[INFO] Received direct upload: {audio_file.filename}")
            filename = audio_file.filename
            audio_bytes = await audio_file.read()
        else:
            raise HTTPException(status_code=400, detail="No audio file or URL provided")

        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Audio data is empty")

        print(f"[INFO] Processing {filename} ({len(audio_bytes)} bytes)")
        
        # 2. Feature Extraction
        feat_start = time.time()
        features_array = extract_features(audio_bytes)
        print(f"[INFO] Feature extraction took {time.time() - feat_start:.2f}s")
        
        # 3. Inference & Insight Generation
        pred_start = time.time()
        analysis_result = generate_insights(features_array)
        print(f"[INFO] Inference took {time.time() - pred_start:.2f}s")
        
        total_time = time.time() - start_time
        print(f"[INFO] Total analysis cycle: {total_time:.2f}s")
        
        return {
            "status": "success",
            "extracted_features": analysis_result.get("extracted_features"),
            "system_insights": analysis_result.get("system_insights"),
            "health_score": analysis_result.get("health_score"),
            "risk_level": analysis_result.get("risk_level"),
            "predictions": analysis_result.get("predictions"),
            "processing_time_sec": round(total_time, 2)
        }
        
    except Exception as e:
        print(f"[ERROR] Error in analyze_voice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


