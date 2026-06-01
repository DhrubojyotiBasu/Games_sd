const boardElement            = document.getElementById('board');
const statusElement           = document.getElementById('status');
const newGameButton           = document.getElementById('newGameButton');
const takebackButton          = document.getElementById('takebackButton');
const startButton             = document.getElementById('startButton');
const computerColorInfo       = document.getElementById('computerColorInfo');
const playerScoreLabel        = document.getElementById('playerScoreLabel');
const playerScoreValue        = document.getElementById('playerScoreValue');
const opponentScoreLabel      = document.getElementById('opponentScoreLabel');
const opponentScoreValue      = document.getElementById('opponentScoreValue');
const timerSelect             = document.getElementById('timerSelect');
const playerTimerLabel        = document.getElementById('playerTimerLabel');
const playerTimerValue        = document.getElementById('playerTimerValue');
const opponentTimerLabel      = document.getElementById('opponentTimerLabel');
const opponentTimerValue      = document.getElementById('opponentTimerValue');
const playerTimerItem         = document.getElementById('playerTimerItem');
const opponentTimerItem       = document.getElementById('opponentTimerItem');
const moveHistoryContainer    = document.getElementById('moveHistory');

const gameOverOverlay   = document.getElementById('gameOverOverlay');
const gameOverIcon      = document.getElementById('gameOverIcon');
const gameOverTitle     = document.getElementById('gameOverTitle');
const gameOverSub       = document.getElementById('gameOverSub');
const gameOverNewGame   = document.getElementById('gameOverNewGame');

// ── Game Over Overlay ─────────────────────────────────────────────────────────

function showGameOver(type, title, sub) {
  // type: 'win' | 'lose' | 'draw'
  const icons = { win: 'W', lose: 'L', draw: '=' };
  gameOverIcon.textContent  = icons[type] || '!';
  gameOverTitle.textContent = title;
  gameOverTitle.className   = `gameover-title ${type}`;
  gameOverSub.textContent   = sub || '';
  gameOverOverlay.classList.remove('hidden');
}

function hideGameOver() {
  gameOverOverlay.classList.add('hidden');
}

gameOverNewGame.addEventListener('click', () => {
  hideGameOver();
  resetGame();
});

// ── Piece config ──────────────────────────────────────────────────────────────

const pieceValues  = { p:1, n:3, b:3, r:5, q:9, k:0 };
const PIECE_URL = {
  wK: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  wQ: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wR: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wB: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wN: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wP: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  bK: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
  bQ: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  bR: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bB: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  bN: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bP: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
};

// ── State ─────────────────────────────────────────────────────────────────────

const game = new Chess();
let selectedSquare    = null;
let legalSquares      = [];
let playerColor       = 'w';
let computerColor     = 'b';
let gameStarted       = false;   // tracks whether Start was pressed

let selectedTimerSeconds = 300;
let boardScore = { player: 0, opponent: 0 };
let timerValues = { player:300, opponent:300 };
let activeTimerSide = null;
let timerInterval   = null;

// ── Timer helpers ─────────────────────────────────────────────────────────────

function applyTimerSelection() {
  selectedTimerSeconds = parseInt(timerSelect.value, 10);
  if (Number.isNaN(selectedTimerSeconds)) selectedTimerSeconds = 300;
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function formatTime(s) {
  if (selectedTimerSeconds === 0) return 'No limit';
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function updateTimerLabels() {
  playerTimerLabel.textContent   = 'Your time';
  opponentTimerLabel.textContent = 'Computer time';
}

function updateTimerDisplay() {
  const pSec = timerValues.player;
  const oSec = timerValues.opponent;
  playerTimerValue.textContent   = formatTime(pSec);
  opponentTimerValue.textContent = formatTime(oSec);
  updateTimerLabels();
  playerTimerItem.classList.toggle('active', activeTimerSide === 'player');
  opponentTimerItem.classList.toggle('active', activeTimerSide === 'opponent');
}

function endByTimeout(loser) {
  stopTimer();
  const youLost = loser === 'player';
  statusElement.textContent = youLost ? 'Computer won on time.' : 'You won on time.';
  showGameOver(
    youLost ? 'lose' : 'win',
    youLost ? 'You Lose' : 'You Win!',
    'Time out'
  );
}

function tickTimer() {
  if (!activeTimerSide) return;
  if (timerValues[activeTimerSide] <= 0) { endByTimeout(activeTimerSide); return; }
  timerValues[activeTimerSide] -= 1;
  if (timerValues[activeTimerSide] <= 0) endByTimeout(activeTimerSide);
  updateTimerDisplay();
}

function getTimerSideForCurrentTurn() {
  return game.turn() === playerColor ? 'player' : 'opponent';
}

function startTimerForSide(side) {
  activeTimerSide = side;
  stopTimer();
  if (selectedTimerSeconds !== 0) timerInterval = setInterval(tickTimer, 1000);
  updateTimerDisplay();
}

function startTimerForCurrentTurn() {
  if (!gameStarted) return;          // only tick once started
  startTimerForSide(getTimerSideForCurrentTurn());
}

function resetTimers() {
  applyTimerSelection();
  timerValues = {
    player: selectedTimerSeconds,
    opponent: selectedTimerSeconds,
  };
  activeTimerSide = null;
  stopTimer();
  updateTimerDisplay();
}

function maybeStartTimerAfterMove() {
  if (game.game_over()) { stopTimer(); return; }
  startTimerForCurrentTurn();
}

function setTimerControlState() {
  timerSelect.disabled = false;
}

function handleTimerSelectionChange() {
  applyTimerSelection();
  resetTimers();
}

// ── Scoreboard ────────────────────────────────────────────────────────────────

function updateScoreboard() {
  playerScoreValue.textContent   = boardScore.player;
  opponentScoreValue.textContent = boardScore.opponent;
  playerScoreLabel.textContent   = 'You';
  opponentScoreLabel.textContent = 'Computer';
}

function updateTakebackButton() {
  // Only available in vs-computer mode, after game has started, with moves to undo
  const canTakeback = gameStarted && game.history().length >= 2;
  takebackButton.disabled = !canTakeback;
}

// ── Move History Helper ────────────────────────────────────────────────────────
function updateMoveHistory() {
  const history = game.history();
  if (history.length === 0) {
    moveHistoryContainer.innerHTML = '<div class="move-list-empty">No moves played yet</div>';
    return;
  }

  // Create table grid structure
  let html = `
    <div class="move-list">
      <div class="move-list-header">#</div>
      <div class="move-list-header">White</div>
      <div class="move-list-header">Black</div>
  `;

  for (let i = 0; i < history.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const whiteMove = history[i];
    const blackMove = history[i + 1] || '';

    html += `
      <div class="move-num">${moveNum}.</div>
      <div class="move-notation">${whiteMove}</div>
      <div class="move-notation">${blackMove}</div>
    `;
  }

  html += '</div>';
  moveHistoryContainer.innerHTML = html;

  // Auto-scroll the move history viewport to the bottom so the latest moves are always visible
  moveHistoryContainer.scrollTop = moveHistoryContainer.scrollHeight;
}

function doTakeback() {
  if (!gameStarted) return;
  // Undo the computer's last move + the player's last move (2 half-moves)
  const undone1 = game.undo();   // computer's move
  const undone2 = game.undo();   // player's move
  if (!undone1 && !undone2) return;

  // Reverse capture points
  if (undone1 && undone1.captured) {
    const pts = pieceValues[undone1.captured.toLowerCase()] || 0;
    boardScore.opponent = Math.max(0, boardScore.opponent - pts);
  }
  if (undone2 && undone2.captured) {
    const pts = pieceValues[undone2.captured.toLowerCase()] || 0;
    boardScore.player = Math.max(0, boardScore.player - pts);
  }

  // Cancel any pending Stockfish reply
  if (sfMoveCallback) sfMoveCallback = null;
  if (stockfish) sendToStockfish('stop');

  selectedSquare = null;
  legalSquares   = [];
  updateScoreboard();
  updateTakebackButton();
  updateMoveHistory();
  renderBoard();
  startTimerForCurrentTurn();
}

function addCapturePoints(move, mover) {
  if (!move || !move.captured) return;
  const pts = pieceValues[move.captured.toLowerCase()] || 0;
  if (mover === 'player' || mover === 'local') boardScore.player   += pts;
  else                                          boardScore.opponent += pts;
}

// ── Board rendering ───────────────────────────────────────────────────────────

function getBoardOrientation() {
  const ref = playerColor;
  if (ref === 'w')
    return { rankStart:8, rankEnd:1, rankStep:-1, fileStart:0, fileEnd:8,  fileStep:1  };
  return   { rankStart:1, rankEnd:8, rankStep:1,  fileStart:7, fileEnd:-1, fileStep:-1 };
}

function createBoard() {
  boardElement.innerHTML = '';
  const files = ['a','b','c','d','e','f','g','h'];
  const o = getBoardOrientation();
  for (let rank = o.rankStart; rank !== o.rankEnd + o.rankStep; rank += o.rankStep) {
    for (let file = o.fileStart; file !== o.fileEnd; file += o.fileStep) {
      const name = `${files[file]}${rank}`;
      const sq   = document.createElement('button');
      sq.type      = 'button';
      sq.className = `square ${(file + rank) % 2 === 0 ? 'dark' : 'light'}`;
      sq.dataset.square = name;
      sq.addEventListener('click', () => handleSquareClick(name));
      boardElement.appendChild(sq);
    }
  }
}

function renderBoard() {
  const board = game.board();
  document.querySelectorAll('.square').forEach((el) => {
    const name  = el.dataset.square;
    const file  = name.charCodeAt(0) - 97;
    const rank  = 8 - parseInt(name[1], 10);
    const piece = board[rank][file];
    if (piece) {
      const key = `${piece.color}${piece.type.toUpperCase()}`;
      el.innerHTML = `<img class="piece" src="${PIECE_URL[key]}" alt="${key}">`;
    } else {
      el.textContent = '';
    }
    el.classList.toggle('selected', selectedSquare === name);
    el.classList.toggle('legal',    legalSquares.includes(name));
  });
  updateStatus();
  updateTakebackButton();
}

function getSelectedPlayerColor() {
  const choice  = document.querySelector('input[name="playerColor"]:checked');
  playerColor   = choice ? choice.value : 'w';
  computerColor = playerColor === 'w' ? 'b' : 'w';
  computerColorInfo.textContent = `The computer plays ${computerColor === 'w' ? 'White' : 'Black'}.`;
}

function updateStatus() {
  if (!gameStarted) { statusElement.textContent = 'Press Start to begin'; return; }
  
  if (game.in_checkmate()) {
    const blackWins = game.turn() === 'w';
    statusElement.textContent = blackWins ? 'Checkmate! Black wins.' : 'Checkmate! White wins.';
    const playerLost = (blackWins && playerColor === 'w') || (!blackWins && playerColor === 'b');
    showGameOver(
      playerLost ? 'lose' : 'win',
      playerLost ? 'You Lose' : 'You Win!',
      `Checkmate - ${blackWins ? 'Black' : 'White'} wins`
    );
    return;
  }
  
  if (game.in_draw()) {
    statusElement.textContent = 'Draw!';
    const reason = game.in_stalemate()            ? 'Stalemate'
                 : game.insufficient_material()    ? 'Insufficient material'
                 : game.in_threefold_repetition()  ? 'Threefold repetition'
                 : 'Fifty-move rule';
    showGameOver('draw', "It's a Draw!", reason);
    return;
  }
  
  const isPlayerTurn = game.turn() === playerColor;
  const turnText = isPlayerTurn ? 'Your move' : 'Computer is thinking...';
  const check = game.in_check() ? ' - Check!' : '';
  
  statusElement.textContent = `${turnText}${check}`;
}

// ── Move handling ─────────────────────────────────────────────────────────────

function handleSquareClick(square) {
  if (!gameStarted) return;          // block moves until started
  const piece = game.get(square);
  if (selectedSquare && legalSquares.includes(square)) {
    makeMove(selectedSquare, square);
    return;
  }
  if (piece && piece.color === playerColor && piece.color === game.turn()) {
    selectedSquare = square;
    legalSquares   = game.moves({ square, verbose: true }).map(m => m.to);
  } else { selectedSquare = null; legalSquares = []; }
  renderBoard();
}

function makeMove(from, to) {
  const move = game.move({ from, to, promotion: 'q' });
  if (!move) return;
  selectedSquare = null; legalSquares = [];
  addCapturePoints(move, 'player');
  updateScoreboard();
  updateMoveHistory();
  renderBoard();
  maybeStartTimerAfterMove();
  if (!game.game_over()) {
    statusElement.textContent = 'Computer is thinking...';
    window.setTimeout(() => { if (!game.game_over()) makeComputerMove(); }, 2000);
  }
}

// ── Stockfish AI ──────────────────────────────────────────────────────────────

const STOCKFISH_CDN = 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16-single.js';
const STOCKFISH_WASM = STOCKFISH_CDN.replace(/\.js$/, '.wasm');
const STOCKFISH_OPTIONS = {
  hash: 64,
  threads: 1,
  contempt: 0,
  limitStrength: true,
};

let stockfish       = null;
let sfReady         = false;
let sfMoveCallback  = null;

const difficultySelect = document.getElementById('difficultySelect');

function getSkillLevel() {
  return parseInt(difficultySelect.value, 10);
}

function initStockfish() {
  if (stockfish) return;          // already loaded
  try {
    stockfish = new Worker(STOCKFISH_CDN);
  } catch (e) {
    // Some browsers block CDN Workers when loading pages from file://.
    // Use a blob worker and pass the WASM location in the worker URL hash.
    const blob = new Blob(
      [`importScripts('${STOCKFISH_CDN}');`],
      { type: 'application/javascript' }
    );
    const blobUrl = URL.createObjectURL(blob);
    stockfish = new Worker(`${blobUrl}#${encodeURIComponent(STOCKFISH_WASM)}`);
  }

  stockfish.onmessage = (evt) => {
    const line = typeof evt === 'string' ? evt : (evt.data || '');
    if (line === 'uciok' || line === 'readyok') { sfReady = true; }
    if (typeof line === 'string' && line.startsWith('bestmove')) {
      const parts = line.split(' ');
      const moveStr = parts[1];          // e.g. "e2e4" or "e7e8q"
      if (sfMoveCallback && moveStr && moveStr !== '(none)') {
        sfMoveCallback(moveStr);
        sfMoveCallback = null;
      }
    }
  };

  stockfish.onerror = (err) => {
    console.warn('Stockfish worker error:', err);
    stockfish = null; sfReady = false;
    fallbackComputerMove();
  };

  stockfish.postMessage('uci');
  stockfish.postMessage(`setoption name Hash value ${STOCKFISH_OPTIONS.hash}`);
  stockfish.postMessage(`setoption name Threads value ${STOCKFISH_OPTIONS.threads}`);
  stockfish.postMessage(`setoption name Contempt value ${STOCKFISH_OPTIONS.contempt}`);
  stockfish.postMessage(`setoption name UCI_LimitStrength value ${STOCKFISH_OPTIONS.limitStrength ? 'true' : 'false'}`);
  stockfish.postMessage('isready');
}

function sendToStockfish(msg) {
  if (stockfish) stockfish.postMessage(msg);
}

function makeComputerMove() {
  if (!gameStarted || game.turn() !== computerColor) return;
  initStockfish();

  const skill = getSkillLevel();
  const fen   = game.fen();

  // Skill Level (0–20): controls how often Stockfish intentionally plays a
  // sub-optimal move. We enable strength limiting for lower levels, but allow
  // full strength on the maximum level so master/difficult settings feel more
  // authentic.
  const skillLevelMap = { 1:0, 2:2, 3:4, 5:8, 8:11, 12:14, 18:17, 20:20 };

  // movetime (ms): let Stockfish search longer for harder levels.
  const movetimeMap = { 1:120, 2:220, 3:380, 5:700, 8:1200, 12:2000, 18:3200, 20:5000 };

  const sfSkill  = skillLevelMap[skill]  ?? 10;
  const movetime = movetimeMap[skill]    ?? 800;
  const useLimitedStrength = sfSkill < 20;

  sfMoveCallback = (uciMove) => {
    // Convert UCI string "e2e4" / "e7e8q" into chess.js move object
    const from      = uciMove.slice(0, 2);
    const to        = uciMove.slice(2, 4);
    const promotion = uciMove.length === 5 ? uciMove[4] : 'q';

    const m = game.move({ from, to, promotion });
    if (m) {
      addCapturePoints(m, 'opponent');
      updateScoreboard();
      updateMoveHistory();
      renderBoard();
      maybeStartTimerAfterMove();
    }
  };

  // setoption must come before position/go
  sendToStockfish(`setoption name UCI_LimitStrength value ${useLimitedStrength ? 'true' : 'false'}`);
  if (useLimitedStrength) {
    sendToStockfish(`setoption name Skill Level value ${sfSkill}`);
  }
  sendToStockfish(`position fen ${fen}`);
  sendToStockfish(`go movetime ${movetime}`);
}

// ── Fallback minimax (used only if Stockfish fails to load) ───────────────────

function fallbackComputerMove() {
  if (!gameStarted) return;
  const move = findBestMoveFallback(game, 2);
  if (move) {
    const m = game.move(move);
    addCapturePoints(m, 'opponent');
    updateScoreboard();
    updateMoveHistory();
    renderBoard();
    maybeStartTimerAfterMove();
  }
}

function evaluateBoard(pos) {
  if (pos.in_checkmate()) return pos.turn() === 'w' ? -9999 : 9999;
  if (pos.in_draw()) return 0;
  const vals = { p:100, n:320, b:330, r:500, q:900, k:20000 };
  let t = 0;
  pos.board().forEach(row => row.forEach(p => {
    if (!p) return;
    t += (p.color === 'w' ? 1 : -1) * vals[p.type];
  }));
  return t;
}

// Minimax with alpha-beta pruning
function minimax(pos, depth, alpha, beta, isMax) {
  if (depth === 0 || pos.game_over()) return evaluateBoard(pos);
  const moves = pos.moves({ verbose: true });
  if (isMax) {
    let best = -Infinity;
    for (const m of moves) {
      pos.move(m);
      const s = minimax(pos, depth-1, alpha, beta, false);
      pos.undo(); best = Math.max(best, s); alpha = Math.max(alpha, s);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    pos.move(m);
    const s = minimax(pos, depth-1, alpha, beta, true);
    pos.undo(); best = Math.min(best, s); beta = Math.min(beta, s);
    if (beta <= alpha) break;
  }
  return best;
}

function findBestMoveFallback(pos, depth) {
  const moves = pos.moves({ verbose: true });
  let bestMove = null, bestScore = -Infinity;
  for (const m of moves) {
    pos.move(m);
    const s = minimax(pos, depth-1, -Infinity, Infinity, false);
    pos.undo();
    if (s > bestScore) { bestScore = s; bestMove = m; }
  }
  return bestMove;
}

// ── Start game logic ──────────────────────────────────────────────────────────

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  startButton.classList.add('hidden');
  statusElement.textContent = 'Game started!';
  // Signal Stockfish to clear its hash for the new game (done once, not per move)
  if (stockfish) sendToStockfish('ucinewgame');
  startTimerForCurrentTurn();

  // If computer goes first (plays white)
  if (computerColor === 'w') {
    window.setTimeout(makeComputerMove, 240);
  }
}

// ── Game reset ────────────────────────────────────────────────────────────────

function resetGame() {
  hideGameOver();
  gameStarted = false;
  sfMoveCallback = null;
  if (stockfish) { sendToStockfish('stop'); sendToStockfish('ucinewgame'); }
  boardScore.player = 0; boardScore.opponent = 0;
  resetTimers();
  updateScoreboard();

  getSelectedPlayerColor();
  startButton.classList.remove('hidden');

  game.reset();
  selectedSquare = null; legalSquares = [];
  takebackButton.disabled = true;
  updateMoveHistory();
  createBoard();
  renderBoard();
}

// ── Event listeners ───────────────────────────────────────────────────────────

startButton.addEventListener('click', startGame);
newGameButton.addEventListener('click', () => resetGame());
takebackButton.addEventListener('click', doTakeback);
timerSelect.addEventListener('change', handleTimerSelectionChange);

// ── Init ──────────────────────────────────────────────────────────────────────

getSelectedPlayerColor();
setTimerControlState();
resetGame(false);
// Pre-warm Stockfish in the background so first move is fast
initStockfish();