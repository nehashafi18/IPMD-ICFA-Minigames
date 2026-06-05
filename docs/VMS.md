# Visitor Management System

The Visitor Management System gates access to the Image Cards app with one-time entry tokens. It is designed for the current MVP/internal demo flow where tokens are generated manually from an admin console. Stripe/payment automation is not implemented yet.

## Access Flow

1. An admin opens the VMS admin console.
2. The admin generates an entry token for a visitor.
3. The visitor opens an entry link such as:

```txt
http://localhost:5173/enter?token=<uuid>
```

4. The frontend calls `POST /api/vms/entries/validate`.
5. The backend validates and redeems the one-time token.
6. The backend sets a signed HttpOnly cookie named `gallery_session`.
7. The visitor is redirected to `/image-cards`.
8. Protected frontend routes and backend APIs use `/api/vms/status` or `gallery_session` to verify access.

Tokens are one-time redeemable. After the first successful redemption, the token is marked with `used_at` and cannot be redeemed again. The browser session remains valid until the `gallery_session` cookie expires.

## Routes

```txt
/                       Public access-required page
/enter?token=<uuid>     Token redemption page
/image-cards            Protected Image Cards app
/vms-admin              Backend-hosted VMS admin console after Docker/backend build
```

During local Vite development, the admin console can also run separately at:

```txt
http://localhost:5174
```

## Backend API

Public/MVP endpoints:

```txt
POST /api/vms/donations/simulate
POST /api/vms/entries/validate
GET  /api/vms/status
POST /api/vms/logout
GET  /api/vms/tokens/:token
```

Admin endpoints require `x-api-key: <VMS_ADMIN_API_KEY>`:

```txt
GET   /api/vms/admin/dashboard
GET   /api/vms/admin/donations
GET   /api/vms/admin/logs
GET   /api/vms/admin/settings
PUT   /api/vms/admin/settings
PATCH /api/vms/admin/tokens/:token
```

Protected Image Cards APIs:

```txt
GET  /api/cards
POST /api/cards/parse
POST /api/prompt/build
POST /api/art/generate
```

## VMS Admin Console

The VMS admin console is used to:

- Generate MVP/internal entry tokens.
- View donation/token records.
- View visitor entry logs.
- Revoke or restore token access.
- Edit VMS settings such as token TTL and session TTL.

It does not currently manage artwork upload/download for this project.

Default local admin key:

```txt
dev-admin-key
```

## Changing The Admin Key

The admin "password" is currently an API key, not a full user account login. Change it by setting:

```env
VMS_ADMIN_API_KEY=replace-with-a-private-admin-key
```

For npm development, put it in:

```txt
backend/.env
```

For Docker Compose, set it in the shell before startup:

```powershell
$env:VMS_ADMIN_API_KEY="replace-with-a-private-admin-key"
docker compose -f deploy\docker-compose.yml up --build
```

Anyone with this key can access the admin APIs, generate tokens, and revoke tokens. Do not commit real admin keys to GitHub.

## Enabling Or Disabling Gated Access

Gated access is enabled by default.

To disable the gate for local development only:

```env
DISABLE_GALLERY_GATE=true
```

With npm:

```txt
backend/.env
```

With Docker Compose:

```powershell
$env:DISABLE_GALLERY_GATE="true"
docker compose -f deploy\docker-compose.yml up --build
```

To enable the gate again:

```env
DISABLE_GALLERY_GATE=false
```

or remove the variable entirely.

Never enable `DISABLE_GALLERY_GATE=true` in production or a public demo environment.

## Required Environment Variables

Recommended backend values:

```env
PORT=5001
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173

DATABASE_URL=./data/vms.sqlite
VMS_ADMIN_API_KEY=dev-admin-key
ALLOW_SIMULATED_PAYMENTS=true
DISABLE_GALLERY_GATE=false
ACCESS_TOKEN_TTL_HOURS=720
GALLERY_SESSION_TTL_HOURS=12
GALLERY_SESSION_SECRET=replace-with-a-long-random-secret
DEFAULT_GALLERY_ID=image-cards
```

Important production notes:

- `GALLERY_SESSION_SECRET` must be long, random, and private.
- Changing `GALLERY_SESSION_SECRET` invalidates existing visitor sessions.
- `VMS_ADMIN_API_KEY` must not be the default value in production.
- `DISABLE_GALLERY_GATE` must be false or unset in production.
- `PUBLIC_APP_URL` must match the public frontend URL that visitors open.
- `FRONTEND_ORIGIN` must match the frontend origin allowed to send credentialed requests.

## Data Storage

The VMS uses SQLite through `better-sqlite3`.

Local npm path:

```txt
backend/data/vms.sqlite
```

Docker Compose path:

```txt
vms_data:/app/data
```

The Docker volume preserves generated tokens, donation records, settings, and visitor logs across container rebuilds.

To remove Docker VMS data intentionally:

```powershell
docker compose -f deploy\docker-compose.yml down -v
```

This also removes other named compose volumes such as Ollama data.

## Local Development

Run each service separately:

```powershell
cd backend
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

```powershell
cd vms-admin
npm install
npm run dev
```

Open:

```txt
Frontend:  http://localhost:5173
Admin:     http://localhost:5174
Backend:   http://localhost:5001
```

## Docker Compose

From the project root:

```powershell
docker compose -f deploy\docker-compose.yml up --build
```

Open:

```txt
Frontend:              http://localhost:5173
Backend:               http://localhost:5001
Backend-hosted admin:  http://localhost:5001/vms-admin
```

The backend Docker image builds and embeds the VMS admin frontend.

## AI Model Notes

The VMS gate can be developed and previewed without Ollama or Stable Diffusion models.

Without AI model services:

- Token generation works.
- Token redemption works.
- Protected route access works.
- The Image Cards page can be viewed.
- Final prompt/image generation may fail when it calls the LLM or Stable Diffusion backend.

There is no committed mock AI generation path. This is intentional so the production project logic is not changed by local preview shortcuts.

## Card Image Notes

The backend filters cards whose image files are missing from:

```txt
frontend/public/cards
```

If a card does not appear, check whether its `image` value in `backend/src/prompts/*.json` has a matching file in `frontend/public/cards`.

The current prompt JSON files also contain some incomplete image references. Missing cards are filtered at runtime instead of breaking the app.

## Adding Public Pages Or APIs

Frontend public routes live in:

```txt
frontend/src/App.tsx
```

Only routes wrapped in `ProtectedRoute` require a valid VMS session.

Backend API protection is configured in:

```txt
backend/src/app.ts
```

Routes with `requireGallerySession` require the signed `gallery_session` cookie. Remove that middleware from a route only if it should be public.

## Current MVP Limitations

- Stripe is not implemented.
- Token creation is simulated through VMS admin.
- Admin auth is a shared API key, not a full account system.
- Tokens are one-time redeemable, but sessions can be reused until cookie expiry.
- SQLite is suitable for MVP/internal demo; production may eventually move to PostgreSQL/Supabase.
