# PadosiPro — Full-Stack Onboarding Assessment

Native mobile onboarding: **register → email OTP → login → profile → pick tasks → home**.

**Public repo:** https://github.com/yogthesharma/padosi-pro-assessment  
**Ready-to-install APK:** [`releases/padosipro.apk`](releases/padosipro.apk)

---

## 15-minute reviewer path (shortest)

Do this on a machine with Docker and an Android emulator (or a phone).

### A. Start the backend (one command)

```bash
git clone https://github.com/yogthesharma/padosi-pro-assessment.git
cd padosi-pro-assessment
docker compose up --build -d
```

Wait ~30s, then confirm:

```bash
curl http://localhost:4000/health
# → {"status":"ok"}
```

| Service | Open this |
|---------|-----------|
| API | http://localhost:4000 |
| **OTP emails (Mailpit)** | http://localhost:8025 |
| Postgres | `localhost:5433` (`padosi` / `padosi` / `padosipro`) |

OTP codes appear in Mailpit — no real email account needed.

Stop later with `docker compose down`.

### B. Install the APK

**Option 1 — use the shipped APK (recommended for review)**

```bash
# Emulator must be running, or plug in a phone with USB debugging
adb install -r releases/padosipro.apk
adb shell am start -n com.padosipro.assessment/.MainActivity
```

**Option 2 — Expo (source smoke test, no APK rebuild)**

```bash
npm install          # Node.js 22+
npm run dev:mobile   # then press `a` for Android / open web
```

### C. Point the app at your API

| Device | API URL to use |
|--------|----------------|
| **Android emulator** | `http://10.0.2.2:4000` (default — usually works as-is) |
| **Physical phone** | Your computer’s LAN IP, e.g. `http://192.168.1.20:4000` |
| **Web / iOS simulator** | `http://localhost:4000` |

If login fails with a network error: Login screen → **Change** (API server) → paste the URL → **Test connection** → **Save**.

Cleartext HTTP is allowed in the Android build so local `http://` works.

### D. Walk the product flow

1. **Create an account** (email + password + confirm).
2. Open **Mailpit** → copy the **6-digit OTP** → verify.
3. Fill **profile** (Business name is optional) → Save.
4. **Pick tasks** (search / multi-select) → Confirm.
5. **Home** shows selected tasks. Bottom: **Edit tasks**. Top-right gear: **Settings** (sign out / server).
6. Force-quit and reopen — you stay logged in.

---

## What’s in the monorepo

| Path | What |
|------|------|
| `apps/api` | Fastify + Postgres API |
| `apps/mobile` | Expo (React Native) app |
| `packages/shared` | Zod schemas, error codes, API types |
| `packages/typescript-config` | Shared TS configs |
| `releases/padosipro.apk` | Release Android binary |
| `docs/` | Architecture + decision log |

Emails go through **Mailpit** (local catcher), not production SMTP.

---

## Prerequisites

| Need | For |
|------|-----|
| **Docker + Docker Compose** | Running the API (required to try the flow) |
| **Node.js 22+** + npm | Running tests / Expo from source |
| **Android SDK** + **JDK 17** | Only if you rebuild the APK yourself |
| `adb` + emulator or device | Installing / running the APK |

---

## Backend details

### Environment variables

Ship only examples — never real secrets:

- Root: [`.env.example`](.env.example) — optional Compose overrides
- API (non-Docker): [`apps/api/.env.example`](apps/api/.env.example)

Compose already injects safe local defaults (`JWT_SECRET`, `OTP_SECRET`, Mailpit SMTP, etc.). You do **not** need a `.env` file for a normal review.

### API overview

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | — | Create account + send OTP |
| POST | `/api/auth/verify-email` | — | Verify OTP → JWT |
| POST | `/api/auth/resend-code` | — | Resend OTP (cooldown) |
| POST | `/api/auth/login` | — | Login (verified only) |
| POST | `/api/auth/logout` | Bearer | Invalidate token |
| GET | `/api/me` | Bearer | Account + onboarding step |
| PUT | `/api/me/profile` | Bearer | Save profile |
| GET | `/api/tasks` | — | Task catalogue |
| GET/PUT | `/api/me/tasks` | Bearer | Selected tasks |

Errors always look like:

```json
{ "error": { "code": "OTP_INVALID", "message": "…", "fields"?: {}, "details"?: {} } }
```

Migrations and the **32-task / 8-category** catalogue seed run automatically on API start.

### Tests

```bash
npm install
npm test
```

Covers OTP generation/hashing, expiry, attempt limits, cooldown, login rules, and HTTP validation (**49** API + **14** shared tests).

```bash
npm run typecheck
```

---

## Rebuild the Android APK (optional)

Only needed if you change mobile code and want a new binary. **JDK 17** is required (JDK 21/25 often break the Android Gradle plugin).

```bash
# From repo root
export ANDROID_HOME="$HOME/Android/Sdk"   # adjust if different
export JAVA_HOME="$(dirname $(dirname $(readlink -f $(which java))))"  # or point at a JDK 17 install
# Prefer an explicit JDK 17, e.g. on Linux:
#   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk

export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

cd apps/mobile
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease

mkdir -p ../../releases
cp app/build/outputs/apk/release/app-release.apk ../../releases/padosipro.apk
```

Built APK path before copy:

```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Install:

```bash
adb install -r releases/padosipro.apk
```

Bake a default API URL at build time (optional):

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `curl localhost:4000/health` fails | `docker compose up --build -d` and wait until healthy |
| App can’t reach API on emulator | Use `http://10.0.2.2:4000` (not `localhost`) |
| App can’t reach API on phone | Same Wi‑Fi as laptop; use laptop LAN IP; allow port 4000 |
| No OTP email | Open http://localhost:8025 — codes land in Mailpit |
| Unverified login | App routes you to verify; resend after ~30s cooldown |
| `adb devices` empty | Start an AVD or enable USB debugging |
| Gradle / Java errors rebuilding APK | Use **JDK 17**, not 25 |

---

## Design & docs

- [DESIGN.md](DESIGN.md) — architecture, trade-offs, next week  
- [docs/README.md](docs/README.md) — docs index  
- [docs/architecture.md](docs/architecture.md) — system layout  
- [docs/DECISIONS.md](docs/DECISIONS.md) — why we chose X over Y  
- [CURSOR.txt](CURSOR.txt) / [CLAUDE.txt](CLAUDE.txt) — notes for AI coding assistants  

---

## Assumptions (called out for the brief)

- **Business name** is optional — most customers are households; business tracks still benefit when filled.
- Users can **edit tasks** from Home (or Settings) after onboarding.
- **Sign out** is under Settings (gear on Home), not on the main home surface.
- Password: ≥8 chars, at least one letter and one number.
- Re-registering an unverified email **resends OTP** (does not overwrite the password).
- Android APK alone is the binary deliverable (iOS needs a paid Apple account).
