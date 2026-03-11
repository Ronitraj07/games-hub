import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useGameStats } from '@/hooks/useGameStats';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { playCorrect, playWrong } from '@/utils/sounds';
import { RefreshCw, Clock, Trophy, Star, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { AIDifficulty, GameMode } from '@/components/shared/GameLobby';

const WORD_LIST = [
  {word:'LOVE',hint:'A deep feeling of affection'},{word:'HEART',hint:'Organ that pumps blood, symbol of love'},
  {word:'ROSE',hint:'A popular romantic flower'},{word:'KISS',hint:'A touch with the lips'},
  {word:'DREAM',hint:'Images in your sleep or an aspiration'},{word:'SMILE',hint:'Expression of happiness'},
  {word:'TRUST',hint:'Firm belief in reliability of someone'},{word:'DANCE',hint:'Moving rhythmically to music'},
  {word:'MAGIC',hint:'Something wonderful and unexplainable'},{word:'BLISS',hint:'Perfect happiness'},
  {word:'CHERISH',hint:'To hold dear'},{word:'FOREVER',hint:'For all time'},
  {word:'TENDER',hint:'Gentle and caring'},{word:'WARMTH',hint:'Feeling of comfort and affection'},
  {word:'CANDLE',hint:'A wax stick used for light or romance'},{word:'SUNSET',hint:'The sun going down in the evening'},
  {word:'CUDDLE',hint:'Holding someone close warmly'},{word:'MEMORY',hint:'Something you remember from the past'},
  {word:'PROMISE',hint:'A commitment to do something'},{word:'JOURNEY',hint:'A long trip or experience'},
];

const scramble = (word: string): string => {
  const a = word.split('');
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join('') === word ? scramble(word) : a.join('');
};

const seededShuffle = (arr: typeof WORD_LIST, seed: string) => {
  let s = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return [...arr].sort(() => rng() - .5).slice(0, 10);
};

const AI_DELAY: Record<AIDifficulty, number> = { easy: 22000, medium: 13000, hard: 4000 };
const TOTAL = 10;

interface OnlineState {
  words: typeof WORD_LIST;
  current: number;
  p1Email: string; p2Email: string;
  p1Score: number; p2Score: number;
  p1Done: boolean; p2Done: boolean;
  status: 'waiting' | 'active' | 'finished';
  seed: string;
  recorded?: boolean;
}

export const WordScramble: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user }       = useAuth();
  const { recordGame } = useGameStats();
  const userKey        = user?.email ?? null;
  const location       = useLocation();

  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [aiDiff, setAiDiff]     = useState<AIDifficulty>('medium');

  const [activeRoomId, setActiveRoomId]       = useState<string | null>(null);
  const [isHost, setIsHost]                   = useState(false);
  const [shouldHostStart, setShouldHostStart] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room   = params.get('room');
    if (room && !activeRoomId) {
      setActiveRoomId(room.toUpperCase());
      setIsHost(false);
      setGameMode('vs-partner');
    }
  }, [location.search, activeRoomId]);

  // ─── Solo/AI state ───
  const [words]    = useState(() => [...WORD_LIST].sort(() => Math.random() - .5).slice(0, TOTAL));
  const [curIdx,     setCurIdx]    = useState(0);
  const [scrambled,  setScrambled] = useState('');
  const [input,      setInput]     = useState('');
  const [score,      setScore]     = useState(0);
  const [timeLeft,   setTimeLeft]  = useState(30);
  const [gameOver,   setGameOver]  = useState(false);
  const [feedback,   setFeedback]  = useState<'correct' | 'wrong' | null>(null);
  const [showHint,   setShowHint]  = useState(false);
  const [streak,     setStreak]    = useState(0);
  const [round,      setRound]     = useState(1);
  const [aiScore,    setAiScore]   = useState(0);
  const [aiSolved,   setAiSolved]  = useState(false);
  const localRecordedRef = useRef(false);
  const onlineRecordedRef = useRef(false);

  // ─── Online scramble — stored in state so it's stable per word ───
  const [onlineScrambled, setOnlineScrambled] = useState('');

  // ─── Online state ───
  const safeSession = activeRoomId
    ? `wordscramble-room-${sanitizeFirebasePath(activeRoomId)}`
    : sessionId
    ? sanitizeFirebasePath(sessionId)
    : `wordscramble-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initialOnline: OnlineState = {
    words: [], current: 0, seed: '',
    p1Email: userKey ?? '', p2Email: '',
    p1Score: 0, p2Score: 0, p1Done: false, p2Done: false,
    status: 'waiting',
    recorded: false,
  };
  const { gameState, updateGameState } = useRealtimeGame<OnlineState>(safeSession, 'wordscramble', initialOnline);
  const isP1 = gameState?.p1Email === userKey;
  const curOnlineWord = gameState?.words?.[gameState.current];

  // Re-scramble when online word changes
  useEffect(() => {
    if (curOnlineWord?.word) setOnlineScrambled(scramble(curOnlineWord.word));
  }, [curOnlineWord?.word]);

  // ─── Record online result (fix: proper dep array) ───
  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || gameState.recorded || !userKey) return;
    if (onlineRecordedRef.current) return;
    onlineRecordedRef.current = true;
    const myScore  = isP1 ? gameState.p1Score : gameState.p2Score;
    const oppScore = isP1 ? gameState.p2Score : gameState.p1Score;
    const result   = myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw';
    const opp      = isP1 ? (gameState.p2Email || undefined) : gameState.p1Email;
    recordGame({ gameType: 'wordscramble', playerEmail: userKey, result, score: myScore, mode: 'vs-partner', opponentEmail: opp });
    updateGameState({ ...gameState, recorded: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.status, gameState?.recorded, isP1, userKey]);

  const loadWord = useCallback((idx: number, wordList = words) => {
    if (idx < TOTAL) {
      setScrambled(scramble(wordList[idx].word));
      setInput(''); setTimeLeft(30); setShowHint(false); setFeedback(null); setAiSolved(false);
    }
  }, [words]);

  useEffect(() => { if (gameMode && gameMode !== 'vs-partner') loadWord(0); }, [gameMode, loadWord]);

  // Local timer
  useEffect(() => {
    if (!gameMode || gameMode === 'vs-partner' || gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); handleNext(false); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curIdx, gameMode, gameOver]);

  // AI timer
  useEffect(() => {
    if (gameMode !== 'vs-ai' || feedback || gameOver) return;
    const t = setTimeout(() => { setAiScore(s => s + 10); setAiSolved(true); }, AI_DELAY[aiDiff]);
    return () => clearTimeout(t);
  }, [gameMode, curIdx, feedback, gameOver, aiDiff]);

  const handleNext = (correct: boolean) => {
    const next = curIdx + 1;
    if (correct) {
      const pts = timeLeft > 20 ? 15 : timeLeft > 10 ? 10 : 5;
      setScore(s => s + pts + (streak >= 2 ? 5 : 0));
      setStreak(s => s + 1);
      playCorrect();
    } else { setStreak(0); playWrong(); }
    if (next >= TOTAL) setGameOver(true);
    else { setCurIdx(next); setRound(next + 1); loadWord(next); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = input.trim().toUpperCase() === words[curIdx].word;
    setFeedback(ok ? 'correct' : 'wrong');
    setTimeout(() => handleNext(ok), 600);
  };

  // Record local/AI result
  useEffect(() => {
    if (!gameOver || localRecordedRef.current || !userKey || gameMode === 'vs-partner') return;
    localRecordedRef.current = true;
    const result = score > aiScore ? 'win' : score < aiScore ? 'loss' : 'draw';
    recordGame({
      gameType:    'wordscramble',
      playerEmail: userKey,
      result:      gameMode === 'vs-ai' ? result : 'win',
      score,
      mode:        gameMode ?? 'solo',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  // Online submit
  const handleOnlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState || gameState.status !== 'active' || !curOnlineWord) return;
    const ok  = input.trim().toUpperCase() === curOnlineWord.word;
    const pts = ok ? 10 : 0;
    const updated = isP1
      ? { ...gameState, p1Score: gameState.p1Score + pts, p1Done: true }
      : { ...gameState, p2Score: gameState.p2Score + pts, p2Done: true };
    const otherDone = isP1 ? gameState.p2Done : gameState.p1Done;
    if (otherDone) {
      if (gameState.current + 1 >= TOTAL) updateGameState({ ...updated, status: 'finished', recorded: false });
      else updateGameState({ ...updated, current: gameState.current + 1, p1Done: false, p2Done: false });
    } else {
      updateGameState(updated);
    }
    setInput('');
  };

  const startOnline = () => {
    const seed    = Math.random().toString(36).slice(2, 8);
    const shuffled = seededShuffle(WORD_LIST, seed);
    updateGameState({ ...initialOnline, words: shuffled, seed, p2Email: 'opponent', status: 'active' });
  };

  useEffect(() => {
    if (!shouldHostStart || !activeRoomId || !isHost) return;
    startOnline();
    setShouldHostStart(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldHostStart, activeRoomId, isHost, safeSession]);

  const timerColor = timeLeft > 15 ? 'text-green-500' : timeLeft > 8 ? 'text-yellow-500' : 'text-red-500';

  if (!gameMode) return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 transition"><ArrowLeft size={20} /> Back</Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">🔤 Word Scramble</h1>
          <div className="w-10" />
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <GameLobby
            gameName="Word Scramble" gameIcon="🔤"
            gradient="from-pink-500 to-purple-500"
            description="Unscramble romantic words — race to solve first!"
            supportsSolo supportsAI
            aiLabels={{ easy: 'solves after ~22s', medium: 'solves after ~13s', hard: 'solves in ~4s' }}
            gameType="WordScramble"
            onStartSolo={() => { setGameMode('solo'); loadWord(0); }}
            onStartVsAI={(d) => { setAiDiff(d); setGameMode('vs-ai'); }}
            onStartVsPartner={(roomId, hostFlag) => {
              setGameMode('vs-partner');
              setActiveRoomId(roomId);
              setIsHost(hostFlag);
              if (hostFlag) setShouldHostStart(true);
            }}
          />
        </div>
      </div>
    </div>
  );

  if (gameOver || gameState?.status === 'finished') {
    const isOnline  = gameMode === 'vs-partner';
    const myFinal   = isOnline ? (isP1 ? gameState!.p1Score : gameState!.p2Score) : score;
    const oppFinal  = isOnline ? (isP1 ? gameState!.p2Score : gameState!.p1Score) : aiScore;
    const maxScore  = TOTAL * 20;
    const pct       = (myFinal / maxScore) * 100;
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Game Over!</h2>
          {isOnline && <p className="text-gray-500 mb-6">You: {myFinal} · Partner: {oppFinal}</p>}
          {gameMode === 'vs-ai' && <p className="text-gray-500 mb-6">You: {myFinal} · AI: {oppFinal}</p>}
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-6 mb-6">
            <p className="text-5xl font-bold text-pink-600 dark:text-pink-400">{myFinal}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">out of {maxScore} points</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-3">
              <div className="bg-pink-500 h-3 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => {
              setGameMode(null); setGameOver(false); setCurIdx(0); setRound(1); setScore(0);
              setStreak(0); setAiScore(0);
              localRecordedRef.current = false; onlineRecordedRef.current = false;
              setActiveRoomId(null); setIsHost(false);
            }}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
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

  const isOnlineActive   = gameMode === 'vs-partner' && gameState?.status === 'active';
  const activeWord       = isOnlineActive ? curOnlineWord : words[curIdx];
  const activeScrambled  = isOnlineActive ? onlineScrambled : scrambled;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setGameMode(null); setActiveRoomId(null); setIsHost(false); }}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 transition">
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">🔤 Word Scramble</h1>
          <div className="flex items-center gap-1 text-yellow-600">
            <Trophy size={18} />
            <span className="font-bold">{isOnlineActive ? (isP1 ? gameState?.p1Score : gameState?.p2Score) : score}</span>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <GameModeBadge mode={gameMode} difficulty={gameMode === 'vs-ai' ? aiDiff : undefined} />
        </div>

        {gameMode === 'vs-ai' && (
          <div className="glass-card p-3 mb-4 flex justify-around text-sm">
            <span>You: <strong>{score}</strong></span>
            <span>🤖 AI: <strong className={aiSolved ? 'text-red-500' : ''}>{aiScore}</strong></span>
            {aiSolved && <span className="text-xs text-red-400">AI solved it!</span>}
          </div>
        )}

        {isOnlineActive && (
          <div className="glass-card p-3 mb-4 flex justify-around text-sm">
            <span>You: <strong>{isP1 ? gameState?.p1Score : gameState?.p2Score}</strong></span>
            <span>Partner: <strong>{isP1 ? gameState?.p2Score : gameState?.p1Score}</strong></span>
            <span className="text-xs text-gray-400">Word {(gameState?.current ?? 0) + 1}/{TOTAL}</span>
          </div>
        )}

        <div className="glass-card p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">Round {round}/{TOTAL}</span>
            {!isOnlineActive && (
              <div className={`flex items-center gap-1 font-bold text-lg ${timerColor}`}>
                <Clock size={18} />{timeLeft}s
              </div>
            )}
            {streak >= 2 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Star size={16} fill="currentColor" />
                <span className="text-sm font-bold">{streak}x streak!</span>
              </div>
            )}
          </div>

          {!isOnlineActive && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${(timeLeft / 30) * 100}%` }} />
            </div>
          )}

          <div className={`text-center mb-6 p-6 rounded-xl transition-all ${
            feedback === 'correct' ? 'bg-green-50 dark:bg-green-900/30'
            : feedback === 'wrong' ? 'bg-red-50 dark:bg-red-900/30'
            : 'bg-pink-50/50 dark:bg-pink-900/10'
          }`}>
            <p className="text-sm text-gray-500 mb-2">Unscramble this word:</p>
            <p className="text-5xl font-bold tracking-widest bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              {activeScrambled.split('').join(' ')}
            </p>
            {feedback && !isOnlineActive && (
              <p className={`mt-3 font-semibold ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                {feedback === 'correct' ? '✅ Correct!' : `❌ It was: ${words[curIdx].word}`}
              </p>
            )}
          </div>

          {showHint && activeWord && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">💡 Hint: {activeWord.hint}</p>
            </div>
          )}

          <form onSubmit={isOnlineActive ? handleOnlineSubmit : handleSubmit} className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value.toUpperCase())}
              placeholder="Type your answer…"
              className="flex-1 glass border-0 rounded-xl px-4 py-3 text-lg font-semibold uppercase tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400" autoFocus />
            <button type="submit"
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition">Go!</button>
          </form>

          {!isOnlineActive && (
            <button onClick={() => setShowHint(true)}
              className="w-full mt-3 text-sm text-gray-500 hover:text-pink-600 transition">💡 Show Hint</button>
          )}

          {isOnlineActive && (isP1 ? gameState?.p1Done : gameState?.p2Done) && (
            <div className="flex items-center justify-center gap-2 mt-4 text-purple-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Waiting for partner…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
