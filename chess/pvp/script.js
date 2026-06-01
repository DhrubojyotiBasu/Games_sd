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

// New Takeback Overlay Elements
const takebackOverlay       = document.getElementById('takebackOverlay');
const takebackPromptText    = document.getElementById('takebackPromptText');
const approveTakebackBtn    = document.getElementById('approveTakebackBtn');
const declineTakebackBtn    = document.getElementById('declineTakebackBtn');

// ── Game Over Overlay ─────────────────────────────────────────────────────────

function showGameOver(type, title, sub) {
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
let playerColor       = 'w'; // Board orientation choice
let gameStarted       = false;   

let selectedTimerSeconds = 300;
let boardScore = { white: 0, black: 0 };
let timerValues = { white: 300, black: 300 };
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
  playerTimerLabel.textContent   = 'White Time';
  opponentTimerLabel.textContent = 'Black Time';
}

function updateTimerDisplay() {
  playerTimerValue.textContent   = formatTime(timerValues.white);
  opponentTimerValue.textContent = formatTime(timerValues.black);
  updateTimerLabels();
  playerTimerItem.classList.toggle('active', activeTimerSide === 'white');
  opponentTimerItem.classList.toggle('active', activeTimerSide === 'black');
}

function endByTimeout(loser) {
  stopTimer();
  const isWhite = loser === 'white';
  statusElement.textContent = isWhite ? 'Black won on time.' : 'White won on time.';
  showGameOver(
    'lose',
    isWhite ? 'Black Wins!' : 'White Wins!',
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

function startTimerForCurrentTurn() {
  if (!gameStarted) return;          
  activeTimerSide = game.turn() === 'w' ? 'white' : 'black';
  stopTimer();
  if (selectedTimerSeconds !== 0) timerInterval = setInterval(tickTimer, 1000);
  updateTimerDisplay();
}

function resetTimers() {
  applyTimerSelection();
  timerValues = { white: selectedTimerSeconds, black: selectedTimerSeconds };
  activeTimerSide = null;
  stopTimer();
  updateTimerDisplay();
}

function maybeStartTimerAfterMove() {
  if (game.game_over()) { stopTimer(); return; }
  startTimerForCurrentTurn();
}

function handleTimerSelectionChange() {
  applyTimerSelection();
  resetTimers();
}

// ── Scoreboard ────────────────────────────────────────────────────────────────

function updateScoreboard() {
  playerScoreValue.textContent   = boardScore.white;
  opponentScoreValue.textContent = boardScore.black;
  playerScoreLabel.textContent   = 'White (P1)';
  opponentScoreLabel.textContent = 'Black (P2)';
}

function updateTakebackButton() {
  // Requires at least 1 full half-moves played globally to perform a double-step undo
  const canTakeback = gameStarted && game.history().length >= 1;
  takebackButton.disabled = !canTakeback;
}

// ── Move History Helper ────────────────────────────────────────────────────────
function updateMoveHistory() {
  const history = game.history();
  if (history.length === 0) {
    moveHistoryContainer.innerHTML = '<div class="move-list-empty">No moves played yet</div>';
    return;
  }

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
  moveHistoryContainer.scrollTop = moveHistoryContainer.scrollHeight;
}

// ── Takeback Request Handling ─────────────────────────────────────────────────

function initiateTakebackRequest() {
  if (!gameStarted) return;
  
  // Identify who is asking based on whose turn it is currently
  const currentTurn = game.turn();
  const requester = currentTurn === 'w' ? 'White' : 'Black';
  const approver = currentTurn === 'w' ? 'Black' : 'White';

  takebackPromptText.textContent = `${requester} requests a takeback. Does ${approver} approve?`;
  takebackOverlay.classList.remove('hidden');
}

function executeApprovedTakeback() {
  takebackOverlay.classList.add('hidden');
  
  // Revert 1 half-move
  const currentTurnBeforeUndo = game.turn();   
  const undone = game.undo();   
  if (!undone) return;

  // Reverse capture calculation matrices
  if (undone.captured) {
    const pts = pieceValues[undone.captured.toLowerCase()] || 0;
    // If it was White's turn before undoing, Black was the one who made the move 
    // and earned points. We must deduct it from Black's score.
    if (currentTurnBeforeUndo === 'w') {
      boardScore.black = Math.max(0, boardScore.black - pts);
    } else {
      boardScore.white = Math.max(0, boardScore.white - pts);
    }
  }

  selectedSquare = null;
  legalSquares   = [];
  updateScoreboard();
  updateTakebackButton();
  updateMoveHistory();
  renderBoard();
  
  // Re-sync and restart the timer for the rolled-back turn
  startTimerForCurrentTurn();
}

// ── Board rendering ───────────────────────────────────────────────────────────

function getBoardOrientation() {
  if (playerColor === 'w')
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
  computerColorInfo.textContent = `Local Pass & Play Mode Active.`;
}

function updateStatus() {
  if (!gameStarted) { statusElement.textContent = 'Press Start to begin'; return; }
  
  if (game.in_checkmate()) {
    const whiteWon = game.turn() === 'b';
    statusElement.textContent = whiteWon ? 'Checkmate! White wins.' : 'Checkmate! Black wins.';
    showGameOver(
      'win',
      whiteWon ? 'White Wins!' : 'Black Wins!',
      'Checkmate'
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
  
  const currentTurnText = game.turn() === 'w' ? "White's move" : "Black's move";
  const check = game.in_check() ? ' - Check!' : '';
  
  statusElement.textContent = `${currentTurnText}${check}`;
}

// ── Move handling ─────────────────────────────────────────────────────────────

function handleSquareClick(square) {
  if (!gameStarted) return; 
  const piece = game.get(square);
  if (selectedSquare && legalSquares.includes(square)) {
    makeMove(selectedSquare, square);
    return;
  }
  if (piece && piece.color === game.turn()) {
    selectedSquare = square;
    legalSquares   = game.moves({ square, verbose: true }).map(m => m.to);
  } else { selectedSquare = null; legalSquares = []; }
  renderBoard();
}

function makeMove(from, to) {
  const move = game.move({ from, to, promotion: 'q' });
  if (!move) return;
  
  selectedSquare = null; 
  legalSquares = [];
  
  // Points logic based on color that just moved
  if (move.captured) {
    const pts = pieceValues[move.captured.toLowerCase()] || 0;
    if (game.turn() === 'b') boardScore.white += pts; // turn already flipped
    else                     boardScore.black += pts;
  }
  
  updateScoreboard();
  updateMoveHistory();
  renderBoard();
  maybeStartTimerAfterMove();
}

// ── Start game logic ──────────────────────────────────────────────────────────

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  startButton.classList.add('hidden');
  updateStatus();
  startTimerForCurrentTurn();
}

// ── Game reset ────────────────────────────────────────────────────────────────

function resetGame() {
  hideGameOver();
  takebackOverlay.classList.add('hidden');
  gameStarted = false;
  boardScore.white = 0; boardScore.black = 0;
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
takebackButton.addEventListener('click', initiateTakebackRequest);
timerSelect.addEventListener('change', handleTimerSelectionChange);

// Takeback overlay actions
approveTakebackBtn.addEventListener('click', executeApprovedTakeback);
declineTakebackBtn.addEventListener('click', () => takebackOverlay.classList.add('hidden'));

// ── Init ──────────────────────────────────────────────────────────────────────

getSelectedPlayerColor();
resetGame();