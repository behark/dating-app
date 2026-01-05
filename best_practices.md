# 📘 Project Best Practices

## 1. Project Purpose

This repository contains a full-stack dating application. It includes:

- A mobile client built with React Native/Expo (under `src/`).
- A Node.js/Express backend (under `backend/`) using MongoDB via Mongoose, plus integrations for authentication, payments, notifications, analytics, and real-time features.
- End-to-end testing (Playwright), monitoring (Prometheus/Grafana), deployment assets (Docker, Nginx, Render, Vercel), and a comprehensive set of scripts and documentation.

## 2. Project Structure

- Root
  - Configuration: `jest.config.js`, `jest.setup.js`, `tsconfig.json`, `.eslintrc.json`, `.prettierrc.json`, `.npmrc`
  - Environment: `.env.example`, additional env examples, deployment check scripts
  - DevOps/Deploy: Dockerfiles, `docker-compose.*.yml`, `nginx/`, `render.yaml`, `vercel.json`, monitoring assets
  - E2E: `e2e/` Playwright config and flows
  - Documentation: numerous guides and reports
- `src/` (Frontend – React Native/Expo)
  - `components/`, `screens/`, `services/`, `hooks/`, `navigation/`, `context/`, `utils/`, `models/`, `config/`
  - `__tests__/` and additional `__tests__` folders inside feature directories
- `backend/` (Backend – Node/Express)
  - `controllers/` (e.g., `authController.js`, others)
  - `models/` (e.g., `User.js` – Mongoose schema and instance methods)
  - `services/`, `config/` (e.g., `database.js`, `firebase.js`, `redis.js`, `payment.js`)
  - `routes/`, `middleware/`, `utils/`, `types/`, `scripts/`, workers
  - `__tests__/` (backend tests and integrations)
- `tests/` (other testing folders: `beta/`, `load/`, `security/`)

Conventions:

- Frontend aliases (see `jest.config.js`): `@/`, `@components/`, `@screens/`, `@services/`, `@utils/`, `@context/`, `@config/`.
- Consistent response shapes in backend controllers: `{ success, message, data? }`.
- Env-driven configuration (EMAIL*\*, JWT*\*, etc.).

## 3. Test Strategy

- Frameworks
  - Unit/Integration: Jest
  - Mobile/React Native tests: `jest-expo` preset
  - E2E: Playwright (`e2e/` with `global-setup.ts` and `global-teardown.ts`)
- Organization
  - Frontend tests: `src/**/__tests__/**/*.test.(js|ts|tsx)` and similar
  - Backend tests: `backend/__tests__/*.test.js`
  - Other: `tests/` for special categories (load/security)
- Configuration Guidelines
  - Mobile tests use `jest-expo` preset (React Native environment).
  - Backend tests should run in a Node-only environment (avoid `jest-expo`), ideally via a separate Jest config (e.g., `backend/jest.config.js`) or a multi-project Jest configuration. This prevents RN/Expo setup from interfering with backend unit tests.
- Mocking Guidelines
  - Mock external dependencies and side effects (DB, network, email, storage, analytics):
    - Backend: Mongoose models (`User`), `nodemailer`, `jsonwebtoken`, payment gateways, Redis, Firebase admin SDK.
    - Frontend: network calls (fetch/axios), Firebase client SDK, storage, native modules.
  - Mock at module boundaries; avoid mocking internal implementation details.
  - Prefer light stubs/fakes for `req`/`res` objects in controller tests.
- Unit vs Integration
  - Unit: Isolate logic; mock I/O and third-party services. Example: controllers with mocked models/services.
  - Integration: Use real modules where feasible; optional in-memory MongoDB for backend, or supertest for API endpoints.
  - E2E: Use Playwright flows to validate user journeys across the deployed/canary environment.
- Coverage Expectations
  - Target at least 80% line/branch coverage for critical modules (auth, payments, discovery). Avoid brittle tests; prefer behavior-driven assertions.

## 4. Code Style

- Linting/Formatting
  - Use ESLint and Prettier configs at the root. Fix lint errors before committing.
- Language Conventions
  - Frontend: Prefer TypeScript for new code; keep types narrow and explicit. Use React hooks idioms, maintain component purity.
  - Backend: Node CommonJS currently (require/module.exports). Prefer `async/await` over raw promises.
- Naming
  - Files: `camelCase` or `kebab-case` consistent with folders (e.g., `authController.js`).
  - Variables/Functions: `camelCase`; Classes/Components: `PascalCase`.
- Documentation
  - Use JSDoc for controllers/services and public functions (as seen in `authController.js`).
  - Document environment variable requirements in code comments where applicable.
- Error Handling
  - Controllers should wrap logic in `try/catch`, log with `console.error` (or a centralized logger), and respond with consistent, non-sensitive messages.
  - Never leak secrets or stack traces in API responses.
  - Validate inputs early and respond with 400/401/403 where appropriate. Keep messages user-safe.

## 5. Common Patterns

- Backend Controllers
  - Validate inputs; query Mongoose models; use instance methods (e.g., `User#matchPassword`, `#generateAuthToken`, `#generateRefreshToken`).
  - Update model fields and `save()`; return `{ success, message, data }`.
  - Depend on `process.env` for secrets and third-party configuration. Check for required envs (e.g., `JWT_SECRET`, `JWT_REFRESH_SECRET`).
- Model Methods and Indexing (Mongoose)
  - Password hashing via pre-save hook; `bcryptjs` for comparing.
  - JWT generation via `jsonwebtoken` with explicit env checks.
  - Geospatial schemas: `location` with 2dsphere indexes; coordinate order is `[longitude, latitude]`.
- Services/Utilities
  - Email via `nodemailer` with a lazily-initialized transporter; soft-disable when credentials are missing.
  - Configured via `backend/config/*` modules; prefer centralizing third-party/service-specific configuration.
- Frontend
  - Aliased imports; React hooks for state/effects; services for data access; utilities kept pure and reusable.
- Testing
  - Use `jest.mock` for external modules; create small fakes for Express res/req in controller tests.
  - For RN/Expo tests, rely on `jest-expo` preset and moduleNameMapper for aliases.

## 6. Do's and Don'ts

- ✅ Do
  - Validate all API inputs; lowercase emails and normalize identifiers.
  - Guard critical flows with env checks (JWT secrets, email credentials, payment keys).
  - Keep controllers thin; push business logic into services where possible.
  - Use model instance methods for security-sensitive operations (password hashing, token creation).
  - Log errors with context but without sensitive data; prefer structured logging when introduced.
  - Maintain consistent API response shapes and status codes.
  - Use geospatial fields correctly; `[lng, lat]` order; ensure `location.type` is `'Point'`.
  - Use aliases/import maps for clarity; keep module boundaries clean.
  - Add tests alongside new features; write unit tests for pure logic and controller branches; add integration tests for routes.
- ❌ Don’t
  - Don’t hardcode secrets, tokens, or credentials.
  - Don’t leak raw error stacks or third-party error messages to clients.
  - Don’t bypass Mongoose hooks by writing unhashed passwords.
  - Don’t mix RN/Expo presets with Node-only backend tests; use separate Jest configs.
  - Don’t introduce circular dependencies or deep cross-layer imports (e.g., frontend importing backend code).

## 7. Tools & Dependencies

- Backend
  - Express, Mongoose, `bcryptjs`, `jsonwebtoken`, `nodemailer`, Redis/Firebase (per config) — web API, auth, persistence, email, caching.
  - Testing: Jest (Node environment for backend tests), Supertest for HTTP integration, optional in-memory MongoDB.
- Frontend
  - React Native/Expo, React Navigation, Firebase client SDK.
  - Testing: Jest with `jest-expo` preset.
- E2E & Ops
  - Playwright for browser-based E2E flows under `e2e/`.
  - Docker, docker-compose, Nginx for reverse proxying; Render/Vercel deploy configs.
  - Monitoring: Prometheus and Grafana dashboards.
- Setup
  - Node LTS recommended.
  - `npm install` at repo root.
  - Copy `.env.example` to `.env` (and backend-specific envs where appropriate). Required: `JWT_SECRET`, `JWT_REFRESH_SECRET`, email credentials for email features, `FRONTEND_URL` for email links.
  - Preferred test commands:
    - Frontend: `npm test` (RN/Expo preset)
    - Backend (recommended): add a dedicated script using a Node-only Jest config (e.g., `jest -c backend/jest.config.js`).

## 8. Other Notes

- Security
  - Enforce JWT secret presence. Consider token rotation and revocation for refresh tokens.
  - Avoid user enumeration in auth flows (already practiced in `forgotPassword`).
- Data Model
  - User `location` is required and indexed; default coordinates are provided when missing (SF). Respect this requirement in new features.
- Reliability
  - Email service gracefully disables when credentials are missing; ensure callers handle `false` returns from email send attempts.
- LLM Guidance
  - Maintain controller response schema, input validation, and env checks.
  - Use existing model methods and patterns instead of inventing new ones.
  - Keep functions cohesive and testable; place side-effects behind small, mockable modules.
