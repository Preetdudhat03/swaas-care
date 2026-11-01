import os
import joblib
import numpy as np

# Path to models relative to this file
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "depression")
MODEL_PATH = os.path.join(MODEL_DIR, "random_forest_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

# Lazy load cache
_MODEL_CACHE = {"model": None, "scaler": None}

def predict_depression(features):
    """
    Predicts depression risk based on 50 extracted voice features.
    """
    if features is None or len(features) < 50:
        return {"prediction": "Normal", "confidence": 0.94, "severity": 0, "is_mock": True}

    energy = float(features[40])      # RMS mean
    pitch_std = float(features[49])   # Pitch variability / dynamic inflection

    # Guard: silence or ambient noise must never trigger depression
    if energy < 0.02:
        return {
            "prediction": "Normal",
            "confidence": 0.94,
            "severity": 0,
            "is_mock": True
        }

    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        # Clinical flat affect in depression is characterized by lack of tonal variation (pitch_std < 10 Hz)
        # combined with low vocal energy during speech.
        if pitch_std >= 14.0:
            flatness_score = max(5, min(35, int((20.0 - min(20.0, pitch_std)) * 2)))
            is_risky = False
        else:
            flatness_score = min(100, int(((14.0 - pitch_std) / 10.0) * 100))
            is_risky = flatness_score > 65.0
        
        return {
            "prediction": "Depression" if is_risky else "Normal",
            "confidence": 0.86 if is_risky else 0.94,
            "severity": round(flatness_score),
            "is_mock": True
        }

    try:
        if _MODEL_CACHE["model"] is None:
            _MODEL_CACHE["model"] = joblib.load(MODEL_PATH)
            _MODEL_CACHE["scaler"] = joblib.load(SCALER_PATH)
            
        model = _MODEL_CACHE["model"]
        scaler = _MODEL_CACHE["scaler"]
        
        features_2d = features.reshape(1, -1)
        features_scaled = scaler.transform(features_2d)
        
        prediction = model.predict(features_scaled)
        probabilities = model.predict_proba(features_scaled)[0] if hasattr(model, "predict_proba") else [0.5, 0.5]
        
        confidence = float(max(probabilities))
        result = 'Depression' if prediction[0] == 1 else 'Normal'
        severity = float(probabilities[1]) * 100
        
        return {
            "prediction": result,
            "confidence": confidence,
            "severity": round(severity),
            "is_mock": False
        }
    except Exception as e:
        print(f"Error in depression prediction: {e}")
        return {"prediction": "Unknown", "error": str(e)}
