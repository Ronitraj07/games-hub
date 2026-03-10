import React, { useEffect, useRef, useState } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Celebration } from '@/components/shared/Celebration';
import { playClick, playWin, playWrong, playMatch } from '@/utils/sounds';
import { Board } from './Board';
import { BoardState, GameStatus } from './types';
import { RotateCcw, ArrowLeft, Bot, Users, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────
type GameMode = 'solo' | 'local' | 'online';
type AIDifficulty = 'easy' | 'hard';

interface TicTacToeGameState {
  board: BoardState;
  currentPlayer: 'X' | 'O';          // whose symbol's turn it is
  playerX: string;                    // email or 'AI'
  playerO: string;
  winner: 'X' | 'O' | null;
  winningCells: number[] | null;
  status: GameStatus;
  isDraw: boolean;
  mode: GameMode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

const calculateWinner = (board: BoardState): { winner: 'X'|'O'|null; cells: number[]|null } => {
  for (const [a,b,c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a] as 'X'|'O', cells: [a,b,c] };
  }
  return { winner: null, cells: null };
};

// Minimax for hard AI
const minimax = (board: BoardState, isMax: boolean): number => {
  const { winner } = calculateWinner(board);
  if (winner === 'O') return  10;
  if (winner === 'X') return -10;
  if (board.every(c => c !== null)) return 0;
  let best = isMax ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const b = [...board] as BoardState;
    b[i] = isMax ? 'O' : 'X';
    const score = minimax(b, !isMax);
    best = isMax ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
};

const getBestMove = (board: BoardState, difficulty: AIDifficulty): number => {
  const empty = board.map((v,i) => v ? null : i).filter(i => i !== null) as number[];
  if (difficulty === 'easy') {
    // 60% random, 40% best
    if (Math.random() < 0.6) return empty[Math.floor(Math.random() * empty.length)];
  }
  let best = -Infinity, move = empty[0];
  for (const i of empty) {
    const b = [...board] as BoardState;
    b[i] = 'O';
    const score = minimax(b, false);
    if (score > best) { best = score; move = i; }
  }
  return move;
};

// ─── Component ───────────────────────────────────────────────────────────────
export const TicTacToe: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const email = user?.email || 'guest';

  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty]     = useState<AIDifficulty>('easy');
  const [showCelebration, setShowCelebration] = useState(false);
  // For local (pass-and-play): track whose physical turn label to show
  const [localTurnLabel, setLocalTurnLabel] = useState<'X' | 'O'>('X');

  const initialState: TicTacToeGameState = {
    board: Array(9).fill(null) as BoardState,
    currentPlayer: 'X',
    playerX: email,
    playerO: 'pending',
    winner: null, winningCells: null,
    status: 'waiting', isDraw: false,
    mode: 'online',
  };

  const { gameState, updateGameState, loading } = useRealtimeGame<TicTacToeGameState>(
    sessionId || `tictactoe-${email}`, 'tictactoe', initialState
  );

  const gameStateRef = useRef<TicTacToeGameState | null>(null);
  gameStateRef.current = gameState ?? null;

  // AI move effect
  useEffect(() => {
    const gs = gameStateRef.current;
    if (!gs || gs.status !== 'active' || gs.mode !== 'solo') return;
    if (gs.currentPlayer !== 'O') return; // not AI's turn
    const timer = setTimeout(() => {
      const latest = gameStateRef.current;
      if (!latest || latest.status !== 'active' || latest.currentPlayer !== 'O') return;
      const move = getBestMove(latest.board, difficulty);
      applyMove(latest, move);
    }, 500);
    return () => clearTimeout(timer);
  }, [gameState?.currentPlayer, gameState?.status]);

  const applyMove = (gs: TicTacToeGameState, index: number) => {
    if (gs.board[index]) return;
    const newBoard = [...gs.board] as BoardState;
    newBoard[index] = gs.currentPlayer;
    const { winner, cells } = calculateWinner(newBoard);
    const isDraw = !winner && newBoard.every(c => c !== null);
    const finished = !!(winner || isDraw);
    if (winner) { playWin(); setShowCelebration(true); }
    else if (isDraw) playWrong();
    else playMatch();
    updateGameState({
      ...gs,
      board: newBoard,
      currentPlayer: gs.currentPlayer === 'X' ? 'O' : 'X',
      winner: winner ?? null,
      winningCells: cells,
      isDraw,
      status: finished ? 'finished' : 'active',
    });
  };

  const handleCellClick = (index: number) => {
    if (!gameState || gameState.status !== 'active') return;
    if (gameState.board[index]) return;
    playClick();

    if (gameState.mode === 'solo') {
      // Only allow clicking when it's X's (human) turn
      if (gameState.currentPlayer !== 'X') return;
      applyMove(gameState, index);

    } else if (gameState.mode === 'local') {
      // Pass-and-play: anyone can click, current symbol is currentPlayer
      applyMove(gameState, index);
      setLocalTurnLabel(gameState.currentPlayer === 'X' ? 'O' : 'X');

    } else {
      // Online: only the player whose symbol matches can click
      const mySymbol = gameState.playerX === email ? 'X' : 'O';
      if (gameState.currentPlayer !== mySymbol) return;
      applyMove(gameState, index);
    }
  };

  const startGame = (mode: GameMode) => {
    playClick();
    setShowCelebration(false);
    setLocalTurnLabel('X');
    updateGameState({
      board: Array(9).fill(null) as BoardState,
      currentPlayer: 'X',
      playerX: email,
      playerO: mode === 'solo' ? 'AI' : mode === 'local' ? 'local-O' : 'waiting',
      winner: null, winningCells: null,
      status: 'active', isDraw: false,
      mode,
    });
  };

  const resetGame = () => {
    playClick();
    setShowCelebration(false);
    setSelectedMode(null);
    updateGameState(initialState);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

  // ── Status label logic ──
  const getStatusLabel = () => {
    if (!gameState || gameState.status === 'waiting') return '';
    if (gameState.status === 'finished') {
      if (gameState.isDraw) return "🤝 It's a Draw!";
      if (gameState.mode === 'solo')
        return gameState.winner === 'X' ? '🏆 You Win!' : '🤖 AI Wins!';
      if (gameState.mode === 'local')
        return `${gameState.winner === 'X' ? '❌ X' : '⭕ O'} Wins!`;
      // online
      const iWon = (gameState.winner === 'X' && gameState.playerX === email) ||
                   (gameState.winner === 'O' && gameState.playerO === email);
      return iWon ? '🏆 You Win!' : '💔 You Lost!';
    }
    // active
    if (gameState.mode === 'solo')
      return gameState.currentPlayer === 'X' ? '🎯 Your Turn (❌)' : '🤖 AI is thinking...';
    if (gameState.mode === 'local')
      return `${gameState.currentPlayer === 'X' ? '❌ X' : '⭕ O'}'s Turn — pass the device!`;
    // online
    const mySymbol  = gameState.playerX === email ? 'X' : 'O';
    const isMyTurn  = gameState.currentPlayer === mySymbol;
    return isMyTurn ? `🎯 Your Turn (${mySymbol === 'X' ? '❌' : '⭕'})` : "⏳ Opponent's Turn...";
  };

  const isBoardDisabled = () => {
    if (!gameState || gameState.status !== 'active') return true;
    if (gameState.mode === 'solo')  return gameState.currentPlayer !== 'X';
    if (gameState.mode === 'local') return false;
    const mySymbol = gameState.playerX === email ? 'X' : 'O';
    return gameState.currentPlayer !== mySymbol;
  };

  const MODES = [
    { id: 'solo'   as GameMode, icon: Bot,   label: 'vs AI',          sub: 'Play against computer',    color: 'from-blue-400 to-cyan-500'     },
    { id: 'local'  as GameMode, icon: Users, label: 'Same Device',     sub: 'Pass & play on one phone',  color: 'from-pink-400 to-rose-500'     },
    { id: 'online' as GameMode, icon: Wifi,  label: 'Online',          sub: 'Real-time on two devices',  color: 'from-purple-400 to-indigo-500' },
  ];

  return (
    <div className="min-h-screen p-4">
      <Celebration show={showCelebration} type="win" message="Winner! 🎉" onComplete={() => setShowCelebration(false)} />
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">❌ Tic Tac Toe ⭕</h1>
          <button onClick={resetGame} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400"><RotateCcw size={20} /></button>
        </div>

        {/* Mode picker (shown when waiting or no mode selected) */}
        {gameState?.status === 'waiting' && (
          <div className="glass-card p-6 space-y-5">
            <div className="text-center">
              <div className="text-5xl mb-3">❌⭕</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Mode</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">How do you want to play?</p>
            </div>

            <div className="space-y-3">
              {MODES.map(({ id, icon: Icon, label, sub, color }) => (
                <button key={id}
                  onClick={() => { setSelectedMode(id); if (id !== 'solo') startGame(id); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    selectedMode === id
                      ? `bg-gradient-to-r ${color} text-white shadow-lg`
                      : 'glass hover:bg-white/40 dark:hover:bg-white/10'
                  }`}>
                  <div className={`p-3 rounded-xl ${
                    selectedMode === id ? 'bg-white/20' : `bg-gradient-to-br ${color} text-white`
                  }`}>
                    <Icon size={22} className={selectedMode === id ? 'text-white' : 'text-white'} />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-base ${selectedMode === id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{label}</p>
                    <p className={`text-xs ${selectedMode === id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* AI difficulty shown only when solo selected */}
            {selectedMode === 'solo' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">AI Difficulty</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['easy','hard'] as AIDifficulty[]).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`py-3 rounded-xl font-semibold capitalize transition-all hover:scale-[1.02] border-2 ${
                        difficulty === d
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300'
                          : 'border-transparent glass text-gray-600 dark:text-gray-300'
                      }`}>
                      {d === 'easy' ? '😊 Easy' : '🧠 Hard'}
                    </button>
                  ))}
                </div>
                <button onClick={() => startGame('solo')}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl transition hover:scale-[1.02]">
                  Start vs AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active / Finished board */}
        {gameState && gameState.status !== 'waiting' && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={`glass-card p-4 text-center transition-all ${
              gameState.status === 'finished' ? 'ring-2 ring-pink-400/50' : ''
            }`}>
              <p className={`font-bold text-lg ${
                gameState.status === 'finished'
                  ? 'text-gray-900 dark:text-white'
                  : getStatusLabel().startsWith('🎯')
                  ? 'text-pink-600 dark:text-pink-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {getStatusLabel()}
              </p>
            </div>

            <Board
              board={gameState.board}
              onCellClick={handleCellClick}
              disabled={isBoardDisabled()}
              winningCells={gameState.winningCells || []}
            />

            {gameState.status === 'finished' && (
              <button onClick={resetGame}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl transition hover:scale-[1.02] active:scale-[0.98]">
                Play Again 💕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
