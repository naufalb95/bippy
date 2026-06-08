import { listFlashcards } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public, unauthenticated read-only deck for the mobile app to fetch.
// Returns only names + already-public video URLs (no secrets), so open
// access is fine. Kept deliberately separate from the authed
// /api/flashcards CRUD routes; the public matcher in middleware.ts lets
// /api/public/* through without a session.
export async function GET() {
  const deck = await listFlashcards();
  return Response.json(deck, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      // Brief CDN cache; the app also caches to disk for offline use.
      "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
    },
  });
}
