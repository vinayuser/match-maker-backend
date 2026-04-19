# Kesher API (Node.js + MySQL)

Express API following the same layering style as the reference project: **routes → controller → services → Sequelize ORM → MySQL**, with `res.success` / `res.error` response helpers. Raw SQL was removed from services in favor of **Sequelize** models (`models/User.js`, `models/UserProfile.js`, `models/UserPhoto.js`).

## Setup

1. Create MySQL 8+ database and user (utf8mb4).

2. Apply schema:

   ```bash
   mysql -u kesher -p kesher < database/schema.sql
   ```

3. Copy environment file:

   ```bash
   cp config/.env.example config/.env
   ```

   Edit `DB_*`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`, and **`CLOUDINARY_URL`** (required for profile photo uploads). Use the value from the Cloudinary dashboard (`cloudinary://API_KEY:API_SECRET@cloud_name`). Images are stored under the `kesher/profiles` folder in your Cloudinary account; `POST /api/v1/upload/photo` returns `data.url` as an HTTPS Cloudinary URL.

4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Default base URL: `http://localhost:4000`

## Scalability notes

- **Connection pool** (`mysql2/promise`) with configurable `DB_POOL_LIMIT` (default 20).
- **Narrow `users` table** for auth; **wide `user_profiles`** row keeps onboarding fields in one place with indexes on discovery columns (`profile_status`, `gender`, `marital_status`, `is_cohen`, `is_locked`).
- **Photos** in separate `user_photos` table to avoid loading blobs in profile reads.
- **Interest / match** tables included for future flows (invitations → mutual accept → lock).

## Halachic rule (Cohen)

`services/matchingRules.service.js` documents the rule: **male Cohen must not be matched with divorced women** (widow not blocked). Use `canSuggestCandidateForViewer()` in discovery queries; `cohenDivorcedSql()` can be embedded in SQL `WHERE` clauses.

## Auth & onboarding API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | `{ email, password }` → `{ token, user }` |
| POST | `/api/v1/auth/login` | No | `{ email, password }` → `{ token, user }` |
| GET | `/api/v1/auth/me` | Bearer JWT | Current user id/email |
| GET | `/api/v1/onboarding` | Bearer JWT | Profile + photos |
| PATCH | `/api/v1/onboarding` | Bearer JWT | Save step: body `{ stepKey?, ...fields, photos? }` (camelCase matches frontend session keys) |
| POST | `/api/v1/onboarding/submit` | Bearer JWT | Validates required fields, sets `profile_status = pending_review`, `verification_status = pending` |

Send JWT as: `Authorization: Bearer <token>`.

After final review, wire the frontend: register → store token → each onboarding step `PATCH` with merged session payload → last step `POST /onboarding/submit`.
# match-maker-backend
