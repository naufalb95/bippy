// One-time setup / migration for the Neon database.
//   - creates the tables from db/schema.sql
//   - seeds the first admin (SEED_ADMIN_EMAIL, defaults to the author)
//   - migrates the original 3 flashcards from the mobile app
//
// All inserts are idempotent (ON CONFLICT DO NOTHING), so it's safe to
// re-run. Reads DATABASE_URL via:  npm run seed   (uses --env-file).

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to admin/.env.local.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const SEED_ADMIN_EMAIL = (
  process.env.SEED_ADMIN_EMAIL || "naufalfbudiman@gmail.com"
).toLowerCase();

// The original deck, migrated out of the mobile app's src/flashcards.ts.
const FLASHCARDS = [
  {
    id: "12812dd3-a9a2-4c93-97da-cc8cca0e8cd1",
    name: "Elephant",
    video: "https://fyikd8msqiqe4fyf.public.blob.vercel-storage.com/elephant.mp4",
  },
  {
    id: "aac02be3-1533-4e7c-9861-14e45ac37f7e",
    name: "Giraffe",
    video: "https://fyikd8msqiqe4fyf.public.blob.vercel-storage.com/giraffe.mp4",
  },
  {
    id: "5c817e0b-83aa-4d72-8d33-a1488e2bfc9f",
    name: "Cat",
    video: "https://fyikd8msqiqe4fyf.public.blob.vercel-storage.com/cat.mp4",
  },
];

async function run() {
  // 1. Schema (split into individual statements for the HTTP driver).
  // Strip line comments first — they can contain semicolons, which would
  // otherwise split a statement mid-way.
  const schema = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");
  const statements = schema
    .split("\n")
    .map((line) => {
      const i = line.indexOf("--");
      return i === -1 ? line : line.slice(0, i);
    })
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log(`✓ Schema applied (${statements.length} statements).`);

  // 2. First admin.
  await sql`
    INSERT INTO admins (email) VALUES (${SEED_ADMIN_EMAIL})
    ON CONFLICT (email) DO NOTHING
  `;
  console.log(`✓ Admin ensured: ${SEED_ADMIN_EMAIL}`);

  // 3. Flashcards.
  let inserted = 0;
  for (const c of FLASHCARDS) {
    const rows = await sql`
      INSERT INTO flashcards (id, name, video)
      VALUES (${c.id}, ${c.name}, ${c.video})
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
    if (rows.length) inserted++;
  }
  console.log(`✓ Flashcards: ${inserted} inserted, ${FLASHCARDS.length - inserted} already present.`);

  console.log("\nDone.");
}

run().catch((e) => {
  console.error("Seed failed:", e.message || e);
  process.exit(1);
});
