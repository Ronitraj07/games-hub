import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStats } from '@/hooks/useGameStats';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
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
const emptyBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

const checkWinner = (board: (string|null)[][], row: number, col: number, player: string) => {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr,dc] of dirs) {
    let cells = [[row,col]];
    for (let i=1;i<4;i++){const r=row+dr*i,c=col+dc*i;if(r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player)break;cells.push([r,c]);}
    for (let i=1;i<4;i++){const r=row-dr*i,c=col-dc*i;if(r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player)break;cells.push([r,c]);}
    if (cells.length >= 4) return cells.slice(0,4);
  }
  return null;
};

export const Connect4: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const { recordGame } = useGameStats();
  const userKey  = user?.email ?? null;
  const aiTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState<number|null>(null);

  const safeSession = sessionId
    ? sanitizeFirebasePath(sessionId)
    : `connect4-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initial: Connect4State = {
    board: emptyBoard(), currentPlayer: userKey ?? '',
    players: { player1: userKey ?? '', player2: null },
    winner: null, winningCells: null, status: 'waiting',
    isDraw: false, mode: 'vs-partner', aiDifficulty: 'medium',
    recorded: false,
  };

  const { gameState, updateGameState, loading } = useRealtimeGame<Connect4State>(
    safeSession, 'connect4', initial
  );

  const isP1     = gameState?.players.player1 === userKey;
  const myColor  = isP1 ? 'from-pink-500 to-rose-500' : 'from-yellow-400 to-orange-500';
  const oppColor = isP1 ? 'from-yellow-400 to-orange-500' : 'from-pink-500 to-rose-500';
  const isAIMode = gameState?.mode === 'vs-ai';
  const isMyTurn = isAIMode
    ? gameState?.currentPlayer === gameState?.players.player1
    : gameState?.currentPlayer === userKey;

  // Record result when game finishes (once)
  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || gameState.recorded || !userKey) return;
    const isAI  = gameState.mode === 'vs-ai';
    const isWin = gameState.winner === userKey;
    const result = gameState.isDraw ? 'draw' : isWin ? 'win' : 'loss';
    recordGame({
      gameType:    'connect4',
      playerEmail: userKey,
      result,
      score:       isWin ? 10 : 0,
      mode:        isAI ? 'vs-ai' : 'vs-partner',
      opponentEmail: isAI ? undefined : (gameState.players.player2 ?? undefined),
    });
    updateGameState({ ...gameState, recorded: true });
  }, [gameState?.status, gameState?.recorded]);

  // AI move effect
  useEffect(() => {
    if (!gameState || gameState.mode !== 'vs-ai' || gameState.status !== 'active') return;
    if (gameState.currentPlayer === gameState.players.player1) return;

    aiTimer.current = setTimeout(() => {
      const board = gameState.board.map(r => [...r]);
      const col   = getConnect4AIMove(board, 'AI', gameState.players.player1, gameState.aiDifficulty as C4Difficulty);
      if (col === -1) return;
      let row = -1;
      for (let r = ROWS-1; r >= 0; r--) { if (!board[r][col]) { row = r; break; } }
      if (row === -1) return;
      board[row][col] = 'AI';
      const cells  = checkWinner(board, row, col, 'AI');
      const full   = board[0].every(c => c !== null);
      if (cells) {
        updateGameState({ ...gameState, board, winner: 'AI', winningCells: cells, status: 'finished', recorded: false });
      } else if (full) {
        updateGameState({ ...gameState, board, isDraw: true, status: 'finished', recorded: false });
      } else {
        updateGameState({ ...gameState, board, currentPlayer: gameState.players.player1 });
      }
    }, 500);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [gameState?.currentPlayer, gameState?.status, gameState?.mode]);

  const handleColumnClick = (col: number) => {
    if (!gameState || gameState.status !== 'active') return;
    if (isAIMode && gameState.currentPlayer !== gameState.players.player1) return;
    if (!isAIMode && !isMyTurn) return;

    let row = -1;
    for (let r = ROWS-1; r >= 0; r--) { if (!gameState.board[r]?.[col]) { row = r; break; } }
    if (row === -1) return;

    const newBoard = gameState.board.map(r => [...r]);
    newBoard[row][col] = userKey ?? '';
    const cells = checkWinner(newBoard, row, col, userKey ?? '');
    const full  = newBoard[0].every(c => c !== null);

    if (cells) {
      updateGameState({ ...gameState, board: newBoard, winner: userKey ?? '', winningCells: cells, status: 'finished', recorded: false });
    } else if (full) {
      updateGameState({ ...gameState, board: newBoard, isDraw: true, status: 'finished', recorded: false });
    } else {
      const next = isAIMode ? 'AI' : (
        gameState.currentPlayer === gameState.players.player1
          ? gameState.players.player2 ?? ''
          : gameState.players.player1
      );
      updateGameState({ ...gameState, board: newBoard, currentPlayer: next });
    }
  };

  const startVsAI = (diff: AIDifficulty) => {
    updateGameState({
      ...initial,
      players: { player1: userKey ?? '', player2: 'AI' },
      status: 'active', mode: 'vs-ai', aiDifficulty: diff,
      currentPlayer: userKey ?? '',
    });
  };

  const startVsPartner = () => {
    updateGameState({
      ...initial,
      players: { player1: userKey ?? '', player2: 'opponent' },
      status: 'active', mode: 'vs-partner',
    });
  };

  const reset = () => updateGameState(initial);
  const isWin = (r: number, c: number) => gameState?.winningCells?.some(([wr,wc]: number[]) => wr===r && wc===c) || false;

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">\ud83d\udd34 Connect 4</h1>
          <button onClick={reset} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400"><RotateCcw size={20} /></button>
        </div>

        {(!gameState || gameState.status === 'waiting') && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <GameLobby
              gameName="Connect 4"
              gameIcon="\ud83d\udd34"
              gradient="from-pink-500 to-purple-500"
              description="Drop pieces and connect four in a row!"
              supportsAI
              aiLabels={{
                easy:   'random moves mostly',
                medium: 'blocks your wins',
                hard:   'minimax depth-4 \u2014 good luck',
              }}
              gameType="Connect4"
              onStartVsAI={startVsAI}
              onStartVsPartner={startVsPartner}
            />
          </div>
        )}

        {gameState && gameState.status !== 'waiting' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <GameModeBadge mode={gameState.mode} difficulty={gameState.mode === 'vs-ai' ? (gameState.aiDifficulty as AIDifficulty) : undefined} />
            </div>

            <div className="glass-card p-4 text-center">
              {gameState.status === 'active' && (
                <p className={`font-semibold text-lg ${
                  isMyTurn ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500'
                }`}>
                  {isMyTurn ? 'Your turn!' : isAIMode ? '\ud83e\udd16 AI thinking\u2026' : "Opponent's turn\u2026"}
                </p>
              )}
              {gameState.status === 'finished' && (
                <p className="font-bold text-xl text-gray-900 dark:text-white">
                  {gameState.isDraw ? '\ud83e\udd1d Draw!' : gameState.winner === userKey ? '\ud83c\udfc6 You Win!' : isAIMode ? '\ud83e\udd16 AI Wins!' : '\ud83d\udc94 You Lost!'}
                </p>
              )}
            </div>

            <div className="glass-card p-4">
              <div className="grid mb-1" style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, gap: '6px' }}>
                {Array(COLS).fill(null).map((_,c) => (
                  <div key={c} className="flex justify-center">
                    <div className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      hovered === c && isMyTurn && gameState.status === 'active'
                        ? `bg-gradient-to-b ${myColor} opacity-80` : 'opacity-0'
                    }`} />
                  </div>
                ))}
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, gap: '6px' }}>
                {Array.isArray(gameState.board) && gameState.board.map((row: (string|null)[], r: number) =>
                  row.map((cell: string|null, c: number) => (
                    <button key={`${r}-${c}`}
                      onClick={() => handleColumnClick(c)}
                      onMouseEnter={() => setHovered(c)}
                      onMouseLeave={() => setHovered(null)}
                      disabled={gameState.status !== 'active' || !isMyTurn}
                      className="aspect-square rounded-full transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed"
                      style={{
                        background: cell
                          ? isWin(r,c)
                            ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                            : cell === gameState.players.player1
                            ? 'linear-gradient(135deg,#ec4899,#f43f5e)'
                            : 'linear-gradient(135deg,#facc15,#f97316)'
                          : 'rgba(255,255,255,0.3)',
                        boxShadow: cell
                          ? isWin(r,c)
                            ? '0 0 16px rgba(251,191,36,.8),inset 0 2px 4px rgba(255,255,255,.3)'
                            : 'inset 0 2px 4px rgba(0,0,0,.1)'
                          : 'inset 0 2px 8px rgba(0,0,0,.15)',
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="glass-card p-3 flex justify-around">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${myColor}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${oppColor}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">{isAIMode ? 'AI' : 'Opponent'}</span>
              </div>
            </div>

            {gameState.status === 'finished' && (
              <button onClick={reset}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl transition hover:scale-[1.02]">
                Play Again \ud83d\udc95
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
