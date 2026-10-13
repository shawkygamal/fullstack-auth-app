# AI usage

I used **Claude Code** for most of the typing. I set the structure and the standards, reviewed everything, and corrected it when it went the wrong way. The UI design was done in **Replit**, then reviewed with Claude to fit the code structure.

## Prompts that worked

- **Clean code and practices:** "Keep the code clean in both apps: thin controllers, logic in services, named errors and one error shape, response DTOs so nothing leaks, no magic numbers, strict TypeScript, and linting with zero warnings. In Vue, `<script setup>` with logic in composables. Use only the packages the task needs."
- **Backend structure:** "Use `apps/` + `libs/`, with controller → service → repository → entity. `apps/` stays thin; business logic and DTOs live in `libs/`. Every route is protected by default and must be marked `@PublicRoute()` to open it."
- **Frontend structure:** "Split the Vue app into `app/` for shared code and `modules/<feature>/` with `apis`, `components`, `composables`, `models`, `utils`, `views` and `routes.ts`. Modules never import each other."
- **"Follow what well-known open-source Vue projects do, and make a checklist."** It gave me a list I could review item by item.
- **"Why is this here?"** Asking it to justify a file or a layer found most of the structural problems.
- **"Check it in a real browser, not just the tests."**

## What was AI-assisted

The backend and frontend code, the tests, Docker, nginx, CI and the README. All of it was reviewed and verified by me.

## Where I corrected it

- **Structure:** it put the auth service and the DTOs in `apps/`, and had a vague `common` library. I moved the logic and DTOs into `libs/`, and turned `common` into `libs/config`.
- **Security:** it stored the JWT in `localStorage`. I switched to an in-memory token plus an `httpOnly` refresh cookie, with rotation that doesn't sign other tabs out. A wrong email and a wrong password get the same message and take the same time, so accounts can't be discovered.
- **Rate limiting:** it was per IP only. I added a per-account lockout and a live "Try again in 14:57" countdown.
- **Data:** I asked for MongoDB best practices with no unneeded fields: lean, projected queries and proper indexes. Duplicate emails relied only on the unique index, so I added an explicit check before hashing and kept the index as the final guard.
- **Logging:** it suggested new packages. I kept Nest's built-in logger and added a request ID on every line and logs for security events like a locked account.
- **UI:** I had the Replit screens aligned with the project's conventions, and the required welcome text restored.

## How I verified it

- 51 backend unit tests and 11 end-to-end tests against a real MongoDB.
- 87 frontend tests, plus strict linting and formatting.
- GitHub Actions runs all of it on every pull request.
- The Docker stack and a real browser, from phone width up to desktop.

Real runs caught mistakes the unit tests missed, like nginx dropping the security headers and a request with no timeout spinning forever.

## Takeaway

The AI is fast on details but weak on structure and scope. Giving it the structure up front, asking "why", and running everything for real is what made the result solid.
