def test_invalid_soil_values_rejected(client):
    # Register and get auth token
    r = client.post("/api/v1/auth/signup", json={
        "email": "soiltest_val@example.com",
        "password": "password123",
        "full_name": "Test Farmer",
        "role": "farmer"
    })
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test negative Nitrogen
    res_neg_n = client.post("/api/v1/soil-tests", headers=headers, json={
        "nitrogen_mg_kg": -10.0,
        "phosphorus_mg_kg": 20.0,
        "potassium_mg_kg": 150.0,
        "soil_ph": 7.0
    })
    assert res_neg_n.status_code == 422

    # Test pH > 14 (impossible pH scale)
    res_high_ph = client.post("/api/v1/soil-tests", headers=headers, json={
        "nitrogen_mg_kg": 100.0,
        "phosphorus_mg_kg": 20.0,
        "potassium_mg_kg": 150.0,
        "soil_ph": 15.5
    })
    assert res_high_ph.status_code == 422

    # Test negative pH
    res_neg_ph = client.post("/api/v1/soil-tests", headers=headers, json={
        "nitrogen_mg_kg": 100.0,
        "phosphorus_mg_kg": 20.0,
        "potassium_mg_kg": 150.0,
        "soil_ph": -1.0
    })
    assert res_neg_ph.status_code == 422


def test_valid_soil_test_creation_and_retrieval(client):
    r = client.post("/api/v1/auth/signup", json={
        "email": "soiltest_ok@example.com",
        "password": "password123",
        "full_name": "Satish Kumar",
        "role": "farmer"
    })
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/v1/soil-tests", headers=headers, json={
        "nitrogen_mg_kg": 120.0,
        "phosphorus_mg_kg": 25.0,
        "potassium_mg_kg": 190.0,
        "soil_ph": 6.8,
        "lab_name": "Rythu Bharosa Kendra"
    })
    assert create_res.status_code == 201
    test_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/soil-tests/{test_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["nitrogen_mg_kg"] == 120.0
    assert get_res.json()["lab_name"] == "Rythu Bharosa Kendra"
