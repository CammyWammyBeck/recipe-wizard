# Repository Guidelines

## Project Structure & Module Organization
- `mobile/` — Expo React Native app (TypeScript). Key folders: `app/` (routes), `components/`, `services/`, `types/`, `assets/`.
- `backend/` — FastAPI service (Python). Key folders: `app/` (routers, models, schemas, services), `alembic/` (migrations). Entry: `app/main.py`.
- `design/` — UI mockups and assets.
- Root docs: `README.md`, this `AGENTS.md`.

## Build, Test, and Development Commands
Mobile (from `mobile/`):
- `npm install` — install dependencies.
- `npm start` — start Expo dev server.
- `npm run android|ios|web` — launch platform targets.
- Useful: `npx expo start --clear-cache`, `npx tsc --noEmit` (type check).

Backend (from `backend/`):
- `python -m venv venv && source venv/bin/activate` — create/activate venv.
- `pip install -r requirements.txt` — install dependencies.
- `uvicorn app.main:app --reload --port 8000` — run API locally.
- DB migrations: `alembic upgrade head`, `alembic revision --autogenerate -m "msg"`.

## Coding Style & Naming Conventions
- TypeScript: 2-space indent, single quotes, `strict` mode on (see `mobile/tsconfig.json`). Components `PascalCase`, files `PascalCase.tsx` or `camelCase.ts`.
- Python: follow PEP 8 with 4-space indent and type hints where practical. Modules `snake_case.py`, classes `PascalCase`.
- APIs: keep route names RESTful under `/api/*`; align request/response types with `mobile/types/*` and `backend/app/schemas/*`.

## Testing Guidelines
- Backend: prefer `pytest`; unit-test services and routers. Example: `pytest -q` (when tests are added).
- Mobile: prefer React Native Testing Library and Jest for components. Example test names: `ComponentName.test.tsx`.
- Aim for >70% coverage on new/changed code; add tests near the code under test (e.g., `backend/app/.../tests/`).

## Commit & Pull Request Guidelines
- Commits use Conventional Commits: `feat: ...`, `fix: ...`, optional scope (e.g., `feat(mobile): ...`).
- PRs: include a clear description, linked issues, and screenshots for UI changes; list steps to validate (commands, env vars). Keep diffs focused and pass type checks/linting.

## Security & Configuration Tips
- Never commit secrets. Use `backend/.env` (copy from `.env.example`) and `mobile/.env` for local overrides. Example: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000`.
- CORS and service URLs are defined in `backend/app/main.py` and mobile `services/api.ts` — update both when changing environments.

