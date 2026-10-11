/**
 * Chess.com-Style Game Review Engine
 * Handles Win Probability Mapping, Move Classifications, and Accuracy % Calculations.
 */

export class GameReviewEngine {
  /**
   * Converts centipawn score to expected win probability percentage (0 - 100).
   * Formula: Win% = 50 + 50 * (2 / (1 + exp(-0.004 * cp)) - 1)
   */
  static centipawnsToWinChance(cp) {
    if (cp === null || cp === undefined) return 50;
    // Cap centipawns between -2000 and 2000
    const clampedCp = Math.max(-2000, Math.min(2000, cp));
    const winProb = 50 + 50 * (2 / (1 + Math.exp(-0.0035 * clampedCp)) - 1);
    return Math.max(0, Math.min(100, winProb));
  }

  /**
   * Analyzes an entire game moves array using Stockfish position evaluations.
   * Classifies moves and calculates player accuracies.
   */
  static analyzeGame(moves, evalResults) {
    let whiteWinProbLosses = [];
    let blackWinProbLosses = [];

    const classifiedMoves = [];

    // Book move names for opening identification
    const bookMovesCount = Math.min(6, moves.length);

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const prevEval = i === 0 ? { cp: 0 } : evalResults[i - 1];
      const currEval = evalResults[i];

      const turn = move.turn; // 'w' or 'b'

      // Calculate Win Probabilities before & after move
      const prevWinProbWhite = this.centipawnsToWinChance(prevEval.cp);
      const currWinProbWhite = this.centipawnsToWinChance(currEval.cp);

      // Win Prob from active player's perspective
      const winBefore = turn === 'w' ? prevWinProbWhite : 100 - prevWinProbWhite;
      const winAfter = turn === 'w' ? currWinProbWhite : 100 - currWinProbWhite;
      const winDelta = winAfter - winBefore; // Negative value = drop in win chance

      const winLoss = Math.max(0, -winDelta);
      if (turn === 'w') whiteWinProbLosses.push(winLoss);
      else blackWinProbLosses.push(winLoss);

      // Classification Logic
      let classification = {
        name: 'Good',
        key: 'good',
        icon: '',
        color: 'var(--color-good)',
        commentary: ''
      };

      if (i < bookMovesCount && winLoss < 2) {
        classification = {
          name: 'Book',
          key: 'book',
          icon: '📖',
          color: 'var(--color-book)',
          commentary: `Theoretical opening move.`
        };
      } else if (winLoss <= 1.5) {
        // Check if piece sacrifice occurred for Brilliant move
        const isSacrifice = move.captured === null && ['n', 'b', 'r', 'q'].includes(move.piece) && winBefore >= 40;
        if (isSacrifice && winLoss <= 0.5) {
          classification = {
            name: 'Brilliant',
            key: 'brilliant',
            icon: '‼️',
            color: 'var(--color-brilliant)',
            commentary: `Brilliant move! A tactical piece sacrifice that maintains complete control.`
          };
        } else {
          classification = {
            name: 'Best',
            key: 'best',
            icon: '⭐',
            color: 'var(--color-best)',
            commentary: `The strongest engine move in the position.`
          };
        }
      } else if (winLoss <= 4.0) {
        classification = {
          name: 'Excellent',
          key: 'excellent',
          icon: '👍',
          color: 'var(--color-excellent)',
          commentary: `An excellent move maintaining a solid position.`
        };
      } else if (winLoss <= 8.0) {
        classification = {
          name: 'Good',
          key: 'good',
          icon: '',
          color: 'var(--color-good)',
          commentary: `A good practical move.`
        };
      } else if (winLoss <= 15.0) {
        classification = {
          name: 'Inaccuracy',
          key: 'inaccuracy',
          icon: '❓',
          color: 'var(--color-inaccuracy)',
          commentary: `An inaccuracy. Missed a slightly more active continuation.`
        };
      } else if (winLoss <= 25.0) {
        classification = {
          name: 'Mistake',
          key: 'mistake',
          icon: '❓❓',
          color: 'var(--color-mistake)',
          commentary: `A mistake! Gives up a noticeable portion of advantage.`
        };
      } else {
        // Check if Miss vs Blunder
        if (winBefore >= 65 && winAfter <= 45) {
          classification = {
            name: 'Miss',
            key: 'miss',
            icon: '⚠️',
            color: 'var(--color-miss)',
            commentary: `Missed opportunity! A tactical win or advantage was overlooked.`
          };
        } else {
          classification = {
            name: 'Blunder',
            key: 'blunder',
            icon: '❌',
            color: 'var(--color-blunder)',
            commentary: `Blunder! A severe error that significantly alters the position.`
          };
        }
      }

      classifiedMoves.push({
        ...move,
        eval: currEval,
        winProbWhite: currWinProbWhite,
        winDelta: winDelta,
        classification: classification
      });
    }

    // Calculate Overall Player Accuracy Scores (0 - 100%)
    const whiteAccuracy = this.calculateAccuracyScore(whiteWinProbLosses);
    const blackAccuracy = this.calculateAccuracyScore(blackWinProbLosses);

    return {
      classifiedMoves,
      whiteAccuracy,
      blackAccuracy
    };
  }

  /**
   * Calculates overall accuracy % based on expected win percentage loss harmonic mean.
   */
  static calculateAccuracyScore(losses) {
    if (!losses || losses.length === 0) return 100;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
    // Non-linear decay mapping avg win loss to 0-100% accuracy
    const rawAcc = 100 * Math.exp(-0.035 * avgLoss);
    return Math.max(10, Math.min(99.8, Math.round(rawAcc * 10) / 10));
  }
}
