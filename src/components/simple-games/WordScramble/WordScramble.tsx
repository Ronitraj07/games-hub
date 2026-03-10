import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { playSound } from '@/utils/sounds';
import { RefreshCw, Clock, Trophy, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const WORD_LIST = [
  { word: 'LOVE', hint: 'A deep feeling of affection' },
  { word: 'HEART', hint: 'Organ that pumps blood, symbol of love' },
  { word: 'ROSE', hint: 'A popular romantic flower' },
  { word: 'KISS', hint: 'A touch with the lips' },
  { word: 'DREAM', hint: 'Images in your sleep or an aspiration' },
  { word: 'SMILE', hint: 'Expression of happiness' },
  { word: 'TRUST', hint: 'Firm belief in reliability of someone' },
  { word: 'DANCE', hint: 'Moving rhythmically to music' },
  { word: 'MAGIC', hint: 'Something wonderful and unexplainable' },
  { word: 'BLISS', hint: 'Perfect happiness' },
  { word: 'CHERISH', hint: 'To hold dear' },
  { word: 'FOREVER', hint: 'For all time' },
  { word: 'TENDER', hint: 'Gentle and caring' },
  { word: 'WARMTH', hint: 'Feeling of comfort and affection' },
  { word: 'CANDLE', hint: 'A wax stick used for light or romance' },
  { word: 'SUNSET', hint: 'The sun going down in the evening' },
  { word: 'CUDDLE', hint: 'Holding someone close warmly' },
  { word: 'MEMORY', hint: 'Something you remember from the past' },
  { word: 'PROMISE', hint: 'A commitment to do something' },
  { word: 'JOURNEY', hint: 'A long trip or experience' },
];

const scrambleWord = (word: string): string => {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('') === word ? scrambleWord(word) : arr.join('');
};

export const WordScramble: React.FC = () => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const TOTAL_ROUNDS = 10;

  const words = React.useMemo(() => {
    const shuffled = [...WORD_LIST].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_ROUNDS);
  }, []);

  const loadWord = useCallback((index: number) => {
    if (index < TOTAL_ROUNDS) {
      setScrambled(scrambleWord(words[index].word));
      setInput('');
      setTimeLeft(30);
      setShowHint(false);
      setFeedback(null);
    }
  }, [words]);

  useEffect(() => { loadWord(0); }, [loadWord]);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNext(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, gameOver]);

  const handleNext = (correct: boolean) => {
    const next = currentIndex + 1;
    if (correct) {
      const points = timeLeft > 20 ? 15 : timeLeft > 10 ? 10 : 5;
      setScore(s => s + points + (streak >= 2 ? 5 : 0));
      setStreak(s => s + 1);
      playSound('success');
    } else {
      setStreak(0);
      playSound('error');
    }
    if (next >= TOTAL_ROUNDS) {
      setGameOver(true);
    } else {
      setCurrentIndex(next);
      setRound(next + 1);
      loadWord(next);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCorrect = input.trim().toUpperCase() === words[currentIndex].word;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => handleNext(isCorrect), 600);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setRound(1);
    setStreak(0);
    setGameOver(false);
    loadWord(0);
  };

  const timerColor = timeLeft > 15 ? 'text-green-500' : timeLeft > 8 ? 'text-yellow-500' : 'text-red-500';

  if (gameOver) {
    const maxScore = TOTAL_ROUNDS * 20;
    const pct = (score / maxScore) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Game Over!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Well played, {user?.displayName || 'Player'}!</p>
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-6 mb-6">
            <p className="text-5xl font-bold text-purple-600 dark:text-purple-400">{score}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">out of {maxScore} points</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-3">
              <div className="bg-purple-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRestart} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <RefreshCw size={18} /> Play Again
            </button>
            <Link to="/" className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <ArrowLeft size={18} /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔤 Word Scramble</h1>
          <div className="flex items-center gap-1 text-yellow-600">
            <Trophy size={18} />
            <span className="font-bold">{score}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Round {round}/{TOTAL_ROUNDS}</span>
            <div className={`flex items-center gap-1 font-bold text-lg ${timerColor}`}>
              <Clock size={18} />
              {timeLeft}s
            </div>
            {streak >= 2 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Star size={16} fill="currentColor" />
                <span className="text-sm font-bold">{streak}x streak!</span>
              </div>
            )}
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${(timeLeft / 30) * 100}%` }} />
          </div>

          <div className={`text-center mb-6 p-6 rounded-xl transition-all ${
            feedback === 'correct' ? 'bg-green-50 dark:bg-green-900/30' :
            feedback === 'wrong' ? 'bg-red-50 dark:bg-red-900/30' :
            'bg-purple-50 dark:bg-purple-900/20'
          }`}>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Unscramble this word:</p>
            <p className="text-5xl font-bold tracking-widest text-purple-600 dark:text-purple-400">
              {scrambled.split('').join(' ')}
            </p>
            {feedback && (
              <p className={`mt-3 font-semibold ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                {feedback === 'correct' ? '✅ Correct!' : `❌ It was: ${words[currentIndex].word}`}
              </p>
            )}
          </div>

          {showHint && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">💡 Hint: {words[currentIndex].hint}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              placeholder="Type your answer..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg font-semibold uppercase tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition">
              Go!
            </button>
          </form>

          <button
            onClick={() => setShowHint(true)}
            className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
          >
            💡 Show Hint (-3 pts)
          </button>
        </div>
      </div>
    </div>
  );
};
