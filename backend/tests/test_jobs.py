"""Tests for /api/jobs — async recipe generation lifecycle.

The router fires an asyncio background task to process the LLM call.
Tests stub the processor to a no-op so the test loop exits cleanly, and
exercise lifecycle endpoints (status / result / cancel) against rows we
insert directly.
"""
import datetime as dt

import pytest

from app.models import Recipe, RecipeIngredient, RecipeJob


@pytest.fixture(autouse=True)
def _stub_job_processors(monkeypatch):
    """Replace the actual background processors with no-ops.

    Prevents real OpenAI calls and dangling tasks from job creation tests.
    Tests that need a "completed" job pre-populate the DB directly.
    """
    from app.services import job_service as js

    async def noop(self, job_id):
        return None

    monkeypatch.setattr(js.RecipeJobService, "_process_generation_job", noop)
    monkeypatch.setattr(js.RecipeJobService, "_process_modification_job", noop)


# ---------------------------------------------------------------------------
# Create job
# ---------------------------------------------------------------------------
class TestCreateGenerationJob:
    def test_returns_job_id_and_status_url(self, client, auth_headers):
        response = client.post(
            "/api/jobs/recipes/generate",
            headers=auth_headers,
            json={"prompt": "garlic shrimp linguine"},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["job_id"]
        assert body["status"] == "pending"
        assert body["status_url"].endswith(f"/api/jobs/recipes/{body['job_id']}/status")
        assert body["polling_interval"] == 3

    def test_persists_job_record(self, client, auth_headers, db_session, user):
        response = client.post(
            "/api/jobs/recipes/generate",
            headers=auth_headers,
            json={"prompt": "lemon chicken bowls"},
        )
        job_id = response.json()["job_id"]
        job = db_session.query(RecipeJob).filter_by(id=job_id).first()
        assert job is not None
        assert job.user_id == user.id
        assert job.job_type == "generate"
        assert job.status == "pending"
        assert job.prompt == "lemon chicken bowls"

    def test_rejects_short_prompt(self, client, auth_headers):
        response = client.post(
            "/api/jobs/recipes/generate",
            headers=auth_headers,
            json={"prompt": "x"},
        )
        assert response.status_code == 422


class TestCreateModificationJob:
    def test_modify_own_recipe(self, client, auth_headers, recipe_factory, user):
        recipe = recipe_factory(owner=user)
        response = client.post(
            "/api/jobs/recipes/modify",
            headers=auth_headers,
            json={
                "recipe_id": str(recipe.id),
                "modification_prompt": "swap chicken for tofu",
            },
        )
        assert response.status_code == 200
        assert response.json()["status"] == "pending"

    def test_modify_rejects_non_owner(self, client, auth_headers, recipe_factory, user_factory):
        other = user_factory()
        recipe = recipe_factory(owner=other)
        response = client.post(
            "/api/jobs/recipes/modify",
            headers=auth_headers,
            json={
                "recipe_id": str(recipe.id),
                "modification_prompt": "double everything",
            },
        )
        assert response.status_code == 404

    def test_modify_invalid_recipe_id_format(self, client, auth_headers):
        response = client.post(
            "/api/jobs/recipes/modify",
            headers=auth_headers,
            json={
                "recipe_id": "not-an-int",
                "modification_prompt": "anything will do",
            },
        )
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# Status / result
# ---------------------------------------------------------------------------
class TestJobStatus:
    def test_status_returns_pending_job(self, client, auth_headers, db_session, user):
        job = RecipeJob(id="job-pending", user_id=user.id, status="pending",
                        job_type="generate", prompt="test", progress=0)
        db_session.add(job)
        db_session.commit()

        response = client.get("/api/jobs/recipes/job-pending/status", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["id"] == "job-pending"
        assert body["status"] == "pending"
        assert body["progress"] == 0

    def test_status_unknown_job(self, client, auth_headers):
        response = client.get("/api/jobs/recipes/does-not-exist/status", headers=auth_headers)
        assert response.status_code == 404

    def test_status_only_own_jobs(self, client, auth_headers, db_session, user_factory):
        other = user_factory()
        job = RecipeJob(id="job-other", user_id=other.id, status="pending",
                        job_type="generate", prompt="x", progress=0)
        db_session.add(job)
        db_session.commit()

        response = client.get("/api/jobs/recipes/job-other/status", headers=auth_headers)
        assert response.status_code == 404


class TestJobResult:
    def _seed_completed_job(self, db_session, user, job_id="job-done"):
        recipe = Recipe(
            title="Done Recipe",
            description="d",
            instructions=["s1", "s2"],
            servings=2,
            difficulty="easy",
            tips=[],
            original_prompt="p",
            created_by_id=user.id,
        )
        db_session.add(recipe)
        db_session.flush()
        db_session.add(RecipeIngredient(
            recipe_id=recipe.id, name="Egg", amount="2", unit="", category="produce",
        ))
        job = RecipeJob(
            id=job_id, user_id=user.id, status="completed",
            job_type="generate", prompt="p", progress=100,
            recipe_id=recipe.id,
            completed_at=dt.datetime.utcnow(),
        )
        db_session.add(job)
        db_session.commit()
        return recipe, job

    def test_result_returns_recipe(self, client, auth_headers, db_session, user):
        recipe, _ = self._seed_completed_job(db_session, user)

        response = client.get("/api/jobs/recipes/job-done/result", headers=auth_headers)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["recipe_id"] == str(recipe.id)
        assert body["recipe"]["title"] == "Done Recipe"
        assert len(body["ingredients"]) == 1

    def test_result_when_not_completed(self, client, auth_headers, db_session, user):
        job = RecipeJob(id="job-running", user_id=user.id, status="processing",
                        job_type="generate", prompt="x", progress=50)
        db_session.add(job)
        db_session.commit()

        response = client.get("/api/jobs/recipes/job-running/result", headers=auth_headers)
        assert response.status_code == 400

    def test_result_unknown(self, client, auth_headers):
        response = client.get("/api/jobs/recipes/nope/result", headers=auth_headers)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Cancel
# ---------------------------------------------------------------------------
class TestCancelJob:
    def test_cancel_pending_job(self, client, auth_headers, db_session, user):
        db_session.add(RecipeJob(id="job-cancel", user_id=user.id, status="pending",
                                 job_type="generate", prompt="x", progress=0))
        db_session.commit()

        response = client.delete("/api/jobs/recipes/job-cancel", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["success"] is True

        db_session.expire_all()
        refreshed = db_session.query(RecipeJob).filter_by(id="job-cancel").first()
        assert refreshed.status == "cancelled"

    def test_cancel_already_completed(self, client, auth_headers, db_session, user):
        db_session.add(RecipeJob(id="job-c", user_id=user.id, status="completed",
                                 job_type="generate", prompt="x", progress=100))
        db_session.commit()
        response = client.delete("/api/jobs/recipes/job-c", headers=auth_headers)
        assert response.status_code == 400

    def test_cancel_unknown(self, client, auth_headers):
        response = client.delete("/api/jobs/recipes/nope", headers=auth_headers)
        assert response.status_code == 404
