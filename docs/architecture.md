# Architecture

## Layout

```
padosi-pro-assessment/
├── apps/api          Fastify + Postgres (Docker image via turbo prune)
├── apps/mobile       Expo Router 57 (React Native)
├── packages/shared   Zod schemas, ErrorCode, wire types
├── packages/typescript-config
├── docker-compose.yml   api + postgres + mailpit
├── releases/         padosipro.apk (submission binary)
└── docs/             This folder
```

## Request path (authenticated)

1. Mobile stores JWT in SecureStore (AsyncStorage on web).
2. API `auth` plugin verifies JWT and loads user `token_version` (logout bumps it).
3. Routes call services; services use repositories (Postgres in Docker, in-memory in Vitest).
4. Bodies validated with Zod from `@padosipro/shared` via `parseInput`.
5. Failures go through a single error handler → `{ error: { code, message, … } }`.

## Onboarding state machine

`GET /api/me` returns `user.onboardingStep`:

| Step | Meaning | Mobile gate |
|------|---------|-------------|
| `profile` | No profile yet | `/profile` only |
| `tasks` | Profile saved, no tasks | `/tasks` |
| `home` | Tasks saved | `/home`, `/settings`, edit `/tasks` |

The **server** owns the step. The client only routes from it (`Stack.Protected` in `_layout.tsx`). That way a reinstall cannot skip profile or task selection.

## OTP

- Generate 6-digit code with crypto-safe RNG.
- Store **HMAC-SHA256** of the code (bound to user), never plaintext.
- Enforce TTL, single use, attempt cap, resend cooldown, hourly send cap in service code covered by unit tests.
- Deliver via SMTP → Mailpit in Compose (`localhost:8025` inbox).

## Mobile navigation (post-UI polish)

- **Home:** hero + selected tasks; settings gear; bottom **Edit tasks**. No sign-out on Home.
- **Settings:** account summary, edit tasks, server URL, **Sign out**.
- Shared motion/primitives: `FadeIn`, `PressableScale`, `IconButton`, `ListRow`.

## Data

- Users, profiles, OTP challenges, selected tasks in Postgres.
- Task catalogue is seeded SQL/seed module (32 tasks / 8 categories) on API boot.
