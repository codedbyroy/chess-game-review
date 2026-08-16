/**
 * Lightweight, zero-dependency Chess Engine & PGN Parser ES Module.
 * Handles FEN state, legal move validation, SAN generation, and PGN parsing.
 */

export class Chess {
  constructor(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
    this.load(fen);
  }

  load(fen) {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    const parts = fen.trim().split(/\s+/);
    const rows = parts[0].split('/');
    
    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const char of rows[r]) {
        if (/\d/.test(char)) {
          c += parseInt(char, 10);
        } else {
          const color = char === char.toUpperCase() ? 'w' : 'b';
          const type = char.toLowerCase();
          this.board[r][c] = { type, color };
          c++;
        }
      }
    }

    this.turn = parts[1] || 'w';
    this.castling = parts[2] || 'KQkq';
    this.epSquare = parts[3] || '-';
    this.halfMoves = parseInt(parts[4] || '0', 10);
    this.fullMoves = parseInt(parts[5] || '1', 10);
    this.history = [];
  }

  fen() {
    let fenRows = [];
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      let rowStr = '';
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (!piece) {
          empty++;
        } else {
          if (empty > 0) {
            rowStr += empty;
            empty = 0;
          }
          rowStr += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
        }
      }
      if (empty > 0) rowStr += empty;
      fenRows.push(rowStr);
    }
    return `${fenRows.join('/')} ${this.turn} ${this.castling} ${this.epSquare} ${this.halfMoves} ${this.fullMoves}`;
  }

  get(square) {
    const { r, c } = this.squareToCoords(square);
    return this.board[r][c];
  }

  squareToCoords(square) {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1], 10);
    return { r: rank, c: file };
  }

  coordsToSquare(r, c) {
    const file = String.fromCharCode(97 + c);
    const rank = 8 - r;
    return `${file}${rank}`;
  }

  /**
   * Parses PGN text into game metadata and array of move objects.
   */
  static parsePgn(pgnText) {
    const result = {
      headers: {},
      moves: [],
      error: null
    };

    try {
      // 1. Extract Headers
      const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
      let match;
      while ((match = headerRegex.exec(pgnText)) !== null) {
        result.headers[match[1]] = match[2];
      }

      // 2. Strip comments and headers
      let moveText = pgnText
        .replace(/\[.*?\]/g, '') // remove headers
        .replace(/\{.*?\}|\(.*?\)/g, '') // remove comments / variations
        .replace(/;.*$/gm, '') // remove line comments
        .replace(/\d+\.+/g, ' ') // remove move numbers
        .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // remove result strings
        .trim();

      // Split into SAN move tokens
      const sanTokens = moveText.split(/\s+/).filter(t => t.length > 0);

      const game = new Chess();
      let moveNumber = 1;

      for (let i = 0; i < sanTokens.length; i++) {
        const san = sanTokens[i];
        const fenBefore = game.fen();
        const moveObj = game.makeSanMove(san);

        if (!moveObj) {
          break; // Stop if unparseable move encountered
        }

        moveObj.san = san;
        moveObj.fenBefore = fenBefore;
        moveObj.fenAfter = game.fen();
        moveObj.moveNum = Math.floor(i / 2) + 1;
        moveObj.turn = i % 2 === 0 ? 'w' : 'b';

        result.moves.push(moveObj);
      }
    } catch (err) {
      result.error = err.message;
    }

    return result;
  }

  makeSanMove(san) {
    const cleanSan = san.replace(/[+#?!]/g, '');
    const turn = this.turn;
    const oppColor = turn === 'w' ? 'b' : 'w';

    let fromR = -1, fromC = -1, toR = -1, toC = -1, promo = null;

    // Castling
    if (cleanSan === 'O-O' || cleanSan === '0-0') {
      fromR = turn === 'w' ? 7 : 0;
      fromC = 4;
      toR = fromR;
      toC = 6;
    } else if (cleanSan === 'O-O-O' || cleanSan === '0-0-0') {
      fromR = turn === 'w' ? 7 : 0;
      fromC = 4;
      toR = fromR;
      toC = 2;
    } else {
      // Regular Move Parsing
      let sanPart = cleanSan;
      if (sanPart.includes('=')) {
        const split = sanPart.split('=');
        sanPart = split[0];
        promo = split[1].toLowerCase();
      }

      let pieceType = 'p';
      if (/^[NBKRQ]/.test(sanPart)) {
        pieceType = sanPart[0].toLowerCase();
        sanPart = sanPart.slice(1);
      }

      sanPart = sanPart.replace('x', '');
      const destSquare = sanPart.slice(-2);
      const disambig = sanPart.slice(0, -2);

      const destCoords = this.squareToCoords(destSquare);
      toR = destCoords.r;
      toC = destCoords.c;

      // Find matching source piece
      let candidates = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (p && p.color === turn && p.type === pieceType) {
            if (this.canPieceMoveTo(r, c, toR, toC, p.type)) {
              candidates.push({ r, c });
            }
          }
        }
      }

      // Filter by disambiguation
      if (disambig.length > 0) {
        if (/^[a-h]/.test(disambig)) {
          const file = disambig[0].charCodeAt(0) - 97;
          candidates = candidates.filter(cand => cand.c === file);
        }
        if (/\d/.test(disambig)) {
          const rank = 8 - parseInt(disambig.slice(-1), 10);
          candidates = candidates.filter(cand => cand.r === rank);
        }
      }

      if (candidates.length === 0) return null;
      fromR = candidates[0].r;
      fromC = candidates[0].c;
    }

    // Execute Move on Board
    const movedPiece = this.board[fromR][fromC];
    const capturedPiece = this.board[toR][toC];

    this.board[toR][toC] = promo ? { type: promo, color: turn } : movedPiece;
    this.board[fromR][fromC] = null;

    // Handle Castle Rook Move
    if (cleanSan === 'O-O' || cleanSan === '0-0') {
      const r = fromR;
      this.board[r][5] = this.board[r][7];
      this.board[r][7] = null;
    } else if (cleanSan === 'O-O-O' || cleanSan === '0-0-0') {
      const r = fromR;
      this.board[r][3] = this.board[r][0];
      this.board[r][0] = null;
    }

    // Update Turn
    this.turn = oppColor;
    if (turn === 'b') this.fullMoves++;

    return {
      from: this.coordsToSquare(fromR, fromC),
      to: this.coordsToSquare(toR, toC),
      piece: movedPiece ? movedPiece.type : 'p',
      captured: capturedPiece ? capturedPiece.type : null,
      promotion: promo
    };
  }

  canPieceMoveTo(fr, fc, tr, tc, pieceType) {
    const dr = tr - fr;
    const dc = tc - fc;

    if (fr === tr && fc === tc) return false;

    switch (pieceType) {
      case 'p': {
        const dir = this.turn === 'w' ? -1 : 1;
        const startRank = this.turn === 'w' ? 6 : 1;
        
        // Single forward
        if (fc === tc && tr === fr + dir && !this.board[tr][tc]) return true;
        // Double forward
        if (fc === tc && fr === startRank && tr === fr + 2 * dir && !this.board[fr + dir][tc] && !this.board[tr][tc]) return true;
        // Capture
        if (Math.abs(dc) === 1 && tr === fr + dir && (this.board[tr][tc] || this.coordsToSquare(tr, tc) === this.epSquare)) return true;
        return false;
      }
      case 'n':
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'b':
        return Math.abs(dr) === Math.abs(dc) && this.isClearPath(fr, fc, tr, tc);
      case 'r':
        return (fr === tr || fc === tc) && this.isClearPath(fr, fc, tr, tc);
      case 'q':
        return (fr === tr || fc === tc || Math.abs(dr) === Math.abs(dc)) && this.isClearPath(fr, fc, tr, tc);
      case 'k':
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
      default:
        return false;
    }
  }

  isClearPath(fr, fc, tr, tc) {
    const stepR = Math.sign(tr - fr);
    const stepC = Math.sign(tc - fc);
    let currR = fr + stepR;
    let currC = fc + stepC;

    while (currR !== tr || currC !== tc) {
      if (this.board[currR][currC]) return false;
      currR += stepR;
      currC += stepC;
    }
    return true;
  }
}
