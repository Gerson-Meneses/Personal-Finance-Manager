# Frontend — Personal Finance Manager

SPA construida con React 19, TypeScript, Vite y React Router. Los datos se gestionan con TanStack Query y la API del backend (`VITE_API_URL`).

## Comandos

```sh
npm install
npm run dev       # servidor de desarrollo
npm run build     # typecheck + build de producción
npm run preview   # sirve el build
npm run lint      # ESLint
npm run test:e2e  # Playwright (levanta API + frontend)
```

## Estructura

```
src/
  components/        Componentes globales (tutorial)
  features/          Dominios: accounts, transactions, loans, budgets, recurring...
  pages/
    public/          Login, registro, verificación y recuperación
    private/         Vistas autenticadas y layout principal
  shared/
    components/      Inputs, modales, tablas, estados de error...
    Hooks/           Hooks reutilizables
    theme/           Tema claro/oscuro
    utils/           Formato, iconos, fechas
e2e/                 Tests Playwright
```

## Variables de entorno

Crea `fronted/.env`:

```env
VITE_API_URL=http://localhost:3000
# VITE_DISABLE_ONBOARDING=true
```

## Tests E2E

`playwright.config.ts` arranca dos servidores:

1. Backend en `http://127.0.0.1:3100` con `NODE_ENV=test`, aplicando migraciones sobre `TEST_DATABASE_URL`.
2. Frontend Vite en `http://127.0.0.1:5174`.

```sh
npx playwright install chromium
npm run test:e2e
```

Los tests cubren health checks, registro/login, navegación principal, menú móvil, skip link, modales accesibles y exportaciones.

### Variables reconocidas por Playwright

| Variable | Uso |
| --- | --- |
| `TEST_DATABASE_URL` | Base aislada para E2E (por defecto `finance_manager_test`). |
| `JWT_SECRET` | Secreto de prueba si no está definido. |
| `E2E_API_URL` | URL de la API usada por `request`. |

## Rendimiento y accesibilidad

- Las rutas se cargan con `React.lazy` para dividir el bundle.
- `vite.config.ts` separa vendors en chunks (`vendor-react`, `vendor-forms`, `vendor-charts`, `vendor-icons`...) para mejorar el cacheado.
- `shared/utils/iconRegistry.ts` contiene el catálogo curado de Lucide; añade ahí cualquier icono nuevo que vaya a guardarse en base de datos o mostrarse con `getIcon`.
- Inputs y selects exponen `aria-invalid`/`aria-describedby`; los modales usan `role="dialog"` con `aria-labelledby` automático.
- Los estados de error de datos usan `QueryErrorState` con acción de reintento.
