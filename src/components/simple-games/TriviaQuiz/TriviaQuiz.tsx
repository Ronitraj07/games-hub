import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { playCorrect, playWrong } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Clock, Trophy, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GameMode } from '@/components/shared/GameLobby';

// ───────────────── Romantic Question Bank ─────────────────
const ALL_QUESTIONS = [
  // 💕 Anniversaries & Traditions
  { q: 'What is the traditional gift for a 1st wedding anniversary?',      options: ['Paper','Cotton','Leather','Wood'],                    answer: 0, category: '💕 Anniversaries' },
  { q: 'What is the traditional gift for a 5th wedding anniversary?',      options: ['Wood','Silver','Gold','Wood'],                        answer: 0, category: '💕 Anniversaries' },
  { q: 'What is the traditional gift for a 25th wedding anniversary?',     options: ['Gold','Silver','Diamond','Pearl'],                    answer: 1, category: '💕 Anniversaries' },
  { q: 'What is the traditional gift for a 50th wedding anniversary?',     options: ['Silver','Ruby','Gold','Diamond'],                     answer: 2, category: '💕 Anniversaries' },
  { q: 'What is the traditional gift for a 10th wedding anniversary?',     options: ['Tin/Aluminium','Copper','Bronze','Iron'],             answer: 0, category: '💕 Anniversaries' },
  { q: 'Valentine\'s Day is celebrated on which date?',                     options: ['12 Feb','13 Feb','14 Feb','15 Feb'],                  answer: 2, category: '💕 Anniversaries' },
  { q: 'Who is the patron saint of love?',                                 options: ['St. George','St. Valentine','St. Nicholas','St. Andrew'], answer: 1, category: '💕 Anniversaries' },

  // 🌹 Romance & Flowers
  { q: 'Which flower is most associated with romantic love?',              options: ['Tulip','Lily','Rose','Daisy'],                        answer: 2, category: '🌹 Romance' },
  { q: 'What colour rose traditionally means "I love you"?',              options: ['White','Yellow','Pink','Red'],                        answer: 3, category: '🌹 Romance' },
  { q: 'What colour rose symbolises new beginnings?',                     options: ['Red','White','Orange','Purple'],                      answer: 1, category: '🌹 Romance' },
  { q: 'What is the language of flowers called?',                         options: ['Floristry','Floriography','Botany','Phytology'],      answer: 1, category: '🌹 Romance' },
  { q: 'Which flower means "You are on my mind"?',                        options: ['Sunflower','Pansy','Orchid','Tulip'],                 answer: 1, category: '🌹 Romance' },
  { q: 'Which gemstone is traditionally given on a proposal?',            options: ['Ruby','Emerald','Diamond','Sapphire'],                answer: 2, category: '🌹 Romance' },
  { q: 'Which city is most famous as the "City of Love"?',               options: ['Venice','Rome','Paris','Barcelona'],                  answer: 2, category: '🌹 Romance' },

  // 🎬 Romantic Movies & Songs
  { q: 'Which film features the line "You had me at hello"?',             options: ['Pretty Woman','Jerry Maguire','Titanic','Notting Hill'], answer: 1, category: '🎬 Romance Films' },
  { q: 'In Titanic, what is the name of the female lead?',                options: ['Rachel','Rose','Ruby','Rita'],                        answer: 1, category: '🎬 Romance Films' },
  { q: 'Which Shakespeare play features the balcony scene?',              options: ['A Midsummer Night\'s Dream','Othello','Romeo & Juliet','Hamlet'], answer: 2, category: '🎬 Romance Films' },
  { q: 'In "The Notebook", where do Noah and Allie share their first kiss?', options: ['On a bridge','In the rain','In a boat','On a ferris wheel'], answer: 3, category: '🎬 Romance Films' },
  { q: 'Which Adele song starts with "Hello, it\'s me"?',                 options: ['Someone Like You','Rolling in the Deep','Hello','Skyfall'], answer: 2, category: '🎬 Romance Films' },
  { q: 'Which romantic movie takes place mostly on a cruise ship?',        options: ['Ghost','Titanic','Out of Africa','Grease'],          answer: 1, category: '🎬 Romance Films' },

  // 💑 Relationship Knowledge
  { q: 'According to researchers, how long does it typically take to fall in love?', options: ['A few seconds','A few minutes','A few days','A few weeks'], answer: 0, category: '💑 Relationships' },
  { q: 'What hormone is known as the "love hormone"?',                    options: ['Serotonin','Dopamine','Oxytocin','Adrenaline'],       answer: 2, category: '💑 Relationships' },
  { q: 'Which country has the highest rate of marriage in the world?',    options: ['USA','India','Egypt','Maldives'],                     answer: 2, category: '💑 Relationships' },
  { q: 'What does the word "soulmate" most closely mean?',                options: ['Best friend','Perfect romantic partner','Twin','Companion'], answer: 1, category: '💑 Relationships' },
  { q: 'In psychology, what are the three components of love according to Sternberg?', options: ['Trust, Respect, Loyalty','Passion, Intimacy, Commitment','Attraction, Affection, Communication','Care, Trust, Honesty'], answer: 1, category: '💑 Relationships' },
  { q: 'What is a "honeymoon phase" in a relationship?',                  options: ['The wedding ceremony','Early blissful stage of romance','A holiday tradition','Anniversary celebration'], answer: 1, category: '💑 Relationships' },

  // 🗺️ Romantic Destinations
  { q: 'Which Italian city is famous for gondola rides with loved ones?', options: ['Rome','Florence','Venice','Milan'],                   answer: 2, category: '🗺️ Romantic Places' },
  { q: 'The Taj Mahal was built as a symbol of what?',                    options: ['Military power','Eternal love','Religious faith','Royal wealth'], answer: 1, category: '🗺️ Romantic Places' },
  { q: 'Which Greek island is famous for white buildings and sunsets?',   options: ['Crete','Rhodes','Corfu','Santorini'],                 answer: 3, category: '🗺️ Romantic Places' },
  { q: 'Which city has the famous "love locks" bridge (Pont des Arts)?',  options: ['London','Paris','Rome','Prague'],                     answer: 1, category: '🗺️ Romantic Places' },
  { q: 'Which South Asian country is the top honeymoon destination?',     options: ['Sri Lanka','Nepal','Maldives','Bhutan'],             answer: 2, category: '🗺️ Romantic Places' },

  // 🧠 Love Trivia
  { q: 'Which organ is traditionally associated with love in art?',       options: ['Brain','Lungs','Heart','Stomach'],                   answer: 2, category: '🧠 Love Trivia' },
  { q: 'What does "XOXO" stand for?',                                     options: ['Love & Hugs','Kisses & Hugs','Hugs & Kisses','Love & Kisses'], answer: 2, category: '🧠 Love Trivia' },
  { q: 'In which country did chocolate become associated with Valentine\'s Day gifts?', options: ['Belgium','Switzerland','USA','France'], answer: 2, category: '🧠 Love Trivia' },
  { q: 'How many love languages are there according to Gary Chapman?',     options: ['3','4','5','6'],                                     answer: 2, category: '🧠 Love Trivia' },
  { q: 'Which of these is NOT one of the 5 love languages?',             options: ['Words of Affirmation','Gift Giving','Eye Contact','Quality Time'], answer: 2, category: '🧠 Love Trivia' },
  { q: 'What is the Roman god of love called?',                           options: ['Eros','Cupid','Venus','Apollo'],                      answer: 1, category: '🧠 Love Trivia' },
  { q: 'What is the Greek goddess of love called?',                       options: ['Hera','Athena','Aphrodite','Persephone'],            answer: 2, category: '🧠 Love Trivia' },
];

const CATEGORIES = ['⭐ All', '💕 Anniversaries', '🌹 Romance', '🎬 Romance Films', '💑 Relationships', '🗺️ Romantic Places', '🧠 Love Trivia'];
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

  const [gameMode,  setGameMode]  = useState<GameMode|null>(null);
  const [category,  setCategory]  = useState('⭐ All');

  // ─── Solo state ───
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

  const [activeQ, setActiveQ] = useState<typeof ALL_QUESTIONS>(() => filteredQ());

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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">💕 Romantic Trivia</h1>
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
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'glass text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[50vh]">
          <GameLobby
            gameName="Romantic Trivia"
            gameIcon="💕"
            gradient="from-pink-500 to-rose-500"
            description="10 romantic questions, 20 seconds each. How well do you know love?"
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
          <div className="text-6xl mb-4">{pct >= 80 ? '💖' : pct >= 50 ? '💕' : '💝'}</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Quiz Complete!</h2>
          {!isOnline && <p className="text-gray-500 mb-6">{correct}/{TOTAL_Q} correct</p>}
          {isOnline  && <p className="text-gray-500 mb-6">You: {myFinal} · Partner: {oppFinal}</p>}
          <div className="bg-pink-50 dark:bg-pink-900/30 rounded-xl p-6 mb-6">
            <p className="text-5xl font-bold text-pink-600 dark:text-pink-400">{myFinal}</p>
            <p className="text-gray-500 mt-1">Your Score</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-3">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
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
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">💕 Romantic Trivia</h1>
          <div className="flex items-center gap-1 text-pink-500"><Trophy size={18}/><span className="font-bold">{isOnlineActive ? (isP1 ? gameState?.p1Score : gameState?.p2Score) : score}</span></div>
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
            <span className="text-sm font-medium text-pink-600 dark:text-pink-400">{q.category}</span>
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
            <div className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 rounded-full transition-all" style={{ width: `${((qNum-1) / TOTAL_Q) * 100}%` }} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 leading-relaxed">{q.q}</h2>

          {myAnswered && isOnlineActive ? (
            <div className="flex items-center justify-center gap-3 py-8 text-pink-500">
              <Loader2 size={20} className="animate-spin"/>
              <span>Waiting for partner…</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((option, i) => {
                let style = 'glass-btn border-0 hover:ring-2 hover:ring-pink-400';
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
