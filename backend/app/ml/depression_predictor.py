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
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        # --- ENHANCED HEURISTIC (Vocal Energy Proxy) ---
        energy = features[40]     # RMS mean
        centroid = features[44]   # Spectral affect proxy
        
        # Calculate emotional "flatness" index (0-100)
        # where higher means more consistent with low mood patterns
        flatness_score = 100 - min(100, (energy / 0.04) * 100)
        
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

