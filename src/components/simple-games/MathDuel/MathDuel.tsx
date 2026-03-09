import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/hooks/shared/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Calculator, Trophy, Zap, Clock } from 'lucide-react';

interface MathProblem {
  question: string;
  answer: number;
  num1: number;
  num2: number;
  operation: '+' | '-' | '×';
}

interface MathDuelGameState {
  currentProblem: MathProblem | null;
  problemNumber: number;
  totalProblems: number;
  players: {
    [email: string]: {
      score: number;
      answers: { correct: boolean; time: number }[];
    };
  };
  status: 'waiting' | 'active' | 'answered' | 'finished';
  timeRemaining: number;
  difficulty: 'easy' | 'medium' | 'hard';
  roundWinner: string | null;
}

interface MathDuelProps {
  sessionId?: string;
}

const generateProblem = (difficulty: 'easy' | 'medium' | 'hard'): MathProblem => {
  let num1: number, num2: number, operation: '+' | '-' | '×';

  switch (difficulty) {
    case 'easy':
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      operation = Math.random() > 0.5 ? '+' : '-';
      if (operation === '-' && num1 < num2) [num1, num2] = [num2, num1];
      break;
    case 'medium':
      num1 = Math.floor(Math.random() * 50) + 10;
      num2 = Math.floor(Math.random() * 50) + 10;
      const ops: ('+' | '-' | '×')[] = ['+', '-', '×'];
      operation = ops[Math.floor(Math.random() * ops.length)];
      if (operation === '-' && num1 < num2) [num1, num2] = [num2, num1];
      if (operation === '×') {
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
      }
      break;
    case 'hard':
      num1 = Math.floor(Math.random() * 100) + 20;
      num2 = Math.floor(Math.random() * 100) + 20;
      const hardOps: ('+' | '-' | '×')[] = ['+', '-', '×'];
      operation = hardOps[Math.floor(Math.random() * hardOps.length)];
      if (operation === '-' && num1 < num2) [num1, num2] = [num2, num1];
      if (operation === '×') {
        num1 = Math.floor(Math.random() * 20) + 5;
        num2 = Math.floor(Math.random() * 20) + 5;
      }
      break;
  }

  let answer: number;
  switch (operation) {
    case '+':
      answer = num1 + num2;
      break;
    case '-':
      answer = num1 - num2;
      break;
    case '×':
      answer = num1 * num2;
      break;
  }

  return {
    question: `${num1} ${operation} ${num2} = ?`,
    answer,
    num1,
    num2,
    operation
  };
};

export const MathDuel: React.FC<MathDuelProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [startTime, setStartTime] = useState<number>(0);

  const partnerEmail = user?.email === 'sinharonitraj@gmail.com' 
    ? 'radhikadidwania567@gmail.com' 
    : 'sinharonitraj@gmail.com';

  const initialState: MathDuelGameState = {
    currentProblem: null,
    problemNumber: 1,
    totalProblems: 10,
    players: {
      [user?.email || '']: { score: 0, answers: [] },
      [partnerEmail]: { score: 0, answers: [] }
    },
    status: 'waiting',
    timeRemaining: 15,
    difficulty: 'medium',
    roundWinner: null
  };

  const { gameState, updateGameState, loading, error } = useRealtimeGame<MathDuelGameState>(
    sessionId || 'mathduel-game',
    'mathduel',
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
        nextProblem();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.timeRemaining, gameState?.status]);

  // Set start time when problem changes
  useEffect(() => {
    if (gameState?.status === 'active' && gameState.currentProblem) {
      setStartTime(Date.now());
    }
  }, [gameState?.currentProblem]);

  const startGame = () => {
    const problem = generateProblem(difficulty);
    updateGameState({
      ...initialState,
      currentProblem: problem,
      difficulty,
      status: 'active',
      players: {
        [user?.email || '']: { score: 0, answers: [] },
        [partnerEmail]: { score: 0, answers: [] }
      }
    });
  };

  const handleAnswer = () => {
    if (!gameState || !gameState.currentProblem || !answer.trim()) return;

    const userAnswer = parseInt(answer);
    const correct = userAnswer === gameState.currentProblem.answer;
    const timeSpent = (Date.now() - startTime) / 1000;

    const updatedPlayers = { ...gameState.players };
    const playerData = updatedPlayers[user?.email || ''];

    playerData.answers.push({ correct, time: timeSpent });

    if (correct) {
      const speedBonus = Math.max(0, Math.floor((15 - gameState.timeRemaining) / 2));
      playerData.score += 10 + speedBonus;
    }

    updateGameState({
      ...gameState,
      players: updatedPlayers,
      roundWinner: correct ? user?.email || '' : null,
      status: 'answered'
    });

    setAnswer('');
    setTimeout(() => nextProblem(), 2000);
  };

  const nextProblem = () => {
    if (!gameState) return;

    if (gameState.problemNumber >= gameState.totalProblems) {
      updateGameState({
        ...gameState,
        status: 'finished'
      });
    } else {
      const problem = generateProblem(gameState.difficulty);
      updateGameState({
        ...gameState,
        currentProblem: problem,
        problemNumber: gameState.problemNumber + 1,
        status: 'active',
        timeRemaining: 15,
        roundWinner: null
      });
    }
  };

  const resetGame = () => {
    updateGameState(initialState);
    setAnswer('');
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

  const myScore = gameState.players[user?.email || '']?.score || 0;
  const opponentScore = gameState.players[partnerEmail]?.score || 0;
  const myCorrect = gameState.players[user?.email || '']?.answers.filter(a => a.correct).length || 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-500 to-teal-600 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Math Duel</h1>
          <p className="text-gray-600 dark:text-gray-400">Solve math problems faster than your opponent!</p>
        </div>

        {/* Waiting State */}
        {gameState.status === 'waiting' && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">Choose Difficulty:</h2>
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      difficulty === level
                        ? 'border-green-600 bg-green-100 dark:bg-green-900/30'
                        : 'border-gray-300 dark:border-gray-700 hover:border-green-400'
                    }`}
                  >
                    <p className="font-semibold capitalize">{level}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {level === 'easy' && '+ and - (1-20)'}
                      {level === 'medium' && '+ - × (10-50)'}
                      {level === 'hard' && '+ - × (20-100)'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">Rules:</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Solve {gameState.totalProblems} math problems</li>
                <li>• 15 seconds per problem</li>
                <li>• 10 points for correct answer + speed bonus</li>
                <li>• First correct answer wins the round!</li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Start Math Duel!
            </button>
          </div>
        )}

        {/* Active Game */}
        {(gameState.status === 'active' || gameState.status === 'answered') && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{myScore}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Your Score</p>
              </div>
              <div className="bg-green-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <Zap className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gameState.problemNumber}/{gameState.totalProblems}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Problem</p>
              </div>
              <div className="bg-green-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <Clock className={`w-6 h-6 ${gameState.timeRemaining <= 5 ? 'text-red-600' : 'text-gray-600'} mx-auto mb-1`} />
                <p className={`text-2xl font-bold ${gameState.timeRemaining <= 5 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {gameState.timeRemaining}s
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Time Left</p>
              </div>
            </div>

            {/* Problem */}
            {gameState.currentProblem && (
              <div className="bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 rounded-xl p-12 text-center">
                <p className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                  {gameState.currentProblem.num1} {gameState.currentProblem.operation} {gameState.currentProblem.num2} = ?
                </p>
              </div>
            )}

            {/* Answer Input */}
            {gameState.status === 'active' && (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
                  placeholder="Type your answer..."
                  className="flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-green-600 focus:outline-none text-3xl text-center dark:bg-gray-800 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={handleAnswer}
                  disabled={!answer.trim()}
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-lg rounded-lg transition-colors"
                >
                  Submit
                </button>
              </div>
            )}

            {/* Answer Result */}
            {gameState.status === 'answered' && (
              <div className={`rounded-lg p-6 text-center ${
                gameState.roundWinner === user?.email
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <p className="text-4xl mb-2">
                  {gameState.roundWinner === user?.email ? '✅' : '❌'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {gameState.roundWinner === user?.email ? 'Correct!' : 'Wrong!'}
                </p>
                {gameState.currentProblem && (
                  <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                    Answer: {gameState.currentProblem.answer}
                  </p>
                )}
              </div>
            )}

            {/* Score Comparison */}
            <div className="flex justify-between items-center bg-green-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">You</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{myCorrect} ✓</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">vs</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Opponent</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {gameState.players[partnerEmail]?.answers.filter(a => a.correct).length || 0} ✓
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Finished State */}
        {gameState.status === 'finished' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">
              {myScore > opponentScore ? '🏆' : myScore < opponentScore ? '😢' : '🤝'}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {myScore > opponentScore ? 'You Won!' : myScore < opponentScore ? 'You Lost!' : "It's a Tie!"}
            </h2>

            <div className="bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 rounded-xl p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Final Score</p>
              <p className="text-5xl font-bold text-green-700 dark:text-green-300 mb-4">
                {myScore} - {opponentScore}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Your Correct</p>
                  <p className="text-2xl font-bold text-green-600">{myCorrect}/{gameState.totalProblems}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Average Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {myCorrect > 0
                      ? (gameState.players[user?.email || ''].answers
                          .filter(a => a.correct)
                          .reduce((acc, a) => acc + a.time, 0) / myCorrect).toFixed(1)
                      : 0}s
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};