import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/hooks/shared/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Brain, Trophy, Users, RotateCcw } from 'lucide-react';

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchGameState {
  cards: Card[];
  flippedCards: number[];
  players: {
    [email: string]: {
      score: number;
      moves: number;
    };
  };
  currentPlayer: string;
  status: 'waiting' | 'active' | 'finished';
  gridSize: 4 | 6;
  gameMode: 'solo' | 'versus';
}

interface MemoryMatchProps {
  sessionId?: string;
}

const EMOJI_SETS = {
  romantic: ['❤️', '💕', '💖', '💗', '💘', '💙', '💚', '💛', '💜', '💝', '💞', '💟', '💋', '💌', '💍', '💎', '💐', '🌹'],
  nature: ['🌺', '🌻', '🌼', '🌷', '🌸', '🌿', '🍀', '🍁', '🍂', '🍃', '🍄', '🌾', '🌱', '🌲', '🌳', '🌴', '🌵', '🌽'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐒', '🐔']
};

const generateCards = (gridSize: 4 | 6, theme: keyof typeof EMOJI_SETS = 'romantic'): Card[] => {
  const pairCount = (gridSize * gridSize) / 2;
  const symbols = EMOJI_SETS[theme].slice(0, pairCount);
  const pairs = [...symbols, ...symbols];
  
  // Fisher-Yates shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  
  return pairs.map((symbol, index) => ({
    id: index,
    symbol,
    isFlipped: false,
    isMatched: false
  }));
};

export const MemoryMatch: React.FC<MemoryMatchProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [gridSize, setGridSize] = useState<4 | 6>(4);
  const [theme, setTheme] = useState<keyof typeof EMOJI_SETS>('romantic');

  const initialState: MemoryMatchGameState = {
    cards: [],
    flippedCards: [],
    players: {},
    currentPlayer: user?.email || '',
    status: 'waiting',
    gridSize: 4,
    gameMode: 'solo'
  };

  const { gameState, updateGameState, loading, error } = useRealtimeGame<MemoryMatchGameState>(
    sessionId || 'memorymatch-game',
    'memorymatch',
    initialState
  );

  const startGame = () => {
    const cards = generateCards(gridSize, theme);
    updateGameState({
      ...initialState,
      cards,
      gridSize,
      status: 'active',
      players: {
        [user?.email || '']: { score: 0, moves: 0 }
      }
    });
  };

  const handleCardClick = (cardId: number) => {
    if (!gameState || gameState.status !== 'active') return;
    
    const card = gameState.cards[cardId];
    if (card.isFlipped || card.isMatched || gameState.flippedCards.length >= 2) return;

    const newFlippedCards = [...gameState.flippedCards, cardId];
    const newCards = gameState.cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );

    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards[firstId];
      const secondCard = newCards[secondId];

      const currentPlayerData = gameState.players[user?.email || ''] || { score: 0, moves: 0 };
      const updatedPlayers = {
        ...gameState.players,
        [user?.email || '']: {
          ...currentPlayerData,
          moves: currentPlayerData.moves + 1
        }
      };

      if (firstCard.symbol === secondCard.symbol) {
        // Match found!
        const matchedCards = newCards.map(c =>
          c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
        );

        updatedPlayers[user?.email || ''].score = currentPlayerData.score + 1;

        updateGameState({
          ...gameState,
          cards: matchedCards,
          flippedCards: [],
          players: updatedPlayers
        });

        // Check if game is complete
        if (matchedCards.every(c => c.isMatched)) {
          setTimeout(() => {
            updateGameState({
              ...gameState,
              cards: matchedCards,
              status: 'finished',
              players: updatedPlayers
            });
          }, 500);
        }
      } else {
        // No match - flip back after delay
        updateGameState({
          ...gameState,
          cards: newCards,
          flippedCards: newFlippedCards,
          players: updatedPlayers
        });

        setTimeout(() => {
          const resetCards = gameState.cards.map(c =>
            c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
          );
          updateGameState({
            ...gameState,
            cards: resetCards,
            flippedCards: [],
            players: updatedPlayers
          });
        }, 1000);
      }
    } else {
      updateGameState({
        ...gameState,
        cards: newCards,
        flippedCards: newFlippedCards
      });
    }
  };

  const resetGame = () => {
    updateGameState(initialState);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p className="text-xl font-bold">Error loading game</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  const currentPlayerData = gameState.players[user?.email || ''] || { score: 0, moves: 0 };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-cyan-500 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Memory Match</h1>
          <p className="text-gray-600 dark:text-gray-400">Find matching pairs!</p>
        </div>

        {/* Waiting State */}
        {gameState.status === 'waiting' && (
          <div className="space-y-6">
            {/* Grid Size Selection */}
            <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-400">Grid Size:</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGridSize(4)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gridSize === 4
                      ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/30'
                      : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  <p className="font-semibold">4x4</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">8 pairs - Easy</p>
                </button>
                <button
                  onClick={() => setGridSize(6)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gridSize === 6
                      ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/30'
                      : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  <p className="font-semibold">6x6</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">18 pairs - Hard</p>
                </button>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-400">Theme:</h2>
              <div className="grid grid-cols-3 gap-4">
                {(Object.keys(EMOJI_SETS) as Array<keyof typeof EMOJI_SETS>).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === t
                        ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
                    }`}
                  >
                    <p className="text-2xl mb-2">{EMOJI_SETS[t][0]}</p>
                    <p className="font-semibold capitalize text-sm">{t}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Active Game */}
        {gameState.status === 'active' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="flex justify-around items-center bg-blue-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-center">
                <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlayerData.score}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Pairs</p>
              </div>
              <div className="text-center">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlayerData.moves}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Moves</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {((gameState.gridSize * gameState.gridSize) / 2) - currentPlayerData.score}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Remaining</p>
              </div>
            </div>

            {/* Card Grid */}
            <div className={`grid gap-3 ${
              gameState.gridSize === 4 ? 'grid-cols-4' : 'grid-cols-6'
            }`}>
              {gameState.cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={card.isFlipped || card.isMatched}
                  className={`aspect-square rounded-lg transition-all duration-300 transform ${
                    card.isMatched
                      ? 'bg-green-200 dark:bg-green-900/30 scale-90 opacity-50'
                      : card.isFlipped
                      ? 'bg-blue-100 dark:bg-blue-900/30 scale-105'
                      : 'bg-gradient-to-br from-blue-400 to-cyan-400 hover:scale-105 hover:shadow-lg'
                  } disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-center h-full">
                    {card.isFlipped || card.isMatched ? (
                      <span className="text-4xl md:text-5xl">{card.symbol}</span>
                    ) : (
                      <span className="text-2xl">?</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Finished State */}
        {gameState.status === 'finished' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Congratulations!</h2>
            
            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl p-6 space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Pairs Found</p>
                <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">{currentPlayerData.score}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Total Moves</p>
                <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{currentPlayerData.moves}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Accuracy</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {((currentPlayerData.score / currentPlayerData.moves) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Playing as: {user?.email}</p>
        </div>
      </div>
    </div>
  );
};