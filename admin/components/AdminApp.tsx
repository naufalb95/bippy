"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Flashcard } from "@/lib/types";
import { CardItem } from "./CardItem";
import { FlashcardModal } from "./FlashcardModal";
import { ConfirmModal } from "./ConfirmModal";
import { AdminsPanel } from "./AdminsPanel";

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; card: Flashcard }
  | null;

type View = "grid" | "list";
const VIEW_KEY = "bippy-admin-view";

export function AdminApp() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<Flashcard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("grid");

  // Restore the saved view after mount (avoids SSR/localStorage mismatch).
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);
  const chooseView = useCallback((v: View) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? cards.filter((c) => c.name.toLowerCase().includes(q)) : cards;
  }, [cards, query]);

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
        <input
          className="search"
          type="text"
          placeholder="Search flashcards…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search flashcards by name"
        />
        <span className="count">
          {loading
            ? "Loading…"
            : query.trim()
            ? `${filtered.length} of ${cards.length}`
            : `${cards.length} flashcard${cards.length === 1 ? "" : "s"}`}
        </span>
        <div className="spacer" />
        <div className="view-toggle" role="group" aria-label="View">
          <button
            className={view === "grid" ? "active" : ""}
            onClick={() => chooseView("grid")}
            aria-pressed={view === "grid"}
          >
            Grid
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => chooseView("list")}
            aria-pressed={view === "list"}
          >
            List
          </button>
        </div>
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

      {!loading && cards.length > 0 && filtered.length === 0 && (
        <div className="state">
          <h2>No matches</h2>
          <p>
            Nothing matches “{query.trim()}”.{" "}
            <a href="#" onClick={(e) => (e.preventDefault(), setQuery(""))}>
              Clear search
            </a>
          </p>
        </div>
      )}

      {view === "grid" ? (
        <div className="grid">
          {filtered.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onEdit={() => setModal({ mode: "edit", card })}
              onDelete={() => requestDelete(card)}
            />
          ))}
        </div>
      ) : (
        <ul className="card-rows">
          {filtered.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              variant="row"
              onEdit={() => setModal({ mode: "edit", card })}
              onDelete={() => requestDelete(card)}
            />
          ))}
        </ul>
      )}

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
