import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useGameStats } from '@/hooks/useGameStats';
import { GameLobby } from '@/components/shared/GameLobby';
import { GameModeBadge } from '@/components/shared/GameModeBadge';
import { playCorrect, playWrong } from '@/utils/sounds';
import { RefreshCw, ArrowLeft, Eraser, Trash2, Download, Trophy, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { GameMode } from '@/components/shared/GameLobby';

const WORDS = [
  'Sunset','Rainbow','Castle','Dragon','Mermaid','Volcano','Spaceship','Dinosaur',
  'Lighthouse','Butterfly','Snowman','Penguin','Guitar','Pizza','Balloon','Treasure',
  'Wizard','Robot','Jungle','Waterfall','Campfire','Telescope','Cactus','Crown',
  'Candle','Compass','Dolphin','Umbrella','Lantern','Heart','Kiss','Flower','Star','Moon',
];

const COLORS = ['#1a1a1a','#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#ffffff'];
const BRUSH_SIZES = [3, 6, 10, 16];
const DRAW_TIME   = 90;
const GUESS_TIME  = 30;

// Internal canvas resolution (fixed, high quality)
const CANVAS_W = 600;
const CANVAS_H = 400;

interface PictionaryOnlineState {
  word:         string;
  drawerEmail:  string;
  guesserEmail: string;
  canvasData:   string;
  guess:        string;
  phase:        'waiting' | 'drawing' | 'guessing' | 'result';
  result:       'correct' | 'timeout' | null;
  p1Score:      number;
  p2Score:      number;
  round:        number;
  drawerReady:  boolean;
  guesserReady: boolean;
  status:       'waiting' | 'active' | 'finished';
  recorded?:    boolean;
}

export const Pictionary: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user }       = useAuth();
  const { recordGame } = useGameStats();
  const userKey        = user?.email ?? null;
  const location       = useLocation();

  const [gameMode, setGameMode] = useState<GameMode | null>(null);

  const [activeRoomId,     setActiveRoomId]     = useState<string | null>(null);
  const [isHost,           setIsHost]           = useState(false);
  const [shouldHostStart,  setShouldHostStart]  = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room   = params.get('room');
    if (room && !activeRoomId) {
      setActiveRoomId(room.toUpperCase());
      setIsHost(false);
      setGameMode('vs-partner');
    }
  }, [location.search, activeRoomId]);

  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const lastPos        = useRef<{ x: number; y: number } | null>(null);
  const syncTimer      = useRef<ReturnType<typeof setInterval> | null>(null);

  const [drawing,       setDrawing]       = useState(false);
  const [color,         setColor]         = useState('#1a1a1a');
  const [brushSize,     setBrushSize]     = useState(6);
  const [erasing,       setErasing]       = useState(false);
  const [word,          setWord]          = useState('');
  const [guess,         setGuess]         = useState('');
  const [timeLeft,      setTimeLeft]      = useState(DRAW_TIME);
  const [phase,         setPhase]         = useState<'idle' | 'drawing' | 'guessing' | 'result'>('idle');
  const [result,        setResult]        = useState<'correct' | 'timeout' | null>(null);
  const [score,         setScore]         = useState(0);
  const [round,         setRound]         = useState(1);
  const [usedWords,     setUsedWords]     = useState<string[]>([]);
  const [localRecorded, setLocalRecorded] = useState(false);

  const safeSession = activeRoomId
    ? `pictionary-room-${sanitizeFirebasePath(activeRoomId)}`
    : sessionId
    ? sanitizeFirebasePath(sessionId)
    : `pictionary-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initialOnline: PictionaryOnlineState = {
    word: '', drawerEmail: userKey ?? '', guesserEmail: '',
    canvasData: '', guess: '', phase: 'waiting', result: null,
    p1Score: 0, p2Score: 0, round: 1,
    drawerReady: false, guesserReady: false, status: 'waiting',
    recorded: false,
  };

  const { gameState, updateGameState, patchGameState, loading } =
    useRealtimeGame<PictionaryOnlineState>(safeSession, 'pictionary', initialOnline);

  const isDrawer  = gameState?.drawerEmail  === userKey;
  const isGuesser = gameState?.guesserEmail === userKey;

  useEffect(() => {
    if (!gameState || gameMode !== 'vs-partner' || !userKey) return;
    if (gameState.status === 'waiting') return;
    if (gameState.drawerEmail === userKey) return;
    if (gameState.guesserEmail === userKey) return;
    if (gameState.guesserEmail !== '') return;
    patchGameState({ guesserEmail: userKey } as any);
  }, [gameState?.status, gameState?.drawerEmail, gameState?.guesserEmail, userKey, gameMode]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || gameState.recorded || !userKey) return;
    const myScore  = gameState.drawerEmail === userKey ? gameState.p1Score : gameState.p2Score;
    const oppScore = gameState.drawerEmail === userKey ? gameState.p2Score : gameState.p1Score;
    const res      = myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw';
    const opp      = gameState.drawerEmail === userKey ? gameState.guesserEmail : gameState.drawerEmail;
    recordGame({ gameType: 'pictionary', playerEmail: userKey, result: res, score: myScore, mode: 'vs-partner', opponentEmail: opp || undefined });
    updateGameState({ ...gameState, recorded: true });
  }, [gameState?.status, gameState?.recorded]);

  const getCanvas = () => canvasRef.current;
  const getCtx    = () => getCanvas()?.getContext('2d');

  const clearCanvas = useCallback(() => {
    const c = getCanvas(); if (!c) return;
    const ctx = getCtx()!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  useEffect(() => { clearCanvas(); }, [phase]);

  useEffect(() => {
    if (gameMode !== 'vs-partner' || !isDrawer || gameState?.phase !== 'drawing') return;
    syncTimer.current = setInterval(() => {
      const c = getCanvas(); if (!c) return;
      const data = c.toDataURL('image/jpeg', 0.4);
      patchGameState({ canvasData: data } as any);
    }, 2000);
    return () => { if (syncTimer.current) clearInterval(syncTimer.current); };
  }, [gameMode, isDrawer, gameState?.phase]);

  useEffect(() => {
    if (!isGuesser || !gameState?.canvasData || gameMode !== 'vs-partner') return;
    const img    = new Image();
    img.onload   = () => { const ctx = getCtx(); if (!ctx) return; ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H); };
    img.src      = gameState.canvasData;
  }, [gameState?.canvasData]);

  useEffect(() => {
    if (gameMode !== 'solo' || phase !== 'drawing') return;
    const t = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { clearInterval(t); setPhase('guessing'); setTimeLeft(GUESS_TIME); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, gameMode]);

  useEffect(() => {
    if (gameMode !== 'solo' || phase !== 'guessing') return;
    const t = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { clearInterval(t); setResult('timeout'); setPhase('result'); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, gameMode]);

  useEffect(() => {
    if (gameMode !== 'vs-partner' || !isDrawer || gameState?.phase !== 'drawing') return;
    setTimeLeft(DRAW_TIME);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          const c = getCanvas();
          const finalData = c ? c.toDataURL('image/jpeg', 0.4) : '';
          updateGameState({ ...gameState!, phase: 'guessing', canvasData: finalData });
          setTimeLeft(GUESS_TIME);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState?.phase, isDrawer, gameMode]);

  useEffect(() => {
    if (gameMode !== 'vs-partner' || !isGuesser || gameState?.phase !== 'guessing') return;
    setTimeLeft(GUESS_TIME);
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); updateGameState({ ...gameState!, result: 'timeout', phase: 'result' }); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState?.phase, isGuesser, gameMode]);

  const startSolo = () => {
    const available = WORDS.filter(w => !usedWords.includes(w));
    const newWord   = available[Math.floor(Math.random() * available.length)];
    setWord(newWord); setUsedWords(u => [...u, newWord]);
    setTimeLeft(DRAW_TIME); setGuess(''); setResult(null); setPhase('drawing');
  };

  const handleSoloGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim().toLowerCase() === word.toLowerCase()) {
      const pts = timeLeft > 20 ? 20 : timeLeft > 10 ? 15 : 10;
      setScore(s => s + pts); setResult('correct'); setPhase('result'); playCorrect();
    } else playWrong();
  };

  useEffect(() => {
    if (phase !== 'result' || localRecorded || !userKey || gameMode !== 'solo') return;
    setLocalRecorded(true);
    recordGame({ gameType: 'pictionary', playerEmail: userKey, result: result === 'correct' ? 'win' : 'loss', score, mode: 'solo' });
  }, [phase]);

  const nextRound = () => { setRound(r => r + 1); clearCanvas(); startSolo(); setLocalRecorded(false); };

  const startOnline = useCallback(() => {
    const newWord = [...WORDS].sort(() => Math.random() - 0.5)[0];
    updateGameState({
      ...initialOnline,
      word:         newWord,
      drawerEmail:  userKey ?? '',
      guesserEmail: '',
      status:       'active',
      phase:        'drawing',
    });
    setTimeLeft(DRAW_TIME);
  }, [userKey, safeSession]);

  useEffect(() => {
    if (!shouldHostStart || !activeRoomId || !isHost) return;
    startOnline();
    setShouldHostStart(false);
  }, [shouldHostStart, activeRoomId, isHost, safeSession]);

  const handleOnlineGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState) return;
    const ok = guess.trim().toLowerCase() === gameState.word.toLowerCase();
    if (ok) {
      updateGameState({
        ...gameState,
        result:   'correct',
        phase:    'result',
        p2Score:  isGuesser ? gameState.p2Score + timeLeft : gameState.p2Score,
        p1Score:  isDrawer  ? gameState.p1Score + 10       : gameState.p1Score,
      });
      playCorrect();
    } else playWrong();
  };

  const nextOnlineRound = () => {
    if (!gameState) return;
    const available = WORDS.filter(w => w !== gameState.word);
    const newWord   = available[Math.floor(Math.random() * available.length)];
    updateGameState({
      ...gameState,
      word:         newWord,
      canvasData:   '',
      drawerEmail:  gameState.guesserEmail,
      guesserEmail: gameState.drawerEmail,
      phase:        'drawing',
      result:       null,
      round:        gameState.round + 1,
    });
    clearCanvas(); setTimeLeft(DRAW_TIME); setGuess('');
  };

  // ── Draw helpers ──
  // Maps pointer position to internal canvas coordinates
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = getCanvas()!;
    const rect = c.getBoundingClientRect();
    // Scale from display size to internal canvas resolution
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    if ('touches' in e) return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top)  * scaleY,
    };
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const canDraw = gameMode === 'solo'
    ? phase === 'drawing'
    : (gameMode === 'vs-partner' && isDrawer && gameState?.phase === 'drawing');

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw) return;
    setDrawing(true);
    const pos = getPos(e); lastPos.current = pos;
    const ctx = getCtx()!;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, (erasing ? brushSize * 3 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = erasing ? '#ffffff' : color; ctx.fill();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !canDraw) return;
    e.preventDefault();
    const ctx = getCtx()!; const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPos.current!.x, lastPos.current!.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = erasing ? '#ffffff' : color;
    ctx.lineWidth   = erasing ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => setDrawing(false);

  const downloadDrawing = () => {
    const c = getCanvas(); if (!c) return;
    const a = document.createElement('a');
    a.download = `pictionary-${word || gameState?.word}.png`; a.href = c.toDataURL(); a.click();
  };

  const timerColor = timeLeft > 30 ? 'text-green-500' : timeLeft > 15 ? 'text-yellow-500' : 'text-red-500 animate-pulse';

  const resetToLobby = () => {
    setGameMode(null); setPhase('idle');
    setActiveRoomId(null); setIsHost(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" size={32} /></div>;

  // ── LOBBY ──
  if (!gameMode || phase === 'idle') return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20} /> Back</Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">🎨 Pictionary</h1>
            <div className="flex items-center gap-1 text-yellow-600"><Trophy size={18} /><span className="font-bold">{score}</span></div>
          </div>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GameLobby
              gameName="Pictionary"
              gameIcon="🎨"
              gradient="from-pink-500 to-rose-500"
              description="Draw the word — your partner guesses!"
              supportsSolo
              supportsAI={false}
              gameType="Pictionary"
              onStartSolo={() => { setGameMode('solo'); startSolo(); }}
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
    </div>
  );

  // ── ACTIVE GAME ──
  const activePhase     = gameMode === 'vs-partner' ? gameState?.phase : phase;
  const activeWord      = gameMode === 'vs-partner' ? gameState?.word  : word;
  const activeResult    = gameMode === 'vs-partner' ? gameState?.result : result;
  const activeRound     = gameMode === 'vs-partner' ? gameState?.round  : round;
  const activeScore     = gameMode === 'vs-partner'
    ? (gameState?.drawerEmail === userKey ? gameState?.p1Score : gameState?.p2Score)
    : score;
  const isOnlineWaiting = gameMode === 'vs-partner' && gameState?.phase === 'waiting';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={resetToLobby} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"><ArrowLeft size={20} /> Back</button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">🎨 Pictionary</h1>
            <div className="flex items-center gap-1 text-yellow-600"><Trophy size={18} /><span className="font-bold">{activeScore}</span></div>
          </div>

          <div className="flex justify-center gap-2 flex-wrap mb-3">
            <GameModeBadge mode={gameMode} />
            {activeRoomId && (
              <span className="glass px-3 py-1 rounded-full text-xs font-mono font-bold text-purple-400 tracking-widest">
                Room: {activeRoomId}
              </span>
            )}
          </div>

          {isOnlineWaiting && (
            <div className="glass-card p-8 text-center">
              <Loader2 size={32} className="animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Waiting for partner to connect…</p>
            </div>
          )}

          {(activePhase === 'drawing' || activePhase === 'guessing') && !isOnlineWaiting && (
            <div className="space-y-2">
              {/* Info bar */}
              <div className="glass-card p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                    Round {activeRound} ·
                    {activePhase === 'drawing'
                      ? (isDrawer || gameMode === 'solo' ? ' 🎨 Draw!' : ' Waiting for drawer…')
                      : (isGuesser || gameMode === 'solo' ? ' 👀 Guess!' : ' Guesser is typing…')}
                  </span>
                  {(isDrawer || gameMode === 'solo') && activePhase === 'drawing' &&
                    <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{activeWord}</span>}
                  <span className={`font-bold ${timerColor}`}>{timeLeft}s</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${activePhase === 'drawing' ? (timeLeft / DRAW_TIME) * 100 : (timeLeft / GUESS_TIME) * 100}%` }} />
                </div>
              </div>

              {/* Canvas — responsive: full container width, internal resolution 600×400 */}
              <div ref={containerRef} className="glass-card overflow-hidden w-full">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className={`w-full touch-none block ${
                    canDraw ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                  style={{ background: '#ffffff', aspectRatio: '3/2' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                />
              </div>

              {/* Drawing toolbar */}
              {canDraw && (
                <div className="glass-card p-3">
                  <div className="flex gap-1.5 mb-2 flex-wrap items-center">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => { setColor(c); setErasing(false); }}
                        className={`w-7 h-7 rounded-full border-2 transition hover:scale-110 ${
                          color === c && !erasing ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
                        }`} style={{ backgroundColor: c }} />
                    ))}
                    <button onClick={() => setErasing(e => !e)}
                      className={`p-1.5 rounded-lg transition ${erasing ? 'bg-blue-500 text-white' : 'glass-btn text-gray-700 dark:text-gray-300'}`}>
                      <Eraser size={15} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Size:</span>
                    {BRUSH_SIZES.map(s => (
                      <button key={s} onClick={() => setBrushSize(s)}
                        className={`rounded-full bg-gray-800 dark:bg-white transition ${brushSize === s ? 'ring-2 ring-pink-500 ring-offset-2' : ''}`}
                        style={{ width: s * 2 + 6, height: s * 2 + 6 }} />
                    ))}
                    <div className="flex-1" />
                    <button onClick={clearCanvas}     className="p-1.5 text-gray-500 hover:text-red-500 transition"><Trash2 size={16} /></button>
                    <button onClick={downloadDrawing} className="p-1.5 text-gray-500 hover:text-blue-500 transition"><Download size={16} /></button>
                  </div>
                </div>
              )}

              {/* Guess input */}
              {(activePhase === 'guessing' && (isGuesser || gameMode === 'solo')) && (
                <div className="glass-card p-3">
                  <p className="text-gray-600 dark:text-gray-400 mb-2 text-center text-sm">What did they draw?</p>
                  <form onSubmit={gameMode === 'solo' ? handleSoloGuess : handleOnlineGuessSubmit} className="flex gap-2">
                    <input type="text" value={guess} onChange={e => setGuess(e.target.value)}
                      placeholder="Your guess…" autoFocus
                      className="flex-1 glass border-0 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400" />
                    <button type="submit" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-5 py-2 rounded-xl transition">
                      Guess!
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {activePhase === 'result' && (
            <div className="glass-card p-8 text-center">
              <div className="text-6xl mb-4">{activeResult === 'correct' ? '🎉' : '⏰'}</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {activeResult === 'correct' ? 'Correct!' : "Time's Up!"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The word was: <strong className="text-pink-600 dark:text-pink-400">{activeWord}</strong>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={gameMode === 'solo' ? nextRound : nextOnlineRound}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2">
                  <RefreshCw size={18} /> Next Round
                </button>
                <button onClick={resetToLobby}
                  className="glass-btn text-gray-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2">
                  <ArrowLeft size={18} /> Lobby
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
