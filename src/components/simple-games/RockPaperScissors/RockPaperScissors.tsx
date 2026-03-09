import React, { useState, useEffect } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/hooks/shared/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Hand, Trophy, Zap } from 'lucide-react';

type Choice = 'rock' | 'paper' | 'scissors';

interface RPSGameState {
  players: {
    [email: string]: {
      choice: Choice | null;
      score: number;
    };
  };
  roundNumber: number;
  totalRounds: number;
  roundWinner: string | null;
  gameWinner: string | null;
  status: 'waiting' | 'choosing' | 'reveal' | 'finished';
  countdown: number;
}

interface RockPaperScissorsProps {
  sessionId?: string;
}

const CHOICES: { name: Choice; emoji: string; beats: Choice }[] = [
  { name: 'rock', emoji: '🪨', beats: 'scissors' },
  { name: 'paper', emoji: '📄', beats: 'rock' },
  { name: 'scissors', emoji: '✂️', beats: 'paper' }
];

const determineWinner = (choice1: Choice, choice2: Choice): 'player1' | 'player2' | 'draw' => {
  if (choice1 === choice2) return 'draw';
  const choice1Data = CHOICES.find(c => c.name === choice1);
  return choice1Data?.beats === choice2 ? 'player1' : 'player2';
};

export const RockPaperScissors: React.FC<RockPaperScissorsProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);

  const partnerEmail = user?.email === 'sinharonitraj@gmail.com' 
    ? 'radhikadidwania567@gmail.com' 
    : 'sinharonitraj@gmail.com';

  const initialState: RPSGameState = {
    players: {
      [user?.email || '']: { choice: null, score: 0 },
      [partnerEmail]: { choice: null, score: 0 }
    },
    roundNumber: 1,
    totalRounds: 5,
    roundWinner: null,
    gameWinner: null,
    status: 'waiting',
    countdown: 3
  };

  const { gameState, updateGameState, loading, error } = useRealtimeGame<RPSGameState>(
    sessionId || 'rps-game',
    'rps',
    initialState
  );

  // Countdown effect
  useEffect(() => {
    if (!gameState || gameState.status !== 'reveal' || gameState.countdown <= 0) return;

    const timer = setTimeout(() => {
      updateGameState({
        ...gameState,
        countdown: gameState.countdown - 1
      });

      if (gameState.countdown === 1) {
        nextRound();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameState?.countdown, gameState?.status]);

  const startGame = () => {
    updateGameState({
      ...initialState,
      status: 'choosing'
    });
  };

  const handleChoiceSelect = (choice: Choice) => {
    if (!gameState || gameState.status !== 'choosing') return;

    const updatedPlayers = { ...gameState.players };
    updatedPlayers[user?.email || ''].choice = choice;

    setSelectedChoice(choice);

    // Check if both players have chosen
    const allChosen = Object.values(updatedPlayers).every(p => p.choice !== null);

    if (allChosen) {
      // Determine round winner
      const emails = Object.keys(updatedPlayers);
      const choice1 = updatedPlayers[emails[0]].choice!;
      const choice2 = updatedPlayers[emails[1]].choice!;
      const result = determineWinner(choice1, choice2);

      let roundWinner: string | null = null;
      if (result === 'player1') {
        roundWinner = emails[0];
        updatedPlayers[emails[0]].score += 1;
      } else if (result === 'player2') {
        roundWinner = emails[1];
        updatedPlayers[emails[1]].score += 1;
      }

      updateGameState({
        ...gameState,
        players: updatedPlayers,
        roundWinner,
        status: 'reveal',
        countdown: 3
      });
    } else {
      updateGameState({
        ...gameState,
        players: updatedPlayers
      });
    }
  };

  const nextRound = () => {
    if (!gameState) return;

    const emails = Object.keys(gameState.players);
    const score1 = gameState.players[emails[0]].score;
    const score2 = gameState.players[emails[1]].score;

    // Check if game is over
    if (gameState.roundNumber >= gameState.totalRounds) {
      const gameWinner = score1 > score2 ? emails[0] : score2 > score1 ? emails[1] : null;
      updateGameState({
        ...gameState,
        gameWinner,
        status: 'finished'
      });
    } else {
      // Reset for next round
      const resetPlayers = { ...gameState.players };
      Object.keys(resetPlayers).forEach(email => {
        resetPlayers[email].choice = null;
      });

      updateGameState({
        ...gameState,
        players: resetPlayers,
        roundNumber: gameState.roundNumber + 1,
        roundWinner: null,
        status: 'choosing',
        countdown: 3
      });
      setSelectedChoice(null);
    }
  };

  const resetGame = () => {
    updateGameState(initialState);
    setSelectedChoice(null);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-500 to-red-600 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-full mb-4">
            <Hand className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Rock Paper Scissors</h1>
          <p className="text-gray-600 dark:text-gray-400">Best of {gameState.totalRounds}!</p>
        </div>

        {/* Waiting State */}
        {gameState.status === 'waiting' && (
          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-orange-700 dark:text-orange-400">Rules:</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• 🪨 Rock crushes Scissors</li>
                <li>• 📄 Paper covers Rock</li>
                <li>• ✂️ Scissors cuts Paper</li>
                <li>• First to win {Math.ceil(gameState.totalRounds / 2)} rounds wins the game!</li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Start Battle!
            </button>
          </div>
        )}

        {/* Choosing State */}
        {gameState.status === 'choosing' && (
          <div className="space-y-6">
            {/* Score Display */}
            <div className="flex justify-around items-center bg-orange-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-center">
                <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{myScore}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">You</p>
              </div>
              <div className="text-center">
                <Zap className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  Round {gameState.roundNumber}/{gameState.totalRounds}
                </p>
              </div>
              <div className="text-center">
                <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{opponentScore}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Opponent</p>
              </div>
            </div>

            {/* Choice Buttons */}
            <div className="text-center mb-4">
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {selectedChoice ? 'Waiting for opponent...' : 'Make your choice!'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {CHOICES.map((choice) => (
                <button
                  key={choice.name}
                  onClick={() => handleChoiceSelect(choice.name)}
                  disabled={selectedChoice !== null}
                  className={`p-8 rounded-xl border-4 transition-all transform ${
                    selectedChoice === choice.name
                      ? 'bg-orange-200 border-orange-600 scale-95 dark:bg-orange-900/30'
                      : 'bg-white border-gray-300 hover:border-orange-400 hover:scale-105 dark:bg-gray-800 dark:border-gray-700'
                  } disabled:cursor-not-allowed`}
                >
                  <p className="text-6xl mb-2">{choice.emoji}</p>
                  <p className="font-bold text-lg capitalize text-gray-900 dark:text-white">{choice.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reveal State */}
        {gameState.status === 'reveal' && (
          <div className="space-y-6">
            {/* Score Display */}
            <div className="flex justify-around items-center bg-orange-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{myScore}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">You</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  Round {gameState.roundNumber}/{gameState.totalRounds}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{opponentScore}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Opponent</p>
              </div>
            </div>

            {/* Reveal */}
            <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl p-8 text-center">
              <div className="flex justify-center items-center gap-8 mb-6">
                <div className="text-center">
                  <p className="text-7xl mb-2">
                    {CHOICES.find(c => c.name === gameState.players[user?.email || ''].choice)?.emoji}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">You</p>
                </div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">VS</p>
                <div className="text-center">
                  <p className="text-7xl mb-2">
                    {CHOICES.find(c => c.name === gameState.players[partnerEmail].choice)?.emoji}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Opponent</p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {gameState.roundWinner === null
                  ? "It's a Draw!"
                  : gameState.roundWinner === user?.email
                  ? 'You Win This Round! 🎉'
                  : 'Opponent Wins This Round!'}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Next round in {gameState.countdown}...
              </p>
            </div>
          </div>
        )}

        {/* Finished State */}
        {gameState.status === 'finished' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">
              {gameState.gameWinner === null ? '🤝' : gameState.gameWinner === user?.email ? '🏆' : '😢'}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {gameState.gameWinner === null ? "It's a Tie!" : gameState.gameWinner === user?.email ? 'You Won!' : 'You Lost!'}
            </h2>

            <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Final Score</p>
              <p className="text-5xl font-bold text-orange-700 dark:text-orange-300">
                {myScore} - {opponentScore}
              </p>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};