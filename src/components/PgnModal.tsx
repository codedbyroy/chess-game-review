"use client";

import React, { useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { SAMPLE_OPERA_GAME } from "@/lib/pgn-parser";

interface PgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPgn: (pgn: string) => boolean; // returns true if success
}

export const PgnModal: React.FC<PgnModalProps> = ({
  isOpen,
  onClose,
  onLoadPgn,
}) => {
  const [pgnText, setPgnText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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
              Import PGN Game
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

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
                className="text-xs font-semibold text-accent-green hover:underline"
              >
                Insert Sample Game (Morphy 1858)
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
      </div>
    </div>
  );
};
