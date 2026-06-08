"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export function QrModal({
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
