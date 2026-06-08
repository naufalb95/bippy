# Bippy! Admin

A small web app to manage the Bippy! flashcard deck — list, add, edit and
delete cards, and upload their videos. Same warm caramel/cocoa theme and icon
as the mobile app.

- **Framework:** Next.js (App Router), deployable to Vercel.
- **Data store:** a single public JSON blob, `flashcards/deck.json`, in the
  same Vercel Blob bucket the mobile app's videos live in. It holds only names
  + already-public video URLs, so public read access is fine.
- **Auth:** Google sign-in (Auth.js / NextAuth v5), restricted to an
  allow-list of emails (`ALLOWED_EMAILS`). Fail-closed — empty list = nobody in.
- **Video upload:** browser uploads straight to Vercel Blob via a short-lived
  token minted by `/api/upload`, so large videos bypass the serverless body
  limit. The `BLOB_READ_WRITE_TOKEN` never reaches the client.

## Setup

```sh
cd admin
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

### Environment variables

| Var | What |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read-write token (same one the mobile project uses). |
| `AUTH_SECRET` | Random secret. `npx auth secret` or `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth2 web client credentials. |
| `ALLOWED_EMAILS` | Comma-separated Google emails allowed to sign in. |

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
OAuth client.

## Wiring the mobile app to the live deck (optional, later)

Today the mobile app reads its deck from the hardcoded `src/flashcards.ts`.
To make this admin the live source of truth, point the app at the deck JSON:

```ts
// the public URL of flashcards/deck.json (see the Blob dashboard)
const DECK_URL = "https://<store>.public.blob.vercel-storage.com/flashcards/deck.json";
const deck: Flashcard[] = await fetch(DECK_URL).then((r) => r.json());
```

Keep the static deck as an offline fallback. Until then, edits made here live
only in the deck blob, not in the app.

## Typecheck

```sh
npm run typecheck
```
