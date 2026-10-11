"""
Krishi Saathi - Official Agronomic Fertilizer Calculation Engine
References: ICAR, TNAU Crop Production Guide, Ministry of Agriculture STCR Norms.
"""

from datetime import date, timedelta
from typing import Dict, Any, List, Optional
from app.schemas.schemas import RecommendedProductItem, SplitScheduleItem

# Official Subsidized Fertilizer MRPs (Govt of India DBT 2024-2026)
FERTILIZER_CATALOG = {
    "urea": {
        "name": "Neem Coated Urea (46% N)",
        "generic": "Urea",
        "bag_size_kg": 45.0,
        "price_per_bag": 266.50,
        "n_pct": 0.46,
        "p_pct": 0.0,
        "k_pct": 0.0
    },
    "dap": {
        "name": "DAP - Di-Ammonium Phosphate (18-46-0)",
        "generic": "DAP",
        "bag_size_kg": 50.0,
        "price_per_bag": 1350.00,
        "n_pct": 0.18,
        "p_pct": 0.46,
        "k_pct": 0.0
    },
    "mop": {
        "name": "MOP - Muriate of Potash (60% K2O)",
        "generic": "MOP",
        "bag_size_kg": 50.0,
        "price_per_bag": 1700.00,
        "n_pct": 0.0,
        "p_pct": 0.0,
        "k_pct": 0.60
    },
    "ssp": {
        "name": "SSP - Single Super Phosphate (16% P2O5, 11% S)",
        "generic": "SSP",
        "bag_size_kg": 50.0,
        "price_per_bag": 525.00,
        "n_pct": 0.0,
        "p_pct": 0.16,
        "k_pct": 0.0
    }
}

# Standard Recommended Dose of Fertilizer (RDF) in kg/ha (N, P2O5, K2O)
CROP_RDF = {
    "rice": {"N": 120.0, "P": 60.0, "K": 40.0, "name": "Rice (Paddy / వరి)"},
    "paddy": {"N": 120.0, "P": 60.0, "K": 40.0, "name": "Rice (Paddy / వరి)"},
    "wheat": {"N": 120.0, "P": 60.0, "K": 40.0, "name": "Wheat (గోధుమ)"},
    "maize": {"N": 120.0, "P": 60.0, "K": 40.0, "name": "Maize (మొక్కజొన్న)"},
    "cotton": {"N": 120.0, "P": 60.0, "K": 60.0, "name": "Cotton (ప్రత్తి)"},
    "sugarcane": {"N": 250.0, "P": 100.0, "K": 120.0, "name": "Sugarcane (చెరకు)"},
    "groundnut": {"N": 25.0, "P": 50.0, "K": 75.0, "name": "Groundnut (వేరుశనగ)"},
    "chickpea": {"N": 20.0, "P": 40.0, "K": 20.0, "name": "Chickpea (శనగ)"},
    "kidneybeans": {"N": 30.0, "P": 50.0, "K": 30.0, "name": "Kidney Beans (రాజ్మా)"},
    "pigeonpeas": {"N": 25.0, "P": 50.0, "K": 25.0, "name": "Pigeonpeas / Redgram (కందులు)"},
    "blackgram": {"N": 20.0, "P": 40.0, "K": 20.0, "name": "Blackgram / Urad (మినుములు)"},
    "mungbean": {"N": 20.0, "P": 40.0, "K": 20.0, "name": "Mungbean / Greengram (పెసలు)"},
    "tomato": {"N": 150.0, "P": 100.0, "K": 100.0, "name": "Tomato (టమోటా)"},
    "chilli": {"N": 120.0, "P": 60.0, "K": 60.0, "name": "Chilli (మిరప)"},
    "banana": {"N": 200.0, "P": 60.0, "K": 300.0, "name": "Banana (అరటి)"},
    "mango": {"N": 100.0, "P": 50.0, "K": 100.0, "name": "Mango (మామిడి)"},
    "grapes": {"N": 100.0, "P": 100.0, "K": 200.0, "name": "Grapes (ద్రాక్ష)"},
    "watermelon": {"N": 100.0, "P": 50.0, "K": 50.0, "name": "Watermelon (పుచ్చకాయ)"},
    "potato": {"N": 150.0, "P": 100.0, "K": 120.0, "name": "Potato (బంగాళాదుంప)"},
    "soybean": {"N": 30.0, "P": 60.0, "K": 40.0, "name": "Soybean (సోయాబీన్)"},
    "mustard": {"N": 80.0, "P": 40.0, "K": 40.0, "name": "Mustard (ఆవాలు)"}
}

# Default provisional recommendation if crop is unlisted
DEFAULT_RDF = {"N": 100.0, "P": 50.0, "K": 50.0, "name": "General Field Crop"}


def convert_area_to_hectares(area: float, unit: str) -> float:
    """Accurately converts land area to hectares."""
    u = unit.lower().strip()
    if u in ["hectares", "hectare", "ha"]:
        return area
    elif u in ["acres", "acre", "ac"]:
        return area * 0.404686
    elif u in ["sq_meters", "sqm", "square_metres", "sq_m"]:
        return area / 10000.0
    else:
        raise ValueError(f"Unsupported land area unit '{unit}'. Use acres, hectares, or sq_meters.")


def evaluate_nutrient_status(n_mg: float, p_mg: float, k_mg: float, ph: float) -> Dict[str, Any]:
    """Evaluates Soil Nutrient Level (Low/Medium/High) and Soil pH classification."""
    # Nitrogen (mg/kg): Low < 125, Medium 125-250, High > 250
    if n_mg < 125:
        n_status = "Low"
        n_factor = 1.25  # +25%
        n_desc = "Low Nitrogen (N). Crops may look yellowish or pale with stunted growth."
    elif n_mg <= 250:
        n_status = "Medium"
        n_factor = 1.00  # Standard
        n_desc = "Medium Nitrogen (N). Adequate baseline available for healthy foliage."
    else:
        n_status = "High"
        n_factor = 0.75  # -25%
        n_desc = "High Nitrogen (N). Reduce synthetic nitrogen to prevent lodging and pests."

    # Phosphorus (mg/kg): Low < 10, Medium 10-25, High > 25
    if p_mg < 10:
        p_status = "Low"
        p_factor = 1.25
        p_desc = "Low Phosphorus (P). Root growth will be sluggish and flowering delayed."
    elif p_mg <= 25:
        p_status = "Medium"
        p_factor = 1.00
        p_desc = "Medium Phosphorus (P). Healthy root development and tillering."
    else:
        p_status = "High"
        p_factor = 0.75
        p_desc = "High Phosphorus (P). Soil has sufficient available phosphate."

    # Potassium (mg/kg): Low < 110, Medium 110-280, High > 280
    if k_mg < 110:
        k_status = "Low"
        k_factor = 1.25
        k_desc = "Low Potassium (K). Plant will be susceptible to moisture stress and disease."
    elif k_mg <= 280:
        k_status = "Medium"
        k_factor = 1.00
        k_desc = "Medium Potassium (K). Good grain filling and disease resistance."
    else:
        k_status = "High"
        k_factor = 0.75
        k_desc = "High Potassium (K). Ample potash present in the soil."

    # Soil pH
    if ph < 5.5:
        ph_status = "Strongly Acidic"
        ph_desc = "Soil is acidic (pH < 5.5). Apply Agricultural Lime (CaCO3) 250-400 kg/acre."
    elif ph < 6.5:
        ph_status = "Slightly Acidic"
        ph_desc = "Soil is slightly acidic. Good for most crops, incorporate FYM/compost."
    elif ph <= 7.5:
        ph_status = "Neutral (Optimal)"
        ph_desc = "Optimal soil pH (6.5-7.5). Nutrients are maximally soluble and available."
    elif ph <= 8.5:
        ph_status = "Moderately Alkaline"
        ph_desc = "Slightly alkaline soil. Prefer Single Super Phosphate (SSP) over DAP."
    else:
        ph_status = "Strongly Alkaline / Sodic"
        ph_desc = "Alkaline / Saline (pH > 8.5). Apply Agricultural Gypsum 300-500 kg/acre."

    return {
        "nitrogen": {"status": n_status, "factor": n_factor, "description": n_desc},
        "phosphorus": {"status": p_status, "factor": p_factor, "description": p_desc},
        "potassium": {"status": k_status, "factor": k_factor, "description": k_desc},
        "ph": {"value": ph, "status": ph_status, "description": ph_desc}
    }


def calculate_fertilizer_recommendation(
    crop_name: str,
    target_area: float,
    area_unit: str,
    n_mg_kg: float,
    p_mg_kg: float,
    k_mg_kg: float,
    soil_ph: float,
    growth_stage: str = "Basal (Land Preparation / Sowing)",
    sowing_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Computes precise fertilizer requirements, product bags, cost, and split schedules.
    """
    crop_key = crop_name.lower().strip()
    is_provisional = False

    if crop_key in CROP_RDF:
        rdf = CROP_RDF[crop_key]
        source = "ICAR & State Agricultural University STCR Standard Recommendations"
    else:
        # Match substring or provisional fallback
        matched = False
        for k, v in CROP_RDF.items():
            if k in crop_key or crop_key in k:
                rdf = v
                matched = True
                source = f"ICAR Benchmark Recommendation matched for {v['name']}"
                break
        if not matched:
            rdf = DEFAULT_RDF
            is_provisional = True
            source = "Provisional baseline agronomic rule. Consult local Krishi Vigyan Kendra (KVK)."

    # 1. Area in Hectares
    hectares = convert_area_to_hectares(target_area, area_unit)

    # 2. Nutrient Status & Soil Test Adjustments
    status = evaluate_nutrient_status(n_mg_kg, p_mg_kg, k_mg_kg, soil_ph)
    adj_n = rdf["N"] * status["nitrogen"]["factor"]
    adj_p = rdf["P"] * status["phosphorus"]["factor"]
    adj_k = rdf["K"] * status["potassium"]["factor"]

    # 3. Total required nutrient in kg for this specific farm area
    req_n_kg = adj_n * hectares
    req_p_kg = adj_p * hectares
    req_k_kg = adj_k * hectares

    # 4. Product calculation
    # P is provided first via DAP (18% N, 46% P2O5)
    dap_spec = FERTILIZER_CATALOG["dap"]
    urea_spec = FERTILIZER_CATALOG["urea"]
    mop_spec = FERTILIZER_CATALOG["mop"]

    dap_kg = req_p_kg / dap_spec["p_pct"] if req_p_kg > 0 else 0.0
    n_from_dap = dap_kg * dap_spec["n_pct"]

    # Remaining N is supplied via Neem Coated Urea (46% N)
    rem_n_kg = max(0.0, req_n_kg - n_from_dap)
    urea_kg = rem_n_kg / urea_spec["n_pct"] if rem_n_kg > 0 else 0.0

    # K is supplied via MOP (60% K2O)
    mop_kg = req_k_kg / mop_spec["k_pct"] if req_k_kg > 0 else 0.0

    # Bag counts & costs
    dap_bags = round(dap_kg / dap_spec["bag_size_kg"], 2)
    urea_bags = round(urea_kg / urea_spec["bag_size_kg"], 2)
    mop_bags = round(mop_kg / mop_spec["bag_size_kg"], 2)

    dap_cost = round(dap_kg * (dap_spec["price_per_bag"] / dap_spec["bag_size_kg"]), 2)
    urea_cost = round(urea_kg * (urea_spec["price_per_bag"] / urea_spec["bag_size_kg"]), 2)
    mop_cost = round(mop_kg * (mop_spec["price_per_bag"] / mop_spec["bag_size_kg"]), 2)

    total_cost = round(dap_cost + urea_cost + mop_cost, 2)

    recommended_products = [
        RecommendedProductItem(
            product_name=dap_spec["name"],
            generic_name=dap_spec["generic"],
            quantity_kg=round(dap_kg, 2),
            bags=dap_bags,
            bag_size_kg=dap_spec["bag_size_kg"],
            unit_price_inr=dap_spec["price_per_bag"],
            subtotal_inr=dap_cost,
            timing_stage="Basal / At Sowing",
            application_method="Apply full quantity during final land preparation / sowing."
        ),
        RecommendedProductItem(
            product_name=urea_spec["name"],
            generic_name=urea_spec["generic"],
            quantity_kg=round(urea_kg, 2),
            bags=urea_bags,
            bag_size_kg=urea_spec["bag_size_kg"],
            unit_price_inr=urea_spec["price_per_bag"],
            subtotal_inr=urea_cost,
            timing_stage="Split into 2-3 applications",
            application_method="Top-dress in 2 to 3 splits: at tillering and panicle/flowering stages."
        ),
        RecommendedProductItem(
            product_name=mop_spec["name"],
            generic_name=mop_spec["generic"],
            quantity_kg=round(mop_kg, 2),
            bags=mop_bags,
            bag_size_kg=mop_spec["bag_size_kg"],
            unit_price_inr=mop_spec["price_per_bag"],
            subtotal_inr=mop_cost,
            timing_stage="Basal & Panicle Stage",
            application_method="Apply 50% basal and 50% at flowering/grain filling stage."
        )
    ]

    # Split Schedule Generation
    base_date = sowing_date or date.today()
    split_schedule = [
        SplitScheduleItem(
            stage="Basal Application (సమతుల్య బేసల్ ఎరువు)",
            days_from_sowing=0,
            due_date=base_date,
            product_name=f"{round(dap_kg, 1)} kg DAP + {round(mop_kg * 0.5, 1)} kg MOP",
            quantity_kg=round(dap_kg + (mop_kg * 0.5), 2),
            method="Deep soil placement before transplanting/sowing",
            instructions="Apply all DAP and half MOP in moist soil during final plowing."
        ),
        SplitScheduleItem(
            stage="First Top-Dressing (మొదటి విడత యూరియా - పిలకల దశ)",
            days_from_sowing=25,
            due_date=base_date + timedelta(days=25),
            product_name=f"{round(urea_kg * 0.5, 1)} kg Neem Coated Urea",
            quantity_kg=round(urea_kg * 0.5, 2),
            method="Broadcasting after weeding with 2-3 cm standing water",
            instructions="Drain excess water if needed, broadcast urea in the morning or evening."
        ),
        SplitScheduleItem(
            stage="Second Top-Dressing (రెండవ విడత యూరియా & పొటాష్ - వెన్ను దశ)",
            days_from_sowing=50,
            due_date=base_date + timedelta(days=50),
            product_name=f"{round(urea_kg * 0.5, 1)} kg Urea + {round(mop_kg * 0.5, 1)} kg MOP",
            quantity_kg=round((urea_kg * 0.5) + (mop_kg * 0.5), 2),
            method="Top dressing at panicle initiation / flowering",
            instructions="Apply remaining Urea and MOP. Ensures bold grain filling and heavy yield."
        )
    ]

    safety = (
        "1. Always wear gloves or wash hands thoroughly with soap after handling chemical fertilizers.\n"
        "2. Do not apply urea right before heavy rainfall to prevent nutrient leaching into waterways.\n"
        "3. Store fertilizer bags off the floor on wooden planks in a dry, ventilated shed away from cattle feed.\n"
        "4. Mix farmyard manure (FYM) or vermicompost to preserve long-term soil microbial biology."
    )

    assumptions = (
        f"Calculations based on target area of {target_area} {area_unit} ({round(hectares, 3)} ha). "
        f"Nutrient response adjusted for Low/Medium/High soil status under ICAR STCR guidelines. "
        f"Prices reflect official Government Subsidized Maximum Retail Prices (Urea ₹266.50/45kg, DAP ₹1350/50kg, MOP ₹1700/50kg)."
    )

    return {
        "crop_name": rdf["name"],
        "growth_stage": growth_stage,
        "target_area": target_area,
        "area_unit": area_unit,
        "target_area_hectares": round(hectares, 4),
        "nutrient_status": status,
        "recommended_products": recommended_products,
        "split_schedule": split_schedule,
        "total_estimated_cost_inr": total_cost,
        "price_source": "Central Government Subsidized DBT Rates (Official 2024-2026)",
        "safety_instructions": safety,
        "recommendation_source": source,
        "assumptions": assumptions,
        "is_provisional": is_provisional
    }
