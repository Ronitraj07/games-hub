import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useGameStats } from '@/hooks/useGameStats';
import { database } from '@/lib/firebase';
import { ref, set, onValue, off } from 'firebase/database';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { playCorrect, playWrong } from '@/utils/sounds';
import {
  RefreshCw, ArrowLeft, Clock, Trophy, CheckCircle, XCircle,
  Loader2, Plus, Pencil, Trash2, BookOpen, Sparkles,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { GameMode } from '@/components/shared/GameLobby';

// ───────────────── Types ─────────────────
export interface TriviaQuestion {
  q:        string;
  options:  [string, string, string, string];
  answer:   number;
  category: string;
  custom?:  boolean;
  id?:      string;
}

// ───────────────── Built-in romantic bank ─────────────────
const ALL_QUESTIONS: TriviaQuestion[] = [
  // 💕 Anniversaries
  { q:'What is the traditional gift for a 1st wedding anniversary?',      options:['Paper','Cotton','Leather','Wood'],                    answer:0, category:'💕 Anniversaries' },
  { q:'What is the traditional gift for a 5th wedding anniversary?',      options:['Wood','Silver','Gold','Silk'],                        answer:0, category:'💕 Anniversaries' },
  { q:'What is the traditional gift for a 25th wedding anniversary?',     options:['Gold','Silver','Diamond','Pearl'],                    answer:1, category:'💕 Anniversaries' },
  { q:'What is the traditional gift for a 50th wedding anniversary?',     options:['Silver','Ruby','Gold','Diamond'],                     answer:2, category:'💕 Anniversaries' },
  { q:'What is the traditional gift for a 10th wedding anniversary?',     options:['Tin/Aluminium','Copper','Bronze','Iron'],             answer:0, category:'💕 Anniversaries' },
  { q:"Valentine's Day is celebrated on which date?",                     options:['12 Feb','13 Feb','14 Feb','15 Feb'],                  answer:2, category:'💕 Anniversaries' },
  { q:'Who is the patron saint of love?',                                 options:['St. George','St. Valentine','St. Nicholas','St. Andrew'], answer:1, category:'💕 Anniversaries' },
  // 🌹 Romance
  { q:'Which flower is most associated with romantic love?',              options:['Tulip','Lily','Rose','Daisy'],                        answer:2, category:'🌹 Romance' },
  { q:'What colour rose traditionally means "I love you"?',              options:['White','Yellow','Pink','Red'],                        answer:3, category:'🌹 Romance' },
  { q:'What colour rose symbolises new beginnings?',                      options:['Red','White','Orange','Purple'],                      answer:1, category:'🌹 Romance' },
  { q:'What is the language of flowers called?',                          options:['Floristry','Floriography','Botany','Phytology'],      answer:1, category:'🌹 Romance' },
  { q:'Which flower means "You are on my mind"?',                         options:['Sunflower','Pansy','Orchid','Tulip'],                 answer:1, category:'🌹 Romance' },
  { q:'Which gemstone is traditionally given on a proposal?',             options:['Ruby','Emerald','Diamond','Sapphire'],                answer:2, category:'🌹 Romance' },
  { q:'Which city is most famous as the "City of Love"?',                options:['Venice','Rome','Paris','Barcelona'],                  answer:2, category:'🌹 Romance' },
  // 🎬 Romance Films
  { q:'Which film features the line "You had me at hello"?',              options:['Pretty Woman','Jerry Maguire','Titanic','Notting Hill'], answer:1, category:'🎬 Romance Films' },
  { q:'In Titanic, what is the name of the female lead?',                 options:['Rachel','Rose','Ruby','Rita'],                        answer:1, category:'🎬 Romance Films' },
  { q:"Which Shakespeare play features the balcony scene?",               options:["A Midsummer Night's Dream",'Othello','Romeo & Juliet','Hamlet'], answer:2, category:'🎬 Romance Films' },
  { q:'In "The Notebook", where do Noah and Allie share their first kiss?', options:['On a bridge','In the rain','In a boat','On a ferris wheel'], answer:3, category:'🎬 Romance Films' },
  { q:"Which Adele song starts with 'Hello, it's me'?",                   options:['Someone Like You','Rolling in the Deep','Hello','Skyfall'], answer:2, category:'🎬 Romance Films' },
  { q:'Which romantic movie takes place mostly on a cruise ship?',         options:['Ghost','Titanic','Out of Africa','Grease'],           answer:1, category:'🎬 Romance Films' },
  // 💑 Relationships
  { q:'What hormone is known as the "love hormone"?',                     options:['Serotonin','Dopamine','Oxytocin','Adrenaline'],       answer:2, category:'💑 Relationships' },
  { q:'What does the word "soulmate" most closely mean?',                 options:['Best friend','Perfect romantic partner','Twin','Companion'], answer:1, category:'💑 Relationships' },
  { q:'What are the three components of love according to Sternberg?',    options:['Trust, Respect, Loyalty','Passion, Intimacy, Commitment','Attraction, Affection, Communication','Care, Trust, Honesty'], answer:1, category:'💑 Relationships' },
  { q:'What is a "honeymoon phase" in a relationship?',                   options:['The wedding ceremony','Early blissful stage of romance','A holiday tradition','Anniversary celebration'], answer:1, category:'💑 Relationships' },
  { q:'How many love languages are there according to Gary Chapman?',      options:['3','4','5','6'],                                     answer:2, category:'💑 Relationships' },
  { q:'Which of these is NOT one of the 5 love languages?',               options:['Words of Affirmation','Gift Giving','Eye Contact','Quality Time'], answer:2, category:'💑 Relationships' },
  // 🗺️ Romantic Places
  { q:'Which Italian city is famous for gondola rides with loved ones?',  options:['Rome','Florence','Venice','Milan'],                   answer:2, category:'🗺️ Romantic Places' },
  { q:'The Taj Mahal was built as a symbol of what?',                     options:['Military power','Eternal love','Religious faith','Royal wealth'], answer:1, category:'🗺️ Romantic Places' },
  { q:'Which Greek island is famous for white buildings and sunsets?',    options:['Crete','Rhodes','Corfu','Santorini'],                 answer:3, category:'🗺️ Romantic Places' },
  { q:'Which city has the famous "love locks" bridge (Pont des Arts)?',   options:['London','Paris','Rome','Prague'],                     answer:1, category:'🗺️ Romantic Places' },
  { q:'Which South Asian country is the top honeymoon destination?',      options:['Sri Lanka','Nepal','Maldives','Bhutan'],             answer:2, category:'🗺️ Romantic Places' },
  // 🧠 Love Trivia
  { q:'What does "XOXO" stand for?',                                      options:['Love & Hugs','Kisses & Hugs','Hugs & Kisses','Love & Kisses'], answer:2, category:'🧠 Love Trivia' },
  { q:'What is the Roman god of love called?',                            options:['Eros','Cupid','Venus','Apollo'],                      answer:1, category:'🧠 Love Trivia' },
  { q:'What is the Greek goddess of love called?',                        options:['Hera','Athena','Aphrodite','Persephone'],             answer:2, category:'🧠 Love Trivia' },
  { q:'Which organ is traditionally associated with love in art?',        options:['Brain','Lungs','Heart','Stomach'],                    answer:2, category:'🧠 Love Trivia' },
];

const BUILTIN_CATEGORIES = ['⭐ All', '💕 Anniversaries', '🌹 Romance', '🎬 Romance Films', '💑 Relationships', '🗺️ Romantic Places', '🧠 Love Trivia'];
const CUSTOM_CATEGORY    = '✏️ Custom';
const TIME_PER = 20;
const TOTAL_Q  = 10;

const BLANK_DRAFT = (): Omit<TriviaQuestion, 'id' | 'custom'> => ({
  q: '', options: ['', '', '', ''], answer: 0, category: CUSTOM_CATEGORY,
});

interface OnlineState {
  questions:   TriviaQuestion[];
  current:     number;
  p1Email:     string;
  p2Email:     string;
  p1Score:     number;
  p2Score:     number;
  p1Answered:  boolean;
  p2Answered:  boolean;
  status:      'waiting' | 'active' | 'finished';
  mode:        GameMode;
  recorded?:   boolean;
}

export const TriviaQuiz: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const { recordGame } = useGameStats();
  const userKey  = user?.email ?? null;
  const location = useLocation();

  type View = 'lobby' | 'builder' | 'game' | 'results';
  const [view,     setView]     = useState<View>('lobby');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [category, setCategory] = useState<string>('⭐ All');

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isHost,       setIsHost]       = useState(false);
  const [shouldHostStart, setShouldHostStart] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room   = params.get('room');
    if (room && !activeRoomId) {
      setActiveRoomId(room.toUpperCase());
      setIsHost(false);
      setGameMode('vs-partner');
      setView('game');
    }
  }, [location.search, activeRoomId]);

  const customDbPath = userKey
    ? `trivia-custom/${sanitizeFirebasePath(userKey)}`
    : null;

  const [customQs,    setCustomQs]    = useState<TriviaQuestion[]>([]);
  const [loadingCust, setLoadingCust] = useState(true);

  useEffect(() => {
    if (!customDbPath) { setLoadingCust(false); return; }
    const r = ref(database, customDbPath);
    const unsub = onValue(r, snap => {
      const val = snap.val();
      if (val) {
        const arr = Object.entries(val).map(([id, v]) => ({ ...(v as TriviaQuestion), id, custom: true }));
        setCustomQs(arr);
      } else setCustomQs([]);
      setLoadingCust(false);
    });
    return () => off(r, 'value', unsub);
  }, [customDbPath]);

  const [draft,     setDraft]     = useState<Omit<TriviaQuestion, 'id' | 'custom'>>(BLANK_DRAFT());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  const saveCustomQ = async () => {
    if (!draft.q.trim())                    return setSaveError('Question text is required.');
    if (draft.options.some(o => !o.trim())) return setSaveError('Fill in all 4 options.');
    if (!customDbPath)                      return setSaveError('You must be logged in.');
    setSaveError('');
    const id = editingId ?? `q-${Date.now()}`;
    await set(ref(database, `${customDbPath}/${id}`), { ...draft, custom: true });
    setDraft(BLANK_DRAFT()); setEditingId(null);
  };

  const deleteCustomQ = async (id: string) => {
    if (!customDbPath) return;
    await set(ref(database, `${customDbPath}/${id}`), null);
  };

  const startEditQ = (q: TriviaQuestion) => {
    setDraft({ q: q.q, options: [...q.options] as [string,string,string,string], answer: q.answer, category: q.category });
    setEditingId(q.id ?? null);
    setView('builder');
  };

  const allCategories = [
    ...BUILTIN_CATEGORIES,
    ...(customQs.length > 0 ? [CUSTOM_CATEGORY] : []),
  ];

  const filteredQ = useCallback(() => {
    let pool: TriviaQuestion[];
    if (category === CUSTOM_CATEGORY) pool = customQs;
    else if (category === '⭐ All')    pool = [...ALL_QUESTIONS, ...customQs];
    else                              pool = ALL_QUESTIONS.filter(q => q.category === category);
    if (pool.length === 0) pool = ALL_QUESTIONS;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, TOTAL_Q);
  }, [category, customQs]);

  const [activeQ,    setActiveQ]    = useState<TriviaQuestion[]>([]);
  const [current,    setCurrent]    = useState(0);
  const [selected,   setSelected]   = useState<number | null>(null);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(TIME_PER);
  const [answers,    setAnswers]    = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [localRecorded, setLocalRecorded] = useState(false);

  const safeSession = activeRoomId
    ? `trivia-room-${sanitizeFirebasePath(activeRoomId)}`
    : sessionId
    ? sanitizeFirebasePath(sessionId)
    : `trivia-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initialOnline: OnlineState = {
    questions: [], current: 0,
    p1Email: userKey ?? '', p2Email: '',
    p1Score: 0, p2Score: 0,
    p1Answered: false, p2Answered: false,
    status: 'waiting', mode: 'vs-partner',
    recorded: false,
  };
  const { gameState, updateGameState } = useRealtimeGame<OnlineState>(safeSession, 'trivia', initialOnline);
  const isP1       = gameState?.p1Email === userKey;
  const curOnlineQ = gameState?.questions?.[gameState.current];

  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || gameState.recorded || !userKey) return;
    const myScore  = isP1 ? gameState.p1Score : gameState.p2Score;
    const oppScore = isP1 ? gameState.p2Score : gameState.p1Score;
    const result   = myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw';
    const opp      = isP1 ? (gameState.p2Email || undefined) : gameState.p1Email;
    recordGame({ gameType: 'trivia', playerEmail: userKey, result, score: myScore, mode: 'vs-partner', opponentEmail: opp });
    updateGameState({ ...gameState, recorded: true });
  }, [gameState?.status, gameState?.recorded, userKey, isP1, recordGame, updateGameState]);

  useEffect(() => {
    if (view !== 'game' || gameMode !== 'solo' || showResult) return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); handleSoloAnswer(null); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [current, view, gameMode, showResult]);

  const handleSoloAnswer = useCallback((idx: number | null) => {
    if (selected !== null || showResult) return;
    setSelected(idx); setShowResult(true);
    const ok = idx === activeQ[current]?.answer;
    if (ok) { setScore(s => s + (timeLeft > 15 ? 15 : timeLeft > 8 ? 10 : 5)); playCorrect(); }
    else playWrong();
    setAnswers(a => [...a, idx]);
    setTimeout(() => {
      if (current + 1 >= TOTAL_Q) setView('results');
      else { setCurrent(c => c + 1); setSelected(null); setShowResult(false); setTimeLeft(TIME_PER); }
    }, 1200);
  }, [selected, showResult, current, activeQ, timeLeft]);

  useEffect(() => {
    if (view !== 'results' || localRecorded || !userKey || gameMode !== 'solo') return;
    setLocalRecorded(true);
    const correct = answers.filter((a, i) => a === activeQ[i]?.answer).length;
    const result = correct >= TOTAL_Q * 0.6 ? 'win' : 'loss';
    recordGame({ gameType: 'trivia', playerEmail: userKey, result, score, mode: 'solo' });
  }, [view, localRecorded, userKey, gameMode, answers, activeQ, score, recordGame]);

  const handleOnlineAnswer = (idx: number) => {
    if (!gameState || gameState.status !== 'active' || !curOnlineQ) return;
    const myAnswered = isP1 ? gameState.p1Answered : gameState.p2Answered;
    if (myAnswered) return;
    const pts     = idx === curOnlineQ.answer ? 10 : 0;
    const updated = isP1
      ? { ...gameState, p1Score: gameState.p1Score + pts, p1Answered: true }
      : { ...gameState, p2Score: gameState.p2Score + pts, p2Answered: true };
    const otherDone = isP1 ? gameState.p2Answered : gameState.p1Answered;
    if (otherDone) {
      if (gameState.current + 1 >= TOTAL_Q) updateGameState({ ...updated, status: 'finished', recorded: false });
      else updateGameState({ ...updated, current: gameState.current + 1, p1Answered: false, p2Answered: false });
    } else updateGameState(updated);
  };

  const startOnline = () => {
    const qs = filteredQ();
    updateGameState({ ...initialOnline, questions: qs, p2Email: 'opponent', status: 'active', mode: 'vs-partner' });
    setView('game');
  };

  useEffect(() => {
    if (!shouldHostStart || !activeRoomId || !isHost) return;
    startOnline();
    setShouldHostStart(false);
  }, [shouldHostStart, activeRoomId, isHost, safeSession]);

  const handleStartSolo = () => {
    const qs = filteredQ();
    setActiveQ(qs); setGameMode('solo');
    setCurrent(0); setSelected(null); setScore(0);
    setTimeLeft(TIME_PER); setAnswers([]); setShowResult(false);
    setLocalRecorded(false);
    setView('game');
  };

  const resetToLobby = () => { setView('lobby'); setGameMode(null); setActiveRoomId(null); setIsHost(false); };

  // ───────────────── VIEW: BUILDER ─────────────────
  if (view === 'builder') return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { setView('lobby'); setDraft(BLANK_DRAFT()); setEditingId(null); setSaveError(''); }}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
              <ArrowLeft size={20}/> Back
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              {editingId ? 'Edit Question' : 'New Question'}
            </h1>
            <div className="w-10"/>
          </div>

          <div className="glass-card p-5 mb-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Question</label>
            <textarea rows={3} value={draft.q}
              onChange={e => setDraft(d => ({ ...d, q: e.target.value }))}
              placeholder="e.g. When is our anniversary?"
              className="w-full glass border-0 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none mb-4"
            />

            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Options <span className="font-normal text-gray-400">(tap circle to mark correct answer)</span>
            </label>
            <div className="space-y-2 mb-4">
              {draft.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <button onClick={() => setDraft(d => ({ ...d, answer: i }))}
                    className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all ${
                      draft.answer === i
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-transparent text-white scale-110'
                        : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-pink-400'
                    }`}>
                    {['A','B','C','D'][i]}
                  </button>
                  <input value={opt}
                    onChange={e => {
                      const next = [...draft.options] as [string,string,string,string];
                      next[i] = e.target.value;
                      setDraft(d => ({ ...d, options: next }));
                    }}
                    placeholder={`Option ${['A','B','C','D'][i]}`}
                    className="flex-1 glass border-0 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  {draft.answer === i && <CheckCircle size={16} className="text-green-500 shrink-0"/>}
                </div>
              ))}
            </div>

            {saveError && <p className="text-red-500 text-sm mb-3">{saveError}</p>}

            <button onClick={saveCustomQ}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-3 rounded-xl transition hover:opacity-90 flex items-center justify-center gap-2">
              <Plus size={18}/> {editingId ? 'Update Question' : 'Add Question'}
            </button>
          </div>

          {customQs.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Your Questions ({customQs.length})</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {customQs.map(cq => (
                  <div key={cq.id} className="flex items-start gap-2 p-3 glass rounded-xl">
                    <p className="flex-1 text-sm text-gray-800 dark:text:white line-clamp-2">{cq.q}</p>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEditQ(cq)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition">
                        <Pencil size={14}/>
                      </button>
                      <button onClick={() => cq.id && deleteCustomQ(cq.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ───────────────── VIEW: LOBBY ─────────────────
  if (view === 'lobby') return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
              <ArrowLeft size={20}/> Back
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              💕 Romantic Trivia
            </h1>
            <button onClick={() => setView('builder')} title="Custom questions"
              className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
              <Sparkles size={20}/>
            </button>
          </div>

          <div className="glass-card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Category</p>
              {customQs.length > 0 && (
                <span className="text-xs text-pink-500 font-medium">{customQs.length} custom</span>
              )}
            </div>
            {loadingCust ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
                <Loader2 size={14} className="animate-spin"/> Loading…
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allCategories.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      category === c
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                        : 'glass text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}>{c}</button>
                ))}
              </div>
            )}
          </div>

          {customQs.length === 0 && (
            <button onClick={() => setView('builder')}
              className="w-full glass-card p-3 mb-4 flex items-center gap-3 hover:ring-2 hover:ring-pink-300 transition text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-white"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Add your own questions</p>
                <p className="text-xs text-gray-500">Create couple-specific questions only you two can answer</p>
              </div>
              <Plus size={18} className="ml-auto text-pink-500 shrink-0"/>
            </button>
          )}

          <div className="flex items-center justify-center min-h-[44vh]">
            <GameLobby
              gameName="Romantic Trivia"
              gameIcon="💕"
              gradient="from-pink-500 to-rose-500"
              description="10 romantic questions, 20 s each. How well do you know love?"
              supportsSolo
              supportsAI={false}
              gameType="TriviaQuiz"
              onStartSolo={handleStartSolo}
              onStartVsPartner={(roomId, hostFlag) => { setGameMode('vs-partner'); setActiveRoomId(roomId); setIsHost(hostFlag); if (hostFlag) setShouldHostStart(true); setView('game'); }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ───────────────── VIEW: RESULTS ─────────────────
  if (view === 'results' || gameState?.status === 'finished') {
    const isOnline = gameMode === 'vs-partner';
    const myFinal  = isOnline ? (isP1 ? gameState!.p1Score : gameState!.p2Score) : score;
    const oppFinal = isOnline ? (isP1 ? gameState!.p2Score : gameState!.p1Score) : 0;
    const correct  = answers.filter((a, i) => a === activeQ[i]?.answer).length;
    const pct      = (myFinal / (TOTAL_Q * 15)) * 100;
    return (
      <div className="h-screen flex items-center justify-center p-4 overflow-y-auto">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{pct >= 80 ? '💖' : pct >= 50 ? '💕' : '💝'}</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Quiz Complete!</h2>
          {!isOnline && <p className="text-gray-500 mb-6">{correct}/{TOTAL_Q} correct</p>}
          {isOnline  && <p className="text-gray-500 mb-6">You: {myFinal} · Partner: {oppFinal}</p>}
          <div className="bg-pink-50 dark:bg-pink-900/30 rounded-xl p-6 mb-6">
            <p className="text-5xl font-bold text-pink-600 dark:text-pink-400">{myFinal}</p>
            <p className="text-gray-500 mt-1">Your Score</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-3">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full" style={{ width: `${Math.min(pct,100)}%` }} />
            </div>
          </div>
          {!isOnline && (
            <div className="grid grid-cols-2 gap-2 mb-6 max-h-48 overflow-y-auto">
              {activeQ.map((q, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  answers[i] === q.answer
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {answers[i] === q.answer ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                  <span className="truncate">{q.custom ? '✏️ Custom' : q.category}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={resetToLobby}
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

  // ───────────────── VIEW: GAME ─────────────────
  const isOnlineActive = gameMode === 'vs-partner' && gameState?.status === 'active';
  const q          = isOnlineActive ? curOnlineQ : activeQ[current];
  const myAnswered = isOnlineActive ? (isP1 ? gameState?.p1Answered : gameState?.p2Answered) : false;
  const timerPct   = (timeLeft / TIME_PER) * 100;
  const timerColor = timeLeft > 12 ? 'bg-green-500' : timeLeft > 6 ? 'bg-yellow-500' : 'bg-red-500';
  const qNum       = isOnlineActive ? (gameState?.current ?? 0) + 1 : current + 1;

  if (!q) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-pink-500" size={32}/></div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 pb-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={resetToLobby} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
              <ArrowLeft size={20}/> Back
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              💕 Romantic Trivia
            </h1>
            <div className="flex items-center gap-1 text-pink-500">
              <Trophy size={18}/>
              <span className="font-bold">{isOnlineActive ? (isP1 ? gameState?.p1Score : gameState?.p2Score) : score}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <GameModeBadge mode={gameMode!} />
            {isOnlineActive && (
              <div className="glass px-3 py-1 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400">
                Partner: {isP1 ? gameState?.p2Score : gameState?.p1Score} pts
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            {/* Category + timer */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                {q.custom ? '✏️ Custom' : q.category}
              </span>
              {!isOnlineActive && (
                <div className="flex items-center gap-1 font-bold text-gray-600 dark:text-gray-400">
                  <Clock size={16}/>
                  <span className={timeLeft <= 6 ? 'text-red-500' : ''}>{timeLeft}s</span>
                </div>
              )}
            </div>

            {/* Countdown bar */}
            {!isOnlineActive && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-4">
                <div className={`h-1.5 rounded-full transition-all ${timerColor}`} style={{ width: `${timerPct}%` }} />
              </div>
            )}

            {/* Progress */}
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-400">Q {qNum}/{TOTAL_Q}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mb-4">
              <div className="bg-gradient-to-r from-pink-400 to-rose-400 h-1 rounded-full transition-all"
                style={{ width: `${((qNum - 1) / TOTAL_Q) * 100}%` }} />
            </div>

            {/* Question — capped so very long text doesn't blow layout */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 leading-snug line-clamp-4">{q.q}</h2>

            {myAnswered && isOnlineActive ? (
              <div className="flex items-center justify-center gap-3 py-6 text-pink-500">
                <Loader2 size={20} className="animate-spin"/>
                <span>Waiting for partner…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {q.options.map((option, i) => {
                  let style = 'glass-btn border-0 hover:ring-2 hover:ring-pink-400';
                  if (showResult && !isOnlineActive) {
                    if (i === q.answer)      style = 'bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500';
                    else if (i === selected) style = 'bg-red-100 dark:bg-red-900/40 ring-2 ring-red-500';
                    else                     style = 'opacity-40 glass-btn border-0';
                  }
                  return (
                    <button key={i}
                      onClick={() => isOnlineActive ? handleOnlineAnswer(i) : handleSoloAnswer(i)}
                      disabled={(showResult && !isOnlineActive) || (myAnswered ?? false)}
                      className={`${style} rounded-xl px-4 py-2.5 text-left font-medium transition-all flex items-center gap-3`}>
                      <span className="w-6 h-6 rounded-full bg-white/60 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                        {['A','B','C','D'][i]}
                      </span>
                      <span className="text-gray-800 dark:text-white text-sm">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
