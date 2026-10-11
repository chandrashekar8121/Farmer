import pytest
from app.services.fertilizer_service import (
    convert_area_to_hectares,
    evaluate_nutrient_status,
    calculate_fertilizer_recommendation
)


def test_area_conversions():
    # 1 hectare = 1 hectare
    assert convert_area_to_hectares(1.0, "hectares") == 1.0
    # 2.47105 acres ~ 1 hectare
    ha_from_acres = convert_area_to_hectares(2.47105, "acres")
    assert abs(ha_from_acres - 1.0) < 0.001
    # 10,000 sq meters = 1 hectare
    ha_from_sqm = convert_area_to_hectares(10000.0, "sq_meters")
    assert ha_from_sqm == 1.0

    with pytest.raises(ValueError):
        convert_area_to_hectares(5.0, "square_miles")


def test_nutrient_status_evaluation():
    # Low N, Medium P, High K, Acidic pH
    status = evaluate_nutrient_status(n_mg=100.0, p_mg=18.0, k_mg=300.0, ph=5.2)
    assert status["nitrogen"]["status"] == "Low"
    assert status["nitrogen"]["factor"] == 1.25  # +25%
    assert status["phosphorus"]["status"] == "Medium"
    assert status["phosphorus"]["factor"] == 1.00
    assert status["potassium"]["status"] == "High"
    assert status["potassium"]["factor"] == 0.75  # -25%
    assert status["ph"]["status"] == "Strongly Acidic"


def test_worked_example_calculation():
    """
    Validates calculation against the worked example in docs/AGRONOMIC_RULES.md:
    Crop: Rice (Paddy)
    Area: 2 Acres (0.80937 ha)
    Soil Test: N=100 mg/kg (Low), P=18 mg/kg (Medium), K=150 mg/kg (Medium), pH=6.8
    Expected:
    - DAP ~ 105.57 kg
    - Urea ~ 222.63 kg
    - MOP ~ 53.95 kg
    - Total cost ~ ₹6,002.66
    """
    res = calculate_fertilizer_recommendation(
        crop_name="Rice",
        target_area=2.0,
        area_unit="acres",
        n_mg_kg=100.0,
        p_mg_kg=18.0,
        k_mg_kg=150.0,
        soil_ph=6.8
    )

    prods = {p.generic_name: p for p in res["recommended_products"]}
    assert "DAP" in prods
    assert "Urea" in prods
    assert "MOP" in prods

    # Verify quantities within 1% margin
    assert abs(prods["DAP"].quantity_kg - 105.57) < 1.0
    assert abs(prods["Urea"].quantity_kg - 222.63) < 1.0
    assert abs(prods["MOP"].quantity_kg - 53.95) < 1.0

    # Verify cost within ₹10
    assert abs(res["total_estimated_cost_inr"] - 6002.66) < 10.0

    # Verify split schedule has at least 3 stages
    assert len(res["split_schedule"]) == 3
