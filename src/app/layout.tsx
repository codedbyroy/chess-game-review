import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChessLens — Offline Chess Game Reviewer",
  description: "Free, in-browser chess game analysis powered by Stockfish WebAssembly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col">
        {children}
      </body>
    </html>
  );
}
