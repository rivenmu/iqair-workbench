# Repository Guidelines

## Project Structure & Module Organization

This is an IQAir data workbench with a Vue 3 frontend and Django 5 API. `frontend/src/` contains views, layouts, components, Pinia stores, API clients, routes, and SCSS tokens; static assets live in `frontend/public/`. Keep feature UI close to its view (for example, dashboard panels in `frontend/src/views/dashboard/`).

`backend/config/` holds Django, ASGI, Celery, and URL configuration. Domain code is organized by Django app in `backend/apps/` (`accounts`, `projects`, `dashboard`, `navigation`, `snapshots`, and `audit`), with models, serializers, views, URLs, and migrations together. Shared logic belongs in `backend/services/`; background work belongs in `backend/tasks/`. Docker, Nginx, and production deployment files are at the root. Runtime data under `data/` and uploads under `uploadfiles/` are untracked.

## Build, Test, and Development Commands

Run the complete local stack with:

```bash
docker compose up -d --build       # build and start all services
docker compose logs -f backend     # follow a service log
docker compose exec backend python manage.py migrate
```

For frontend-only work, run `npm install`, `npm run dev`, or `npm run build` from `frontend/`; the build performs Vue type checking before generating `dist/`. Validate backend configuration with `docker compose exec backend python manage.py check`. Run Django tests with `docker compose exec backend python manage.py test` when tests are added.

## Coding Style & Naming Conventions

Follow the existing style: four-space indentation for Python and two-space indentation for TypeScript, Vue, and SCSS. Use `PascalCase.vue` for components/views (`UserManagement.vue`), camelCase for TypeScript functions and variables, and `snake_case` for Python modules and functions. Keep API client modules in `frontend/src/api/`; use Django serializers and permission classes rather than embedding validation or authorization logic in views. No formatter or linter is configured—avoid unrelated formatting churn and always run the frontend build after TypeScript/Vue changes.

## Testing Guidelines

Add backend tests within the owning Django app (for example, `backend/apps/accounts/tests/`) and name test methods `test_<behavior>`. Cover permissions, authentication, API responses, and model changes. For UI changes, at minimum run `npm run build` and manually verify the relevant screen against the API.

## Commit & Pull Request Guidelines

History uses short imperative summaries such as `Add production deployment config: ...`; use that style and keep each commit focused. Pull requests should explain the user-visible change, list validation performed, link the related issue when available, and include screenshots for UI changes. Highlight migrations, environment-variable changes, and deployment/configuration impacts explicitly. Never commit `.env`, credentials, generated runtime data, or uploads.
