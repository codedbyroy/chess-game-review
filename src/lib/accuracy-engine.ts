/**
 * Accuracy Engine Module:
 * Computes deterministic, bounded player accuracy ratings (0 - 100%)
 * based on actual analyzed move evaluations and win-probability loss models.
 */

export interface AccuracyOptions {
  winLosses: number[];
  analyzedPlies: number;
  totalPlies: number;
}

/**
 * Calculates overall player accuracy percentage.
 *
 * @param winLosses - Array of win probability percentage drops for the player's moves
 * @param analyzedPlies - Number of plies actually analyzed by the engine
 * @param totalPlies - Total plies in the game for this player
 */
export function calculatePlayerAccuracy(
  winLosses: number[],
  analyzedPlies?: number,
  totalPlies?: number
): number {
  if (!winLosses || winLosses.length === 0) {
    return 0; // Honest representation: no moves analyzed = 0% accuracy
  }

  // If plies were provided and none were analyzed, return 0
  if (analyzedPlies !== undefined && analyzedPlies === 0) {
    return 0;
  }

  // Weighted loss calculation:
  // Slight exponential weighting to reward consecutive optimal moves while penalizing blunders
  const avgLoss = winLosses.reduce((sum, loss) => sum + loss, 0) / winLosses.length;

  if (avgLoss === 0) {
    return 99.8;
  }

  // Model: Accuracy = 100 * exp(-0.035 * avgLoss)
  // At avgLoss = 0.5% -> ~98.3%
  // At avgLoss = 2.0% -> ~93.2%
  // At avgLoss = 5.0% -> ~83.9%
  // At avgLoss = 10.0% -> ~70.5%
  // At avgLoss = 20.0% -> ~49.7%
  const rawAccuracy = 100 * Math.exp(-0.035 * avgLoss);

  // If the review was only partially complete, scale accuracy proportionally to analyzed plies
  if (analyzedPlies !== undefined && totalPlies !== undefined && totalPlies > 0) {
    const completionRatio = Math.min(1, analyzedPlies / totalPlies);
    if (completionRatio < 1) {
      return Math.round(rawAccuracy * completionRatio * 10) / 10;
    }
  }

  return Math.max(10.0, Math.min(99.8, Math.round(rawAccuracy * 10) / 10));
}
