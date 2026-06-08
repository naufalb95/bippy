import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Flashcard } from "./types";

// Single source of truth lives in Neon. The HTTP driver is serverless-
// and edge-safe. Initialised lazily so importing this module (e.g. in
// the auth/middleware graph, or during `next build`) doesn't require
// DATABASE_URL to be present until a query actually runs.
let cached: NeonQueryFunction<false, false> | null = null;
function sql(): NeonQueryFunction<false, false> {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    cached = neon(url);
  }
  return cached;
}

type Row = { id: string; name: string; video: string | null };

function toCard(row: Row): Flashcard {
  return { id: row.id, name: row.name, ...(row.video ? { video: row.video } : {}) };
}

// --- Flashcards ---

export async function listFlashcards(): Promise<Flashcard[]> {
  const rows = (await sql()`
    SELECT id, name, video FROM flashcards ORDER BY created_at, name
  `) as Row[];
  return rows.map(toCard);
}

export async function createFlashcard(card: {
  id: string;
  name: string;
  video?: string;
}): Promise<Flashcard> {
  const rows = (await sql()`
    INSERT INTO flashcards (id, name, video)
    VALUES (${card.id}, ${card.name}, ${card.video ?? null})
    RETURNING id, name, video
  `) as Row[];
  return toCard(rows[0]);
}

export async function flashcardExists(id: string): Promise<boolean> {
  const rows = (await sql()`SELECT 1 FROM flashcards WHERE id = ${id}`) as unknown[];
  return rows.length > 0;
}

// Full-row update. `video: null` clears the video; a string sets it.
export async function updateFlashcard(
  id: string,
  fields: { name: string; video: string | null }
): Promise<Flashcard | null> {
  const rows = (await sql()`
    UPDATE flashcards
    SET name = ${fields.name}, video = ${fields.video}
    WHERE id = ${id}
    RETURNING id, name, video
  `) as Row[];
  return rows[0] ? toCard(rows[0]) : null;
}

// Deletes the row and returns its video URL (so the caller can clean up
// the blob), or `undefined` if the card didn't exist.
export async function deleteFlashcard(
  id: string
): Promise<{ video: string | null } | undefined> {
  const rows = (await sql()`
    DELETE FROM flashcards WHERE id = ${id} RETURNING video
  `) as { video: string | null }[];
  return rows[0];
}

// --- Admins ---

export async function isAdmin(email: string): Promise<boolean> {
  const rows = (await sql()`
    SELECT 1 FROM admins WHERE email = ${email.toLowerCase()}
  `) as unknown[];
  return rows.length > 0;
}

export async function listAdmins(): Promise<string[]> {
  const rows = (await sql()`
    SELECT email FROM admins ORDER BY added_at, email
  `) as { email: string }[];
  return rows.map((r) => r.email);
}

export async function addAdmin(email: string): Promise<void> {
  await sql()`
    INSERT INTO admins (email) VALUES (${email.toLowerCase()})
    ON CONFLICT (email) DO NOTHING
  `;
}

export async function removeAdmin(email: string): Promise<void> {
  await sql()`DELETE FROM admins WHERE email = ${email.toLowerCase()}`;
}

export async function adminCount(): Promise<number> {
  const rows = (await sql()`SELECT COUNT(*)::int AS n FROM admins`) as { n: number }[];
  return rows[0]?.n ?? 0;
}
