import { auth } from "@/auth";
import { listAdmins, addAdmin } from "@/lib/db";

export const dynamic = "force-dynamic";

// Basic email shape check — good enough to catch fat-fingers; Google
// auth is the real gate.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  return Response.json(await listAdmins());
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return bad("a valid email is required");

  await addAdmin(email);
  return Response.json({ email }, { status: 201 });
}

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}
function bad(msg: string) {
  return Response.json({ error: msg }, { status: 400 });
}
