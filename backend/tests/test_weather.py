from app.services.weather_service import generate_spray_advisory


def test_spray_advisory_logic():
    # Rain expected -> Warning to avoid fertilizer spraying
    rain_adv = generate_spray_advisory(wind_speed_kmh=10.0, rain_mm=5.0, condition="Rain")
    assert "వర్షం" in rain_adv or "do not spray" in rain_adv.lower()

    # High wind -> Warning about drift
    wind_adv = generate_spray_advisory(wind_speed_kmh=22.0, rain_mm=0.0, condition="Clear")
    assert "గాలి" in wind_adv or "wind" in wind_adv.lower()

    # Favorable weather
    calm_adv = generate_spray_advisory(wind_speed_kmh=8.0, rain_mm=0.0, condition="Clear")
    assert "అనుకూల" in calm_adv or "favorable" in calm_adv.lower()


def test_weather_endpoint_degrades_gracefully(client):
    res = client.get("/api/v1/weather?lat=16.5&lon=80.6&location_name=Vijayawada")
    assert res.status_code == 200
    data = res.json()
    assert "current" in data
    assert "spray_advisory" in data["current"]
    # When no key is provided, is_live is False and notes state it clearly
    if not data["is_live"]:
        assert "OPENWEATHER_API_KEY" in data["notes"]
