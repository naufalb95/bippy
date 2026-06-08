import { auth } from "@/auth";
import { readDeck, writeDeck } from "@/lib/store";
import type { Flashcard } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const deck = await readDeck();
  return Response.json(deck);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return bad("name is required");

  const video =
    typeof body?.video === "string" && body.video.trim()
      ? body.video.trim()
      : undefined;
  const id =
    typeof body?.id === "string" && body.id.trim()
      ? body.id.trim()
      : crypto.randomUUID();

  const deck = await readDeck();
  if (deck.some((c) => c.id === id)) return bad("a card with that id already exists");

  const card: Flashcard = { id, name, ...(video ? { video } : {}) };
  await writeDeck([...deck, card]);
  return Response.json(card, { status: 201 });
}

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}
function bad(msg: string) {
  return Response.json({ error: msg }, { status: 400 });
}
