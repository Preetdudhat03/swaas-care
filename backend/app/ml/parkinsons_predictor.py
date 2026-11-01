import os
import joblib
import numpy as np

# Path to models relative to this file
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "parkinsons")
MODEL_PATH = os.path.join(MODEL_DIR, "random_forest_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

# Lazy load cache
_MODEL_CACHE = {"model": None, "scaler": None}

def _map_50_to_22_biomarkers(features):
    """
    Maps 50 acoustic features from librosa (MFCC, RMS, ZCR, Centroid, Bandwidth, Pitch)
    into the 22 clinical vocal biomarkers of the UCI/Oxford Parkinson's dataset.
    """
    fo = float(features[48]) if features[48] > 0 else 150.0
    f_std = float(features[49]) if features[49] > 0 else 20.0
    
    fhi = fo + 1.2 * f_std
    flo = max(50.0, fo - 1.2 * f_std)
    
    jitter_pct = min(0.04, (f_std / (fo + 1e-5)) * 0.05)
    jitter_abs = f_std * 0.000001
    rap = jitter_pct * 0.5
    ppq = jitter_pct * 0.6
    ddp = rap * 3.0
    
    rms_std = float(features[41])
    shimmer = min(0.18, max(0.005, rms_std * 0.6))
    shimmer_db = float(20.0 * np.log10(shimmer + 1.0))
    apq3 = shimmer * 0.5
    apq5 = shimmer * 0.6
    apq = shimmer * 0.7
    dda = apq3 * 3.0
    
    zcr_mean = float(features[42])
    zcr_std = float(features[43])
    cent_mean = float(features[44])
    
    nhr = min(0.25, max(0.001, zcr_mean * 0.5))
    hnr = max(6.0, 28.0 - (nhr * 80.0))
    rpde = float(np.clip(0.4 + (zcr_std * 5.0), 0.25, 0.85))
    dfa = float(np.clip(0.65 + (zcr_mean * 2.0), 0.50, 0.88))
    spread1 = float(np.clip(-6.5 + (jitter_pct * 150.0), -7.5, -2.0))
    spread2 = float(np.clip(0.18 + (shimmer * 1.5), 0.05, 0.55))
    d2 = float(np.clip(2.1 + (cent_mean / 4000.0), 1.8, 3.5))
    ppe = float(np.clip(0.15 + (jitter_pct * 15.0), 0.05, 0.55))
    
    return np.array([
        fo, fhi, flo,
        jitter_pct, jitter_abs, rap, ppq, ddp,
        shimmer, shimmer_db, apq3, apq5, apq, dda,
        nhr, hnr, rpde, dfa, spread1, spread2, d2, ppe
    ], dtype=np.float32)

def predict_parkinsons(features):
    """
    Predicts Parkinson's disease risk using machine learning trained on
    the Oxford/UCI Vocal Biomarker Dataset (Kaggle: nasrulhakim86).
    
    Accepts:
      - 22 vocal biomarker array [Fo, Fhi, Flo, Jitter..., Shimmer..., NHR, HNR, RPDE...]
      - 50 acoustic feature array from live audio feature extraction
    """
    features_arr = np.array(features, dtype=np.float32).flatten()
    energy = float(features_arr[40]) if len(features_arr) >= 50 else 0.05

    # Guard: silence or ambient noise must never trigger parkinsons
    if energy < 0.02:
        return {
            "prediction": "Normal",
            "confidence": 0.95,
            "severity": 0,
            "is_mock": True
        }
    
    # 1. Fallback heuristic if models are not yet trained/available
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        pitch_std = features_arr[49] if len(features_arr) >= 50 else (features_arr[3] * 1000)
        rms_std = features_arr[41] if len(features_arr) >= 50 else (features_arr[8] * 2)
        
        if pitch_std < 25.0:
            instability_index = max(5, min(35, int(pitch_std)))
            is_risky = False
        else:
            jitter_score = min(100, (pitch_std / 70.0) * 100)
            shimmer_score = min(100, (rms_std / 0.12) * 100)
            instability_index = (jitter_score * 0.7) + (shimmer_score * 0.3)
            is_risky = instability_index > 65.0
        
        return {
            "prediction": "Parkinsons" if is_risky else "Normal",
            "confidence": 0.85 if is_risky else 0.95,
            "severity": round(instability_index),
            "is_mock": True
        }

    try:
        # 2. Lazy load models
        if _MODEL_CACHE["model"] is None:
            print("[DEBUG] Lazy loading Parkinsons models...")
            _MODEL_CACHE["model"] = joblib.load(MODEL_PATH)
            _MODEL_CACHE["scaler"] = joblib.load(SCALER_PATH)
            
        model = _MODEL_CACHE["model"]
        scaler = _MODEL_CACHE["scaler"]
        
        # 3. Format input to 22 clinical vocal biomarkers
        if len(features_arr) == 22:
            input_22 = features_arr
        elif len(features_arr) >= 50:
            input_22 = _map_50_to_22_biomarkers(features_arr)
        else:
            # Pad or truncate to 22
            input_22 = np.pad(features_arr, (0, max(0, 22 - len(features_arr))), 'constant')[:22]

        features_2d = input_22.reshape(1, -1)
        features_scaled = scaler.transform(features_2d)
        
        pred = model.predict(features_scaled)
        probabilities = model.predict_proba(features_scaled)[0] if hasattr(model, "predict_proba") else [0.5, 0.5]
        
        confidence = float(max(probabilities))
        result = 'Parkinsons' if pred[0] == 1 else 'Normal'
        severity = float(probabilities[1]) * 100
        
        return {
            "prediction": result,
            "confidence": round(confidence, 3),
            "severity": round(severity),
            "is_mock": False
        }
    except Exception as e:
        print(f"Error in parkinsons prediction: {e}")
        return {"prediction": "Unknown", "error": str(e), "is_mock": True}
