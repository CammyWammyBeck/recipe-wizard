"""Live contract tests against the real OpenAI API.

Skipped by default. Run with:

    RUN_LIVE_OPENAI=1 OPENAI_API_KEY=sk-... pytest tests/test_openai_live.py

These tests cost money and make real network calls. Their purpose is to
verify that the OpenAI API still returns JSON that parses into our
schemas — an early-warning signal for model or response-format drift that
unit tests (with mocked responses) can never catch.
"""
import os

import pytest
from openai import OpenAI

from app.schemas import (
    IngredientAPI, RecipeAPI, RecipeGenerationRequest,
    RecipeIdeaGenerationRequest,
)
from app.services.llm_service import llm_service
from app.services.openai_service import openai_service


pytestmark = [
    pytest.mark.live_openai,
    pytest.mark.skipif(
        os.getenv("RUN_LIVE_OPENAI") != "1",
        reason="RUN_LIVE_OPENAI not set — skipping live OpenAI contract tests",
    ),
]


@pytest.fixture(autouse=True)
def _use_real_client():
    """Override the module-load-time fake and point at the real OpenAI API."""
    key = os.getenv("OPENAI_API_KEY")
    if not key or key.startswith("sk-test"):
        pytest.skip("Real OPENAI_API_KEY required for live tests")
    openai_service.client = OpenAI(api_key=key)
    yield


class TestLiveOpenAI:
    async def test_models_list_reachable(self):
        connected = await openai_service.check_openai_connection()
        assert connected, "Could not reach OpenAI /models endpoint"

    async def test_recipe_generation_produces_valid_schema(self, user_factory):
        user = user_factory()
        request = RecipeGenerationRequest(
            prompt="a quick 20-minute chicken stir fry for 2 people",
        )
        result = await openai_service.generate_recipe(request, user)
        data = result["recipe_data"]

        # Contract: these must coerce cleanly into the schemas the mobile app consumes
        RecipeAPI(
            title=data["recipe"]["title"],
            description=data["recipe"].get("description"),
            instructions=data["recipe"]["instructions"],
            prepTime=data["recipe"].get("prepTime"),
            cookTime=data["recipe"].get("cookTime"),
            servings=data["recipe"].get("servings"),
            difficulty=data["recipe"].get("difficulty"),
            tips=data["recipe"].get("tips"),
        )
        for i, ing in enumerate(data["ingredients"]):
            IngredientAPI(
                id=str(i),
                name=ing["name"],
                amount=str(ing["amount"]),
                unit=ing.get("unit"),
                category=ing["category"],
            )

        # Sanity: the categories returned should match the user's grocery_categories
        assert all(ing["category"] in user.grocery_categories for ing in data["ingredients"])

    async def test_recipe_ideas_produce_valid_schema(self):
        result = await openai_service.generate_recipe_ideas(
            prompt="cozy winter soups", count=3,
        )
        assert len(result["ideas"]) >= 1
        for idea in result["ideas"]:
            assert idea["title"]
            assert idea["description"]
            assert "id" in idea
