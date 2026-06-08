import { auth } from "@/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const dynamic = "force-dynamic";

// Client-direct upload flow: the browser uploads the video straight to
// Vercel Blob, so large files bypass the serverless request-body limit.
// This route only mints a short-lived upload token — and only for a
// signed-in admin.
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session?.user) throw new Error("Unauthorized");
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/x-m4v",
            "video/webm",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB ceiling
        };
      },
      // Fires as a server-to-server webhook after upload. Nothing to do
      // here — the client gets the public URL back and writes it into the
      // deck via /api/flashcards.
      onUploadCompleted: async () => {},
    });
    return Response.json(json);
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
