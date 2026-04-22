# Recipe Wizard — Backend

FastAPI service that generates recipes via OpenAI and serves the mobile app. Deployed to Heroku; see `DEPLOYMENT.md`.

## Running locally

```bash
python -m venv venv
source venv/bin/activate            # or venv/Scripts/activate on Windows
pip install -r requirements.txt

# Env vars required: SECRET_KEY, OPENAI_API_KEY, DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

## Tests

The pytest suite lives under `tests/` and uses an in-memory SQLite database, a stubbed OpenAI client, and overridden FastAPI dependencies — no external services are contacted.

```bash
# Install dev deps (pytest + bcrypt pin)
pip install -r requirements-dev.txt

# Run the full suite
pytest

# Run a single file or test
pytest tests/test_recipes.py
pytest tests/test_auth.py::TestLogin::test_login_success

# Verbose + show log capture
pytest -vv --log-cli-level=INFO
```

### What's covered

| File | Surface |
|---|---|
| `tests/test_smoke.py` | Client / fixtures / auth header smoke checks |
| `tests/test_auth.py` | `/api/auth` — register, login, me, refresh, logout, verify, change-password |
| `tests/test_users.py` | `/api/users` — profile, preferences, account deletion (with cascade verification of all user-linked tables) |
| `tests/test_recipes.py` | `/api/recipes` — generate, modify, ideas, history, save/unsave (with stubbed LLM) |
| `tests/test_shopping_list.py` | `/api/shopping-list` router + `ShoppingListService` consolidation unit tests |
| `tests/test_jobs.py` | `/api/jobs` — async generation / modification lifecycle |
| `tests/test_services.py` | `openai_service` + `llm_service` internals — prompt building, JSON fix, validation, retry behaviour |
| `tests/test_health.py` | `/health*`, `/api/status`, security headers |
| `tests/test_auth_utils.py` | Password hashing + JWT encode/verify edge cases |
| `tests/test_openai_live.py` | **Opt-in contract tests** against the real OpenAI API — see below |

### Live OpenAI contract tests

These make real API calls (they cost money) and verify the model still returns JSON we can parse into our schemas. They are skipped unless explicitly opted in:

```bash
RUN_LIVE_OPENAI=1 OPENAI_API_KEY=sk-... pytest tests/test_openai_live.py
```

Run this before cutting a store build or after bumping `DEFAULT_MODEL` in production.
