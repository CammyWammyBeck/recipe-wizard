"""Tests for /api/auth — registration, login, token, password change."""
from tests.conftest import DEFAULT_PASSWORD


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------
class TestRegister:
    def test_register_creates_user_and_returns_token(self, client):
        response = client.post("/api/auth/register", json={
            "email": "newuser@example.com",
            "password": "StrongPass123!",
            "username": "newuser",
            "first_name": "New",
            "last_name": "User",
        })
        assert response.status_code == 201
        body = response.json()
        assert body["token_type"] == "bearer"
        assert body["access_token"]
        assert body["user"]["email"] == "newuser@example.com"
        assert body["user"]["username"] == "newuser"
        assert body["user"]["isActive"] is True

    def test_register_minimal_fields(self, client):
        """Only email + password are required."""
        response = client.post("/api/auth/register", json={
            "email": "minimal@example.com",
            "password": "StrongPass123!",
        })
        assert response.status_code == 201

    def test_register_rejects_short_password(self, client):
        response = client.post("/api/auth/register", json={
            "email": "x@example.com",
            "password": "short",
        })
        assert response.status_code == 422

    def test_register_rejects_invalid_email(self, client):
        response = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "StrongPass123!",
        })
        assert response.status_code == 422

    def test_register_rejects_duplicate_email(self, client, user):
        response = client.post("/api/auth/register", json={
            "email": user.email,
            "password": "AnotherPass123!",
        })
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_rejects_duplicate_username(self, client, user):
        response = client.post("/api/auth/register", json={
            "email": "different@example.com",
            "password": "StrongPass123!",
            "username": user.username,
        })
        assert response.status_code == 400
        assert "username" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
class TestLogin:
    def test_login_success(self, client, user):
        response = client.post("/api/auth/login", json={
            "email": user.email,
            "password": DEFAULT_PASSWORD,
        })
        assert response.status_code == 200
        body = response.json()
        assert body["access_token"]
        assert body["user"]["email"] == user.email

    def test_login_wrong_password(self, client, user):
        response = client.post("/api/auth/login", json={
            "email": user.email,
            "password": "WrongPassword!!!",
        })
        assert response.status_code == 401

    def test_login_unknown_user(self, client):
        response = client.post("/api/auth/login", json={
            "email": "ghost@example.com",
            "password": "DoesntMatter1!",
        })
        assert response.status_code == 401

    def test_login_inactive_user(self, client, user, db_session):
        user.is_active = False
        db_session.commit()
        response = client.post("/api/auth/login", json={
            "email": user.email,
            "password": DEFAULT_PASSWORD,
        })
        # authenticate_user succeeds but the is_active check returns 400
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# Authenticated endpoints
# ---------------------------------------------------------------------------
class TestProtectedEndpoints:
    def test_me_returns_profile(self, client, auth_headers, user):
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["email"] == user.email
        assert body["units"] == "metric"
        assert "grocery_categories" in body

    def test_refresh_returns_new_token(self, client, auth_headers):
        response = client.post("/api/auth/refresh", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["access_token"]

    def test_logout(self, client, auth_headers):
        response = client.post("/api/auth/logout", headers=auth_headers)
        assert response.status_code == 200
        assert "logged out" in response.json()["message"].lower()

    def test_verify_token(self, client, auth_headers, user):
        response = client.post("/api/auth/verify-token", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["valid"] is True
        assert body["user"]["id"] == user.id

    def test_invalid_token_rejected(self, client):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer not.a.real.jwt"},
        )
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# Password change
# ---------------------------------------------------------------------------
class TestChangePassword:
    def test_change_password_success(self, client, auth_headers, user):
        response = client.post(
            "/api/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": DEFAULT_PASSWORD,
                "new_password": "BrandNewPass456!",
            },
        )
        assert response.status_code == 200

        # New password should now log in
        login = client.post("/api/auth/login", json={
            "email": user.email,
            "password": "BrandNewPass456!",
        })
        assert login.status_code == 200

    def test_change_password_wrong_current(self, client, auth_headers):
        response = client.post(
            "/api/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "WrongCurrent123!",
                "new_password": "BrandNewPass456!",
            },
        )
        assert response.status_code == 400

    def test_change_password_short_new(self, client, auth_headers):
        response = client.post(
            "/api/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": DEFAULT_PASSWORD,
                "new_password": "short",
            },
        )
        assert response.status_code == 422
