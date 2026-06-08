"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { QRCodeCanvas } from "qrcode.react";
import type { Flashcard } from "@/lib/types";

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; card: Flashcard }
  | null;

// Must match the server's allowedContentTypes in /api/upload.
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
  "video/webm",
];
const ALLOWED_VIDEO_EXTS = [".mp4", ".mov", ".m4v", ".webm"];
const VIDEO_FORMATS_LABEL = "MP4, MOV, M4V or WebM";

// Returns an error message if the file isn't an accepted video, else null.
function videoFileError(file: File): string | null {
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

export function AdminApp() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<Flashcard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const requestDelete = useCallback((card: Flashcard) => {
    setDeleteError(null);
    setPendingDelete(card);
  }, []);

  const cancelDelete = useCallback(() => {
    setPendingDelete(null);
    setDeleteError(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/flashcards/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      setCards((cs) => cs.filter((c) => c.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (e) {
      setDeleteError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete]);

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
            onDelete={() => requestDelete(card)}
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

      {pendingDelete && (
        <ConfirmModal
          title="Delete flashcard?"
          message={`This removes “${pendingDelete.name}” from the deck${
            pendingDelete.video ? " and deletes its video" : ""
          }. This can't be undone.`}
          confirmLabel="Delete"
          busyLabel="Deleting…"
          busy={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      <AdminsPanel />
    </>
  );
}

function AdminsPanel() {
  const [admins, setAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admins", { cache: "no-store" });
      if (res.ok) setAdmins(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setAdmins((a) => (a.includes(data.email) ? a : [...a, data.email]));
      setEmail("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: string) {
    if (!confirm(`Remove ${e} from admins? They'll lose access on next sign-in.`))
      return;
    setError(null);
    try {
      const res = await fetch(`/api/admins/${encodeURIComponent(e)}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove");
      }
      setAdmins((a) => a.filter((x) => x !== e));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="admins">
      <h2 className="section-title">Admins</h2>
      <p className="section-sub">
        Google accounts allowed to sign in. Removing someone takes effect on
        their next sign-in.
      </p>

      {error && <div className="error">{error}</div>}

      <div className="admins-card">
        <ul className="admin-list">
          {loading ? (
            <li className="admin-empty">Loading…</li>
          ) : admins.length === 0 ? (
            <li className="admin-empty">No admins yet.</li>
          ) : (
            admins.map((e) => (
              <li key={e} className="admin-row">
                <span className="admin-email">{e}</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => remove(e)}
                  disabled={admins.length <= 1}
                  title={
                    admins.length <= 1 ? "Can't remove the last admin" : "Remove"
                  }
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="admin-add">
          <input
            type="text"
            inputMode="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button className="btn btn-primary" onClick={add} disabled={busy}>
            {busy ? "Adding…" : "Add admin"}
          </button>
        </div>
      </div>
    </section>
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
  const [showQr, setShowQr] = useState(false);
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
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowQr(true)}>
            Show QR
          </button>
          <button className="btn btn-deep btn-sm" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {showQr && (
        <QrModal name={card.name} value={deepLink} onClose={() => setShowQr(false)} />
      )}
    </div>
  );
}

function QrModal({
  name,
  value,
  onClose,
}: {
  name: string;
  value: string;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<"idle" | "done" | "error">("idle");

  async function copyImage() {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("no blob");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied("done");
    } catch {
      setCopied("error");
    } finally {
      setTimeout(() => setCopied("idle"), 1800);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal qr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>{name}</h2>
        <div className="qr-canvas-wrap" ref={wrapRef}>
          <QRCodeCanvas
            value={value}
            size={240}
            level="H"
            marginSize={2}
            fgColor="#3C2E20"
            bgColor="#FFFFFF"
            imageSettings={{
              src: "/icon.svg",
              height: 52,
              width: 52,
              excavate: true,
            }}
          />
        </div>
        <button className="btn btn-primary qr-copy" onClick={copyImage}>
          {copied === "done"
            ? "Copied!"
            : copied === "error"
            ? "Copy failed"
            : "Copy image"}
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  busyLabel,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  busyLabel: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="overlay" onClick={busy ? undefined : onCancel}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {error && <div className="error">{error}</div>}
        <p className="confirm-text">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
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
