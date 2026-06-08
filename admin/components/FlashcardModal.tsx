"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import type { Flashcard } from "@/lib/types";
import { VIDEO_ACCEPT, VIDEO_FORMATS_LABEL, videoFileError } from "@/lib/video";

export function FlashcardModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Flashcard | null;
  onClose: () => void;
  onSaved: (card: Flashcard) => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [video, setVideo] = useState<string | undefined>(initial?.video);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    const invalid = videoFileError(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const result = await upload(`flashcards/videos/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: file.type || "video/mp4",
        onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
      });
      setVideo(result.url);
    } catch (err) {
      setError(`Upload failed: ${(err as Error).message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (uploading) return;
    e.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    // Ignore leave events fired when crossing into a child element.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/flashcards/${initial!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed, video: video ?? null }),
        });
      } else {
        res = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed, video: video ?? undefined }),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      onSaved(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const busy = uploading || saving;

  return (
    <div className="overlay" onClick={busy ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? "Edit flashcard" : "Add flashcard"}</h2>

        {error && <div className="error">{error}</div>}

        <div className="field">
          <label htmlFor="fc-name">Name</label>
          <input
            id="fc-name"
            type="text"
            value={name}
            placeholder="e.g. Elephant"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field">
          <label>Video</label>
          <div
            className={`video-picker${dragging ? " dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="row">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? `Uploading… ${progress}%` : video ? "Replace video" : "Choose video"}
              </button>
              {video && !uploading ? (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setVideo(undefined)}
                >
                  Remove
                </button>
              ) : (
                !uploading && <span className="drop-hint">or drag &amp; drop</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={VIDEO_ACCEPT}
              onChange={handleFile}
              hidden
            />
            {uploading && (
              <div className="progress">
                <div style={{ width: `${progress}%` }} />
              </div>
            )}
            {video && !uploading && (
              <div className="preview">
                <video src={video} controls muted playsInline preload="metadata" />
              </div>
            )}
            {!video && !uploading && (
              <p className="hint" style={{ marginTop: 10 }}>
                {VIDEO_FORMATS_LABEL}. Optional — the app shows “Video coming
                soon!” until one is added.
              </p>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add card"}
          </button>
        </div>
      </div>
    </div>
  );
}
