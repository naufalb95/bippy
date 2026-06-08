"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import type { Flashcard } from "@/lib/types";

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; card: Flashcard }
  | null;

export function AdminApp() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/flashcards", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      setCards(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    async (card: Flashcard) => {
      if (
        !confirm(
          `Delete "${card.name}"? This removes it from the deck${
            card.video ? " and deletes its video" : ""
          }. This can't be undone.`
        )
      )
        return;
      try {
        const res = await fetch(`/api/flashcards/${card.id}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 204) throw new Error("Delete failed");
        setCards((cs) => cs.filter((c) => c.id !== card.id));
      } catch (e) {
        alert((e as Error).message);
      }
    },
    []
  );

  const handleSaved = useCallback((saved: Flashcard) => {
    setCards((cs) => {
      const i = cs.findIndex((c) => c.id === saved.id);
      if (i === -1) return [...cs, saved];
      const next = [...cs];
      next[i] = saved;
      return next;
    });
    setModal(null);
  }, []);

  return (
    <>
      <div className="toolbar">
        <span className="count">
          {loading ? "Loading…" : `${cards.length} flashcard${cards.length === 1 ? "" : "s"}`}
        </span>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setModal({ mode: "add" })}>
          + Add flashcard
        </button>
      </div>

      {error && (
        <div className="error">
          {error} ·{" "}
          <a href="#" onClick={(e) => (e.preventDefault(), load())}>
            retry
          </a>
        </div>
      )}

      {!loading && cards.length === 0 && !error && (
        <div className="state">
          <h2>No flashcards yet</h2>
          <p>Add your first card to get started.</p>
        </div>
      )}

      <div className="grid">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onEdit={() => setModal({ mode: "edit", card })}
            onDelete={() => handleDelete(card)}
          />
        ))}
      </div>

      {modal && (
        <FlashcardModal
          initial={modal.mode === "edit" ? modal.card : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

function CardItem({
  card,
  onEdit,
  onDelete,
}: {
  card: Flashcard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const deepLink = `bippy://${card.id}`;
  return (
    <div className="card">
      <div className="thumb">
        {card.video ? (
          <video src={card.video} muted loop playsInline preload="metadata" />
        ) : (
          <span className="novideo">Video coming soon!</span>
        )}
      </div>
      <div className="body">
        <h3 className="name">{card.name}</h3>
        <div className="qr-line">
          QR: <code>{deepLink}</code>{" "}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigator.clipboard?.writeText(deepLink)}
            title="Copy deep link"
          >
            Copy
          </button>
        </div>
        <div className="meta">{card.id}</div>
        <div className="actions">
          <button className="btn btn-deep btn-sm" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function FlashcardModal({
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
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
          <div className="video-picker">
            <div className="row">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? `Uploading… ${progress}%` : video ? "Replace video" : "Upload video"}
              </button>
              {video && !uploading && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setVideo(undefined)}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
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
                Optional — the app shows “Video coming soon!” until one is added.
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
