# Personal Finance Manager

Aplicación web para registrar movimientos, controlar cuentas, presupuestos, deudas y pagos futuros.

- **Backend**: Bun + Hono + TypeORM + PostgreSQL.
- **Frontend**: React 19 + TypeScript + Vite + React Router + TanStack Query.
- **Tests**: `bun test` (backend, unitarios e integración) y Playwright (E2E).

## Estructura

```
backend/   API Hono, entidades, migraciones, servicios y tests
fronted/   SPA React, componentes compartidos, features y E2E
```

> El directorio del frontend se llama `fronted` por compatibilidad histórica.

## Requisitos

- [Bun](https://bun.sh/) 1.3+
- Node.js 20+ (para Vite/Playwright)
- PostgreSQL 14+

## Puesta en marcha

### 1. Backend

```sh
cd backend
bun install
cp .env.example .env   # completa DATABASE_URL o DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
bun run db:migrate
bun run dev            # http://localhost:3000
```

Variables principales (ver `backend/.env.example`):

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | URL completa de PostgreSQL (prioridad sobre `DB_*`). |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL` | Conexión por parámetros. |
| `JWT_SECRET` | Firma de tokens (obligatorio). |
| `CORS_ORIGINS` | Orígenes permitidos separados por coma. |
| `TEST_DATABASE_URL` | Base aislada para tests de integración y E2E. |
| `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, `EMAIL_USER` | Gmail API para correos. |
| `DISABLE_EMAILS` | `true` evita enviar correos reales (tests). |

Health checks: `GET /health/live` y `GET /health/ready` (este último comprueba la base de datos).

### 2. Frontend

```sh
cd fronted
npm install
npm run dev            # http://localhost:5173
```

Variables disponibles en `fronted/.env`:

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | URL base de la API (por defecto `http://localhost:3000`). |
| `VITE_DISABLE_ONBOARDING` | `true` desactiva el tutorial (usado por E2E). |

## Tests

### Backend

```sh
cd backend
bun test tests/finance.test.ts
NODE_ENV=test bun test tests/loanIntegration.test.ts   # requiere TEST_DATABASE_URL migrada
```

### E2E

```sh
cd fronted
npx playwright install chromium
npm run test:e2e
```

Playwright levanta la API en `http://127.0.0.1:3100` (con migraciones sobre `TEST_DATABASE_URL`) y el frontend en `http://127.0.0.1:5174`, de forma automática.

## Scripts útiles

| Backend | Frontend |
| --- | --- |
| `bun run dev` | `npm run dev` |
| `bun run build` | `npm run build` |
| `bun run db:migrate` / `db:revert` / `db:show` | `npm run lint` |
| `bun run test` / `test:integration` | `npm run test:e2e` |

## Notas de despliegue

- El backend aplica migraciones al arrancar en producción (`bun run start`).
- Define `DB_SSL=true` (o usa una URL remota) para bases gestionadas.
- No subas `.env` al repositorio; usa los secretos del proveedor.
- Ejecuta `GET /health/ready` en el healthcheck del proveedor.
