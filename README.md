# VueFrameworkFront

Vue 3 + TypeScript frontend scaffold for QuickFramework.

## Commands

```powershell
yarn install
yarn dev
yarn typecheck
yarn lint
yarn lint:style
yarn format:check
yarn test:unit
yarn test:e2e
yarn build
```

Use `yarn format` to apply Prettier formatting before committing.

The repository includes non-sensitive `.env` defaults, so `yarn dev` can start against the local monolith without extra configuration.
Use `.env.local` only for a machine-specific override; it is intentionally ignored by Git.
The current Playwright E2E suite mocks backend API responses in the browser and can run without starting the backend.

Run the live backend E2E when the Ubuntu VM middleware is available:

```powershell
yarn test:e2e:live:monolith-vm
```

This command starts `JavaFrameworkBackend` through `scripts/run-monolith-vm.ps1`, points the Vite proxy to `http://127.0.0.1:8080`, runs `tests/e2e/live-backend.spec.ts`, and stops the backend unless `-KeepBackendRunning` is passed to the underlying PowerShell script.
By default it resets the VM MySQL `quickframework` schema before startup, then lets Flyway recreate seed data. Use `-SkipDatabaseReset` only when intentionally testing against an existing database state.

## Features

- **Auth & routing**: login / refresh token / logout; backend-driven dynamic menus generate routes; `v-permission` directive and `QfPermissionButton` for button-level permission hiding. Front-end hiding is never a security boundary — the backend enforces authorization.
- **IAM**: users, departments, roles, menus, button permissions, authorization assignment.
- **System**: configs, dictionaries, operation log, login log; notice publish/revoke/delete with realtime auto-refresh.
- **Async tasks**: list, detail, retry, cancel, manual-intervention (retry / cancel / ignore / restore).
- **File management**: upload, list, detail, preview-info, download (covered by Playwright E2E).
- **Workflow**: form designer (`src/form-engine`), process designer (`src/modules/workflow`) with multi-mode countersign node UI (sequential / parallel-all / parallel-any), process start, todo, done, approval history, flow diagram.
- **Realtime push (SSE)**: `src/api/realtime.ts` consumes `GET /api/realtime/events` via fetch stream (Authorization header, no query token); `src/stores/notifications.ts` tracks connection / unread count / recent events; the `MainLayout` top-bar notification bell; `NoticeListView` auto-refreshes on notice events. Backend contract: `JavaFrameworkBackend/docs/realtime-push.md`.
- **i18n (bilingual)**: `src/locales/{zh-CN,en-US}`; `t('namespace.key')`; form `rules` and table `columns` wrapped in `computed()` so labels/messages react to locale. See `JavaFrameworkBackend/docs/i18n.md`.
- **Shared component layer** (`src/shared`): `QfPermissionButton`, `QfDataTable`, `QfFormDrawer`, `QfFileUpload` — atomic, cross-module, prop/slot/event-only components. Dev-only `/shared/playground` route for manual verification.
- **Testing**: Vitest unit tests (with axios mocked via `vi.mock`); Playwright E2E both mocked (no backend) and live (`yarn test:e2e:live:monolith-vm`).

See [`AGENTS.md`](AGENTS.md) for the full front-end feature boundary, directory layout and shared-component rules.

## Backend Integration

The frontend keeps `VITE_API_BASE_URL=/api` by default and uses the Vite dev proxy for local integration.

Monolith backend:

```powershell
yarn dev
```

Start the backend with:

```powershell
cd ..\JavaFrameworkBackend
.\scripts\run-monolith-vm.ps1
```

Cloud Gateway backend:

```powershell
yarn dev --mode cloud
```

Start the backend cloud mode with VM Nacos:

```powershell
cd ..\JavaFrameworkBackend
.\scripts\smoke-cloud-vm-nacos.ps1 -KeepRunning
```

Use `VITE_API_PROXY_TARGET` in `.env.local` to override the Vite proxy without changing source code.

## Docker

The frontend Dockerfile builds the Vite app with Node 20 and serves it through Nginx.

## File Management

The file management page is registered through backend dynamic menus with component `file/FileListView`.
It calls `/api/files` through the configured API base URL, supports metadata listing, upload, detail view, preview-info display and download, and is covered by Playwright E2E.
The default Nginx template proxies `/api/` to `http://backend:8080/api/`; adjust the upstream service name in deployment-specific manifests.

## OpenAPI

Start the backend monolith first, then generate typed API artifacts:

```powershell
yarn openapi:generate
```

Default schema URL: `http://127.0.0.1:8080/v3/api-docs/platform`.
Override with `OPENAPI_SCHEMA` or write to another file with `OPENAPI_OUTPUT`.
