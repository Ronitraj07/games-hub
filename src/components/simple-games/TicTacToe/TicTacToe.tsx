import React, { useEffect, useRef } from 'react';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Board } from './Board';
import { InviteModal } from '@/components/games/InviteModal';
import { useGameStats } from '@/hooks/useGameStats';
import { RotateCcw, ArrowLeft, Bot, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAIMove } from '@/lib/tictactoe-ai';
import type { CellValue, BoardState } from './types';
import type { AIDifficulty } from '@/lib/tictactoe-ai';

interface TicTacToeGameState {
  board: BoardState;
  currentPlayer: 'X' | 'O';
  players: { player1: string; player2: string | null };
  winner: 'X' | 'O' | null;
  winningCells: number[] | null;
  status: 'waiting' | 'active' | 'finished';
  isDraw: boolean;
  mode: 'vs-human' | 'vs-ai';
  aiDifficulty: AIDifficulty;
  recorded?: boolean;
}

const safeBoard = (board: BoardState | null | undefined): BoardState =>
  Array.from({ length: 9 }, (_, i) =>
    Array.isArray(board) && i < board.length && board[i] !== undefined ? board[i] : null
  ) as BoardState;

const calculateWinner = (board: BoardState): { winner: CellValue; cells: number[] | null } => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], cells: [a, b, c] };
  }
  return { winner: null, cells: null };
};

export const TicTacToe: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const { recordGame } = useGameStats();
  const userKey  = user?.email ?? null;
  const aiThinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showInvite,   setShowInvite]   = React.useState(false);
  const [aiDifficulty, setAiDifficulty] = React.useState<AIDifficulty>('medium');

  const safeSession = sessionId
    ? sanitizeFirebasePath(sessionId)
    : `tictactoe-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initialState: TicTacToeGameState = {
    board:         Array(9).fill(null) as BoardState,
    currentPlayer: 'X',
    players:       { player1: userKey ?? '', player2: null },
    winner:        null,
    winningCells:  null,
    status:        'waiting',
    isDraw:        false,
    mode:          'vs-human',
    aiDifficulty:  'medium',
    recorded:      false,
  };

  const { gameState, updateGameState, patchGameState, loading } =
    useRealtimeGame<TicTacToeGameState>(safeSession, 'tictactoe', initialState);

  // --- Player registration -------------------------------------------------
  // When a second player opens the same session, register them as player2.
  useEffect(() => {
    if (!gameState || !userKey) return;
    if (gameState.status !== 'active') return;
    if (gameState.mode !== 'vs-human') return;
    // Already registered
    if (gameState.players.player1 === userKey) return;
    if (gameState.players.player2 === userKey) return;
    // Slot is free — join as player2
    if (!gameState.players.player2) {
      patchGameState({ players: { ...gameState.players, player2: userKey } } as any);
    }
  }, [gameState?.status, gameState?.players?.player2, userKey]);

  // Derive my symbol AFTER player2 may have been registered
  const mySymbol: CellValue = gameState?.players?.player1 === userKey ? 'X' : 'O';
  const isMyTurn = gameState?.currentPlayer === mySymbol && gameState?.mode === 'vs-human';
  const currentBoard = safeBoard(gameState?.board);

  // Record result
  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || gameState.recorded || !userKey) return;
    const isWin  = gameState.winner === mySymbol;
    const result = gameState.isDraw ? 'draw' : isWin ? 'win' : 'loss';
    recordGame({
      gameType:      'tictactoe',
      playerEmail:   userKey,
      result,
      score:         isWin ? 10 : 0,
      mode:          gameState.mode === 'vs-ai' ? 'vs-ai' : 'vs-partner',
      opponentEmail: gameState.mode === 'vs-ai' ? undefined : (gameState.players.player2 ?? undefined),
    });
    updateGameState({ ...gameState, recorded: true });
  }, [gameState?.status, gameState?.recorded]);

  // AI move
  useEffect(() => {
    if (!gameState || gameState.mode !== 'vs-ai') return;
    if (gameState.status !== 'active') return;
    if (gameState.currentPlayer !== 'O') return;
    const board = safeBoard(gameState.board);
    aiThinkTimer.current = setTimeout(() => {
      const move = getAIMove(board, gameState.aiDifficulty);
      if (move === -1) return;
      const newBoard = [...board] as BoardState;
      newBoard[move] = 'O';
      const { winner, cells } = calculateWinner(newBoard);
      const isDraw = !winner && newBoard.every(c => c !== null);
      updateGameState({
        ...gameState,
        board: newBoard,
        winner,
        winningCells: cells,
        isDraw,
        status: winner || isDraw ? 'finished' : 'active',
        currentPlayer: winner || isDraw ? 'O' : 'X',
        recorded: false,
      });
    }, 500);
    return () => { if (aiThinkTimer.current) clearTimeout(aiThinkTimer.current); };
  }, [gameState?.currentPlayer, gameState?.status, gameState?.mode]);

  const handleCellClick = (index: number) => {
    if (!gameState || gameState.status !== 'active') return;
    if (gameState.mode === 'vs-ai'   && gameState.currentPlayer !== 'X') return;
    if (gameState.mode === 'vs-human' && !isMyTurn) return;
    if (index < 0 || index > 8) return;
    const board = safeBoard(gameState.board);
    if (board[index]) return;
    const newBoard = [...board] as BoardState;
    newBoard[index] = gameState.mode === 'vs-ai' ? 'X' : mySymbol;
    const { winner, cells } = calculateWinner(newBoard);
    const isDraw = !winner && newBoard.every(c => c !== null);
    const nextPlayer: 'X'|'O' = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateGameState({
      ...gameState,
      board: newBoard,
      winner,
      winningCells: cells,
      isDraw,
      status: winner || isDraw ? 'finished' : 'active',
      currentPlayer: winner || isDraw ? gameState.currentPlayer : nextPlayer,
      recorded: false,
    });
  };

  const startVsAI = (diff: AIDifficulty) => {
    updateGameState({
      ...initialState,
      players: { player1: userKey ?? '', player2: 'AI' },
      status: 'active',
      mode: 'vs-ai',
      aiDifficulty: diff,
    });
  };

  const startVsHuman = () => {
    updateGameState({
      ...initialState,
      players: { player1: userKey ?? '', player2: null },
      status: 'active',
      mode: 'vs-human',
    });
  };

  const resetGame = () => updateGameState({ ...initialState, players: { player1: userKey ?? '', player2: null } });

  const handleInviteReady = (_roomId: string, _isHost: boolean) => {
    setShowInvite(false);
    startVsHuman();
  };

  const turnLabel = () => {
    if (!gameState || gameState.status !== 'active') return '';
    if (gameState.mode === 'vs-ai') {
      return gameState.currentPlayer === 'X' ? 'Your turn — you are ❌' : '🤖 AI is thinking…';
    }
    // vs-human
    if (!gameState.players.player2) return 'Waiting for partner to join…';
    return isMyTurn ? `Your turn — you are ${mySymbol === 'X' ? '❌' : '⭕'}` : "Opponent's turn…";
  };

  const resultLabel = () => {
    if (!gameState || gameState.status !== 'finished') return '';
    if (gameState.isDraw) return '🤝 Draw!';
    if (gameState.mode === 'vs-ai') return gameState.winner === 'X' ? '🏆 You Win!' : '🤖 AI Wins!';
    return gameState.winner === mySymbol ? '🏆 You Win!' : '💔 You Lost!';
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>
  );

  const isAITurn = gameState?.mode === 'vs-ai' && gameState?.currentPlayer === 'O';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Tic Tac Toe</h1>
          <button onClick={resetGame} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400" title="Reset">
            <RotateCcw size={20} />
          </button>
        </div>

        {(!gameState || gameState.status === 'waiting') && (
          <div className="glass-card p-8 text-center">
            <div className="text-6xl mb-4">❌⭕</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Tic Tac Toe</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Choose how you want to play</p>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setShowInvite(true)} disabled={!userKey}
                className="flex items-center gap-4 glass-btn px-5 py-4 rounded-2xl text-left hover:scale-[1.02] transition-all disabled:opacity-50">
                <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white"><Users size={22} /></div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Play vs Partner</p>
                  <p className="text-sm text-gray-500">Invite with a 6-letter code</p>
                </div>
              </button>
              <div className="glass-btn px-5 py-4 rounded-2xl">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white"><Bot size={22} /></div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Play vs AI</p>
                    <p className="text-sm text-gray-500">Challenge the computer</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['easy','medium','hard'] as AIDifficulty[]).map(d => (
                    <button key={d} onClick={() => startVsAI(d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all hover:scale-105 ${
                        d==='easy'   ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        d==='medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                       'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState && gameState.status !== 'waiting' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <span className={`glass px-3 py-1 rounded-full text-xs font-semibold ${
                gameState.mode === 'vs-ai' ? 'text-indigo-400' : 'text-pink-400'
              }`}>
                {gameState.mode === 'vs-ai' ? `🤖 vs AI · ${gameState.aiDifficulty}` : '👥 vs Partner'}
              </span>
            </div>
            <div className="glass-card p-4 text-center">
              {gameState.status === 'active' && (
                <p className={`font-semibold text-lg ${
                  isMyTurn || isAITurn === false ? 'text-pink-400' : 'text-gray-500'
                }`}>{turnLabel()}</p>
              )}
              {gameState.status === 'finished' && (
                <p className="font-bold text-xl text-white">{resultLabel()}</p>
              )}
            </div>
            <Board
              board={currentBoard}
              onCellClick={handleCellClick}
              disabled={isAITurn || gameState.status !== 'active' || (gameState.mode === 'vs-human' && !isMyTurn)}
              winningCells={gameState.winningCells || []}
            />
            {gameState.status === 'finished' && (
              <button onClick={resetGame}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition">
                Play Again 💕
              </button>
            )}
          </div>
        )}
      </div>
      {showInvite && (
        <InviteModal gameType="TicTacToe" onClose={() => setShowInvite(false)} onReady={handleInviteReady} />
      )}
    </div>
  );
};
