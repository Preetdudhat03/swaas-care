import time
import httpx
import gc
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import Dict, Any, Optional
from ml.extractor import extract_features
from ml.predictor import generate_insights

router = APIRouter()

@router.post("/analyze", response_model=Dict[str, Any])
def analyze_voice(
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
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(audio_url)
                if resp.status_code != 200:
                    raise HTTPException(status_code=400, detail="Could not download audio from URL")
                audio_bytes = resp.content
        elif audio_file:
            print(f"[INFO] Received direct upload: {audio_file.filename}")
            filename = audio_file.filename
            audio_bytes = audio_file.file.read()
        else:
            raise HTTPException(status_code=400, detail="No audio file or URL provided")

        if not audio_bytes or len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Audio data is empty")

        print(f"[INFO] Processing {filename} ({len(audio_bytes)} bytes)")
        
        # 2. Fast Feature Extraction with Voice Activity Detection (VAD)
        feat_start = time.time()
        features_array, has_speech, vad_reason = extract_features(audio_bytes, return_vad=True)
        print(f"[INFO] VAD: has_speech={has_speech} ({vad_reason}) | extraction took {time.time() - feat_start:.3f}s")
        
        if not has_speech:
            total_time = time.time() - start_time
            return {
                "status": "no_speech_detected",
                "message": "No voice was detected in the audio recording. Please speak clearly into your microphone.",
                "extracted_features": {
                    "voice_tremor": 0,
                    "breathiness": 0,
                    "pitch_variation": 0,
                    "speech_energy": 0,
                    "has_speech": False
                },
                "health_score": 0,
                "risk_level": "insufficient_data",
                "system_insights": {
                    "respiratory": { "score": 0, "insight": "No vocal speech detected.", "status": "normal", "is_mock": False },
                    "neurological": { "score": 0, "insight": "No vocal speech detected.", "status": "normal", "is_mock": False },
                    "emotional": { "score": 0, "insight": "No vocal speech detected.", "status": "normal", "is_mock": False },
                    "predictions": {
                        "asthma": { "prediction": "No Voice Detected", "confidence": 0.0, "severity": 0 },
                        "depression": { "prediction": "No Voice Detected", "confidence": 0.0, "severity": 0 },
                        "parkinsons": { "prediction": "No Voice Detected", "confidence": 0.0, "severity": 0 }
                    }
                },
                "predictions": {
                    "asthma": { "prediction": "No Voice Detected", "confidence": 0.0, "severity": 0 },
                    "depression": { "prediction": "No Voice Detected", "confidence": 0.0, "severity": 0 },
                    "parkinsons": { "prediction": "No Voice Detected", "confidence": 0.0, "severity": 0 }
                },
                "processing_time_sec": round(total_time, 3)
            }

        # 3. Fast Inference & Insight Generation
        pred_start = time.time()
        analysis_result = generate_insights(features_array, has_speech=True)
        print(f"[INFO] Inference took {time.time() - pred_start:.3f}s")
        
        total_time = time.time() - start_time
        print(f"[INFO] Total analysis cycle: {total_time:.3f}s")
        
        return {
            "status": "success",
            "extracted_features": analysis_result.get("extracted_features"),
            "system_insights": analysis_result.get("system_insights"),
            "health_score": analysis_result.get("health_score"),
            "risk_level": analysis_result.get("risk_level"),
            "predictions": analysis_result.get("system_insights", {}).get("predictions"),
            "processing_time_sec": round(total_time, 3)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error in analyze_voice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        audio_bytes = None
        gc.collect()
