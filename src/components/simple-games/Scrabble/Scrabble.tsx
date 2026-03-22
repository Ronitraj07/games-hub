import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStats } from '@/hooks/useGameStats';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameBoard, GameBoardCell } from '@/components/shared/GameBoard';
import { ScrabbleGameState, MULTIPLIER_MAP } from './types';
import { createEmptyBoard, getInitialLetterBag, drawTiles, isValidWord, calculateWordScore, getPremiumType } from './utils';
import { ArrowLeft, RotateCw, Send, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SCRABBLE_CONFIG = {
  gameType: 'scrabble' as const,
  icon: '📝',
  gradient: 'from-blue-600 to-cyan-700',
  description: 'Word game on a shared board. Form words to score points. Couple\'s Bonus when both collaborate!',
  supportsSolo: true,
  supportsAI: true,
};

// Board display component
const ScrabbleBoardDisplay: React.FC<{ gameState: ScrabbleGameState | null }> = ({ gameState }) => {
  if (!gameState) return null;

  const cells: GameBoardCell[][] = Array.from({ length: 15 }, (_, row) =>
    Array.from({ length: 15 }, (_, col) => ({
      id: `cell-${row}-${col}`,
      row,
      col,
      type: getPremiumType(row, col) as any,
      content: gameState.board?.[row]?.[col]?.letter ? (
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded flex items-center justify-center font-bold text-yellow-900 shadow-lg text-sm">
          {gameState.board[row][col].letter}
        </div>
      ) : undefined,
    }))
  );

  return <GameBoard rows={15} cols={15} cells={cells} cellSize={32} showGridLines={true} />;
};

export const Scrabble: React.FC = () => {
  const { user } = useAuth();
  const { recordGame } = useGameStats();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'lobby' | 'game'>('lobby');
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [gameState, setGameState] = useState<ScrabbleGameState | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string>('');

  const { gameState: fbGameState, updateGameState, loading: fbLoading } = useRealtimeGame<ScrabbleGameState>(
    roomId,
    SCRABBLE_CONFIG.gameType,
    null
  );

  useEffect(() => {
    if (fbGameState && mode === 'game') {
      setGameState(fbGameState);
    }
  }, [fbGameState, mode]);

  const handleStartSolo = () => {
    setIsHost(true);
    setMode('game');
    initializeGame('solo');
  };

  const handleStartVsAI = () => {
    setIsHost(true);
    setMode('game');
    initializeGame('vs-ai');
  };

  const handleStartVsPartner = () => {
    setIsHost(true);
    setMode('game');
    setRoomId('SCRABBLE_' + Math.random().toString(36).substr(2, 6));
    initializeGame('vs-partner');
  };

  const initializeGame = (gameMode: 'solo' | 'vs-ai' | 'vs-partner') => {
    const letterBag = getInitialLetterBag();
    const { tiles: p1Tiles, remaining: bag1 } = drawTiles([...letterBag], 7);
    const { tiles: p2Tiles, remaining: initialBag } = drawTiles(bag1, 7);

    const initialState: ScrabbleGameState = {
      board: createEmptyBoard(),
      multiplierMap: MULTIPLIER_MAP,
      player1Email: user?.email || '',
      player2Email: gameMode === 'vs-partner' ? '' : null,
      player1Score: 0,
      player2Score: 0,
      player1Rack: p1Tiles,
      player2Rack: p2Tiles,
      letterBag: initialBag,
      currentTurnEmail: user?.email || '',
      turnTimer: 60,
      phase: 'active',
      status: 'playing',
      moveHistory: [],
      lastMove: null,
      mode: gameMode,
      recorded: false,
    };

    setGameState(initialState);
    if (gameMode === 'vs-partner' && roomId) {
      updateGameState(initialState);
    }
  };

  const handlePass = () => {
    if (!gameState) return;
    const nextPlayer = gameState.currentTurnEmail === gameState.player1Email ? gameState.player2Email : gameState.player1Email;
    if (!nextPlayer) return;

    const updatedState = {
      ...gameState,
      currentTurnEmail: nextPlayer,
      turnTimer: 60,
    };

    setGameState(updatedState);
    if (gameState.mode === 'vs-partner' && roomId) {
      updateGameState(updatedState);
    }
    setSelectedTiles(new Set());
  };

  const handleSubmitWord = () => {
    if (!gameState || selectedTiles.size === 0) return;

    let score = 0;
    let wordsFormed: string[] = [];

    // Simple scoring: sum letter values
    const selectedIndices = Array.from(selectedTiles);
    const currentRack = gameState.currentTurnEmail === gameState.player1Email
      ? gameState.player1Rack
      : gameState.player2Rack;

    const word = selectedIndices.map(i => currentRack[i]).join('');

    // Validate word
    if (!isValidWord(word)) {
      setMessage(`"${word}" is not a valid word!`);
      return;
    }

    // Calculate score
    score = word.split('').reduce((sum, letter) => {
      const letterVal = { A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8 }[letter.toUpperCase()] || 0;
      return sum + letterVal;
    }, 0);

    // Update game state
    const isPlayer1 = gameState.currentTurnEmail === gameState.player1Email;
    const updatedState = {
      ...gameState,
      player1Score: isPlayer1 ? gameState.player1Score + score : gameState.player1Score,
      player2Score: !isPlayer1 ? gameState.player2Score + score : gameState.player2Score,
      currentTurnEmail: gameState.player2Email || gameState.player1Email === gameState.currentTurnEmail
        ? gameState.player1Email
        : gameState.player2Email || gameState.player1Email,
      turnTimer: 60,
    };

    setGameState(updatedState);
    setSelectedTiles(new Set());
    setMessage(`${word}: +${score} points!`);

    if (gameState.mode === 'vs-partner' && roomId) {
      updateGameState(updatedState);
    }

    // Record if solo
    if (gameState.mode === 'solo' && gameState.player1Score + score > gameState.player2Score) {
      recordGame({
        gameType: SCRABBLE_CONFIG.gameType,
        playerEmail: user?.email || '',
        result: 'win',
        score: gameState.player1Score + score,
        mode: 'solo',
      });
    }
  };

  if (mode === 'lobby') {
    return (
      <GameLobby
        gameName="Scrabble"
        gameIcon={SCRABBLE_CONFIG.icon}
        gradient={SCRABBLE_CONFIG.gradient}
        description={SCRABBLE_CONFIG.description}
        supportsSolo={SCRABBLE_CONFIG.supportsSolo}
        supportsAI={SCRABBLE_CONFIG.supportsAI}
        gameType={SCRABBLE_CONFIG.gameType}
        onStartSolo={handleStartSolo}
        onStartVsAI={handleStartVsAI}
        onStartVsPartner={handleStartVsPartner}
      />
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-cyan-900">
        <Loader className="w-8 h-8 text-blue-300 animate-spin" />
      </div>
    );
  }

  const isPlayer1 = user?.email === gameState.player1Email;
  const isMyTurn = user?.email === gameState.currentTurnEmail;
  const currentRack = isPlayer1 ? gameState.player1Rack : gameState.player2Rack || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-800 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-200 hover:text-white transition"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-3xl font-bold text-white">Scrabble for Couples</h1>
          <div></div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`glass-card p-4 rounded-xl ${isPlayer1 && isMyTurn ? 'ring-2 ring-blue-400' : ''}`}>
            <h2 className="text-lg font-bold text-white mb-2">You</h2>
            <p className="text-3xl font-bold text-blue-200">{gameState.player1Score}</p>
            {isMyTurn && <p className="text-sm text-blue-300">Your turn • {gameState.turnTimer}s</p>}
          </div>
          <div className={`glass-card p-4 rounded-xl ${!isPlayer1 && isMyTurn ? 'ring-2 ring-cyan-400' : ''}`}>
            <h2 className="text-lg font-bold text-white mb-2">Opponent</h2>
            <p className="text-3xl font-bold text-cyan-200">{gameState.player2Score}</p>
            {!isMyTurn && gameState.player2Email && <p className="text-sm text-cyan-300">Opponent's turn</p>}
          </div>
        </div>

        {/* Board (Proper Scrabble 15x15) */}
        <div className="glass-card p-8 rounded-2xl mb-6 flex flex-col items-center overflow-x-auto">
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-white">Scrabble Board</p>
            <p className="text-sm text-blue-200">Premium squares: 🟦 DL • 🟪 TL • 🟥 DW • 🟩 TW</p>
          </div>
          <div className="overflow-auto">
            <ScrabbleBoardDisplay gameState={gameState} />
          </div>
        </div>

        {/* Rack & Controls */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4">Your Tiles</h3>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {currentRack.map((tile, i) => (
              <button
                key={i}
                onClick={() => {
                  const newSelected = new Set(selectedTiles);
                  if (newSelected.has(i)) newSelected.delete(i);
                  else newSelected.add(i);
                  setSelectedTiles(newSelected);
                }}
                className={`p-3 rounded-lg font-bold text-center text-lg transition ${
                  selectedTiles.has(i)
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : 'bg-blue-400 text-gray-900 hover:bg-blue-300'
                }`}
              >
                {tile}
              </button>
            ))}
          </div>

          {message && (
            <div className="mb-4 p3 rounded-lg bg-green-500/20 border border-green-400 text-green-300">
              {message}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleSubmitWord}
              disabled={selectedTiles.size === 0 || !isMyTurn}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
            >
              <Send size={18} /> Submit Word
            </button>
            <button
              onClick={handlePass}
              disabled={!isMyTurn}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
            >
              <RotateCw size={18} /> Pass Turn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
