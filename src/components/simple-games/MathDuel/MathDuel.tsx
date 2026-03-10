import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { playCorrect, playWrong } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Problem {
  question: string;
  answer: number;
  options: number[];
}

const generateProblem = (difficulty: Difficulty): Problem => {
  let a: number, b: number, question: string, answer: number;
  if (difficulty === 'easy') {
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    if (op === '-' && b > a) [a, b] = [b, a];
    answer = op === '+' ? a + b : a - b;
    question = `${a} ${op} ${b} = ?`;
  } else if (difficulty === 'medium') {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    a = Math.floor(Math.random() * 12) + 1;
    b = Math.floor(Math.random() * 12) + 1;
    if (op === '-' && b > a) [a, b] = [b, a];
    answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
    question = `${a} ${op} ${b} = ?`;
  } else {
    const ops = ['×', '÷', '+', '-'];
    const op  = ops[Math.floor(Math.random() * ops.length)];
    a = Math.floor(Math.random() * 15) + 2;
    b = Math.floor(Math.random() * 10) + 2;
    if (op === '÷') { answer = a; a = a * b; }
    else if (op === '-' && b > a) { [a, b] = [b, a]; answer = a - b; }
    else { answer = op === '+' ? a + b : op === '-' ? a - b : a * b; }
    question = `${a} ${op} ${b} = ?`;
  }
  const wrongOptions = new Set<number>();
  while (wrongOptions.size < 3) {
    const offset = Math.floor(Math.random() * 10) + 1;
    const wrong  = Math.random() > 0.5 ? answer + offset : answer - offset;
    if (wrong !== answer) wrongOptions.add(wrong);
  }
  const options = [answer, ...wrongOptions].sort(() => Math.random() - 0.5);
  return { question, answer, options };
};

const TOTAL_QUESTIONS = 10;
const TIME_PER_Q: Record<Difficulty, number> = { easy: 15, medium: 12, hard: 8 };

export const MathDuel: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [problem, setProblem]       = useState<Problem | null>(null);
  const [score, setScore]           = useState(0);
  const [round, setRound]           = useState(1);
  const [timeLeft, setTimeLeft]     = useState(15);
  const [selected, setSelected]     = useState<number | null>(null);
  const [correct, setCorrect]       = useState(0);
  const [gameOver, setGameOver]     = useState(false);
  const [streak, setStreak]         = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextQuestion = useCallback((diff: Difficulty) => {
    setProblem(generateProblem(diff));
    setSelected(null); setShowFeedback(false); setTimeLeft(TIME_PER_Q[diff]);
  }, []);

  useEffect(() => {
    if (!difficulty || gameOver || showFeedback) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); handleAnswer(-999); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [round, difficulty, gameOver, showFeedback]);

  const handleAnswer = useCallback((option: number) => {
    if (showFeedback || !problem) return;
    clearInterval(timerRef.current!);
    setSelected(option);
    setShowFeedback(true);
    const isCorrect = option === problem.answer;
    if (isCorrect) {
      const bonus = timeLeft > (TIME_PER_Q[difficulty!] * 0.6) ? 10 : 5;
      setScore(s => s + bonus + (streak >= 2 ? 5 : 0));
      setCorrect(c => c + 1);
      setStreak(s => s + 1);
      playCorrect();
    } else {
      setStreak(0); playWrong();
    }
    setTimeout(() => {
      if (round >= TOTAL_QUESTIONS) setGameOver(true);
      else { setRound(r => r + 1); nextQuestion(difficulty!); }
    }, 800);
  }, [showFeedback, problem, timeLeft, difficulty, streak, round, nextQuestion]);

  if (!difficulty) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🧮</div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent mb-2">Math Duel</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Choose your difficulty</p>
        <div className="grid gap-3">
          {(['easy','medium','hard'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => { setDifficulty(d); nextQuestion(d); }}
              className={`p-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 ${
                d === 'easy'   ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                d === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                                 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
              }`}>
              {d === 'easy' ? '🟢 Easy (+, -)' : d === 'medium' ? '🟡 Medium (+, -, ×)' : '🔴 Hard (+, -, ×, ÷)'}
              <p className="text-sm opacity-80 mt-1">{TIME_PER_Q[d]}s per question</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (gameOver) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">{(correct / TOTAL_QUESTIONS) >= 0.8 ? '🏆' : (correct / TOTAL_QUESTIONS) >= 0.5 ? '⭐' : '💪'}</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Duel Over!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{correct}/{TOTAL_QUESTIONS} correct • {difficulty} mode</p>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-6 mb-6">
          <p className="text-5xl font-bold text-green-600 dark:text-green-400">{score}</p>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Total Points</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setDifficulty(null); setScore(0); setRound(1); setCorrect(0); setGameOver(false); setStreak(0); }}
            className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
            <RefreshCw size={18} /> Play Again
          </button>
          <Link to="/" className="flex-1 glass-btn text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Home
          </Link>
        </div>
      </div>
    </div>
  );

  const timerPct = (timeLeft / TIME_PER_Q[difficulty]) * 100;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">🧮 Math Duel</h1>
          <div className="flex items-center gap-1 text-yellow-600"><Trophy size={18} /><span className="font-bold">{score}</span></div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">Q {round}/{TOTAL_QUESTIONS}</span>
            {streak >= 2 && <span className="text-sm font-bold text-orange-500">🔥 {streak}x streak!</span>}
            <span className={`font-bold text-lg ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-400'}`}>{timeLeft}s</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div className={`h-2 rounded-full transition-all ${timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${timerPct}%` }} />
          </div>

          <div className="text-center py-8 mb-6">
            <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-wide">{problem?.question}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {problem?.options.map((option, i) => {
              let style = 'glass-btn border-0 hover:ring-2 hover:ring-green-400';
              if (showFeedback) {
                if (option === problem.answer) style = 'bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500';
                else if (option === selected)  style = 'bg-red-100 dark:bg-red-900/40 ring-2 ring-red-500';
                else style = 'opacity-40 glass-btn border-0';
              }
              return (
                <button key={i} onClick={() => handleAnswer(option)} disabled={showFeedback}
                  className={`${style} rounded-xl py-5 text-2xl font-bold text-gray-800 dark:text-white transition-all hover:scale-105 active:scale-95`}>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
