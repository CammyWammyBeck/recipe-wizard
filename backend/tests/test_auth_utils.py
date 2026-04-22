"""Unit tests for app/utils/auth — password hashing, JWT encoding/verification."""
from datetime import timedelta

import pytest
from fastapi import HTTPException

from app.utils.auth import AuthUtils, create_access_token_for_user


class TestPasswordHashing:
    def test_hash_verifies_correctly(self):
        hashed = AuthUtils.get_password_hash("SuperSecret123!")
        assert hashed != "SuperSecret123!"
        assert AuthUtils.verify_password("SuperSecret123!", hashed)

    def test_wrong_password_rejected(self):
        hashed = AuthUtils.get_password_hash("One")
        assert not AuthUtils.verify_password("Two", hashed)

    def test_different_hashes_for_same_password(self):
        """bcrypt salts each hash — same input should produce different hashes."""
        a = AuthUtils.get_password_hash("Same123!")
        b = AuthUtils.get_password_hash("Same123!")
        assert a != b


class TestJWT:
    def test_round_trip_token(self):
        token = AuthUtils.create_access_token(
            data={"user_id": 42, "sub": "x@y.com"},
            expires_delta=timedelta(minutes=5),
        )
        decoded = AuthUtils.verify_token(token)
        assert decoded.user_id == 42
        assert decoded.email == "x@y.com"

    def test_missing_user_id_rejected(self):
        token = AuthUtils.create_access_token(
            data={"sub": "x@y.com"},  # no user_id
            expires_delta=timedelta(minutes=5),
        )
        with pytest.raises(HTTPException) as exc:
            AuthUtils.verify_token(token)
        assert exc.value.status_code == 401

    def test_invalid_signature_rejected(self):
        with pytest.raises(HTTPException) as exc:
            AuthUtils.verify_token("not.a.valid.jwt")
        assert exc.value.status_code == 401

    def test_expired_token_rejected(self):
        token = AuthUtils.create_access_token(
            data={"user_id": 1, "sub": "x@y.com"},
            expires_delta=timedelta(seconds=-1),
        )
        with pytest.raises(HTTPException) as exc:
            AuthUtils.verify_token(token)
        assert exc.value.status_code == 401


class TestTokenForUser:
    def test_token_contains_user_claims(self, user):
        data = create_access_token_for_user(user)
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0
        assert data["user"]["email"] == user.email
        assert data["user"]["id"] == user.id

    def test_token_verifies_with_same_user_id(self, user):
        data = create_access_token_for_user(user)
        decoded = AuthUtils.verify_token(data["access_token"])
        assert decoded.user_id == user.id
