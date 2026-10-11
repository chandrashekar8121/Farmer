from app.services.ml_service import recommender


def test_ml_crop_recommendation_inference():
    # Test typical rice profile: High N, moderate P, moderate K, high humidity & rainfall
    res = recommender.predict(
        n=85.0,
        p=48.0,
        k=40.0,
        ph=6.4,
        temperature=24.0,
        humidity=82.0,
        rainfall=220.0
    )

    assert "predicted_crop" in res
    assert res["confidence_score"] > 0
    assert "explanation" in res
    assert len(res["secondary_crops"]) >= 1
    # Check that input parameters are faithfully echoed
    assert res["input_parameters"]["N"] == 85.0
    assert res["input_parameters"]["rainfall"] == 220.0


def test_ml_endpoint_via_api(client):
    res = client.post("/api/v1/crop-recommendations", json={
        "nitrogen_mg_kg": 40.0,
        "phosphorus_mg_kg": 68.0,
        "potassium_mg_kg": 80.0,
        "soil_ph": 7.3,
        "temperature": 19.0,
        "humidity": 17.0,
        "rainfall": 80.0
    })
    assert res.status_code == 200
    data = res.json()
    assert "predicted_crop" in data
    assert "confidence_score" in data
    assert "seasonal_advisory" in data
