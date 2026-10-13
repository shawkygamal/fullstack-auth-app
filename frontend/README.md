# Auth App: web client

The client is built with Vue 3, TypeScript, Vite, Vue Router and Pinia. It follows the conventions of the official Vue tooling (`create-vue`, the Vue style guide, Pinia and Vue Test Utils docs) and uses a feature-module layout: shared code in `app/`, one folder per feature in `modules/`.

```bash
npm install
npm run dev            # http://localhost:5173, proxies /api to http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` / `npm run test:watch` | Unit and component tests (Vitest + Vue Test Utils + jsdom) |
| `npm run lint` / `lint:check` | ESLint: `eslint-plugin-vue` recommended rules, type-aware `typescript-eslint` |
| `npm run format` / `format:check` | Prettier |
| `npm run type-check` | `vue-tsc` over the app, the tests and the configs |
| `npm run build` | Type-check, then production build into `dist/` |

## Structure

```
src/
├── main.ts                 # creates the app: Pinia, HTTP auth wiring, cross-tab sync, router, error handler
├── App.vue                 # RouterView, plus the app loader until the first route resolves
├── router/
│   ├── index.ts            # route table (each module contributes its routes.ts), scroll, chunk-error recovery
│   └── guards.ts           # session guard (requiresAuth / guestOnly + redirect), title and focus on navigation
├── app/                    # shared by every module; modules never import each other
│   ├── api/                # fetch client (timeout, refresh-and-retry), ApiError, SessionService
│   ├── stores/             # session.store.ts (Pinia setup store)
│   ├── components/         # Base* presentational components, TheAppLoader
│   ├── composables/        # use-form-validation, use-countdown
│   ├── layouts/            # CardLayout
│   ├── views/              # NotFoundView
│   ├── constants/ · models/ · utils/
│   └── styles/main.css     # design tokens, reset, utilities only; component styles are scoped
└── modules/
    ├── auth/               # sign in / sign up
    │   ├── apis/ · composables/ · models/ · utils/
    │   ├── components/     # SignInForm, SignUpForm, SignUpPasswordRules
    │   ├── views/          # SignInView, SignUpView
    │   └── routes.ts
    └── home/               # the application page
```

Tests live next to the code they cover, in `__tests__/` folders.

## Best-practice checklist

Each item says where it is implemented and how it was verified. "Test" means an automated test. "Browser" means checked in real Chrome via the DevTools protocol, against the Docker stack, with screenshots.

### Tooling and code quality

- [x] Vite, plus `vue-tsc` type-checking in the build: `npm run build`
- [x] Strict TypeScript from `@vue/tsconfig`, plus `noUncheckedIndexedAccess` and no unused locals or parameters. The app, test and tool configs are split, as in `create-vue`.
- [x] ESLint flat config with `eslint-plugin-vue` *recommended* and **type-aware** `typescript-eslint`, with zero warnings allowed in CI. Extra rules:
  - `<script setup>` only, macro order, PascalCase components in templates
  - typed refs, no `v-html`
  - inline type imports, no floating promises
- [x] Prettier, kept separate from linting (`skip-formatting`), and `.editorconfig`
- [x] CI runs lint, format check, tests and build, then builds the Docker image

### Vue conventions (official style guide)

- [x] Multi-word, PascalCase single-file component names, with no `index.vue`
- [x] `Base*` prefix for presentational components, `The*` for single-instance ones
- [x] Tightly coupled children prefixed with their parent: `SignUpPasswordRules`
- [x] `<script setup lang="ts">` everywhere, with typed `defineProps` / `defineModel` / `defineEmits`, `withDefaults`, and `useTemplateRef`
- [x] Block order: script, template, style. Styles are `scoped`; only design tokens are global.
- [x] Business logic lives in composables; components only render and wire up
- [x] Feature modules: `apis/`, `components/`, `composables/`, `models/`, `utils/`, `views/` and `routes.ts`. Modules never import each other; shared code lives in `app/`.

### State and data

- [x] Pinia setup store for the session, the official recommendation over hand-rolled module state. It's testable and visible in devtools.
- [x] **Access token in memory only.** Nothing auth-related goes in `localStorage` or `sessionStorage`. The httpOnly refresh cookie restores the session after a reload. *(test)*
- [x] Refresh is single-flight, so requests failing with 401 together share one refresh. *(test)*
- [x] A 401 triggers one refresh and a retry. If the refresh fails, the user is sent to sign in with "Your session has expired", and comes back to the same page afterwards. *(test)*
- [x] A network failure during refresh does not sign the user out *(test)*
- [x] Every request has a 15-second timeout, so a hanging API can't leave a spinner forever. Found in the browser check. *(test)*
- [x] Sign-in and sign-out are mirrored across tabs (BroadcastChannel) *(test)*
- [x] Sign-out still works locally when the server can't be reached *(test)*

### Routing

- [x] Route names are constants (`RouteName`), never hard-coded paths
- [x] Every page is lazy-loaded, so each is a separate chunk
- [x] The guard restores the session once, then applies `requiresAuth` / `guestOnly` *(test)*
- [x] After sign-in, the user goes back to the page they wanted (`?redirect=`), but only to in-app paths: `//evil.com` and `/\evil.com` are rejected *(test)*
- [x] A 404 page instead of a silent redirect
- [x] Each page sets the document title; scroll goes to the top, or is restored on back and forward
- [x] If a page chunk fails to load after a deploy, the page reloads instead of breaking *(test)*
- [x] An app loader shows until the first route resolves, so there's never a blank screen

### Forms and UX

- [x] The same validation rules as the backend DTOs, with plain-language messages that suggest a fix ("like name@example.com") *(test)*
- [x] "Reward early, punish late" inline validation:
  - leaving a field shows its error only if something was typed, so tabbing through an empty form stays quiet *(test, browser)*
  - submit shows every error *(test)*
  - an error clears as soon as the value is fixed *(test)*
- [x] Submitting an invalid form moves focus to the first invalid field *(test, browser)*
- [x] Live password-rule checklist, also linked to the field for screen readers *(test, browser)*
- [x] Show/hide password toggle, and a Caps Lock warning on password fields *(test)*
- [x] After a wrong password: the email is kept, the password is cleared and focused, and the empty field doesn't complain. Found in the browser check. *(test, browser)*
- [x] A taken email on sign-up focuses the email field *(test)*
- [x] The server warns when 2 or fewer attempts are left *(browser)*
- [x] **Rate limiting:**
  - the alert is announced once
  - the button shows a live "Try again in 14:57" and is disabled until the countdown ends
  - everything resets when it ends *(test, browser)*
- [x] Buttons show progress ("Signing in…") and can't be double-submitted *(test)*
- [x] Correct `autocomplete` values for password managers: `username`, `current-password`, `new-password`, `name`. Also `inputmode="email"` and `maxlength` matching the API limits.
- [x] Inputs use a font size of at least 16px, which stops iOS from zooming in on focus. Touch targets are 44px or more.
- [x] Notices for "session expired" and "signed out in another tab"

### Accessibility (WCAG 2.2 AA)

- [x] Every input has a `<label>`. `aria-invalid` and `aria-describedby` link errors, hints and the password rules. *(test)*
- [x] Errors are inserted as `role="alert"` (announced right away); notices use `role="status"`. A countdown is never re-announced every second.
- [x] On in-app navigation, focus moves to the page `<h1>` so screen readers announce the new page *(browser)*
- [x] Logical tab order: email → password → Show → Sign in → Sign up *(browser)*
- [x] Visible `:focus-visible` rings on every interactive element *(browser)*
- [x] Color contrast is computed for every token pair. Text is 7:1 to 17:1, and input borders are 3.4:1, above the 3:1 that WCAG 1.4.11 requires. Links are underlined, because grey text and white links are less than 3:1 apart (1.4.1).
- [x] Respects `prefers-reduced-motion`, and uses `lang`, landmarks (`<main>`) and one `<h1>` per page

### Responsive and theming

- [x] Works from 320px up to desktop *(browser at 320, 390 and 1280px)*
- [x] A single dark, monochrome theme modelled on cal.com's dark tokens: near-black surfaces, a neutral grey scale, white primary actions, and colour only for status. `color-scheme: dark` styles native controls and scrollbars, and autofilled fields keep the dark background. *(browser)*
- [x] Self-hosted fonts, Inter for text and Cal Sans for headings, bundled by Vite. There is no third-party request and the CSP is unchanged.

### Security

- [x] No `v-html` (a lint rule enforces it), and no tokens in web storage
- [x] Same-origin `/api` through the Vite dev proxy and nginx, so the SameSite=Strict cookie works with no CORS
- [x] The nginx image sends a CSP, `X-Frame-Options: DENY`, `nosniff` and a referrer policy. Framing the app is blocked, as the iframe check confirmed.
- [x] Open-redirect protection on `?redirect=` *(test)*

### Delivery

- [x] Multi-stage Docker image served by nginx: SPA fallback, immutable caching for hashed assets, `no-cache` for `index.html`
- [x] `index.html` has a description, favicon, theme colors and a `<noscript>` message
- [x] A global `app.config.errorHandler`, the hook point for an error tracker

### Deliberately not included

- **i18n:** the UI has a dozen strings in one language. `vue-i18n` would add weight with no benefit yet.
- **A UI kit or form library:** the forms are three fields each. The validation rules mirror the backend in about 40 lines.
- **Playwright or Cypress in CI:** the real-browser checks were run during development with headless Chrome. The component tests cover the same behaviour in CI. Add Playwright once the app grows.
