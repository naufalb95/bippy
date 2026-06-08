-- Bippy! Admin database schema (Neon Postgres).
-- Source of truth for the flashcard deck and the admin allow-list.
-- Run once via: npm run seed   (or paste into the Neon SQL editor).

CREATE TABLE IF NOT EXISTS flashcards (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  video      text,                 -- public video URL (Vercel Blob); null = "coming soon"
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Admins permitted to sign in. Fail-closed: empty table = nobody gets in.
CREATE TABLE IF NOT EXISTS admins (
  email    text PRIMARY KEY,       -- lowercased Google account email
  added_at timestamptz NOT NULL DEFAULT now()
);
