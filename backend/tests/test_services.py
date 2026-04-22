"""Direct unit tests for the service layer.

Bypasses the HTTP layer to exercise the LLM and OpenAI service helpers
that the routers rely on.
"""
import json
from types import SimpleNamespace

import pytest

from app.schemas import RecipeGenerationRequest, RecipeIdeaGenerationRequest
from app.services.llm_service import llm_service, check_llm_service_status
from app.services.openai_service import openai_service

from tests.conftest import (
    SAMPLE_IDEAS_JSON, SAMPLE_RECIPE_JSON, FakeOpenAIClient, make_chat_completion,
)


# ---------------------------------------------------------------------------
# OpenAIService — prompt construction & validation
# ---------------------------------------------------------------------------
class TestSystemPromptConstruction:
    def test_recipe_system_prompt_includes_categories(self):
        prompt = openai_service.create_recipe_system_prompt(
            user_categories=["produce", "dairy", "pantry"]
        )
        assert "produce, dairy, pantry" in prompt
        assert "JSON" in prompt

    def test_recipe_system_prompt_requires_categories(self):
        with pytest.raises(ValueError, match="grocery categories"):
            openai_service.create_recipe_system_prompt(user_categories=None)

        with pytest.raises(ValueError, match="grocery categories"):
            openai_service.create_recipe_system_prompt(user_categories=[])

    def test_modification_system_prompt_requires_categories(self):
        with pytest.raises(ValueError, match="grocery categories"):
            openai_service.create_recipe_modification_system_prompt(user_categories=None)

    def test_ideas_system_prompt_does_not_require_categories(self):
        prompt = openai_service.create_recipe_ideas_system_prompt()
        assert "JSON" in prompt
        assert "ideas" in prompt.lower()


class TestPreferenceContextFromRequest:
    def test_compiles_all_preference_fields(self):
        ctx = openai_service._generate_preference_context_from_request({
            "units": "imperial",
            "defaultServings": 2,
            "preferredDifficulty": "easy",
            "maxCookTime": 30,
            "maxPrepTime": 15,
            "dietaryRestrictions": ["vegan"],
            "allergens": ["soy"],
            "dislikes": ["mushrooms"],
            "additionalPreferences": "low sodium please",
        })
        assert "imperial" in ctx
        assert "vegan" in ctx
        assert "soy" in ctx.lower()
        assert "mushrooms" in ctx
        assert "low sodium please" in ctx
        # Additional preferences should be flagged as overriding
        assert "ADDITIONAL PREFERENCES" in ctx
        assert ctx.startswith("\n\nUser Preferences:")

    def test_empty_preferences_returns_empty_string(self):
        assert openai_service._generate_preference_context_from_request({}) == ""


class TestRecipeValidation:
    def test_valid_recipe_passes(self):
        ok, err = openai_service._validate_recipe_data(SAMPLE_RECIPE_JSON)
        assert ok and err == ""

    def test_missing_top_level_keys_fails(self):
        ok, err = openai_service._validate_recipe_data({"recipe": {}})
        assert not ok and err == "format"

    def test_missing_recipe_title_fails(self):
        ok, err = openai_service._validate_recipe_data({
            "recipe": {"instructions": ["x"]},
            "ingredients": [{"name": "x", "amount": "1", "category": "y"}],
        })
        assert not ok and err == "format"

    def test_empty_ingredients_fails(self):
        ok, err = openai_service._validate_recipe_data({
            "recipe": {"title": "x", "instructions": ["y"]},
            "ingredients": [],
        })
        assert not ok and err == "format"

    def test_ingredient_missing_field_fails(self):
        ok, err = openai_service._validate_recipe_data({
            "recipe": {"title": "x", "instructions": ["y"]},
            "ingredients": [{"name": "x"}],  # missing amount + category
        })
        assert not ok and err == "format"


class TestJsonFix:
    def test_strips_markdown_fences(self):
        raw = "```json\n{\"a\":1}\n```"
        assert openai_service._simple_json_fix(raw) == '{"a":1}'

    def test_extracts_json_from_surrounding_text(self):
        raw = "Here you go:\n{\"recipe\": 1}\nEnjoy!"
        assert openai_service._simple_json_fix(raw) == '{"recipe": 1}'

    def test_passthrough_when_already_clean(self):
        raw = '{"a": 1}'
        assert openai_service._simple_json_fix(raw) == raw


class TestIdeasValidation:
    def test_valid_ideas_pass(self):
        ok, err = openai_service._validate_ideas_data(
            {"ideas": [{"title": "T1", "description": "D1"},
                       {"title": "T2", "description": "D2"}]},
            expected_count=2,
        )
        assert ok

    def test_count_far_off_fails(self):
        ok, err = openai_service._validate_ideas_data(
            {"ideas": [{"title": "T", "description": "D"}]},
            expected_count=10,
        )
        assert not ok and err == "count"

    def test_missing_field_fails(self):
        ok, err = openai_service._validate_ideas_data(
            {"ideas": [{"title": "T"}]},
            expected_count=1,
        )
        assert not ok and err == "format"


# ---------------------------------------------------------------------------
# OpenAIService.generate_recipe — end-to-end with mocked client
# ---------------------------------------------------------------------------
class TestGenerateRecipe:
    async def test_happy_path_returns_parsed_recipe(self, monkeypatch, user_factory):
        fake = FakeOpenAIClient()
        monkeypatch.setattr(openai_service, "client", fake)

        user = user_factory()
        request = RecipeGenerationRequest(prompt="creamy pasta")
        result = await openai_service.generate_recipe(request, user)

        assert result["recipe_data"]["recipe"]["title"] == "Creamy Chicken Pasta"
        assert result["model"] == openai_service.default_model
        assert result["retry_count"] == 0

    async def test_retries_then_succeeds(self, monkeypatch, user_factory):
        """First attempt returns invalid JSON; second returns a valid recipe."""
        attempts = {"n": 0}

        def create(**kwargs):
            attempts["n"] += 1
            if attempts["n"] == 1:
                return make_chat_completion("not valid json")
            return make_chat_completion(json.dumps(SAMPLE_RECIPE_JSON))

        fake = FakeOpenAIClient()
        fake.chat.completions.create = create
        monkeypatch.setattr(openai_service, "client", fake)

        user = user_factory()
        request = RecipeGenerationRequest(prompt="any prompt")
        result = await openai_service.generate_recipe(request, user)

        assert attempts["n"] == 2
        assert result["recipe_data"]["recipe"]["title"] == "Creamy Chicken Pasta"
        assert result["retry_count"] == 1

    async def test_all_attempts_invalid_returns_padded_final_attempt(
        self, monkeypatch, user_factory,
    ):
        """If all 3 attempts produce invalid recipes, the service still
        returns the last one with defaults filled in (so the client gets
        *something* rather than a hard 500 from the LLM service itself —
        the router decides what status to return)."""
        bad = {"recipe": {"title": "Just Title"}, "ingredients": [{"name": "x"}]}
        fake = FakeOpenAIClient()
        fake.chat.completions.create = lambda **kw: make_chat_completion(json.dumps(bad))
        monkeypatch.setattr(openai_service, "client", fake)

        result = await openai_service.generate_recipe(
            RecipeGenerationRequest(prompt="anything"), user_factory(),
        )
        # Defaults filled in
        recipe = result["recipe_data"]["recipe"]
        assert recipe["title"] == "Just Title"
        assert recipe.get("instructions") == ["Follow recipe steps"]
        assert recipe.get("difficulty") == "medium"

    async def test_persistent_json_decode_failure_raises(self, monkeypatch, user_factory):
        fake = FakeOpenAIClient()
        fake.chat.completions.create = lambda **kw: make_chat_completion("totally not json")
        monkeypatch.setattr(openai_service, "client", fake)

        with pytest.raises(RuntimeError):
            await openai_service.generate_recipe(
                RecipeGenerationRequest(prompt="any prompt"), user_factory(),
            )


class TestGenerateIdeas:
    async def test_happy_path_assigns_uuids(self, monkeypatch):
        fake = FakeOpenAIClient()
        monkeypatch.setattr(openai_service, "client", fake)

        result = await openai_service.generate_recipe_ideas(
            "spring salads", count=3, user_preferences=None,
        )
        assert len(result["ideas"]) == 3
        assert all("id" in idea for idea in result["ideas"])
        # IDs should be unique
        assert len({idea["id"] for idea in result["ideas"]}) == 3


# ---------------------------------------------------------------------------
# LLMService — wraps openai_service with a connection pre-check
# ---------------------------------------------------------------------------
class TestLLMService:
    async def test_convert_to_api_response_shapes_payload(self):
        result = llm_service.convert_to_api_response(
            recipe_data=SAMPLE_RECIPE_JSON,
            original_prompt="creamy pasta",
            generation_metadata={"model": "gpt-4o-mini", "generation_time_ms": 100,
                                 "token_count": 200, "prompt_tokens": 100,
                                 "retry_count": 0},
        )
        assert result["recipe"]["title"] == "Creamy Chicken Pasta"
        assert len(result["ingredients"]) == 5
        assert result["userPrompt"] == "creamy pasta"
        # Each ingredient gets a stable position-based id
        assert result["ingredients"][0]["id"] == "0"

    async def test_convert_to_api_response_includes_retry_metadata(self):
        result = llm_service.convert_to_api_response(
            recipe_data=SAMPLE_RECIPE_JSON,
            original_prompt="x",
            generation_metadata={"model": "m", "generation_time_ms": 1,
                                 "token_count": 1, "prompt_tokens": 1,
                                 "retry_count": 2,
                                 "retry_message": "Adjusting the recipe format..."},
        )
        assert result["retryCount"] == 2
        assert result["retryMessage"] == "Adjusting the recipe format..."

    async def test_generate_recipe_with_fallback_propagates_503(self, monkeypatch, user_factory):
        async def fail(self):
            return False
        monkeypatch.setattr(
            llm_service.__class__, "check_llm_connection", fail,
        )
        with pytest.raises(ConnectionError):
            await llm_service.generate_recipe_with_fallback(
                RecipeGenerationRequest(prompt="anything"), user_factory(),
            )

    async def test_check_llm_service_status_connected(self, monkeypatch):
        fake = FakeOpenAIClient()
        monkeypatch.setattr(openai_service, "client", fake)
        status = await check_llm_service_status()
        assert status["status"] == "connected"
        assert status["service"] == "openai"
        assert "default_model" in status

    async def test_check_llm_service_status_disconnected(self, monkeypatch):
        async def fail(self):
            return False
        monkeypatch.setattr(
            llm_service.__class__, "check_llm_connection", fail,
        )
        status = await check_llm_service_status()
        assert status["status"] == "disconnected"
