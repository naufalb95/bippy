"use client";

import { useCallback, useEffect, useState } from "react";
import type { Flashcard } from "@/lib/types";
import { CardItem } from "./CardItem";
import { FlashcardModal } from "./FlashcardModal";
import { ConfirmModal } from "./ConfirmModal";
import { AdminsPanel } from "./AdminsPanel";

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; card: Flashcard }
  | null;

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
