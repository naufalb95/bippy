import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bippy! Admin",
  description: "Manage the Bippy! flashcard deck.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
