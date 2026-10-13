# Auth App

Sign up / sign in module: a **NestJS + MongoDB** API and a **Vue 3 + TypeScript** client.

- Sign up with email, name (min 3 chars) and password (min 8 chars, at least one letter, one number and one special character). The same rules are enforced on both the client and the server.
- Sign in with email and password. You get a short-lived access token and an httpOnly refresh cookie that keeps you signed in across reloads.
- `GET /api/users/me` is the protected endpoint.
- The application page greets the signed-in user with "Welcome to the application."

## Quick start

### Everything in Docker

```bash
cp .env.example .env      # set JWT_SECRET (see the command in the file)
docker compose up --build
```

The app runs at **http://localhost:8080**, and the API docs (Swagger) at **http://localhost:8080/api/docs**. Set `WEB_PORT` in `.env` to use another port. nginx serves the client and proxies `/api` to the API, so the browser sees a single origin.

### Local development

Requirements: Node 22.11+, Docker (or any MongoDB 6+).

```bash
docker compose up -d mongo                    # database only

cd backend
cp .env.example .env                          # set JWT_SECRET
npm install
npm run start:dev                             # http://localhost:3000/api  (docs: /api/docs)

cd frontend
npm install
npm run dev                                   # http://localhost:5173  (proxies /api to :3000)
```

## Scripts

| | Backend (`backend/`) | Frontend (`frontend/`) |
| --- | --- | --- |
| Dev server | `npm run start:dev` | `npm run dev` |
| Unit tests | `npm test` | `npm test` (unit + component) |
| End-to-end tests (real MongoDB) | `npm run test:e2e` | — |
| Lint / format | — | `npm run lint:check` · `npm run format:check` |
| Type check | `npm run typecheck` | `npm run type-check` |
| Production build | `npm run build && npm run start:prod` | `npm run build` (static files in `dist/`) |

The e2e tests use `MONGODB_URI_TEST` (default `mongodb://localhost:27017/auth-app-test`) and drop that database when they finish.
CI (`.github/workflows/ci.yml`) runs everything above, then builds both Docker images.

## Dependencies

Both apps target **Node 22.11** and use the newest release of every package that runs on it. `npm audit` reports 0 vulnerabilities in both, and every installed package's `engines` accepts 22.11.

| Held back | At | Why | Unblocked by Node |
| --- | --- | --- | --- |
| NestJS (`common`, `core`, `platform-express`, `testing`, `cli`) | 11 | `@nestjs/throttler` 6.7 and `@nestjs/swagger` 12 require Node 22.12. The last throttler that runs on 22.11 (6.5) supports Nest ≤ 11. | 22.12 |
| `@nestjs/jwt`, `@nestjs/mongoose` | 11 | v12 is ESM-only. `require()` of ESM is only enabled by default from Node 22.12. | 22.12 |
| `vite`, `@vitejs/plugin-vue` | 6.4, 5.2 | Vite 7/8 and plugin-vue 6 require Node 22.12. | 22.12 |
| `vue-router` | 4.6 | v5 requires Vite ≥ 7.3. | 22.12 |
| `vitest` | 4.1 | v5 requires Node 22.12. 4.1.11 is the release with the security fixes. | 22.12 |
| `jsdom` | 26 | v27's CSS parser is ESM-only, so it can't be `require()`d on 22.11. | 22.12 |
| `eslint` | 9 | v10 requires Node 22.13. | 22.13 |
| `typescript-eslint` + frontend `typescript` | 8.55 + 5.9 | TypeScript 6 support arrived in 8.58, but from 8.56 on it depends on `eslint-visitor-keys` 5, which requires Node 22.13. The backend doesn't lint with it, so it uses TypeScript 6. | 22.13 |
| `typescript` (both) | ≤ 6.0 | TypeScript 7 (the Go-based compiler) isn't supported yet by ts-jest, typescript-eslint or `@nestjs/swagger`. | — |

`overrides` in `package.json` fix advisories that have no fixed release in the declared range:
- **`@nestjs/swagger` → `js-yaml` 5.4.3.** Swagger pins 5.3.0 (GHSA-r3ph-w7gj-g6xm); 5.4.3 is the patched 5.x.
- **`@istanbuljs/load-nyc-config` → `js-yaml` 4.3.2.** This is Jest's coverage loader. Its js-yaml 3 pulls in `sprintf-js` (GHSA-hp3w-g68c-fv3c, no fixed version). The loader only calls `load()`, which js-yaml 4 provides with the same signature.
- **`js-beautify` → `nopt` 9.** This is used by `@vue/test-utils`. nopt 10 changes nothing but its minimum Node (22.22). js-beautify uses nopt only in its CLI, never in the API that test-utils calls.

The frontend lints with `typescript-eslint` directly, not through `@vue/eslint-config-typescript`. That wrapper depends on `fast-glob` → `micromatch` → `braces`, and `braces` has an advisory with no fixed release.

The backend e2e tests run Jest with `--experimental-vm-modules`. MongoDB driver 7 loads `os` through a dynamic `import()`, which Jest only allows with that flag. Without it, the driver's handshake is incomplete, and Mongoose retries the connection forever.

## API

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | public | `{ email, name, password }` → `{ accessToken, user }` + refresh cookie (201). 409 if the email exists. |
| `POST` | `/api/auth/login` | public | `{ email, password }` → `{ accessToken, user }` + refresh cookie (200). 401 on bad credentials, 429 when rate-limited. |
| `POST` | `/api/auth/refresh` | refresh cookie | → `{ accessToken }`, rotates the cookie. 401 when the session is over. |
| `POST` | `/api/auth/logout` | refresh cookie | Revokes the session and clears the cookie (204). |
| `GET` | `/api/users/me` | Bearer | The signed-in user: `{ id, email, name }`. |

Every error answers with the same shape: `{ statusCode, name, messages: string[] }`. A 429 also carries a `Retry-After` header (in seconds).
Interactive documentation is served by Swagger at `/api/docs`: http://localhost:8080/api/docs with Docker, http://localhost:3000/api/docs when running the API locally. It is off in production unless `SWAGGER_ENABLED=true`.

## How sessions work

- **Access token:** a JWT that lives 15 minutes, held **in memory** only and sent as `Authorization: Bearer`. It is never stored where scripts could read it later.
- **Refresh token:** a random string in an **httpOnly, SameSite=Strict** cookie, scoped to `/api/auth`.
  - Scripts can't read it, so an XSS can't steal it, and other sites can't send it, so there's no CSRF.
  - The `sessions` collection stores only its SHA-256 hash. The session expires 7 days after its last use (a TTL index cleans it up).
- **Rotation:** every refresh replaces the refresh token.
  - Tabs that refresh at the same moment share a 30-second grace period, so none of them gets signed out.
  - A replaced token presented after that grace period means it was copied, so the whole session is revoked.
- **Client:**
  - On load, the client calls `refresh` to restore the session.
  - On a 401 it refreshes once and retries the request; several requests failing together share a single refresh.
  - Signing in or out in one tab is mirrored in the others (BroadcastChannel).

## Login rate limiting

There are two independent layers:

| Layer | Limit | Where it is stored | Protects against |
| --- | --- | --- | --- |
| Per IP | 10 login and 5 sign-up requests per minute | memory (`@nestjs/throttler`) | one client hammering the API |
| Per account | 5 failed sign-ins in 15 min pause that email for 15 min | MongoDB `login_attempts` (TTL) | distributed guessing of one account's password |

- **Same behaviour for unknown emails:** failures count for emails that don't exist too, and sign-in takes the same time either way (a dummy bcrypt check). Neither the limit nor the timing reveals which accounts exist.
- **While an account is paused:** the password isn't checked at all, and a successful sign-in resets the counter.
- **Warnings:** the 401 warns once 2 or fewer attempts are left. The 429 carries `Retry-After`, and the client turns it into a live countdown.
- **Behind a proxy:** set `TRUST_PROXY_HOPS` to the number of proxies, so the per-IP limit sees the real client IP. Docker sets it to 1 for nginx, and a forged `X-Forwarded-For` header cannot get around it.

## UX details

- Field errors appear when you leave a field, or for every field when you submit; they clear as soon as the value is fixed. The sign-up password shows a live checklist of the rules.
- Submitting an invalid form moves focus to the first invalid field.
- A failed sign-in clears the password and refocuses it.
- A taken email refocuses the email field.
- Buttons show what they are doing ("Signing in…") and can't be double-submitted.
- When rate-limited, the button reads "Try again in 14:32" and stays disabled until the countdown ends.
- Passwords have a show/hide toggle. Inputs have proper `autocomplete` values for password managers, `aria-invalid` and `aria-describedby`.
- An expired session sends you to sign in with an explanation, and signing out in another tab is announced the same way.
- A dark charcoal theme with a restrained violet accent, using Inter and Cal Sans fonts. Visible focus rings are on.

## Logging

The API logs to standard output: readable coloured text locally, one JSON object per line in production. Any log tool can collect them without code changes.

- **Request ID:** every request gets an id, returned in the `X-Request-Id` header and attached to every line logged while handling it. In Docker, nginx creates the id and forwards it, so nginx and the API share it. A user reporting a problem can quote the id, and one search finds every line of that request.
- **One line per request:** method, path, status and duration for successes. Failures are logged as warnings with their error message, and server errors with the full stack trace.
- **Security events**, logged on their own:

  | Event | Level |
  | --- | --- |
  | Account created, signed in, signed out | `log` |
  | Failed sign-in, with the attempts left | `log` |
  | Sign-in paused after 5 failures, or attempted while paused | `warn` |
  | Refresh-token reuse detected (a copied token), session revoked | `warn` |
  | Session ended because its user no longer exists | `warn` |

- **Privacy:** request bodies are never logged, so passwords never appear. Emails are masked (`j***@example.com`), and users are identified by id.
- **Level:** `LOG_LEVEL` sets the least severe level printed, `log` by default. `warn` gives quiet production logs, `debug` adds detail when troubleshooting.

A production line looks like this:

```json
{"level":"warn","timestamp":1791915024935,"message":"Sign-in paused for l***@example.com after 5 failed attempts, for 900s","context":"LoginAttemptService","requestId":"271c2406332b3ddf83b925828c22ff6d"}
```

## Environment

`backend/.env` is validated on boot; the API refuses to start with a missing or invalid value.

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` switches logs to JSON and turns Swagger off by default |
| `APP_PORT` | `3000` | |
| `MONGODB_URI` | — | required |
| `JWT_SECRET` | — | required, at least 32 characters |
| `JWT_EXPIRES_IN` | `15m` | access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | session lifetime, counted from its last use |
| `COOKIE_SECURE` | `true` | HTTPS-only refresh cookie; set `false` only for plain-HTTP local runs |
| `TRUST_PROXY_HOPS` | `0` | number of reverse proxies in front of the API |
| `CORS_ORIGINS` | `http://localhost:5173` | only needed when the client is served from another origin |
| `SWAGGER_ENABLED` | on, except in production | serves the API docs at `/api/docs`; `docker-compose.yml` turns it on |
| `LOG_LEVEL` | `log` | least severe level printed: `verbose`, `debug`, `log`, `warn`, `error` or `fatal` |

`frontend/.env`: `VITE_API_URL` (default `/api`, i.e. same origin).

## Project structure

The backend uses an `apps/` + `libs/` layering:
- **`apps/`** holds a thin HTTP layer: routes, cookies, rate limits and API docs.
- **`libs/`** holds the business logic and persistence, in domain libraries that any app could reuse.

Dependencies point inward: `controller → service → repository → entity`.

What goes where:
- **`apps/api`**: only what is HTTP-specific. That means routes, cookies, rate limits, bootstrap and HTTP-only env variables.
- **`libs/<domain>`** (`auth`, `user`): business rules, persistence and the API contract (DTOs).
- **`libs/base-api`**: the request pipeline that both apps and libs build on (guard, decorators, serialization, error filters). It has no config.
- **`libs/config`**: the env variables the libs need. Libs cannot import from an app, so these cannot live in `apps/`.

```
backend/
├── apps/api/
│   ├── src/
│   │   ├── main.ts · app.module.ts
│   │   ├── app.setup.ts       # helmet, cookies, CORS, validation, filters, global guard, Swagger (shared with e2e)
│   │   ├── config/            # app env schema: shared variables + HTTP ones (port, cookies, CORS, proxies)
│   │   └── modules/
│   │       ├── auth/       # register / login / refresh / logout: controller, refresh cookie, per-IP limits
│   │       └── user/       # GET /users/me (protected)
│   └── test/               # e2e tests against a real MongoDB
├── libs/
│   ├── auth/src/                       # the auth domain
│   │   ├── auth.service.ts             # register, login (with lockout), refresh, logout
│   │   ├── session.service.ts          # refresh tokens: create, rotate, detect reuse, revoke
│   │   ├── login-attempt.service.ts    # per-account brute-force protection
│   │   ├── dtos/                       # RegisterDto, LoginDto (validation rules) + responses/
│   │   ├── entities/ · repositories/   # sessions, login_attempts (TTL-indexed)
│   │   └── config/ · constants/ · errors/ · interfaces/ · tests/
│   ├── user/src/                       # the user domain
│   │   ├── entities/ · repositories/   # unique email; lean, projected reads; hash never selected by default
│   │   ├── user.service.ts             # hashing, constant-time credential check, profile
│   │   └── constants/ · dtos/ · errors/ · interfaces/ · tests/
│   ├── base-api/src/                   # framework plumbing
│   │   ├── guards/jwt-auth.guard.ts    # global: every route is protected unless @PublicRoute()
│   │   ├── decorators/                 # @PublicRoute, @CurrentUser, @ApiAuth, @ApiPropertyExpose
│   │   ├── interceptors/               # @Serialize (whitelists response fields), request logging
│   │   ├── filters/ · errors/          # one error shape; Retry-After for 429s
│   │   ├── logger/ · request-context/  # JSON logs in production; a request id on every line
│   │   └── utils/                      # serialization, email masking for logs
│   └── config/src/                     # the env variables the libs need, validated at startup
└── Dockerfile

frontend/
├── src/
│   ├── app/                            # shared across modules
│   │   ├── api/                        # fetch client (timeout, refresh-and-retry), ApiError, SessionService
│   │   ├── stores/session.store.ts     # Pinia: in-memory token, restore, cross-tab sync
│   │   ├── components/ · layouts/      # Base* components, TheAppLoader, CardLayout
│   │   └── composables/ · constants/ · models/ · styles/ · utils/ · views/
│   ├── modules/                        # feature modules; they never import each other
│   │   ├── auth/                       # sign in / sign up: apis, components, composables, models, utils, views, routes
│   │   └── home/                       # the application page
│   ├── router/                         # route table + guards (session, redirect, title, focus)
│   └── main.ts
├── README.md                           # client details and the full best-practice checklist
├── nginx.conf                          # SPA fallback, /api proxy, caching, security headers (incl. CSP)
└── Dockerfile
```

## Security notes

- **Passwords:**
  - Hashed with bcrypt (cost 12) and never returned; the hash is excluded from queries by default.
  - Capped at 72 bytes, the most bcrypt can hash.
- **Login responses:** the same `401 Invalid email or password` whether the email or the password is wrong, and in the same time.
- **Duplicate emails:** sign-up checks for the email first, with an indexed lookup before the costly bcrypt hash, and answers 409. Two concurrent sign-ups can both pass that check, so the unique index on `email` is the final guard and answers the same 409. Emails are lowercased and trimmed before both.
- **Mongo access:** lives only in repositories.
  - Reads are lean and projected, and return plain objects.
  - Counters change in single atomic updates.
  - User input is validated by DTOs before it reaches a query, so no operator injection is possible.
- **Requests and responses:** request bodies are whitelisted. Responses go through explicit DTOs, so no internal field leaks.
- **Hardening:**
  - `helmet` on the API; CSP and other security headers on the client.
  - The API container runs as a non-root user.
  - Logging never records request bodies or full email addresses (see [Logging](#logging)).
- **Limitations:** the per-IP counter lives in memory, so with several API instances each keeps its own. The per-account lockout is already shared through MongoDB. For a multi-instance deployment, back `@nestjs/throttler` with Redis.
