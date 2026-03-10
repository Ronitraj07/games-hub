import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { playCorrect, playWrong } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Clock, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const QUESTIONS = [
  { q: 'What is the capital of France?',            options: ['London','Berlin','Paris','Rome'],           answer: 2, category: '🌍 Geography' },
  { q: 'How many hearts does an octopus have?',     options: ['1','2','3','4'],                            answer: 2, category: '🐙 Animals'  },
  { q: 'Which planet is known as the Red Planet?',  options: ['Venus','Mars','Jupiter','Saturn'],          answer: 1, category: '🚀 Space'    },
  { q: 'What is 7 × 8?',                             options: ['54','56','58','64'],                        answer: 1, category: '🔢 Math'     },
  { q: 'Who painted the Mona Lisa?',                options: ['Van Gogh','Picasso','Da Vinci','Monet'],    answer: 2, category: '🎨 Art'      },
  { q: 'What is the largest ocean on Earth?',       options: ['Atlantic','Indian','Arctic','Pacific'],     answer: 3, category: '🌊 Geography' },
  { q: 'How many sides does a hexagon have?',       options: ['5','6','7','8'],                            answer: 1, category: '🔢 Math'     },
  { q: 'What gas do plants absorb from the air?',   options: ['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'], answer: 2, category: '🌱 Science'  },
  { q: 'Which country invented pizza?',             options: ['Greece','France','Italy','Spain'],          answer: 2, category: '🍕 Food'     },
  { q: 'How many strings does a guitar have?',      options: ['4','5','6','7'],                            answer: 2, category: '🎸 Music'    },
  { q: 'What is the fastest land animal?',          options: ['Lion','Cheetah','Horse','Leopard'],         answer: 1, category: '🐆 Animals'  },
  { q: 'In which year did World War II end?',       options: ['1943','1944','1945','1946'],                answer: 2, category: '📚 History'  },
  { q: 'What is the chemical symbol for Gold?',     options: ['Go','Gd','Au','Ag'],                       answer: 2, category: '⚗️ Science'  },
  { q: 'How many bones are in the human body?',     options: ['196','206','216','226'],                   answer: 1, category: '🦴 Biology'  },
  { q: 'What is the longest river in the world?',   options: ['Amazon','Nile','Yangtze','Mississippi'],   answer: 1, category: '🌍 Geography' },
];

const TIME_PER_QUESTION = 20;
const TOTAL_QUESTIONS   = 10;

export const TriviaQuiz: React.FC = () => {
  const [questions] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS));
  const [current, setCurrent]       = useState(0);
  const [selected, setSelected]     = useState<number | null>(null);
  const [score, setScore]           = useState(0);
  const [timeLeft, setTimeLeft]     = useState(TIME_PER_QUESTION);
  const [gameOver, setGameOver]     = useState(false);
  const [answers, setAnswers]       = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (gameOver || showResult) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleAnswer(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [current, gameOver, showResult]);

  const handleAnswer = useCallback((optionIndex: number | null) => {
    if (selected !== null || showResult) return;
    setSelected(optionIndex);
    setShowResult(true);
    const isCorrect = optionIndex === questions[current].answer;
    if (isCorrect) { setScore(s => s + (timeLeft > 15 ? 15 : timeLeft > 8 ? 10 : 5)); playCorrect(); }
    else { playWrong(); }
    setAnswers(a => [...a, optionIndex]);
    setTimeout(() => {
      if (current + 1 >= TOTAL_QUESTIONS) setGameOver(true);
      else { setCurrent(c => c + 1); setSelected(null); setShowResult(false); setTimeLeft(TIME_PER_QUESTION); }
    }, 1200);
  }, [selected, showResult, current, questions, timeLeft]);

  const handleRestart = () => {
    setCurrent(0); setSelected(null); setScore(0);
    setTimeLeft(TIME_PER_QUESTION); setGameOver(false); setAnswers([]); setShowResult(false);
  };

  if (gameOver) {
    const correct = answers.filter((a, i) => a === questions[i]?.answer).length;
    const pct = (score / (TOTAL_QUESTIONS * 15)) * 100;
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '📚'}</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Quiz Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{correct}/{TOTAL_QUESTIONS} correct answers</p>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 mb-6">
            <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{score}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Total Points</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {questions.map((q, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                answers[i] === q.answer ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                {answers[i] === q.answer ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>{q.category}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={handleRestart} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <RefreshCw size={18} /> Play Again
            </button>
            <Link to="/" className="flex-1 glass-btn text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <ArrowLeft size={18} /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const timerPct   = (timeLeft / TIME_PER_QUESTION) * 100;
  const timerColor = timeLeft > 12 ? 'bg-green-500' : timeLeft > 6 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">❓ Trivia Quiz</h1>
          <div className="flex items-center gap-1 text-yellow-600"><Trophy size={18} /><span className="font-bold">{score}</span></div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{q.category}</span>
            <div className="flex items-center gap-1 font-bold text-gray-600 dark:text-gray-400">
              <Clock size={16} />
              <span className={timeLeft <= 6 ? 'text-red-500' : ''}>{timeLeft}s</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-5">
            <div className={`h-2 rounded-full transition-all ${timerColor}`} style={{ width: `${timerPct}%` }} />
          </div>

          <div className="mb-2 flex justify-between">
            <span className="text-xs text-gray-400">Q {current + 1}/{TOTAL_QUESTIONS}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-6">
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 h-1.5 rounded-full transition-all" style={{ width: `${(current / TOTAL_QUESTIONS) * 100}%` }} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 leading-relaxed">{q.q}</h2>

          <div className="grid grid-cols-1 gap-3">
            {q.options.map((option, i) => {
              let style = 'glass-btn border-0 hover:ring-2 hover:ring-blue-400';
              if (showResult) {
                if (i === q.answer) style = 'bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500';
                else if (i === selected) style = 'bg-red-100 dark:bg-red-900/40 ring-2 ring-red-500';
                else style = 'opacity-40 glass-btn border-0';
              }
              return (
                <button key={i} onClick={() => handleAnswer(i)} disabled={showResult}
                  className={`${style} rounded-xl px-4 py-3 text-left font-medium transition-all flex items-center gap-3`}>
                  <span className="w-7 h-7 rounded-full bg-white/60 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 shrink-0">
                    {['A','B','C','D'][i]}
                  </span>
                  <span className="text-gray-800 dark:text-white">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
