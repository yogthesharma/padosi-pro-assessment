# PadosiPro — Full-Stack Onboarding Assessment

Native mobile onboarding for PadosiPro: register → email OTP → login → profile → pick tasks → home.

Built as a **Turborepo** monorepo (everything TypeScript/JavaScript):

| Path | What |
|------|------|
| `apps/api` | Fastify + Postgres API |
| `apps/mobile` | Expo (React Native) app |
| `packages/shared` | Zod schemas, error codes, API types (used by both) |
| `packages/typescript-config` | Shared TS configs |

Emails go through **Mailpit** (local catcher). Web inbox: http://localhost:8025

---

## Prerequisites

- **Node.js 22+** and npm
- **Docker** + Docker Compose
- For the APK: **Android SDK** (Android Studio) and JDK 17+

Optional: Expo Go for a quick emulator smoke test (a release APK is still the deliverable).

---

## 1. Backend (one command)

From the repo root:

```bash
docker compose up --build -d
```

That starts:

| Service | URL |
|---------|-----|
| API | http://localhost:4000 |
| Mailpit inbox | http://localhost:8025 |
| Postgres | `localhost:5433` (user/password/db: `padosi` / `padosi` / `padosipro`) |

Health check:

```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

Migrations and the 32-task catalogue seed run automatically on API start.

Stop:

```bash
docker compose down
```

### Environment variables

Ship only examples — never real secrets:

- Root: [`.env.example`](.env.example) — optional overrides for Compose
- API (non-Docker): [`apps/api/.env.example`](apps/api/.env.example)

Compose already injects safe local defaults (`JWT_SECRET`, `OTP_SECRET`, Mailpit SMTP, etc.).

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

### Tests

```bash
npm install
npm test
```

Covers OTP generation/hashing, expiry, attempt limits, cooldown, login rules, and HTTP validation (49 API + 14 shared tests).

---

## 2. Mobile app

```bash
npm install
docker compose up -d          # API must be running
npm run dev:mobile            # Expo
```

Then press `a` for Android emulator, or open the web preview.

### Server URL (important for APK / devices)

| Where the app runs | Default API URL |
|--------------------|-----------------|
| Android emulator | `http://10.0.2.2:4000` |
| Web / iOS simulator | `http://localhost:4000` |
| Physical phone | Your machine’s LAN IP, e.g. `http://192.168.1.20:4000` |

On Login → **Change** opens Server settings (test + save). Cleartext HTTP is allowed in the Android build so local `http://` works.

Override at build time:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
```

### Typecheck

```bash
npm run typecheck
```

---

## 3. Build the Android APK

Requires Android SDK + JDK.

```bash
export ANDROID_HOME="$HOME/Android/Sdk"   # adjust if different
export PATH="$PATH:$ANDROID_HOME/platform-tools"

cd apps/mobile
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

APK path:

```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Copy for submission:

```bash
mkdir -p releases
cp apps/mobile/android/app/build/outputs/apk/release/app-release.apk releases/padosipro.apk
```

Install on an emulator:

```bash
adb install -r releases/padosipro.apk
```

**Reviewer tip:** start `docker compose up -d` first. On the emulator the app talks to `http://10.0.2.2:4000` by default. OTP emails appear in Mailpit at http://localhost:8025.

---

## Quick demo flow

1. Open the app → Create an account  
2. Copy the 6-digit code from Mailpit → Verify  
3. Fill profile (Business name optional) → Save  
4. Pick tasks (search / multi-select) → Confirm  
5. Home lists selected tasks → **Edit tasks** (bottom) or open **Settings** (gear) to sign out / change server  
6. Restart the app — you stay logged in  

---

## Design notes

See [DESIGN.md](DESIGN.md) for architecture, trade-offs, and what we’d do with another week.

More detail:

| Doc | What |
|-----|------|
| [docs/README.md](docs/README.md) | Docs index |
| [docs/architecture.md](docs/architecture.md) | System layout + onboarding steps |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Why we chose X over Y |
| [CURSOR.txt](CURSOR.txt) / [CLAUDE.txt](CLAUDE.txt) | Notes for AI coding assistants |

---

## Assumptions (called out for the brief)

- **Business name** is optional — most customers are households; business tracks still benefit when filled.  
- Users can **edit tasks** from Home (or Settings) after onboarding.  
- **Sign out** is under Settings (gear on Home), not on the main home surface.  
- Password: ≥8 chars, at least one letter and one number.  
- Re-registering an unverified email **resends OTP** (does not overwrite the password).  
- Android APK alone is the binary deliverable (iOS needs a paid Apple account).
