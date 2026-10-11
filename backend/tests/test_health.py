def test_root_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "Krishi Saathi API"


def test_api_v1_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data
    assert "database" in data
    assert "crop_ml_engine" in data
    # Ensure no secrets leaked
    assert "SECRET_KEY" not in str(data)
    assert "SUPABASE_KEY" not in str(data)
