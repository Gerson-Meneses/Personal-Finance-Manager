# Copilot Instructions for Personal Finance Manager

## Project Overview
This is a full-stack personal finance management application with a TypeScript backend (Hono + TypeORM) and a React frontend (Vite). The backend manages user accounts, transactions, loans, and categories with PostgreSQL. The frontend is currently a boilerplate and needs implementation.

## Architecture
- **Backend**: Hono web framework, TypeORM for ORM, PostgreSQL database, Zod for validation, JWT for auth.
- **Frontend**: React 19 + TypeScript + Vite, currently default template.
- **Data Model**: User-centric with entities like Account, Transaction, Category, Loan, RecurrentTransaction. Enums define types (e.g., TypeTransaction: INCOME/EXPENSE).
- **API Structure**: RESTful routes under `/auth` and `/accounts`, with auth middleware protecting endpoints.

Key files:
- `backend/src/index.ts`: App setup, DataSource init, routes, error handling.
- `backend/src/entities/`: TypeORM entities with relations (e.g., User has many Accounts/Transactions).
- `backend/src/services/`: Business logic classes (e.g., AccountService with repo methods).
- `backend/src/controllers/`: Hono handlers calling services, returning JSON responses.
- `backend/src/schemas/`: Zod schemas for input validation with Spanish error messages.

## Key Patterns
- **Service Layer**: Classes with TypeORM repositories for data access (e.g., `AccountService.getAllAccountsByUser()`).
- **Controller Pattern**: Functions taking Hono Context and user ID, calling services, returning `{message, data}` JSON.
- **Validation**: Use Zod schemas in services/controllers; errors handled by global errorHandler (ZodError -> 400 with details).
- **Auth**: JWT middleware sets `user` in context; verify with `c.get('user')`.
- **Entities**: UUID primary keys, timestamps (createdAt/updatedAt), relations with cascade options.
- **Enums**: Centralized in `utils/Enums.ts` for types like TypeAccount (DEBIT/CREDIT/CASH).

## Workflows
- **Dev Setup**: Run `bun install` in backend, `npm install` in frontend. Start backend with `bun run dev` (port 3000), frontend with `npm run dev`.
- **Database**: PostgreSQL on localhost:5432, db 'finance_manager'. Synchronize=true in dev; entities auto-loaded from `src/entities/**/*.entity.ts`.
- **Build**: Backend hot-reload with Bun; frontend `npm run build` for production.
- **Testing**: No tests configured yet; add to package.json scripts when implementing.

## Conventions
- **Language**: Spanish for user-facing messages and comments.
- **Naming**: CamelCase for classes/methods, PascalCase for entities, kebab-case for routes.
- **Error Handling**: Throw DomainError for business logic; global handler formats responses.
- **Imports**: Relative paths with `../` for internal modules.
- **Schemas**: Define Zod objects with custom min/max messages; export inferred types.

## Integration Points
- **Database**: TypeORM queries with relations (e.g., `find({relations: ['user']})`).
- **Auth Flow**: Register/login via `/auth`, token in Authorization header.
- **Frontend-Backend**: API calls to localhost:3000; implement auth headers in React.

Focus on completing the frontend to consume the backend APIs. Use the existing entity relations for data fetching.