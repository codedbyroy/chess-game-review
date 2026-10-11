import React from "react";

interface PlayerCardProps {
  color: "w" | "b";
  name?: string;
  rating?: string;
  isTurn?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  color,
  name = "Player",
  rating,
  isTurn = false,
}) => {
  const isWhite = color === "w";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
        isTurn
          ? "bg-card border-accent-green shadow-sm"
          : "bg-card/70 border-border"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-md border ${
            isWhite
              ? "bg-[#eeeed2] text-neutral-900 border-neutral-300"
              : "bg-[#2b2926] text-white border-neutral-700"
          }`}
        >
          {isWhite ? "W" : "B"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">{name}</span>
            {rating && (
              <span className="text-xs text-neutral-400 font-mono">
                ({rating})
              </span>
            )}
          </div>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
            {isWhite ? "White Pieces" : "Black Pieces"}
          </span>
        </div>
      </div>

      {isTurn && (
        <span className="text-[10px] font-bold text-accent-green bg-accent-green/10 border border-accent-green/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
          To Move
        </span>
      )}
    </div>
  );
};
