# DESIGN.md

One-page notes on how this submission is put together.

## Architecture

```
┌─────────────┐     JWT      ┌──────────────┐     SQL      ┌──────────┐
│ Expo mobile │ ───────────► │ Fastify API  │ ───────────► │ Postgres │
│ (apps/mobile)│ ◄─────────── │ (apps/api)   │              └──────────┘
└─────────────┘              └──────┬───────┘
                                    │ SMTP
                                    ▼
                              ┌──────────┐
                              │ Mailpit  │  (OTP inbox)
                              └──────────┘

packages/shared  →  Zod schemas + ErrorCode + wire types (both apps)
```

**Monorepo (Turborepo + npm workspaces).** One install, shared validation so the phone and the server never disagree on “what is a valid Indian mobile?” Docker image for the API uses `turbo prune @padosipro/api` so the mobile tree never lands in the container.

**Backend.** Thin routes → services → repositories. OTP policy (TTL, attempts, cooldown, hourly cap) lives in pure functions with a injectable clock — that’s what the tests hammer without a database. Postgres repositories match the same interfaces as the in-memory ones used in Vitest.

**Mobile.** Expo Router + `Stack.Protected` guards driven by `GET /api/me`’s `onboardingStep` (`profile` | `tasks` | `home`). The server decides the next screen, so a reinstall can’t skip profile or tasks. Token in SecureStore (AsyncStorage on web). TanStack Query for catalogue/tasks; react-hook-form + shared Zod for forms. After onboarding, **Sign out** lives under Settings; Home stays task-focused with a thumb-zone Edit CTA.

## Main trade-offs

| Choice | Why | Cost |
|--------|-----|------|
| **HMAC of OTP, not plain SHA-256** | 6-digit space is tiny; a leaked hash table is otherwise brute-forceable | Needs `OTP_SECRET` in env |
| **JWT + `token_version`** | Logout actually invalidates tokens; no refresh-token machinery | No silent refresh; expiry is 7d |
| **Mailpit, not production SMTP** | Brief allows a local catcher; one Compose command for reviewers | APK must reach the host API |
| **Replace-all task selection (`PUT`)** | Idempotent, simple | No partial patch / ordering UI |
| **Business name optional** | Household-first product; still useful for business tracks | Call it out in README |
| **Server URL setting in app** | One APK works on emulator (`10.0.2.2`) and a real phone | Extra settings surface |

## Security highlights (review focus)

- Passwords: bcrypt (cost 12 in Compose).
- OTP: cryptographically random, HMAC-SHA256 with user binding, 10 min TTL, single use, ≤5 attempts (atomic), ~30s resend cooldown, hourly send cap.
- Login: same message for unknown email / wrong password; only after a correct password do we reveal `EMAIL_NOT_VERIFIED`.
- Validation: every body through Zod; consistent `{ error: { code, message, fields? } }`.

## What we left out

- Refresh tokens / biometric unlock  
- Forgot-password  
- Real push / SMS OTP  
- iOS binary (needs paid Apple account)  
- Hosted staging API (local Docker is what the brief asks for)  
- Screen recording (optional; can record if requested)  
- Rate limits beyond auth endpoints  

## With another week

1. E2E Detox/Maestro against emulator + Mailpit.  
2. Refresh tokens + device session list.  
3. Polish empty/offline art and a11y pass on small phones.  
4. Optional “tell us in your own words” free-text request after task pick (matches live product copy).  
5. Deploy a throwaway API so a physical phone doesn’t need LAN config.
