import { del } from "@vercel/blob";

// Best-effort cleanup of a card's video blob when it lives in our bucket.
// Remote/3rd-party URLs are left alone. The DB row is the source of truth;
// a dangling blob is harmless, so failures here are swallowed.
export async function deleteVideoBlob(url?: string | null): Promise<void> {
  if (!url || !url.includes(".public.blob.vercel-storage.com/")) return;
  try {
    await del(url);
  } catch {
    // non-fatal
  }
}
