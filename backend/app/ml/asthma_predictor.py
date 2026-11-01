import os
import joblib
import numpy as np

# Path to models relative to this file
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "asthma")
MODEL_PATH = os.path.join(MODEL_DIR, "random_forest_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

# Lazy load cache
_MODEL_CACHE = {"model": None, "scaler": None}

def predict_asthma(features):
    """
    Predicts asthma risk based on 50 extracted voice features.
    """
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        # --- ENHANCED HEURISTIC (Respiratory Friction Proxy) ---
        zcr_mean = features[42]   # Vocal friction/breathiness
        rms_mean = features[40]   # Breath flow energy
        
        # Calculate respiratory strain (0-100)
        # zcr_mean typically 0.01 - 0.20
        strain_index = min(100, (zcr_mean / 0.18) * 100)
        
        is_risky = strain_index > 60.0
        
        return {
            "prediction": "Asthma" if is_risky else "Normal",
            "confidence": 0.88 if is_risky else 0.95,
            "severity": round(strain_index),
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
        result = 'Asthma' if prediction[0] == 1 else 'Normal'
        severity = float(probabilities[1]) * 100
        
        return {
            "prediction": result,
            "confidence": confidence,
            "severity": round(severity),
            "is_mock": False
        }
    except Exception as e:
        print(f"Error in asthma prediction: {e}")
        return {"prediction": "Unknown", "error": str(e)}

