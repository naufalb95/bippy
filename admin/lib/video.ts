// Accepted flashcard video formats. Must match the server's
// allowedContentTypes in app/api/upload/route.ts.
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
  "video/webm",
];
const ALLOWED_VIDEO_EXTS = [".mp4", ".mov", ".m4v", ".webm"];

export const VIDEO_FORMATS_LABEL = "MP4, MOV, M4V or WebM";
export const VIDEO_ACCEPT = ALLOWED_VIDEO_TYPES.join(",");

// Returns an error message if the file isn't an accepted video, else null.
export function videoFileError(file: File): string | null {
  const type = file.type.toLowerCase();
  if (type) {
    if (!type.startsWith("video/"))
      return `That's not a video file. Use ${VIDEO_FORMATS_LABEL}.`;
    if (!ALLOWED_VIDEO_TYPES.includes(type))
      return `Unsupported video format. Use ${VIDEO_FORMATS_LABEL}.`;
    return null;
  }
  // Some drops/files report no MIME type — fall back to the extension.
  const name = file.name.toLowerCase();
  return ALLOWED_VIDEO_EXTS.some((e) => name.endsWith(e))
    ? null
    : `Unsupported video format. Use ${VIDEO_FORMATS_LABEL}.`;
}
