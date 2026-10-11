import io
from app.services.ocr_service import extract_soil_values_from_text, parse_soil_document


def test_regex_extraction_from_soil_report_text():
    sample_text = """
    GOVERNMENT SOIL TESTING LABORATORY, ANDHRA PRADESH
    Soil Health Card Diagnostic Report
    Farmer: Venkata Rao
    Soil pH: 6.8
    Available Nitrogen: 115 mg/kg
    Available Phosphorus: 18.5 mg/kg
    Available Potassium: 160 mg/kg
    Organic Carbon: 0.65 %
    Electrical Conductivity: 0.42 dS/m
    """
    extracted = extract_soil_values_from_text(sample_text)
    assert extracted["soil_ph"] == 6.8
    assert extracted["nitrogen_mg_kg"] == 115.0
    assert extracted["phosphorus_mg_kg"] == 18.5
    assert extracted["potassium_mg_kg"] == 160.0
    assert extracted["organic_carbon_percent"] == 0.65
    assert extracted["electrical_conductivity_ds_m"] == 0.42


def test_file_upload_rejection_of_unsupported_type(client):
    r = client.post("/api/v1/auth/signup", json={
        "email": "upload_tester@example.com",
        "password": "password123",
        "full_name": "Upload Tester",
        "role": "farmer"
    })
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload unsupported .exe file
    res = client.post(
        "/api/v1/soil-tests/upload",
        headers=headers,
        files={"file": ("malicious.exe", b"binarycontent", "application/octet-stream")}
    )
    assert res.status_code == 400
    assert "invalid file type" in res.json()["detail"].lower()


def test_file_upload_text_report_success(client):
    r = client.post("/api/v1/auth/signup", json={
        "email": "upload_ok@example.com",
        "password": "password123",
        "full_name": "Upload Ok",
        "role": "farmer"
    })
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    report_content = b"Soil Test Lab\nSoil pH: 7.2\nAvailable Nitrogen: 130 mg/kg\nPhosphorus: 20 mg/kg\nPotassium: 190 mg/kg"
    res = client.post(
        "/api/v1/soil-tests/upload",
        headers=headers,
        files={"file": ("test_report.txt", report_content, "text/plain")}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["extraction_status"] == "success"
    assert data["extracted_data"]["nitrogen_mg_kg"] == 130.0
    assert data["extracted_data"]["soil_ph"] == 7.2
