import { auth } from "@/auth";
import { updateFlashcard, deleteFlashcard } from "@/lib/db";
import { deleteVideoBlob } from "@/lib/blob";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return bad("name is required");

  // `video`: a non-empty string sets it; null/"" clears it.
  let video: string | null = null;
  const v = body?.video;
  if (typeof v === "string" && v.trim()) video = v.trim();

  const updated = await updateFlashcard(id, { name, video });
  if (!updated) return notFound();
  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const deleted = await deleteFlashcard(id);
  if (!deleted) return notFound();

  await deleteVideoBlob(deleted.video);
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
