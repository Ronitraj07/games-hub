import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStats } from '@/hooks/useGameStats';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getConnect4AIMove } from '@/lib/connect4-ai';
import type { C4Difficulty } from '@/lib/connect4-ai';
import type { AIDifficulty, GameMode } from '@/components/shared/GameLobby';

interface Connect4State {
  board: (string | null)[][];
  currentPlayer: string;
  players: { player1: string; player2: string | null };
  winner: string | null;
  winningCells: number[][] | null;
  status: 'waiting' | 'active' | 'finished';
  isDraw: boolean;
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  recorded?: boolean;
}

const ROWS = 6, COLS = 7;
const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// Firebase strips all-null rows — always rebuild a full 6×7 grid
const safeBoard = (board: (string | null)[][] | null | undefined): (string | null)[][] =>
  Array.from({ length: ROWS }, (_, r) => {
    const row = board?.[r];
    return Array.from({ length: COLS }, (__, c) =>
      Array.isArray(row) ? (row[c] ?? null) : null
    );
  });

const checkWinner = (board: (string | null)[][], row: number, col: number, player: string) => {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    const cells = [[row, col]];
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      cells.push([r, c]);
    }
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      cells.push([r, c]);
    }
    if (cells.length >= 4) return cells.slice(0, 4);
  }
  return null;
};

const AI_TOKEN = '__AI__';

export const Connect4: React.FC<{ sessionId?: string }> = ({ sessionId: propSession }) => {
  const { user }       = useAuth();
  const { recordGame } = useGameStats();
  const location       = useLocation();
  const userKey        = user?.email ?? null;
  const aiTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInit    = useRef<Connect4State | null>(null);
  const recordedRef    = useRef(false);

  const [hovered, setHovered]           = useState<number | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isHost, setIsHost]             = useState(false);
  const [lobbyMode, setLobbyMode]       = useState<'lobby' | 'session'>('lobby');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room   = params.get('room');
    if (room && !activeRoomId) {
      setActiveRoomId(room.toUpperCase());
      setIsHost(false);
      setLobbyMode('session');
    }
  }, [location.search]);

  const safeSession = activeRoomId
    ? `connect4-room-${sanitizeFirebasePath(activeRoomId)}`
    : propSession
    ? sanitizeFirebasePath(propSession)
    : `connect4-ai-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const makeInitial = (p1: string, mode: GameMode = 'vs-partner', diff: AIDifficulty = 'medium'): Connect4State => ({
    board: emptyBoard(), currentPlayer: p1,
    players: { player1: p1, player2: null },
    winner: null, winningCells: null, status: 'active',
    isDraw: false, mode, aiDifficulty: diff, recorded: false,
  });

  const { gameState, updateGameState, patchGameState, loading } =
    useRealtimeGame<Connect4State>(safeSession, 'connect4', makeInitial(userKey ?? ''));

  // Always work with a normalised board — never raw gameState.board
  const board = safeBoard(gameState?.board);

  // Guest registers as player2
  useEffect(() => {
    if (!gameState || !userKey) return;
    if (gameState.mode !== 'vs-partner') return;
    if (gameState.players.player1 === userKey) return;
    if (gameState.players.player2 === userKey) return;
    patchGameState({ players: { ...gameState.players, player2: userKey } } as any);
  }, [gameState?.players?.player1, gameState?.players?.player2, userKey, gameState?.mode]);

  useEffect(() => {
    if (!pendingInit.current || !activeRoomId || !isHost) return;
    updateGameState(pendingInit.current);
    pendingInit.current = null;
  }, [activeRoomId, isHost, safeSession]);

  const isP1     = gameState?.players.player1 === userKey;
  const isAIMode = gameState?.mode === 'vs-ai';
  const myColor  = isP1 ? 'from-pink-500 to-rose-500' : 'from-yellow-400 to-orange-500';
  const oppColor = isP1 ? 'from-yellow-400 to-orange-500' : 'from-pink-500 to-rose-500';
  const partnerReady = !!(gameState?.players?.player2);

  // Fix: in vs-partner mode P1 cannot move until P2 has joined
  const isMyTurn = isAIMode
    ? gameState?.currentPlayer === gameState?.players.player1
    : (!isAIMode && !partnerReady)
      ? false
      : gameState?.currentPlayer === userKey;

  // Stats recording
  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || gameState.recorded || !userKey) return;
    if (recordedRef.current) return;
    recordedRef.current = true;
    const isWin  = gameState.winner === userKey;
    const result = gameState.isDraw ? 'draw' : isWin ? 'win' : 'loss';
    recordGame({
      gameType: 'connect4', playerEmail: userKey, result, score: isWin ? 10 : 0,
      mode: isAIMode ? 'vs-ai' : 'vs-partner',
      opponentEmail: isAIMode ? undefined : (gameState.players.player2 ?? undefined),
    });
    updateGameState({ ...gameState, recorded: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.status, gameState?.recorded, userKey]);

  useEffect(() => {
    if (gameState?.status === 'active') recordedRef.current = false;
  }, [gameState?.status]);

  // AI move — uses safeBoard-normalised board
  useEffect(() => {
    if (!gameState || gameState.mode !== 'vs-ai' || gameState.status !== 'active') return;
    if (gameState.currentPlayer !== AI_TOKEN) return;
    aiTimer.current = setTimeout(() => {
      const b   = safeBoard(gameState.board);
      const col = getConnect4AIMove(b, AI_TOKEN, gameState.players.player1, gameState.aiDifficulty as C4Difficulty);
      if (col === -1) return;
      let row = -1;
      for (let r = ROWS - 1; r >= 0; r--) { if (!b[r][col]) { row = r; break; } }
      if (row === -1) return;
      b[row][col] = AI_TOKEN;
      const cells = checkWinner(b, row, col, AI_TOKEN);
      const full  = b[0].every(c => c !== null);
      if (cells)     updateGameState({ ...gameState, board: b, winner: AI_TOKEN, winningCells: cells, status: 'finished', recorded: false });
      else if (full) updateGameState({ ...gameState, board: b, isDraw: true, status: 'finished', recorded: false });
      else           updateGameState({ ...gameState, board: b, currentPlayer: gameState.players.player1 });
    }, 500);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [gameState?.currentPlayer, gameState?.status, gameState?.mode]);

  const handleColumnClick = (col: number) => {
    if (!gameState || gameState.status !== 'active') return;
    if (isAIMode  && gameState.currentPlayer !== gameState.players.player1) return;
    if (!isAIMode && !isMyTurn) return;
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) { if (!board[r][col]) { row = r; break; } }
    if (row === -1) return;
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = userKey ?? '';
    const cells = checkWinner(newBoard, row, col, userKey ?? '');
    const full  = newBoard[0].every(c => c !== null);
    if (cells)  { updateGameState({ ...gameState, board: newBoard, winner: userKey ?? '', winningCells: cells, status: 'finished', recorded: false }); return; }
    if (full)   { updateGameState({ ...gameState, board: newBoard, isDraw: true, status: 'finished', recorded: false }); return; }
    const next = isAIMode
      ? AI_TOKEN
      : (gameState.currentPlayer === gameState.players.player1
          ? (gameState.players.player2 ?? '')
          : gameState.players.player1);
    updateGameState({ ...gameState, board: newBoard, currentPlayer: next });
  };

  const startVsAI = (diff: AIDifficulty) => {
    setActiveRoomId(null); setIsHost(false);
    recordedRef.current = false;
    setLobbyMode('session');
    updateGameState({
      ...makeInitial(userKey ?? '', 'vs-ai', diff),
      players: { player1: userKey ?? '', player2: AI_TOKEN },
      currentPlayer: userKey ?? '',
    });
  };

  const handleStartVsPartner = (roomId: string, hostFlag: boolean) => {
    setIsHost(hostFlag);
    setActiveRoomId(roomId);
    recordedRef.current = false;
    setLobbyMode('session');
    if (hostFlag) {
      pendingInit.current = {
        ...makeInitial(userKey ?? '', 'vs-partner'),
        players: { player1: userKey ?? '', player2: null },
        currentPlayer: userKey ?? '',
      };
    }
  };

  const playAgain = () => {
    if (!gameState) return;
    recordedRef.current = false;
    updateGameState({
      ...makeInitial(gameState.players.player1, gameState.mode, gameState.aiDifficulty),
      players: gameState.players,
      currentPlayer: gameState.players.player1,
    });
  };

  const resetGame = () => {
    setActiveRoomId(null); setIsHost(false);
    recordedRef.current = false;
    setLobbyMode('lobby');
    updateGameState({ ...makeInitial(userKey ?? ''), status: 'waiting' });
  };

  const isWinCell = (r: number, c: number) =>
    gameState?.winningCells?.some(([wr, wc]: number[]) => wr === r && wc === c) || false;

  const inSession = lobbyMode === 'session';

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

  return (
    // Reduced outer padding on mobile so the board fits without scrolling
    <div className="min-h-screen px-2 py-3 sm:p-4">
      <div className="max-w-sm sm:max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Link to="/" className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition text-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">💎 Connect 4</h1>
          <button onClick={resetGame} className="glass-btn p-1.5 rounded-xl text-gray-600 dark:text-gray-400"><RotateCcw size={16} /></button>
        </div>

        {/* ── LOBBY ── */}
        {!inSession && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <GameLobby
              gameName="Connect 4" gameIcon="💎"
              gradient="from-pink-500 to-purple-500"
              description="Drop pieces and connect four in a row!"
              supportsAI
              aiLabels={{ easy: 'random moves mostly', medium: 'blocks your wins', hard: 'minimax depth-4 — good luck' }}
              gameType="Connect4"
              onStartVsAI={startVsAI}
              onStartVsPartner={handleStartVsPartner}
            />
          </div>
        )}

        {/* ── GAME ── */}
        {inSession && gameState && (
          <div className="space-y-2">

            {/* Badges */}
            <div className="flex justify-center gap-2 flex-wrap">
              <GameModeBadge mode={gameState.mode} difficulty={gameState.mode === 'vs-ai' ? (gameState.aiDifficulty as AIDifficulty) : undefined} />
              {activeRoomId && (
                <span className="glass px-3 py-1 rounded-full text-xs font-mono font-bold text-purple-400 tracking-widest">
                  Room: {activeRoomId}
                </span>
              )}
            </div>

            {/* Status */}
            <div className="glass-card px-3 py-2 text-center">
              {gameState.status === 'active' && (
                <p className={`font-semibold text-sm sm:text-base ${
                  isMyTurn ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500'
                }`}>
                  {!partnerReady && gameState.mode === 'vs-partner'
                    ? 'Waiting for partner to join…'
                    : isMyTurn ? 'Your turn!'
                    : isAIMode ? '🤖 AI thinking…'
                    : "Opponent's turn…"}
                </p>
              )}
              {gameState.status === 'finished' && (
                <p className="font-bold text-base sm:text-xl text-gray-900 dark:text-white">
                  {gameState.isDraw
                    ? '🤝 Draw!'
                    : gameState.winner === userKey ? '🏆 You Win!'
                    : gameState.winner === AI_TOKEN ? '🤖 AI Wins!'
                    : '💔 You Lost!'}
                </p>
              )}
            </div>

            {/* Board
                Sizing strategy:
                - w-full keeps it fluid inside max-w-sm/lg
                - gap-1 (4px) on mobile, gap-1.5 (6px) on sm+
                - aspect-square on cells auto-sizes everything
            */}
            <div className="glass-card p-2 sm:p-3">
              {/* Drop indicator */}
              <div
                className="grid mb-1"
                style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, gap: '4px' }}
              >
                {Array(COLS).fill(null).map((_, c) => (
                  <div key={c} className="flex justify-center">
                    <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      hovered === c && isMyTurn && gameState.status === 'active'
                        ? `bg-gradient-to-b ${myColor} opacity-80` : 'opacity-0'
                    }`} />
                  </div>
                ))}
              </div>

              {/* Cells */}
              <div
                className="grid w-full"
                style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, gap: '4px' }}
              >
                {board.map((row, r) =>
                  row.map((cell, c) => (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleColumnClick(c)}
                      onMouseEnter={() => setHovered(c)}
                      onMouseLeave={() => setHovered(null)}
                      disabled={gameState.status !== 'active' || !isMyTurn}
                      className="aspect-square rounded-full transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed"
                      style={{
                        background: cell
                          ? isWinCell(r, c)
                            ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                            : cell === gameState.players.player1
                            ? 'linear-gradient(135deg,#ec4899,#f43f5e)'
                            : 'linear-gradient(135deg,#facc15,#f97316)'
                          : 'rgba(255,255,255,0.3)',
                        boxShadow: cell
                          ? isWinCell(r, c)
                            ? '0 0 12px rgba(251,191,36,.8),inset 0 2px 4px rgba(255,255,255,.3)'
                            : 'inset 0 2px 4px rgba(0,0,0,.1)'
                          : 'inset 0 2px 6px rgba(0,0,0,.15)',
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Colour legend */}
            <div className="glass-card px-3 py-2 flex justify-around">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${myColor}`} />
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${oppColor}`} />
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{isAIMode ? 'AI 🤖' : 'Partner'}</span>
              </div>
            </div>

            {/* Play Again / Leave */}
            {gameState.status === 'finished' && (
              <div className="flex gap-3">
                <button onClick={playAgain}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2.5 rounded-xl hover:scale-[1.02] transition text-sm sm:text-base">
                  Play Again 💕
                </button>
                <button onClick={resetGame}
                  className="glass-btn px-4 py-2.5 rounded-xl text-gray-400 text-sm font-medium hover:text-red-400 transition">
                  Leave
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
