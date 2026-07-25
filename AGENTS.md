# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start all services (dev mode with hot-reload)
docker compose up -d --build

# View logs
docker compose logs -f backend       # Django API
docker compose logs -f frontend      # Vite HMR (port 8888)
docker compose logs -f celery-worker
docker compose logs -f celery-beat

# Django management (run inside container)
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py check
docker compose exec backend python manage.py init_admin
docker compose exec backend python manage.py showmigrations
docker compose exec backend python manage.py sqlmigrate <app_name> <migration_id>

# Interactive shell
docker compose exec backend python manage.py shell_plus
docker compose exec backend bash
docker compose exec frontend sh

# Restart single service
docker compose restart backend

# Stop all
docker compose down

# Production update
./update.sh    # backup DB -> git pull -> rebuild -> cleanup

# MySQL backup
docker compose exec mysql mysqldump -u root -p iqair_workbench > backup.sql

# MySQL direct CLI (ALWAYS add charset flag to avoid garbled Chinese)
docker compose exec mysql mysql -u iqair -p --default-character-set=utf8mb4 iqair_workbench
```

## Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + Vite + TypeScript + Pinia + Element Plus + ECharts |
| Backend | Django 5 + DRF + Celery + Channels + SimpleUI |
| Database | MySQL 8.0 |
| Cache/Queue | Redis 7 |
| Deployment | Docker Compose + Gunicorn (WSGI) |

### Backend Structure (`backend/`)

- **`config/`** — Django settings, root URL conf, Celery app, ASGI/WSGI
- **`apps/accounts/`** — User model (AbstractUser + `role`: admin/user), JWT login/register/SSO, IP tracking, custom permissions (IsAdmin, IsAdminOrReadOnly, IsOwnerOrAdmin)
- **`apps/projects/`** — Project model (navigation card items), CRUD with AuditLogMixin
- **`apps/dashboard/`** — Core data domain: Brand, FilterRevenue, UIText, PlatformSalesData. All dashboard data flows through `DashboardService` (in `services/`)
- **`apps/snapshots/`** — DataSnapshot model with hybrid storage: JSON in MySQL (<=1MB) or filesystem (>1MB). `SnapshotService` handles create/restore/cleanup
- **`apps/audit/`** — OperationLog model, `AuditLogService`, `AuditLogMixin` (auto-log create/update/destroy on any ViewSet). 90-day retention with compaction after 7 days
- **`apps/navigation/`** — WebsiteLink (categorized bookmarks) + UserFavorite
- **`services/`** — Business logic layer separate from views:
  - `dashboard_service.py` — get/save aggregated dashboard data (brands + revenues + UI texts), auto-creates snapshots on save
  - `platform_data_service.py` — Excel parsing (openpyxl), upsert PlatformSalesData, yoy comparison queries
- **`tasks/`** — Celery shared tasks: `cleanup_old_snapshots` (daily 2am), `cleanup_old_logs` (daily 3am)

### Frontend Structure (`frontend/src/`)

- **`api/`** — Axios-based API clients with unified interceptor (auto JWT refresh on 401, error toast)
- **`router/`** — Vue Router with auth guards: `requiresAuth`, `requiresAdmin`
- **`stores/`** — Pinia store (user: token, refreshToken, userInfo, login/logout)
- **`styles/`** — Apple-inspired design token system (colors, radii, shadows, spacing, fonts, glass effects)
- **`views/dashboard/`** — Multiple dashboard panels sharing the same data flow pattern

### API Routes

All under `config/urls.py`:

- `api/auth/` — login, register, me, change-password, admin-sso, users CRUD
- `api/projects/` — project CRUD
- `api/dashboard/{project_pk}/` — data get/save, brands CRUD, ui-texts
- `api/dashboard/platform/` — Excel upload, query (with yoy), date-range, template download
- `api/snapshots/{project_pk}/snapshots/` — list, manual create, restore
- `api/audit/` — operation logs (read-only)
- `api/navigation/` — website links + favorites

### Key Design Decisions

- **No password validators** — all Django built-in validators removed intentionally
- **Snapshot-on-save** — saving dashboard data automatically snapshots the previous state (enables undo/restore)
- **Hybrid snapshot storage** — threshold at 1MB, large snapshots stored outside MySQL
- **Audit trail** — `AuditLogMixin` auto-records all CRUD actions; logs compacted after 7 days (one record per day)
- **Permissions** — admin can do everything, regular users see only own data (snapshots, logs)
- **Frontend design** — Apple-inspired: glassmorphism panels, SF Pro fonts, muted color palette, CSS custom property tokens
