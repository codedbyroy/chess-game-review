"use client";

import React, { useState } from "react";
import { X, Upload, FileText, AlertCircle, Globe, Loader2, Sparkles } from "lucide-react";
import { SAMPLE_OPERA_GAME } from "@/lib/pgn-parser";
import { fetchLatestGame, ChessPlatform } from "@/lib/chess-api";

interface PgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPgn: (pgn: string) => boolean; // returns true if success
}

type TabMode = "manual" | "fetch";

export const PgnModal: React.FC<PgnModalProps> = ({
  isOpen,
  onClose,
  onLoadPgn,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>("manual");
  const [pgnText, setPgnText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Platform fetch state
  const [platform, setPlatform] = useState<ChessPlatform>("chesscom");
  const [username, setUsername] = useState("");
  const [isLoadingFetch, setIsLoadingFetch] = useState(false);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgnText.trim()) {
      setErrorMessage("Please enter PGN text or choose a file.");
      return;
    }

    const success = onLoadPgn(pgnText);
    if (success) {
      setErrorMessage(null);
      setPgnText("");
      onClose();
    } else {
      setErrorMessage("Invalid PGN format. Please verify the move syntax.");
    }
  };

  const handleFetchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage("Please enter a username.");
      return;
    }

    setIsLoadingFetch(true);
    setErrorMessage(null);

    try {
      const fetchedPgn = await fetchLatestGame(platform, username);
      const success = onLoadPgn(fetchedPgn);
      if (success) {
        setUsername("");
        onClose();
      } else {
        setErrorMessage("Successfully fetched game, but the PGN notation could not be parsed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch game from online account.";
      setErrorMessage(msg);
    } finally {
      setIsLoadingFetch(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPgnText(content);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read the selected file.");
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setPgnText(SAMPLE_OPERA_GAME);
    setErrorMessage(null);
  };

  const quickUsers = [
    { name: "Hikaru", user: "hikaru", platform: "chesscom" as ChessPlatform },
    { name: "MagnusCarlsen", user: "magnuscarlsen", platform: "chesscom" as ChessPlatform },
    { name: "DrNykterstein", user: "drnykterstein", platform: "lichess" as ChessPlatform },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-pgn-title"
        className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent-green" />
            <h2 id="import-pgn-title" className="font-bold text-base text-foreground">
              Import Chess Game
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-card-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border bg-[#151412] px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("manual");
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
              activeTab === "manual"
                ? "border-accent-green text-white bg-card"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste / Upload PGN
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("fetch");
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
              activeTab === "fetch"
                ? "border-accent-green text-white bg-card"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            Fetch Online Game
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Manual / Upload */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="pgn-input"
                  className="text-xs font-semibold text-neutral-300"
                >
                  Paste PGN Notation:
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs font-semibold text-accent-green hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Load Morphy Opera Game
                </button>
              </div>
              <textarea
                id="pgn-input"
                rows={7}
                value={pgnText}
                onChange={(e) => {
                  setPgnText(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder={`[Event "Casual Game"]\n[White "Player 1"]\n[Black "Player 2"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...`}
                className="w-full bg-[#1a1917] border border-border rounded-xl p-3 text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-accent-green transition-colors resize-none"
              />
            </div>

            {/* File Upload Alternative */}
            <div>
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border hover:border-neutral-500 rounded-xl cursor-pointer bg-card-hover/20 hover:bg-card-hover/40 transition-colors">
                <Upload className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-medium text-neutral-300">
                  Or upload a .pgn file from your computer
                </span>
                <input
                  type="file"
                  accept=".pgn,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-card-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-accent-green hover:bg-accent-green-hover text-white shadow-md transition-all active:scale-95"
              >
                Load Game
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Online Fetch */}
        {activeTab === "fetch" && (
          <form onSubmit={handleFetchSubmit} className="p-5 space-y-4">
            {/* Platform Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Select Platform:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlatform("chesscom")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    platform === "chesscom"
                      ? "border-accent-green bg-accent-green/10 text-white shadow-sm"
                      : "border-border bg-[#1a1917] text-neutral-400 hover:text-white"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Chess.com
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("lichess")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    platform === "lichess"
                      ? "border-accent-green bg-accent-green/10 text-white shadow-sm"
                      : "border-border bg-[#1a1917] text-neutral-400 hover:text-white"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Lichess.org
                </button>
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label
                htmlFor="username-input"
                className="block text-xs font-semibold text-neutral-300 mb-2"
              >
                Enter {platform === "chesscom" ? "Chess.com" : "Lichess"} Username:
              </label>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g. hikaru, magnuscarlsen..."
                className="w-full bg-[#1a1917] border border-border rounded-xl px-3 py-2.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-accent-green transition-colors"
              />
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <span className="block text-[11px] text-neutral-400 mb-1.5 font-medium">
                Try a famous player:
              </span>
              <div className="flex flex-wrap gap-2">
                {quickUsers.map((item) => (
                  <button
                    key={item.user}
                    type="button"
                    onClick={() => {
                      setPlatform(item.platform);
                      setUsername(item.user);
                      setErrorMessage(null);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-card-hover hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
                  >
                    {item.name} ({item.platform})
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-card-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoadingFetch}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-accent-green hover:bg-accent-green-hover disabled:opacity-60 text-white shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                {isLoadingFetch ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Fetching Game...
                  </>
                ) : (
                  "Fetch Latest Game"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
