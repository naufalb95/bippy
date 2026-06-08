"use client";

import { useState } from "react";
import type { Flashcard } from "@/lib/types";
import { QrModal } from "./QrModal";

export function CardItem({
  card,
  variant = "card",
  onEdit,
  onDelete,
}: {
  card: Flashcard;
  variant?: "card" | "row";
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showQr, setShowQr] = useState(false);
  const deepLink = `bippy://${card.id}`;

  const actions = (
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
  );

  const qr = showQr && (
    <QrModal name={card.name} value={deepLink} onClose={() => setShowQr(false)} />
  );

  if (variant === "row") {
    return (
      <li className="card-row">
        <div className="row-thumb">
          {card.video ? (
            <video src={card.video} muted playsInline preload="metadata" />
          ) : (
            <span className="novideo-dot" title="Video coming soon" />
          )}
        </div>
        <span className="row-name">{card.name}</span>
        {actions}
        {qr}
      </li>
    );
  }

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
        {actions}
      </div>
      {qr}
    </div>
  );
}
