"""Sanity check — test infrastructure works at all."""


def test_client_root(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Welcome to Recipe Wizard API"


def test_user_factory_creates_user(user, db_session):
    from app.models import User
    found = db_session.query(User).filter_by(email=user.email).first()
    assert found is not None
    assert found.is_active is True


def test_auth_headers_authenticate(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"].startswith("user")


def test_unauthenticated_endpoint_returns_401(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
