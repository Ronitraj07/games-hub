import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/hooks/shared/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Paintbrush, Trophy, Clock, RotateCcw, Check } from 'lucide-react';

interface PictionaryGameState {
  currentWord: string;
  drawer: string;
  guesser: string;
  canvasData: string;
  status: 'waiting' | 'drawing' | 'guessed' | 'timeout' | 'finished';
  timeRemaining: number;
  scores: {
    [email: string]: number;
  };
  roundNumber: number;
  totalRounds: number;
  guessInput: string;
}

interface PictionaryProps {
  sessionId?: string;
}

const WORDS = [
  'heart', 'love', 'flower', 'star', 'moon', 'sun', 'tree', 'house',
  'cat', 'dog', 'bird', 'fish', 'car', 'book', 'phone', 'coffee',
  'pizza', 'cake', 'ice cream', 'rainbow', 'mountain', 'beach', 'guitar', 'piano',
  'smile', 'kiss', 'hug', 'ring', 'crown', 'butterfly', 'umbrella', 'balloon'
];

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
];

const BRUSH_SIZES = [2, 5, 10, 15];

export const Pictionary: React.FC<PictionaryProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [guess, setGuess] = useState('');

  const partnerEmail = user?.email === 'sinharonitraj@gmail.com' 
    ? 'radhikadidwania567@gmail.com' 
    : 'sinharonitraj@gmail.com';

  const initialState: PictionaryGameState = {
    currentWord: '',
    drawer: user?.email || '',
    guesser: partnerEmail,
    canvasData: '',
    status: 'waiting',
    timeRemaining: 60,
    scores: {
      [user?.email || '']: 0,
      [partnerEmail]: 0
    },
    roundNumber: 1,
    totalRounds: 6,
    guessInput: ''
  };

  const { gameState, updateGameState, loading, error } = useRealtimeGame<PictionaryGameState>(
    sessionId || 'pictionary-game',
    'pictionary',
    initialState
  );

  // Timer effect
  useEffect(() => {
    if (!gameState || gameState.status !== 'drawing') return;

    const timer = setInterval(() => {
      if (gameState.timeRemaining > 0) {
        updateGameState({
          ...gameState,
          timeRemaining: gameState.timeRemaining - 1
        });
      } else {
        updateGameState({
          ...gameState,
          status: 'timeout'
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.timeRemaining, gameState?.status]);

  // Load canvas data
  useEffect(() => {
    if (!gameState || !canvasRef.current || !gameState.canvasData) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
    img.src = gameState.canvasData;
  }, [gameState?.canvasData]);

  const startGame = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    updateGameState({
      ...initialState,
      currentWord: word,
      status: 'drawing'
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState?.drawer !== user?.email) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveCanvas();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || gameState?.drawer !== user?.email) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const saveCanvas = () => {
    if (!canvasRef.current || !gameState) return;
    const dataUrl = canvasRef.current.toDataURL();
    updateGameState({
      ...gameState,
      canvasData: dataUrl
    });
  };

  const clearCanvas = () => {
    if (!canvasRef.current || gameState?.drawer !== user?.email) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvas();
  };

  const handleGuess = () => {
    if (!gameState || !guess.trim() || gameState.guesser !== user?.email) return;

    if (guess.toLowerCase() === gameState.currentWord.toLowerCase()) {
      const timeBonus = Math.floor(gameState.timeRemaining / 5);
      const points = 10 + timeBonus;
      
      const updatedScores = { ...gameState.scores };
      updatedScores[user?.email || ''] += points;
      updatedScores[gameState.drawer] += points; // Drawer also gets points

      updateGameState({
        ...gameState,
        scores: updatedScores,
        status: 'guessed',
        guessInput: guess
      });
    } else {
      updateGameState({
        ...gameState,
        guessInput: guess
      });
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
    } else {
      // Swap roles
      const word = WORDS[Math.floor(Math.random() * WORDS.length)];
      updateGameState({
        ...gameState,
        currentWord: word,
        drawer: gameState.guesser,
        guesser: gameState.drawer,
        canvasData: '',
        status: 'drawing',
        timeRemaining: 60,
        roundNumber: gameState.roundNumber + 1,
        guessInput: ''
      });

      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  };

  const resetGame = () => {
    updateGameState(initialState);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
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

  const isDrawer = gameState.drawer === user?.email;
  const myScore = gameState.scores[user?.email || ''] || 0;
  const opponentScore = gameState.scores[partnerEmail] || 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-500 to-purple-600 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-600 rounded-full mb-4">
            <Paintbrush className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Pictionary</h1>
          <p className="text-gray-600 dark:text-gray-400">Draw and guess words!</p>
        </div>

        {/* Waiting State */}
        {gameState.status === 'waiting' && (
          <div className="space-y-6">
            <div className="bg-pink-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-pink-700 dark:text-pink-400">How to Play:</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Take turns drawing and guessing</li>
                <li>• Drawer gets a word to draw (60 seconds)</li>
                <li>• Guesser tries to guess the word</li>
                <li>• Both players score points for correct guesses!</li>
                <li>• {gameState.totalRounds} rounds total</li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Start Drawing!
            </button>
          </div>
        )}

        {/* Active Game */}
        {(gameState.status === 'drawing' || gameState.status === 'guessed' || gameState.status === 'timeout') && (
          <div className="space-y-6">
            {/* Score & Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-pink-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{myScore}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">You</p>
              </div>
              <div className="bg-pink-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <Clock className={`w-6 h-6 ${gameState.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-600'} mx-auto mb-1`} />
                <p className={`text-2xl font-bold ${gameState.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {gameState.timeRemaining}s
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Round {gameState.roundNumber}/{gameState.totalRounds}</p>
              </div>
              <div className="bg-pink-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{opponentScore}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Opponent</p>
              </div>
            </div>

            {/* Word Display (only for drawer) */}
            {isDrawer && gameState.status === 'drawing' && (
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Draw this word:</p>
                <p className="text-3xl font-bold text-pink-700 dark:text-pink-300">{gameState.currentWord.toUpperCase()}</p>
              </div>
            )}

            {/* Drawing Tools (only for drawer) */}
            {isDrawer && gameState.status === 'drawing' && (
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        color === c ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  {BRUSH_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`px-3 py-1 rounded-lg border-2 transition-all ${
                        brushSize === size
                          ? 'border-pink-600 bg-pink-100 dark:bg-pink-900/30'
                          : 'border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear
                </button>
              </div>
            )}

            {/* Canvas */}
            <div className="border-4 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className={`w-full ${isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
              />
            </div>

            {/* Guess Input (only for guesser) */}
            {!isDrawer && gameState.status === 'drawing' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
                  placeholder="Type your guess..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-pink-600 focus:outline-none dark:bg-gray-800 dark:text-white text-lg"
                />
                <button
                  onClick={handleGuess}
                  disabled={!guess.trim()}
                  className="px-6 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  Guess
                </button>
              </div>
            )}

            {/* Result */}
            {(gameState.status === 'guessed' || gameState.status === 'timeout') && (
              <div className="space-y-4">
                <div className={`rounded-lg p-6 text-center ${
                  gameState.status === 'guessed' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <div className="text-6xl mb-2">
                    {gameState.status === 'guessed' ? '✅' : '⏰'}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {gameState.status === 'guessed' ? 'Correct Guess!' : 'Time\'s Up!'}
                  </h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300">
                    The word was: <span className="font-bold">{gameState.currentWord}</span>
                  </p>
                </div>
                <button
                  onClick={nextRound}
                  className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-bold text-lg rounded-lg transition-colors"
                >
                  {gameState.roundNumber < gameState.totalRounds ? 'Next Round' : 'Finish Game'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Finished State */}
        {gameState.status === 'finished' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">
              {myScore > opponentScore ? '🎨' : myScore < opponentScore ? '🎭' : '🤝'}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {myScore > opponentScore ? 'You Won!' : myScore < opponentScore ? 'You Lost!' : "It's a Tie!"}
            </h2>

            <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Final Score</p>
              <p className="text-5xl font-bold text-pink-700 dark:text-pink-300">
                {myScore} - {opponentScore}
              </p>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};