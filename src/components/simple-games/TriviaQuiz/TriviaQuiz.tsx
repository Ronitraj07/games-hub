import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { playCorrect, playWrong } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Clock, Trophy, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AIDifficulty, GameMode } from '@/components/shared/GameLobby';

// ───────────────── Question bank ─────────────────
const ALL_QUESTIONS = [
  // Geography
  {q:'What is the capital of France?',         options:['London','Berlin','Paris','Rome'],                answer:2,category:'🌍 Geography'},
  {q:'What is the largest ocean on Earth?',    options:['Atlantic','Indian','Arctic','Pacific'],          answer:3,category:'🌍 Geography'},
  {q:'What is the longest river in the world?',options:['Amazon','Nile','Yangtze','Mississippi'],         answer:1,category:'🌍 Geography'},
  {q:'Which country has the most natural lakes?',options:['USA','Canada','Russia','Brazil'],               answer:1,category:'🌍 Geography'},
  {q:'What is the smallest country in the world?',options:['Monaco','Liechtenstein','Vatican City','San Marino'],answer:2,category:'🌍 Geography'},
  // Science
  {q:'What gas do plants absorb from the air?',options:['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'],  answer:2,category:'🌱 Science'},
  {q:'What is the chemical symbol for Gold?',  options:['Go','Gd','Au','Ag'],                              answer:2,category:'🌱 Science'},
  {q:'How many bones are in the human body?',  options:['196','206','216','226'],                          answer:1,category:'🌱 Science'},
  {q:'What is the speed of light (km/s)?',     options:['200,000','300,000','400,000','500,000'],          answer:1,category:'🌱 Science'},
  {q:'What planet is known as the Red Planet?',options:['Venus','Mars','Jupiter','Saturn'],                answer:1,category:'🌱 Science'},
  // History
  {q:'In which year did WW2 end?',             options:['1943','1944','1945','1946'],                      answer:2,category:'📚 History'},
  {q:'Who was the first US President?',        options:['Lincoln','Jefferson','Washington','Adams'],       answer:2,category:'📚 History'},
  {q:'Which empire built the Colosseum?',      options:['Greek','Ottoman','Roman','Persian'],              answer:2,category:'📚 History'},
  // Math
  {q:'What is 7 × 8?',                          options:['54','56','58','64'],                              answer:1,category:'🔢 Math'},
  {q:'How many sides does a hexagon have?',    options:['5','6','7','8'],                                  answer:1,category:'🔢 Math'},
  {q:'What is the square root of 144?',        options:['10','11','12','13'],                              answer:2,category:'🔢 Math'},
  {q:'What is 15% of 200?',                    options:['25','30','35','40'],                              answer:1,category:'🔢 Math'},
  // Art & Culture
  {q:'Who painted the Mona Lisa?',             options:['Van Gogh','Picasso','Da Vinci','Monet'],          answer:2,category:'🎨 Art'},
  {q:'Which country invented pizza?',          options:['Greece','France','Italy','Spain'],                answer:2,category:'🎨 Art'},
  // Animals
  {q:'How many hearts does an octopus have?',  options:['1','2','3','4'],                                  answer:2,category:'🐙 Animals'},
  {q:'What is the fastest land animal?',       options:['Lion','Cheetah','Horse','Leopard'],               answer:1,category:'🐙 Animals'},
  {q:'How many strings does a guitar have?',   options:['4','5','6','7'],                                  answer:2,category:'🎸 Music'},
  // Love & Relationships
  {q:'What is the traditional gift for a 25th wedding anniversary?',options:['Gold','Silver','Diamond','Pearl'],answer:1,category:'💕 Love'},
  {q:'Which flower is most associated with love?',options:['Tulip','Lily','Rose','Daisy'],                 answer:2,category:'💕 Love'},
  {q:'What is the language of flowers called?',options:['Floristry','Floriography','Botany','Phytology'],  answer:1,category:'💕 Love'},
];

const CATEGORIES = ['⭐ All', '🌍 Geography', '🌱 Science', '📚 History', '🔢 Math', '🎨 Art', '🐙 Animals', '💕 Love'];
const TIME_PER = 20;
const TOTAL_Q  = 10;

interface OnlineState {
  questions: typeof ALL_QUESTIONS;
  current: number;
  p1Email: string; p2Email: string;
  p1Score: number; p2Score: number;
  p1Answered: boolean; p2Answered: boolean;
  status: 'waiting'|'active'|'finished';
  mode: GameMode;
}

export const TriviaQuiz: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const userKey  = user?.email ?? null;

  const [gameMode,   setGameMode]   = useState<GameMode|null>(null);
  const [category,   setCategory]   = useState('⭐ All');
  const [showCatPicker, setShowCatPicker] = useState(false);

  // ─── Solo state ───
  const [questions]  = useState(() => [...ALL_QUESTIONS].sort(() => Math.random() - .5));
  const [current,    setCurrent]    = useState(0);
  const [selected,   setSelected]   = useState<number|null>(null);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(TIME_PER);
  const [gameOver,   setGameOver]   = useState(false);
  const [answers,    setAnswers]    = useState<(number|null)[]>([]);
  const [showResult, setShowResult] = useState(false);

  const filteredQ = useCallback(() => {
    const pool = category === '⭐ All' ? ALL_QUESTIONS : ALL_QUESTIONS.filter(q => q.category === category);
    return [...pool].sort(() => Math.random() - .5).slice(0, TOTAL_Q);
  }, [category]);

  const [activeQ, setActiveQ] = useState<typeof ALL_QUESTIONS>(filteredQ);

  // ─── Online state ───
  const safeSession = sessionId
    ? sanitizeFirebasePath(sessionId)
    : `trivia-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;
  const initialOnline: OnlineState = {
    questions: [], current: 0,
    p1Email: userKey ?? '', p2Email: '',
    p1Score: 0, p2Score: 0,
    p1Answered: false, p2Answered: false,
    status: 'waiting', mode: 'vs-partner',
  };
  const { gameState, updateGameState } = useRealtimeGame<OnlineState>(safeSession, 'trivia', initialOnline);
  const isP1 = gameState?.p1Email === userKey;
  const curOnlineQ = gameState?.questions?.[gameState.current];

  // Solo timer
  useEffect(() => {
    if (gameMode !== 'solo' || gameOver || showResult) return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); handleSoloAnswer(null); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [current, gameMode, gameOver, showResult]);

  const handleSoloAnswer = useCallback((idx: number | null) => {
    if (selected !== null || showResult) return;
    setSelected(idx); setShowResult(true);
    const ok = idx === activeQ[current]?.answer;
    if (ok) { setScore(s => s + (timeLeft > 15 ? 15 : timeLeft > 8 ? 10 : 5)); playCorrect(); }
    else playWrong();
    setAnswers(a => [...a, idx]);
    setTimeout(() => {
      if (current + 1 >= TOTAL_Q) setGameOver(true);
      else { setCurrent(c => c + 1); setSelected(null); setShowResult(false); setTimeLeft(TIME_PER); }
    }, 1200);
  }, [selected, showResult, current, activeQ, timeLeft]);

  const handleOnlineAnswer = (idx: number) => {
    if (!gameState || gameState.status !== 'active' || !curOnlineQ) return;
    const myAnswered = isP1 ? gameState.p1Answered : gameState.p2Answered;
    if (myAnswered) return;
    const pts = idx === curOnlineQ.answer ? 10 : 0;
    const updated = isP1
      ? { ...gameState, p1Score: gameState.p1Score + pts, p1Answered: true }
      : { ...gameState, p2Score: gameState.p2Score + pts, p2Answered: true };
    const otherDone = isP1 ? gameState.p2Answered : gameState.p1Answered;
    if (otherDone) {
      if (gameState.current + 1 >= TOTAL_Q) updateGameState({ ...updated, status: 'finished' });
      else updateGameState({ ...updated, current: gameState.current + 1, p1Answered: false, p2Answered: false });
    } else updateGameState(updated);
  };

  const startOnline = () => {
    const qs = filteredQ();
    updateGameState({ ...initialOnline, questions: qs, p2Email: 'opponent', status: 'active', mode: 'vs-partner' });
  };

  const handleStartSolo = () => {
    const qs = filteredQ();
    setActiveQ(qs); setGameMode('solo');
    setCurrent(0); setSelected(null); setScore(0);
    setTimeLeft(TIME_PER); setGameOver(false); setAnswers([]); setShowResult(false);
  };

  // ─── LOBBY ───
  if (!gameMode) return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20}/> Back</Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">❓ Trivia Quiz</h1>
          <div className="w-10"/>
        </div>

        {/* Category picker */}
        <div className="glass-card p-4 mb-4">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  category === c
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                    : 'glass text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[50vh]">
          <GameLobby
            gameName="Trivia Quiz"
            gameIcon="❓"
            gradient="from-blue-500 to-indigo-500"
            description="10 questions, 20 seconds each. First to answer gets bonus points!"
            supportsSolo
            supportsAI={false}
            gameType="TriviaQuiz"
            onStartSolo={handleStartSolo}
            onStartVsPartner={() => { setGameMode('vs-partner'); startOnline(); }}
          />
        </div>
      </div>
    </div>
  );

  // ─── RESULTS ───
  if (gameOver || gameState?.status === 'finished') {
    const isOnline = gameMode === 'vs-partner';
    const myFinal  = isOnline ? (isP1 ? gameState!.p1Score : gameState!.p2Score) : score;
    const oppFinal = isOnline ? (isP1 ? gameState!.p2Score : gameState!.p1Score) : 0;
    const correct  = answers.filter((a, i) => a === activeQ[i]?.answer).length;
    const pct = (myFinal / (TOTAL_Q * 15)) * 100;
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '📚'}</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Quiz Complete!</h2>
          {!isOnline && <p className="text-gray-500 mb-6">{correct}/{TOTAL_Q} correct</p>}
          {isOnline  && <p className="text-gray-500 mb-6">You: {myFinal} · Partner: {oppFinal}</p>}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 mb-6">
            <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{myFinal}</p>
            <p className="text-gray-500 mt-1">Your Score</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
          {!isOnline && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {activeQ.map((q, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  answers[i] === q.answer
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {answers[i] === q.answer ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                  <span>{q.category}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => { setGameMode(null); setGameOver(false); }}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <RefreshCw size={18}/> Play Again
            </button>
            <Link to="/" className="flex-1 glass-btn text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <ArrowLeft size={18}/> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE GAME ───
  const isOnlineActive = gameMode === 'vs-partner' && gameState?.status === 'active';
  const q = isOnlineActive ? curOnlineQ : activeQ[current];
  const myAnswered = isOnlineActive ? (isP1 ? gameState?.p1Answered : gameState?.p2Answered) : false;
  const timerPct   = (timeLeft / TIME_PER) * 100;
  const timerColor = timeLeft > 12 ? 'bg-green-500' : timeLeft > 6 ? 'bg-yellow-500' : 'bg-red-500';
  const qNum = isOnlineActive ? (gameState?.current ?? 0) + 1 : current + 1;

  if (!q) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" size={32}/></div>;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setGameMode(null)} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20}/> Back</button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">❓ Trivia Quiz</h1>
          <div className="flex items-center gap-1 text-yellow-600"><Trophy size={18}/><span className="font-bold">{isOnlineActive ? (isP1 ? gameState?.p1Score : gameState?.p2Score) : score}</span></div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <GameModeBadge mode={gameMode} />
          {isOnlineActive && (
            <div className="glass px-3 py-1 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400">
              Partner: {isP1 ? gameState?.p2Score : gameState?.p1Score} pts
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{q.category}</span>
            {!isOnlineActive && (
              <div className="flex items-center gap-1 font-bold text-gray-600 dark:text-gray-400">
                <Clock size={16}/>
                <span className={timeLeft <= 6 ? 'text-red-500' : ''}>{timeLeft}s</span>
              </div>
            )}
          </div>

          {!isOnlineActive && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-5">
              <div className={`h-2 rounded-full transition-all ${timerColor}`} style={{ width: `${timerPct}%` }} />
            </div>
          )}

          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400">Q {qNum}/{TOTAL_Q}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-6">
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 h-1.5 rounded-full transition-all" style={{ width: `${((qNum-1) / TOTAL_Q) * 100}%` }} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 leading-relaxed">{q.q}</h2>

          {myAnswered && isOnlineActive ? (
            <div className="flex items-center justify-center gap-3 py-8 text-purple-500">
              <Loader2 size={20} className="animate-spin"/>
              <span>Waiting for partner…</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((option, i) => {
                let style = 'glass-btn border-0 hover:ring-2 hover:ring-blue-400';
                if (showResult && !isOnlineActive) {
                  if (i === q.answer) style = 'bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500';
                  else if (i === selected) style = 'bg-red-100 dark:bg-red-900/40 ring-2 ring-red-500';
                  else style = 'opacity-40 glass-btn border-0';
                }
                return (
                  <button key={i}
                    onClick={() => isOnlineActive ? handleOnlineAnswer(i) : handleSoloAnswer(i)}
                    disabled={(showResult && !isOnlineActive) || (myAnswered ?? false)}
                    className={`${style} rounded-xl px-4 py-3 text-left font-medium transition-all flex items-center gap-3`}>
                    <span className="w-7 h-7 rounded-full bg-white/60 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 shrink-0">
                      {['A','B','C','D'][i]}
                    </span>
                    <span className="text-gray-800 dark:text-white">{option}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
