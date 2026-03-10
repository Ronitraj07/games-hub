import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { playCorrect, playWrong, playClick } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw';

const CHOICES: { value: Choice; emoji: string; label: string; beats: Choice }[] = [
  { value: 'rock',     emoji: '✊', label: 'Rock',     beats: 'scissors' },
  { value: 'paper',    emoji: '✋', label: 'Paper',    beats: 'rock'     },
  { value: 'scissors', emoji: '✌️', label: 'Scissors', beats: 'paper'    },
];

const TOTAL_ROUNDS = 5;

export const RockPaperScissors: React.FC = () => {
  const { user } = useAuth();
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [cpuChoice, setCpuChoice]       = useState<Choice | null>(null);
  const [result, setResult]             = useState<Result | null>(null);
  const [playerScore, setPlayerScore]   = useState(0);
  const [cpuScore, setCpuScore]         = useState(0);
  const [round, setRound]               = useState(1);
  const [gameOver, setGameOver]         = useState(false);
  const [animating, setAnimating]       = useState(false);
  const [history, setHistory]           = useState<{ player: Choice; cpu: Choice; result: Result }[]>([]);

  const getResult = (player: Choice, cpu: Choice): Result => {
    if (player === cpu) return 'draw';
    return CHOICES.find(c => c.value === player)!.beats === cpu ? 'win' : 'lose';
  };

  const handleChoice = (choice: Choice) => {
    if (animating || gameOver) return;
    setAnimating(true);
    setPlayerChoice(choice);
    setCpuChoice(null);
    setResult(null);

    setTimeout(() => {
      const cpu = CHOICES[Math.floor(Math.random() * 3)].value;
      const res = getResult(choice, cpu);
      setCpuChoice(cpu);
      setResult(res);
      setHistory(h => [...h, { player: choice, cpu, result: res }]);

      if (res === 'win')  { setPlayerScore(s => s + 1); playCorrect(); }
      else if (res === 'lose') { setCpuScore(s => s + 1); playWrong(); }
      else { playClick(); }

      if (round >= TOTAL_ROUNDS) setGameOver(true);
      else setRound(r => r + 1);
      setAnimating(false);
    }, 800);
  };

  const handleRestart = () => {
    setPlayerChoice(null); setCpuChoice(null); setResult(null);
    setPlayerScore(0); setCpuScore(0); setRound(1);
    setGameOver(false); setHistory([]);
  };

  const resultColors = {
    win:  'text-green-600 dark:text-green-400',
    lose: 'text-red-600 dark:text-red-400',
    draw: 'text-yellow-600 dark:text-yellow-400',
  };

  const finalWinner = playerScore > cpuScore ? 'You Win! 🏆' : playerScore < cpuScore ? 'CPU Wins! 🤖' : "It's a Tie! 🤝";

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">✊ Rock Paper Scissors</h1>
          <button onClick={handleRestart} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400">
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="glass-card p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.displayName || 'You'}</p>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{playerScore}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-gray-400">Round {Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</p>
              <p className="text-2xl font-bold text-gray-400">VS</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">CPU</p>
              <p className="text-4xl font-bold text-red-600 dark:text-red-400">{cpuScore}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 mb-4">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <div className={`text-8xl transition-all duration-300 ${animating ? 'animate-bounce' : ''}`}>
                {playerChoice ? CHOICES.find(c => c.value === playerChoice)!.emoji : '❓'}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your choice</p>
            </div>
            <div className="text-3xl font-bold text-gray-300">⚔️</div>
            <div className="text-center flex-1">
              <div className={`text-8xl transition-all duration-300 ${animating ? 'animate-bounce' : ''}`}>
                {animating ? '🤔' : cpuChoice ? CHOICES.find(c => c.value === cpuChoice)!.emoji : '❓'}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">CPU choice</p>
            </div>
          </div>

          {result && !gameOver && (
            <div className={`text-center text-2xl font-bold mb-4 ${resultColors[result]}`}>
              {result === 'win' ? '🎉 You Win!' : result === 'lose' ? '😅 CPU Wins!' : '🤝 Draw!'}
            </div>
          )}

          {!gameOver && (
            <div className="grid grid-cols-3 gap-3">
              {CHOICES.map(choice => (
                <button key={choice.value} onClick={() => handleChoice(choice.value)} disabled={animating}
                  className="glass-btn rounded-xl p-4 text-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                  <div className="text-4xl mb-1">{choice.emoji}</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{choice.label}</div>
                </button>
              ))}
            </div>
          )}

          {gameOver && (
            <div className="text-center">
              <div className="text-5xl mb-3">{playerScore > cpuScore ? '🏆' : playerScore < cpuScore ? '🤖' : '🤝'}</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{finalWinner}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{playerScore} - {cpuScore} after {TOTAL_ROUNDS} rounds</p>
              <button onClick={handleRestart} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold px-8 py-3 rounded-xl transition flex items-center gap-2 mx-auto">
                <RefreshCw size={18} /> Play Again
              </button>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Round History</h3>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div key={i} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  h.result === 'win'  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  h.result === 'lose' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {CHOICES.find(c => c.value === h.player)!.emoji} vs {CHOICES.find(c => c.value === h.cpu)!.emoji}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
