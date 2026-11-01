import random
from ml.asthma_predictor import predict_asthma
from ml.depression_predictor import predict_depression
from ml.parkinsons_predictor import predict_parkinsons
from ml.extractor import get_feature_dict

def generate_insights(features_array, has_speech=True):
    """
    Combines predictions from specific models (Asthma, Depression, Parkinson's)
    and maps them to the overall health system insights used by the frontend.
    """
    
    # 0. Immediate guard for no voice / silence
    if not has_speech or features_array is None or len(features_array) < 50 or float(features_array[40]) < 0.005:
        return {
            "health_score": 0,
            "risk_level": "insufficient_data",
            "has_speech": False,
            "system_insights": {
                "respiratory": {
                    "score": 0,
                    "insight": "No human speech detected. Please record a vocal sample.",
                    "status": "normal",
                    "is_mock": False
                },
                "neurological": {
                    "score": 0,
                    "insight": "No human speech detected. Please record a vocal sample.",
                    "status": "normal",
                    "is_mock": False
                },
                "emotional": {
                    "score": 0,
                    "insight": "No human speech detected. Please record a vocal sample.",
                    "status": "normal",
                    "is_mock": False
                },
                "predictions": {
                    "asthma": { "prediction": "No Speech Detected", "confidence": 0.0, "severity": 0 },
                    "depression": { "prediction": "No Speech Detected", "confidence": 0.0, "severity": 0 },
                    "parkinsons": { "prediction": "No Speech Detected", "confidence": 0.0, "severity": 0 }
                }
            },
            "extracted_features": get_feature_dict(features_array, has_speech=False)
        }

    # 1. Get specific predictions
    asthma_res = predict_asthma(features_array)
    depression_res = predict_depression(features_array)
    parkinsons_res = predict_parkinsons(features_array)
    
    # 2. Get readable feature dict for metadata
    feature_meta = get_feature_dict(features_array, has_speech=True)
    
    # 3. Map to system insights (Standardized 0-100)
    # Respiratory (mapped from Asthma model)
    res_sev = asthma_res.get("severity", 0)
    insights = {
        "respiratory": {
            "score": 100 - res_sev if asthma_res["prediction"] == "Asthma" else 92,
            "insight": "Patterns consistent with respiratory irritation detected." if asthma_res["prediction"] == "Asthma" else "Lung capacity and airflow appear optimal.",
            "status": "warning" if asthma_res["prediction"] == "Asthma" else "normal",
            "is_mock": asthma_res.get("is_mock", False)
        },
        "neurological": {
            "score": 100 - parkinsons_res.get("severity", 0) if parkinsons_res["prediction"] == "Parkinsons" else 94,
            "insight": "Vocal micro-tremors detected; patterns consistent with neurological motor fatigue." if parkinsons_res["prediction"] == "Parkinsons" else "Vocal cords show stable neuromuscular control.",
            "status": "warning" if parkinsons_res["prediction"] == "Parkinsons" else "normal",
            "is_mock": parkinsons_res.get("is_mock", False)
        },
        "emotional": {
            "score": 100 - depression_res.get("severity", 0) if depression_res["prediction"] == "Depression" else 90,
            "insight": "Flat affect detected; vocal energy consistent with fatigue or low mood." if depression_res["prediction"] == "Depression" else "Vocal energy suggests balanced emotional state.",
            "status": "warning" if depression_res["prediction"] == "Depression" else "normal",
            "is_mock": depression_res.get("is_mock", False)
        }
    }
    
    # Calculate overall health score
    overall_score = int(sum(sys["score"] for sys in insights.values()) / 3)
    
    # Risk level logic
    if overall_score >= 85:
        risk_level = "low"
    elif overall_score >= 70:
        risk_level = "medium"
    else:
        risk_level = "high"
        
    return {
        "health_score": overall_score,
        "risk_level": risk_level,
        "has_speech": True,
        "system_insights": {
            **insights,
            "predictions": {
                "asthma": asthma_res,
                "depression": depression_res,
                "parkinsons": parkinsons_res
            }
        },
        "extracted_features": feature_meta
    }
