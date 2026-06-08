import { auth } from "@/auth";
import { listFlashcards, createFlashcard, flashcardExists } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  return Response.json(await listFlashcards());
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

  if (await flashcardExists(id)) return bad("a card with that id already exists");

  const card = await createFlashcard({ id, name, video });
  return Response.json(card, { status: 201 });
}

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}
function bad(msg: string) {
  return Response.json({ error: msg }, { status: 400 });
}
