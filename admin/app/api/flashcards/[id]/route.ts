import { auth } from "@/auth";
import { readDeck, writeDeck, deleteVideoBlob } from "@/lib/store";
import type { Flashcard } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const deck = await readDeck();
  const idx = deck.findIndex((c) => c.id === id);
  if (idx === -1) return notFound();

  const current = deck[idx];
  const next: Flashcard = { ...current };

  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name) return bad("name cannot be empty");
    next.name = name;
  }
  // `video` may be set to a new URL, or explicitly cleared with null/"".
  if ("video" in (body ?? {})) {
    const v = body.video;
    if (v === null || v === "") {
      delete next.video;
    } else if (typeof v === "string" && v.trim()) {
      next.video = v.trim();
    }
  }

  deck[idx] = next;
  await writeDeck(deck);
  return Response.json(next);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const deck = await readDeck();
  const card = deck.find((c) => c.id === id);
  if (!card) return notFound();

  await writeDeck(deck.filter((c) => c.id !== id));
  await deleteVideoBlob(card.video);
  return new Response(null, { status: 204 });
}

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}
function notFound() {
  return Response.json({ error: "not found" }, { status: 404 });
}
function bad(msg: string) {
  return Response.json({ error: msg }, { status: 400 });
}
