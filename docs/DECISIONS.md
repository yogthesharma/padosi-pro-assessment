# Decision log

Short records of choices that reviewers (or future us) might ask about.
Format: context → decision → consequence. Newest first.

---

## 2026-09-29 — Sign out lives in Settings, not Home

**Context.** Thumb-zone UX: Home should focus on “what we handle for you,” not account chrome.

**Decision.** Move Sign out (and server link) to `/settings`. Home keeps a settings gear and a bottom **Edit tasks** CTA.

**Consequence.** One extra tap to sign out; Home stays calmer and closer to a modern consumer app. Profile onboarding still has a quiet “Wrong account? Sign out” link as an escape hatch.

---

## 2026-09-29 — Shared motion primitives on mobile

**Context.** Brief scores UI/UX; flat screens felt unfinished after the functional flow worked.

**Decision.** Add lightweight `FadeIn` / `PressableScale` / icon buttons; reuse theme tokens; no new animation libraries beyond what Expo already provides (`expo-linear-gradient`, RN `Animated`).

**Consequence.** Slightly more JS on mount; no native dependency risk. Easy to strip if a reviewer prefers minimal UI.

---

## 2026-09 — HMAC for OTP hashes (not plain SHA-256)

**Context.** OTPs are 6 digits (~1e6 space). A leaked unsalted/plain hash table is trivial to brute force.

**Decision.** Store HMAC-SHA256 with `OTP_SECRET`, bound to the user id.

**Consequence.** Requires a secret in env (Compose injects a local default). Tests cover verify / expiry / attempts without SMTP.

---

## 2026-09 — JWT + `token_version` instead of refresh tokens

**Context.** Need logout that actually invalidates tokens without running a Redis session store.

**Decision.** Embed `tokenVersion` in the JWT; logout increments DB `token_version`; auth middleware rejects mismatches. Expiry 7 days.

**Consequence.** No silent refresh; user re-logins after expiry or logout. Enough for the assessment scope.

---

## 2026-09 — Mailpit for email

**Context.** Brief allows a local catcher; reviewers must see OTPs without real SMTP credentials.

**Decision.** Docker Compose service `mailpit`; API SMTP → `mailpit:1025`; human inbox `localhost:8025`.

**Consequence.** Physical phones need LAN API URL; emulator uses `10.0.2.2:4000`.

---

## 2026-09 — Business name optional

**Context.** Product is household-first; not every user runs a business.

**Decision.** Optional field in shared Zod schema; documented in README Assumptions.

**Consequence.** Profile can be saved without it; Lifestyle Manager still gets name/mobile/address.

---

## 2026-09 — Turborepo monorepo + shared Zod package

**Context.** API and mobile must agree on validation and error codes.

**Decision.** `packages/shared` for schemas/types; both apps depend on it. Docker build uses `turbo prune @padosipro/api`.

**Consequence.** One `npm install` at root; API image stays mobile-free.

---

## 2026-09 — Replace-all task selection (`PUT /api/me/tasks`)

**Context.** Selection is a set of catalogue ids; partial patch adds complexity without product value here.

**Decision.** Client sends full id list; server replaces membership in one transaction.

**Consequence.** Simple, idempotent; no ordering or “suggested” tasks yet.
