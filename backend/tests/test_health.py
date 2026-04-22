"""Tests for health + introspection endpoints and security middleware."""


class TestHealthEndpoints:
    def test_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        body = response.json()
        assert "message" in body
        assert body["environment"] == "development"

    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        body = response.json()
        assert body["service"] == "Recipe Wizard API"
        assert body["status"] in ("healthy", "degraded", "unhealthy")

    def test_liveness(self, client):
        response = client.get("/health/live")
        assert response.status_code == 200
        assert response.json()["status"] == "alive"

    def test_readiness_returns_payload(self, client):
        """Readiness may be 200 or 503 depending on env; both shapes are valid."""
        response = client.get("/health/ready")
        assert response.status_code in (200, 503)
        body = response.json()
        assert "ready" in body

    def test_api_status(self, client):
        response = client.get("/api/status")
        assert response.status_code == 200
        body = response.json()
        assert body["service"] == "Recipe Wizard API"
        assert "services" in body


class TestSecurityHeaders:
    def test_common_headers_present(self, client):
        response = client.get("/")
        headers = response.headers
        assert headers.get("X-Frame-Options") == "DENY"
        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert "Content-Security-Policy" in headers
        assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_production_hsts_header_not_set_in_dev(self, client):
        response = client.get("/")
        # Strict-Transport-Security is production-only
        assert "Strict-Transport-Security" not in response.headers
