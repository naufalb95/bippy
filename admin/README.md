# Bippy! Admin

A small web app to manage the Bippy! flashcard deck — list, add, edit and
delete cards, upload their videos, and manage who's allowed in. Same warm
caramel/cocoa theme and icon as the mobile app.

- **Framework:** Next.js (App Router), deployable to Vercel.
- **Data store:** **Neon Postgres** is the single source of truth — both the
  flashcard deck (`flashcards`) and the admin allow-list (`admins`). Nothing
  is hardcoded in the codebase.
- **Auth:** Google sign-in (Auth.js / NextAuth v5). Permitted accounts live in
  the `admins` table (not env). Fail-closed — empty table = nobody gets in.
- **Video storage:** only the video *files* live in Vercel Blob; the DB stores
  their URLs. The browser uploads straight to Blob via a short-lived token
  minted by `/api/upload`, so large videos bypass the serverless body limit and
  `BLOB_READ_WRITE_TOKEN` never reaches the client.

## Setup

```sh
cd admin
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run seed                 # create tables + seed first admin & the 3 cards
npm run dev                  # http://localhost:3000
```

`npm run seed` is idempotent — safe to re-run. It creates the schema from
`db/schema.sql`, inserts the first admin (`SEED_ADMIN_EMAIL`, defaulting to the
author), and migrates the original 3 flashcards.

### Environment variables

| Var | What |
| --- | --- |
| `DATABASE_URL` | Neon Postgres **pooled** connection string. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read-write token (same one the mobile project uses). |
| `AUTH_SECRET` | Random secret. `npx auth secret` or `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth2 web client credentials. |
| `SEED_ADMIN_EMAIL` | _(optional, seed only)_ first admin email. Defaults to `naufalfbudiman@gmail.com`. |

### Neon setup

Create a project at [neon.tech](https://neon.tech/) (or via the Vercel
Marketplace) and copy the **pooled** connection string into `DATABASE_URL`.
Then run `npm run seed`. Add/remove further admins from the **Admins** panel in
the app — no redeploy needed.

### Google OAuth setup

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services
   → Credentials → **Create OAuth client ID** → type **Web application**.
2. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://<your-admin-domain>/api/auth/callback/google` (prod)
3. Copy the client ID/secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

## Deploying to Vercel

Set the project **root directory** to `admin/`, add all the env vars above in
the Vercel dashboard, and deploy. Add the production callback URL to the Google
OAuth client. Run the seed once against the production `DATABASE_URL` (locally
with the prod URL, or paste `db/schema.sql` into the Neon SQL editor).

> Note: an admin removed from the table keeps access until their current session
> JWT expires; the check runs at sign-in. Fine for this use case.

## Wiring the mobile app to the live deck (optional, later)

The mobile app still reads its deck from the hardcoded `src/flashcards.ts`. To
make this DB the live source of truth, expose a read-only public endpoint (e.g.
`GET /api/public/deck` returning the deck JSON — unauthenticated) and fetch that
from the app, keeping the static deck as an offline fallback. Until then, edits
here live only in the database, not in the app.

## Typecheck

```sh
npm run typecheck
```
