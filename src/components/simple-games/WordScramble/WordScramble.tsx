import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/hooks/shared/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Shuffle, Trophy, Clock, Zap } from 'lucide-react';

interface WordScrambleGameState {
  currentWord: string;
  scrambledWord: string;
  roundNumber: number;
  totalRounds: number;
  players: {
    [email: string]: {
      score: number;
      lastAnswerTime: number;
    };
  };
  currentPlayer: string;
  status: 'waiting' | 'active' | 'finished';
  timeRemaining: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface WordScrambleProps {
  sessionId?: string;
}

const WORD_LISTS = {
  easy: [
    'love', 'heart', 'smile', 'happy', 'friend', 'music', 'dance', 'dream',
    'star', 'moon', 'sun', 'flower', 'sweet', 'joy', 'peace', 'hope'
  ],
  medium: [
    'romance', 'laughter', 'memories', 'forever', 'together', 'adventure',
    'treasure', 'harmony', 'passion', 'destiny', 'precious', 'magical'
  ],
  hard: [
    'relationship', 'affection', 'compassion', 'commitment', 'wonderful',
    'beautiful', 'extraordinary', 'magnificent', 'incredible', 'spectacular'
  ]
};

const scrambleWord = (word: string): string => {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const scrambled = arr.join('');
  return scrambled === word ? scrambleWord(word) : scrambled;
};

const getRandomWord = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  const words = WORD_LISTS[difficulty];
  return words[Math.floor(Math.random() * words.length)];
};

export const WordScramble: React.FC<WordScrambleProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const initialState: WordScrambleGameState = {
    currentWord: '',
    scrambledWord: '',
    roundNumber: 1,
    totalRounds: 10,
    players: {},
    currentPlayer: user?.email || '',
    status: 'waiting',
    timeRemaining: 30,
    difficulty: 'medium'
  };

  const { gameState, updateGameState, loading, error } = useRealtimeGame<WordScrambleGameState>(
    sessionId || 'wordscramble-game',
    'wordscramble',
    initialState
  );

  // Timer effect
  useEffect(() => {
    if (!gameState || gameState.status !== 'active') return;

    const timer = setInterval(() => {
      if (gameState.timeRemaining > 0) {
        updateGameState({
          ...gameState,
          timeRemaining: gameState.timeRemaining - 1
        });
      } else {
        handleTimeout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.timeRemaining, gameState?.status]);

  const startGame = () => {
    const word = getRandomWord(difficulty);
    updateGameState({
      ...initialState,
      currentWord: word,
      scrambledWord: scrambleWord(word),
      status: 'active',
      difficulty,
      players: {
        [user?.email || '']: { score: 0, lastAnswerTime: 0 }
      }
    });
    setFeedback(null);
  };

  const handleTimeout = () => {
    if (!gameState) return;
    setFeedback({ type: 'error', message: `Time's up! The word was: ${gameState.currentWord}` });
    setTimeout(() => nextRound(), 2000);
  };

  const handleGuess = () => {
    if (!gameState || !guess.trim()) return;

    if (guess.toLowerCase() === gameState.currentWord.toLowerCase()) {
      const timeBonus = Math.floor(gameState.timeRemaining / 3);
      const points = 10 + timeBonus;
      
      const updatedPlayers = { ...gameState.players };
      const currentPlayerData = updatedPlayers[user?.email || ''] || { score: 0, lastAnswerTime: 0 };
      updatedPlayers[user?.email || ''] = {
        score: currentPlayerData.score + points,
        lastAnswerTime: 30 - gameState.timeRemaining
      };

      updateGameState({
        ...gameState,
        players: updatedPlayers
      });

      setFeedback({ 
        type: 'success', 
        message: `🎉 Correct! +${points} points (${timeBonus} time bonus)` 
      });
      
      setTimeout(() => nextRound(), 1500);
    } else {
      setFeedback({ type: 'error', message: '❌ Try again!' });
    }
    setGuess('');
  };

  const nextRound = () => {
    if (!gameState) return;

    if (gameState.roundNumber >= gameState.totalRounds) {
      updateGameState({
        ...gameState,
        status: 'finished'
      });
      return;
    }

    const word = getRandomWord(gameState.difficulty);
    updateGameState({
      ...gameState,
      currentWord: word,
      scrambledWord: scrambleWord(word),
      roundNumber: gameState.roundNumber + 1,
      timeRemaining: 30
    });
    setFeedback(null);
  };

  const resetGame = () => {
    setGuess('');
    setFeedback(null);
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

  const currentPlayerScore = gameState.players[user?.email || '']?.score || 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <Shuffle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Word Scramble</h1>
          <p className="text-gray-600 dark:text-gray-400">Unscramble the word before time runs out!</p>
        </div>

        {/* Waiting State */}
        {gameState.status === 'waiting' && (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-purple-700 dark:text-purple-400">Choose Difficulty:</h2>
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      difficulty === level
                        ? 'border-purple-600 bg-purple-100 dark:bg-purple-900/30'
                        : 'border-gray-300 dark:border-gray-700 hover:border-purple-400'
                    }`}
                  >
                    <p className="font-semibold capitalize">{level}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {level === 'easy' && '4-5 letters'}
                      {level === 'medium' && '6-8 letters'}
                      {level === 'hard' && '9+ letters'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Active Game */}
        {gameState.status === 'active' && (
          <div className="space-y-6">
            {/* Game Info */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Score: {currentPlayerScore}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${gameState.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-600'}`} />
                <span className={`font-semibold ${gameState.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {gameState.timeRemaining}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Round {gameState.roundNumber}/{gameState.totalRounds}
                </span>
              </div>
            </div>

            {/* Scrambled Word */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-8 text-center">
              <p className="text-5xl font-bold tracking-widest text-purple-700 dark:text-purple-300">
                {gameState.scrambledWord.toUpperCase()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {gameState.currentWord.length} letters
              </p>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={`p-4 rounded-lg text-center font-semibold ${
                feedback.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                feedback.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-purple-600 focus:outline-none text-lg dark:bg-gray-800 dark:text-white"
                autoFocus
              />
              <button
                onClick={handleGuess}
                disabled={!guess.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Finished State */}
        {gameState.status === 'finished' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Game Complete!</h2>
            
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Final Score</p>
              <p className="text-5xl font-bold text-purple-700 dark:text-purple-300">{currentPlayerScore}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Average: {(currentPlayerScore / gameState.totalRounds).toFixed(1)} points per round
              </p>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-lg transition-colors"
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