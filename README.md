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

## Admin auth & role API

Admin system supports two roles:

- `super_admin`: full admin control (create/update/list admin accounts)
- `matchmaker_admin`: limited permissions decided by super admin

`admin_users.permissions` is a JSON array of permission keys (e.g. `["profiles:read","matches:update"]`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/admin/auth/bootstrap` | No | One-time bootstrap for first super admin `{ email, password, name }` (blocked if any super admin exists) |
| POST | `/api/v1/admin/auth/login` | No | Admin login `{ email, password }` → `{ token, admin }` |
| GET | `/api/v1/admin/auth/me` | Bearer Admin JWT | Current admin profile |
| POST | `/api/v1/admin/users` | Bearer Admin JWT (`super_admin`) | Create matchmaker admin `{ email, password, name, permissions[] }` |
| GET | `/api/v1/admin/users` | Bearer Admin JWT (`super_admin`) | List all admin users |
| PATCH | `/api/v1/admin/users/:id` | Bearer Admin JWT (`super_admin`) | Update matchmaker admin `{ name?, permissions?, isActive?, password? }` |
| GET | `/api/v1/admin/approval-queue` | Bearer Admin JWT (`super_admin` or `matchmaker_admin`) | List pending profile registrations for review |
| PATCH | `/api/v1/admin/approval-queue/:userId/review` | Bearer Admin JWT (`super_admin` or `matchmaker_admin`) | Review profile `{ decision: "approve" \| "reject", note? }` |

Admin JWT uses `ADMIN_JWT_SECRET` (falls back to `JWT_SECRET` if missing).

## Seeder for approval queue

Populate sample user registrations for admin moderation:

```bash
npm run seed:approval-queue
```

This creates seeded users/profiles, including pending, approved, and rejected records.  
All seeded users use password: `User@12345`.

Reset (delete seeded records only):

```bash
npm run seed:approval-queue:reset
```
# match-maker-backend
