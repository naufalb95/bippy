"use client";

import { useCallback, useEffect, useState } from "react";

export function AdminsPanel() {
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
