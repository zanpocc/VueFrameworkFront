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

Copy `.env.example` to a local `.env.local` only when the API base URL needs to differ from `/api`.
The current Playwright E2E suite mocks backend API responses in the browser and can run without starting the backend.

Run the live backend E2E when the Ubuntu VM middleware is available:

```powershell
yarn test:e2e:live:monolith-vm
```

This command starts `JavaFrameworkBackend` through `scripts/run-monolith-vm.ps1`, points the Vite proxy to `http://127.0.0.1:8080`, runs `tests/e2e/live-backend.spec.ts`, and stops the backend unless `-KeepBackendRunning` is passed to the underlying PowerShell script.
By default it resets the VM MySQL `quickframework` schema before startup, then lets Flyway recreate seed data. Use `-SkipDatabaseReset` only when intentionally testing against an existing database state.

## Backend Integration

The frontend keeps `VITE_API_BASE_URL=/api` by default and uses the Vite dev proxy for local integration.

Monolith backend:

```powershell
Copy-Item .env.monolith.example .env.local
yarn dev
```

Start the backend with:

```powershell
cd ..\JavaFrameworkBackend
.\scripts\run-monolith-vm.ps1
```

Cloud Gateway backend:

```powershell
Copy-Item .env.cloud.example .env.local
yarn dev
```

Start the backend cloud mode with VM Nacos:

```powershell
cd ..\JavaFrameworkBackend
.\scripts\smoke-cloud-vm-nacos.ps1 -KeepRunning
```

Use `VITE_API_PROXY_TARGET` in `.env.local` to switch the Vite proxy between `http://127.0.0.1:8080` and `http://127.0.0.1:9000` without changing source code.

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
