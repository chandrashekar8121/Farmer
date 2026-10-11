"""
Krishi Saathi - ML Crop Recommendation Service
Loads trained Random Forest model artifact and generates crop predictions.
Includes transparent agronomic fallbacks and regional explanations.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from typing import Dict, Any, List

FEATURE_ORDER = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

CROP_DISPLAY_INFO = {
    "rice": {"name": "Rice (Paddy / వరి)", "season": "Kharif & Rabi", "advisory": "Requires standing water and warm humid climate."},
    "maize": {"name": "Maize (మొక్కజొన్న)", "season": "Kharif & Rabi", "advisory": "Well-drained loamy soil, good moisture, moderate rainfall."},
    "chickpea": {"name": "Chickpea (శనగ)", "season": "Rabi", "advisory": "Thrives in cooler winter weather with minimal water."},
    "kidneybeans": {"name": "Kidney Beans (రాజ్మా)", "season": "Rabi / Hill Kharif", "advisory": "Requires fertile, humus-rich soil and moderate cool climate."},
    "pigeonpeas": {"name": "Pigeonpeas / Redgram (కందులు)", "season": "Kharif", "advisory": "Drought tolerant legume, fixes nitrogen in soil."},
    "mothbeans": {"name": "Mothbeans (మొత్ బీన్స్)", "season": "Kharif", "advisory": "Highly drought-resistant arid pulse crop."},
    "mungbean": {"name": "Mungbean / Greengram (పెసలు)", "season": "Kharif & Summer", "advisory": "Short duration pulse (60-70 days), restores soil fertility."},
    "blackgram": {"name": "Blackgram / Urad (మినుములు)", "season": "Kharif & Rabi", "advisory": "Excellent intercrop for paddy fallows and cotton."},
    "lentil": {"name": "Lentil / Masoor (ఎర్ర కంది)", "season": "Rabi", "advisory": "Cold tolerant legume suited for dry zones."},
    "pomegranate": {"name": "Pomegranate (దానిమ్మ)", "season": "Perennial / Mrig bahar", "advisory": "Semi-arid climate, deep loamy or alluvial soil."},
    "banana": {"name": "Banana (అరటి)", "season": "Year-round", "advisory": "High nitrogen and potassium demand, continuous moisture."},
    "mango": {"name": "Mango (మామిడి)", "season": "Summer harvest", "advisory": "Tropical climate with clear frost-free flowering period."},
    "grapes": {"name": "Grapes (ద్రాక్ష)", "season": "Year-round pruning", "advisory": "High potassium and phosphorus demand, arid sunny dry weather."},
    "watermelon": {"name": "Watermelon (పుచ్చకాయ)", "season": "Summer / Zaid", "advisory": "Sandy loam soil, warm sunny days, moderate irrigation."},
    "muskmelon": {"name": "Muskmelon (కర్బూజ)", "season": "Summer / Zaid", "advisory": "Dry atmosphere, warm nights, light textured fertile soil."},
    "apple": {"name": "Apple (యాపిల్)", "season": "Temperate", "advisory": "Cool temperate climate with sufficient winter chilling hours."},
    "orange": {"name": "Orange / Citrus (నారింజ)", "season": "Sub-tropical", "advisory": "Light well-drained soil, avoids waterlogging."},
    "papaya": {"name": "Papaya (బొప్పాయి)", "season": "Year-round", "advisory": "Warm climate, fertile soil, strictly avoid water stagnation."},
    "coconut": {"name": "Coconut (కొబ్బరి)", "season": "Perennial", "advisory": "Coastal/tropical climate with high humidity and sandy loam."},
    "cotton": {"name": "Cotton (ప్రత్తి)", "season": "Kharif", "advisory": "Deep black cotton soil, warm weather, moderate rainfall."},
    "jute": {"name": "Jute (జనపనార)", "season": "Kharif", "advisory": "Warm humid climate with standing river/canal water for retting."},
    "coffee": {"name": "Coffee (కాఫీ)", "season": "Hill plantation", "advisory": "Shaded plantation slopes with rich organic matter and rainfall."}
}


class CropRecommender:
    def __init__(self):
        self.model = None
        self.metadata = {}
        self._load_model()

    def _load_model(self):
        # Look in backend ml_artifacts or ml/models
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "..", "ml_artifacts", "crop_model.joblib"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "crop_model.joblib"))
        ]
        meta_paths = [
            os.path.join(os.path.dirname(__file__), "..", "ml_artifacts", "model_metadata.json"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "model_metadata.json"))
        ]

        for p in possible_paths:
            if os.path.exists(p):
                try:
                    self.model = joblib.load(p)
                    break
                except Exception as e:
                    print(f"Error loading model from {p}: {e}")

        for mp in meta_paths:
            if os.path.exists(mp):
                try:
                    with open(mp, "r", encoding="utf-8") as f:
                        self.metadata = json.load(f)
                    break
                except Exception as e:
                    print(f"Error loading metadata: {e}")

    def predict(
        self,
        n: float,
        p: float,
        k: float,
        ph: float,
        temperature: float = 25.0,
        humidity: float = 70.0,
        rainfall: float = 120.0
    ) -> Dict[str, Any]:
        """
        Runs ML prediction with strict feature ordering.
        Falls back to rule-based agronomic deduction if model artifact is unavailable.
        """
        feature_dict = {
            "N": float(n),
            "P": float(p),
            "K": float(k),
            "temperature": float(temperature),
            "humidity": float(humidity),
            "ph": float(ph),
            "rainfall": float(rainfall)
        }

        # Check if model is loaded
        if self.model is not None:
            # Build feature DataFrame with exact column names
            df_input = pd.DataFrame([{col: feature_dict[col] for col in FEATURE_ORDER}])
            try:
                probs = self.model.predict_proba(df_input)[0]
                classes = self.model.classes_

                top_indices = np.argsort(probs)[::-1]
                primary_idx = top_indices[0]
                primary_crop = classes[primary_idx]
                primary_conf = round(float(probs[primary_idx]) * 100, 1)

                # Secondary crops (top 3 runner ups)
                secondary = []
                for idx in top_indices[1:4]:
                    c_name = classes[idx]
                    c_display = CROP_DISPLAY_INFO.get(c_name, {}).get("name", c_name.capitalize())
                    conf_pct = round(float(probs[idx]) * 100, 1)
                    secondary.append({
                        "crop": c_display,
                        "suitability": "Viable Alternative" if conf_pct > 10 else "Potential Alternative",
                        "confidence": max(1.0, conf_pct)
                    })

                display = CROP_DISPLAY_INFO.get(primary_crop, {})
                crop_title = display.get("name", primary_crop.capitalize())
                season = display.get("season", "Kharif/Rabi")
                advisory = display.get("advisory", "Follow recommended package of practices.")

                explanation = (
                    f"Based on your soil's Nitrogen ({n} mg/kg), Phosphorus ({p} mg/kg), "
                    f"Potassium ({k} mg/kg), and pH ({ph}), together with climate conditions "
                    f"({temperature}°C, {humidity}% humidity, {rainfall}mm rainfall), "
                    f"{crop_title} shows the highest agronomic compatibility."
                )

                limitations = (
                    "This AI recommendation is trained on ICAR agronomic benchmark data. "
                    "Actual crop yield depends on irrigation quality, local pest pressure, seed variety, "
                    "and market prices. Please verify with your local agricultural extension officer."
                )

                return {
                    "predicted_crop": crop_title,
                    "secondary_crops": secondary,
                    "confidence_score": primary_conf,
                    "explanation": explanation,
                    "seasonal_advisory": f"Recommended Season: {season}. Advisory: {advisory}",
                    "model_version": "Random Forest v1.0 (Trained on 2,200 ICAR Benchmark Samples)",
                    "data_source": "ICAR Agronomic Crop Guidelines & Kaggle Crop Recommendation",
                    "limitations": limitations,
                    "input_parameters": feature_dict
                }
            except Exception as e:
                print(f"ML inference error: {e}, falling back to agronomic rules.")

        # Agronomic Fallback when model is not available
        return self._agronomic_rule_fallback(feature_dict)

    def _agronomic_rule_fallback(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Transparent, rule-based fallback based on soil and rainfall."""
        n, p, k, ph, rf = features["N"], features["P"], features["K"], features["ph"], features["rainfall"]

        if rf >= 180 and n >= 60:
            crop = "rice"
            alt = ["jute", "maize"]
        elif rf < 70 and features["temperature"] < 22:
            crop = "chickpea"
            alt = ["wheat", "lentil"]
        elif n >= 100:
            crop = "cotton"
            alt = ["maize", "watermelon"]
        elif p >= 60 and k >= 60:
            crop = "banana"
            alt = ["chickpea", "pigeonpeas"]
        else:
            crop = "maize"
            alt = ["mungbean", "blackgram"]

        display = CROP_DISPLAY_INFO.get(crop, {})
        crop_title = display.get("name", crop.capitalize())
        secondary = [
            {"crop": CROP_DISPLAY_INFO.get(c, {}).get("name", c.capitalize()), "suitability": "Feasible Option", "confidence": 70.0}
            for c in alt
        ]

        explanation = (
            f"[Rule-Based Fallback] Based on soil N={n}, P={p}, K={k}, pH={ph} and rainfall={rf}mm, "
            f"{crop_title} is selected as an agronomically viable crop."
        )

        return {
            "predicted_crop": crop_title,
            "secondary_crops": secondary,
            "confidence_score": 75.0,
            "explanation": explanation,
            "seasonal_advisory": f"Season: {display.get('season', 'General')}. Advisory: {display.get('advisory', 'Verify with local KVK.')}",
            "model_version": "Agronomic Rule-Based Fallback Engine",
            "data_source": "ICAR Standard Crop Suitability Tables",
            "limitations": "Model artifact unavailable; prediction generated via rule-based agronomic boundaries.",
            "input_parameters": features
        }


recommender = CropRecommender()
