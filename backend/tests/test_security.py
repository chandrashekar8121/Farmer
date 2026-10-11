def test_unauthorized_access_rejected(client):
    # Try fetching soil tests without token
    res = client.get("/api/v1/soil-tests")
    assert res.status_code == 401
    assert "token is required" in res.json()["detail"].lower()


def test_tenant_isolation_farmer_cannot_access_other_farmer_records(client):
    # 1. Register Farmer 1
    r1 = client.post("/api/v1/auth/signup", json={
        "email": "farmer1@example.com",
        "password": "password123",
        "full_name": "Ramesh Kumar",
        "role": "farmer",
        "language_preference": "te"
    })
    assert r1.status_code == 201
    token1 = r1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Register Farmer 2
    r2 = client.post("/api/v1/auth/signup", json={
        "email": "farmer2@example.com",
        "password": "password123",
        "full_name": "Suresh Reddy",
        "role": "farmer",
        "language_preference": "en"
    })
    assert r2.status_code == 201
    token2 = r2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 3. Farmer 1 creates a soil test
    st1 = client.post("/api/v1/soil-tests", headers=headers1, json={
        "nitrogen_mg_kg": 140.0,
        "phosphorus_mg_kg": 22.0,
        "potassium_mg_kg": 180.0,
        "soil_ph": 7.1,
        "lab_name": "KVK Vijayawada"
    })
    assert st1.status_code == 201
    test_id_1 = st1.json()["id"]

    # 4. Farmer 2 tries to read Farmer 1's soil test -> MUST BE REJECTED 403 or 404
    forbidden_res = client.get(f"/api/v1/soil-tests/{test_id_1}", headers=headers2)
    assert forbidden_res.status_code == 403

    # 5. Farmer 2 tries to delete Farmer 1's soil test -> MUST BE REJECTED 404
    delete_res = client.delete(f"/api/v1/soil-tests/{test_id_1}", headers=headers2)
    assert delete_res.status_code == 404

    # 6. Verify Farmer 1 can still access their test
    ok_res = client.get(f"/api/v1/soil-tests/{test_id_1}", headers=headers1)
    assert ok_res.status_code == 200
