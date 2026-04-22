"""Tests for /api/users — profile, preferences, account deletion."""
from app.models import (
    Conversation, Recipe, RecipeJob, SavedRecipe, ShoppingList, User,
)


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------
class TestProfile:
    def test_get_profile(self, client, auth_headers, user):
        response = client.get("/api/users/profile", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["email"] == user.email
        assert body["units"] == "metric"
        assert body["default_servings"] == 4

    def test_update_profile_fields(self, client, auth_headers):
        response = client.put(
            "/api/users/profile",
            headers=auth_headers,
            json={"first_name": "Cameron", "last_name": "Beck"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["first_name"] == "Cameron"
        assert body["last_name"] == "Beck"

    def test_update_profile_username(self, client, auth_headers):
        response = client.put(
            "/api/users/profile",
            headers=auth_headers,
            json={"username": "newhandle"},
        )
        assert response.status_code == 200
        assert response.json()["username"] == "newhandle"

    def test_update_profile_rejects_taken_username(self, client, auth_headers, user_factory):
        other = user_factory(username="taken_handle")
        response = client.put(
            "/api/users/profile",
            headers=auth_headers,
            json={"username": "taken_handle"},
        )
        assert response.status_code == 400
        assert "taken" in response.json()["detail"].lower()
        assert other.username == "taken_handle"

    def test_settings_endpoint_alias(self, client, auth_headers, user):
        response = client.get("/api/users/settings", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == user.email


# ---------------------------------------------------------------------------
# Preferences
# ---------------------------------------------------------------------------
class TestPreferences:
    def test_get_preferences_defaults(self, client, auth_headers):
        response = client.get("/api/users/preferences", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["units"] == "metric"
        assert body["default_servings"] == 4
        assert isinstance(body["grocery_categories"], list)
        assert isinstance(body["dietary_restrictions"], list)

    def test_update_preferences(self, client, auth_headers):
        payload = {
            "units": "imperial",
            "default_servings": 2,
            "preferred_difficulty": "medium",
            "max_cook_time": 45,
            "max_prep_time": 20,
            "dietary_restrictions": ["vegetarian"],
            "allergens": ["nuts"],
            "dislikes": ["cilantro"],
            "additional_preferences": "Prefer Italian cuisine",
            "theme_preference": "dark",
            "grocery_categories": ["produce", "dairy"],
        }
        response = client.put(
            "/api/users/preferences", headers=auth_headers, json=payload,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["units"] == "imperial"
        assert body["default_servings"] == 2
        assert body["dietary_restrictions"] == ["vegetarian"]
        assert body["allergens"] == ["nuts"]
        assert body["additional_preferences"] == "Prefer Italian cuisine"
        assert body["grocery_categories"] == ["produce", "dairy"]

    def test_partial_preferences_update_keeps_other_fields(self, client, auth_headers):
        client.put("/api/users/preferences", headers=auth_headers,
                   json={"units": "imperial", "default_servings": 6})
        response = client.put("/api/users/preferences", headers=auth_headers,
                              json={"theme_preference": "light"})
        assert response.status_code == 200
        body = response.json()
        # previously-set fields persist
        assert body["units"] == "imperial"
        assert body["default_servings"] == 6
        assert body["theme_preference"] == "light"

    def test_invalid_units_rejected(self, client, auth_headers):
        response = client.put(
            "/api/users/preferences",
            headers=auth_headers,
            json={"units": "stones"},
        )
        assert response.status_code == 422

    def test_invalid_difficulty_rejected(self, client, auth_headers):
        response = client.put(
            "/api/users/preferences",
            headers=auth_headers,
            json={"preferred_difficulty": "extreme"},
        )
        assert response.status_code == 422

    def test_default_servings_out_of_range(self, client, auth_headers):
        response = client.put(
            "/api/users/preferences",
            headers=auth_headers,
            json={"default_servings": 100},
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# Account deletion (cascade verification)
# ---------------------------------------------------------------------------
class TestAccountDeletion:
    def test_delete_account_removes_user(self, client, auth_headers, user, db_session):
        user_id = user.id  # capture before deletion detaches the instance
        response = client.delete("/api/users/account", headers=auth_headers)
        assert response.status_code == 200

        db_session.expire_all()
        assert db_session.query(User).filter_by(id=user_id).first() is None

    def test_delete_account_cascades_to_owned_records(
        self, client, auth_headers, user, db_session, recipe_factory,
    ):
        """CLAUDE.md flags this as load-bearing: every user-linked table needs
        cascade delete so the public account-deletion flow leaves no orphans."""
        recipe = recipe_factory(owner=user)
        user_id, recipe_id = user.id, recipe.id

        saved = SavedRecipe(user_id=user_id, recipe_id=recipe_id)
        convo = Conversation(user_id=user_id, recipe_id=recipe_id, user_prompt="x")
        job = RecipeJob(id="job-1", user_id=user_id, status="pending", job_type="generate", prompt="hi")
        sl = ShoppingList(user_id=user_id, name="My List")
        db_session.add_all([saved, convo, job, sl])
        db_session.commit()

        response = client.delete("/api/users/account", headers=auth_headers)
        assert response.status_code == 200

        db_session.expire_all()
        assert db_session.query(User).filter_by(id=user_id).first() is None
        assert db_session.query(Recipe).filter_by(created_by_id=user_id).count() == 0
        assert db_session.query(SavedRecipe).filter_by(user_id=user_id).count() == 0
        assert db_session.query(Conversation).filter_by(user_id=user_id).count() == 0
        assert db_session.query(RecipeJob).filter_by(user_id=user_id).count() == 0
        assert db_session.query(ShoppingList).filter_by(user_id=user_id).count() == 0

    def test_delete_account_requires_auth(self, client):
        response = client.delete("/api/users/account")
        assert response.status_code == 401
