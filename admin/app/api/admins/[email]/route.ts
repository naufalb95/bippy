import { auth } from "@/auth";
import { removeAdmin, adminCount } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ email: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { email: raw } = await params;
  const email = decodeURIComponent(raw).toLowerCase();

  // Never let the deck lock everyone out — keep at least one admin.
  if ((await adminCount()) <= 1) {
    return Response.json(
      { error: "can't remove the last admin" },
      { status: 400 }
    );
  }

  await removeAdmin(email);
  return new Response(null, { status: 204 });
}

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}
