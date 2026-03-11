import React, { useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, X, Shuffle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { GameLobby } from '@/components/shared/GameLobby';

// ─────────────────────────────────────────────────────────
//  DECKS
// ─────────────────────────────────────────────────────────
const DECKS = {
  romantic: {
    label: '💕 Romantic',
    color: 'from-pink-400 to-rose-500',
    bg: 'bg-gradient-to-br from-pink-950/40 to-rose-950/40',
    adult: false,
    truths: [
      'What is your happiest memory with me?',
      'When did you first realise you had feelings for me?',
      'What is your favourite thing I do that makes you feel loved?',
      'What song instantly makes you think of us?',
      'If you could relive one moment with me, which would it be?',
      'What is the most romantic thing I have ever done for you?',
      'What small thing do I do that secretly melts your heart?',
      'What is your dream date with me?',
      'What does being with me feel like in one word?',
      'What is something you have always wanted to tell me but never have?',
      'What physical feature of mine do you love most?',
      'How did you know I was the one?',
      'What is the sweetest thing I have ever said to you?',
      'Where would your perfect holiday with me be?',
      'What is one promise you want us to make to each other right now?',
    ],
    dares: [
      'Send me the most romantic voice note you can right now.',
      'Write me a 4-line poem and send it.',
      'Tell me 5 things you love about me — you have 30 seconds.',
      'Send me the photo in your gallery that reminds you of us.',
      'Record a 10-second video saying why you love me.',
      'Send me a voice message singing one line of our favourite song.',
      'Describe in a text exactly what you would do if I were there right now.',
      'Send me your most recent selfie, no filter.',
      'Write me a flirty text as if we just met.',
      'Tell me the one thing about me that you find irresistible.',
      'Send me a voice note with the cheesiest pickup line you know.',
      'Describe our first kiss in detail over text.',
      'Set a photo of us as your wallpaper and send me a screenshot.',
      'Send me a voice message saying the three words.',
      'Tell me one thing you have never told anyone about how you feel about me.',
    ],
  },
  adult: {
    label: '🔞 After Dark',
    color: 'from-rose-600 to-red-700',
    bg: 'bg-gradient-to-br from-rose-950/60 to-red-950/60',
    adult: true,
    truths: [
      'What is your number one fantasy you have never told me?',
      'What is the most turned on you have ever been because of something I did?',
      'What outfit or look of mine drives you absolutely crazy?',
      'What is something new and wild you want us to try together?',
      'What body part of mine do you think about most?',
      'Have you ever touched yourself thinking about me? Describe it.',
      'What is your dirtiest thought about me you have never said out loud?',
      'What would your ideal night alone with me look like in full detail?',
      'What is one thing you want me to do to you that I have never done?',
      'What is the most attractive thing I do without knowing it?',
      'Have you ever imagined us in a specific location doing something explicit? Where and what?',
      'What is something you want to hear me say in an intimate moment?',
      'Rate our intimacy honestly and tell me what would make it a 10.',
      'What is one word that describes what you want from me tonight?',
      'Have you ever watched something and immediately thought of doing it with me?',
      'What do you think about just before you fall asleep when you miss me?',
      'What is the wildest place you have imagined us together?',
      'Tell me the most explicit dream you have ever had about me.',
    ],
    dares: [
      'Send me your sexiest photo right now.',
      'Send me a voice note describing exactly what you would do to me if I were there.',
      'Send me a photo of whatever you are wearing right now — or not wearing.',
      'Record a 15-second video of you doing your most seductive look into the camera.',
      'Send me the most explicit text you have ever wanted to send me.',
      'Describe in detail over voice note what you want me to do to you.',
      'Send me a photo of your favourite body part of yours.',
      'Voice note: tell me your hottest fantasy about us, no holding back.',
      'Send a flirty video saying exactly what you want tonight.',
      'Text me the dirtiest thing on your mind right now.',
      'Send me a photo that would make my jaw drop.',
      'Record yourself saying the most explicit thing you have ever wanted to say to me.',
      'Send me a voice note moaning my name.',
      'Describe in a text message what you are going to do to me next time we are together.',
      'Send me a photo from an angle I have never seen before.',
      'Voice note: narrate what our perfect explicit night together looks like.',
      'Send me a photo that would get you in trouble if anyone else saw it.',
      'Text me exactly what you are thinking about me right now — zero filter.',
    ],
  },
} as const;

type DeckKey = keyof typeof DECKS;
type CardType = 'truth' | 'dare';

interface TodCard { type: CardType; text: string; deck: DeckKey; drawnBy: string; }

interface TodState {
  status: 'lobby' | 'active';
  deck: DeckKey;
  adultUnlocked: boolean;
  currentCard: TodCard | null;
  currentTurn: string;
  player1: string;
  player2: string | null;
  customTruths: string[];
  customDares: string[];
  history: TodCard[];
  flipping: boolean;
}

const pickRandom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const TruthOrDare: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const userEmail = user?.email ?? 'guest';

  // ── Room state ──────────────────────────────────────
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [inGame, setInGame] = useState(false);

  // Fix: track whether host has already seeded Firebase to avoid re-seeding on re-renders
  const seededRef = useRef(false);

  // ── Local UI state ──────────────────────────────────
  const [showAgeGate,   setShowAgeGate]   = useState(false);
  const [showCustom,    setShowCustom]    = useState(false);
  const [newCustomText, setNewCustomText] = useState('');
  const [newCustomType, setNewCustomType] = useState<CardType>('truth');

  // ── Firebase session ────────────────────────────────
  const safeRoom = activeRoomId
    ? `tod-room-${sanitizeFirebasePath(activeRoomId)}`
    : 'tod-placeholder';

  // Fix: initialState always uses userEmail as player1 —
  // this is only the local fallback; the host immediately overwrites with updateGameState below.
  const makeInitialState = (hostEmail: string): TodState => ({
    status: 'lobby',
    deck: 'romantic',
    adultUnlocked: false,
    currentCard: null,
    currentTurn: hostEmail,
    player1: hostEmail,
    player2: null,
    customTruths: [],
    customDares: [],
    history: [],
    flipping: false,
  });

  const { gameState, updateGameState } = useRealtimeGame<TodState>(
    safeRoom, 'truthordare', makeInitialState(userEmail)
  );

  const gs = gameState;
  const isMyTurn = gs?.currentTurn === userEmail;
  const amPlayer1 = gs?.player1 === userEmail;
  const partnerJoined = !!gs?.player2;

  // ── Deep-link join: ?room=CODE ──────────────────────
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room = params.get('room');
    if (room && !activeRoomId) {
      setActiveRoomId(room.toUpperCase());
      setIsHost(false);
      setInGame(true);
    }
  }, [location.search, activeRoomId]);

  // Fix: Guest join — runs whenever Firebase state loads.
  // Conditions: we have a room, we are NOT the host, Firebase is loaded (gs exists),
  // the host's player1 is someone else, and player2 slot is empty.
  React.useEffect(() => {
    if (!activeRoomId || isHost || !gs) return;
    // gs.player1 will be the HOST's email (written by host seed below).
    // If it equals our email we somehow ended up as host — do nothing.
    if (gs.player1 === userEmail) return;
    // Slot already taken (either by us or someone else)
    if (gs.player2) return;
    // Write ourselves in as player2 and flip status to active
    updateGameState({ ...gs, player2: userEmail, status: 'active' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, isHost, gs?.player1, gs?.player2, gs?.status]);

  // Fix: Host activates game when partner joins (fallback in case guest didn't flip status)
  React.useEffect(() => {
    if (!isHost || !gs) return;
    if (gs.player2 && gs.status === 'lobby') {
      updateGameState({ ...gs, status: 'active' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gs?.player2, gs?.status]);

  // ── Host seeds room on mount ────────────────────────
  // Fix: host must write the initial state to Firebase immediately so the guest
  // reads player1 = host's email (not their own email from local initialState).
  const handleStartVsPartner = (roomId: string, hostFlag: boolean) => {
    setActiveRoomId(roomId);
    setIsHost(hostFlag);
    setInGame(true);
    seededRef.current = false;
  };

  // Seed effect: fires once activeRoomId + isHost are set and safeRoom path is ready
  React.useEffect(() => {
    if (!activeRoomId || !isHost || seededRef.current) return;
    seededRef.current = true;
    updateGameState(makeInitialState(userEmail));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, isHost, safeRoom]);

  // ── Deck selection ───────────────────────────────────
  const selectDeck = (d: DeckKey) => {
    if (!gs) return;
    if (DECKS[d].adult && !gs.adultUnlocked) { setShowAgeGate(true); return; }
    updateGameState({ ...gs, deck: d, currentCard: null });
  };

  const confirmAge = () => {
    if (!gs) return;
    setShowAgeGate(false);
    updateGameState({ ...gs, adultUnlocked: true, deck: 'adult', currentCard: null });
  };

  // ── Draw card ────────────────────────────────────────
  // Fix: stale closure — capture the card locally and pass it explicitly to both
  // updateGameState calls instead of relying on gs spreading twice from the same closure.
  const drawCard = useCallback((type?: CardType) => {
    if (!gs || gs.flipping || !isMyTurn) return;
    const t: CardType = type ?? (Math.random() > 0.5 ? 'truth' : 'dare');
    const deck = DECKS[gs.deck];
    const pool = [
      ...(t === 'truth' ? deck.truths : deck.dares),
      ...(t === 'truth' ? gs.customTruths : gs.customDares),
    ];
    const text = pickRandom(pool);
    const card: TodCard = { type: t, text, deck: gs.deck, drawnBy: userEmail };
    const newHistory = [card, ...(gs.history || [])].slice(0, 20);
    const nextTurn = amPlayer1 ? (gs.player2 ?? userEmail) : gs.player1;

    // First write: show flipping animation with new card
    updateGameState({ ...gs, flipping: true, currentCard: card, history: newHistory });

    // Second write: end flip, advance turn.
    // Fix: spread gs first, then override — but use the values we computed above
    // so we don't lose currentCard from the first write.
    setTimeout(() => {
      updateGameState({
        ...gs,
        flipping: false,
        currentCard: card,       // explicit — not relying on Firebase read-back
        currentTurn: nextTurn,
        history: newHistory,     // explicit — same array as first write
      });
    }, 400);
  }, [gs, isMyTurn, amPlayer1, userEmail]);

  // ── Custom cards ─────────────────────────────────────
  const addCustomCard = () => {
    if (!gs || !newCustomText.trim()) return;
    if (newCustomType === 'truth') {
      updateGameState({ ...gs, customTruths: [...gs.customTruths, newCustomText.trim()] });
    } else {
      updateGameState({ ...gs, customDares: [...gs.customDares, newCustomText.trim()] });
    }
    setNewCustomText('');
  };

  const leaveGame = () => {
    setActiveRoomId(null);
    setIsHost(false);
    setInGame(false);
    seededRef.current = false;
  };

  // ─────────────────────────────────────────────────────
  //  RENDER — Lobby (no room yet)
  // ─────────────────────────────────────────────────────
  if (!inGame || !activeRoomId) return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto pt-8">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-pink-500 transition mb-8 text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <GameLobby
          gameName="Truth or Dare"
          gameIcon="🔥"
          gradient="from-rose-500 to-pink-500"
          description="Real-time · Two players · Two devices"
          supportsSolo={false}
          supportsAI={false}
          gameType="TruthOrDare"
          onStartVsPartner={handleStartVsPartner}
        />
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  RENDER — Waiting for partner (host only, before P2 joins)
  // ─────────────────────────────────────────────────────
  if (isHost && !partnerJoined) return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="glass-card max-w-sm w-full p-10 text-center">
        <div className="text-6xl mb-4 animate-pulse">⏳</div>
        <h2 className="text-xl font-bold text-white mb-2">Room Created!</h2>
        <p className="text-gray-400 text-sm mb-6">Waiting for partner to join…</p>
        <div className="glass rounded-2xl px-6 py-4 mb-4">
          <p className="text-4xl font-black tracking-widest text-pink-400">{activeRoomId}</p>
        </div>
        <button onClick={leaveGame}
          className="text-sm text-gray-500 hover:text-red-400 transition mt-4">
          ← Leave room
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  RENDER — Game active
  // ─────────────────────────────────────────────────────
  const deck = DECKS[gs?.deck ?? 'romantic'];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">

        {/* Age gate modal */}
        {showAgeGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-card max-w-sm w-full p-8 text-center">
              <div className="text-6xl mb-4">🔞</div>
              <h2 className="text-2xl font-bold text-white mb-2">Adults Only</h2>
              <p className="text-gray-400 text-sm mb-6">
                The <span className="font-bold text-rose-400">After Dark</span> deck contains explicit 18+ content for couples.
                Both players must be 18 or older to continue.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowAgeGate(false)}
                  className="flex-1 glass-btn py-3 rounded-xl font-semibold text-gray-300">Cancel</button>
                <button onClick={confirmAge}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-rose-600 to-red-700 hover:scale-105 transition-transform">
                  I am 18+ ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={leaveGame}
            className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition text-sm">
            <ArrowLeft size={18} /> Leave
          </button>
          <div className="text-center">
            <h1 className={`text-xl font-bold bg-gradient-to-r ${deck.color} bg-clip-text text-transparent`}>
              🔥 Truth or Dare
            </h1>
            <p className="text-xs text-gray-500">Room: <span className="text-pink-400 font-bold">{activeRoomId}</span></p>
          </div>
          <button onClick={() => setShowCustom(s => !s)}
            className="glass-btn p-2 rounded-xl text-gray-400">
            <Plus size={18} />
          </button>
        </div>

        {/* Turn indicator */}
        <div className={`text-center py-2 px-4 rounded-full text-sm font-semibold mb-5 ${
          isMyTurn
            ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border border-pink-500/30'
            : 'glass text-gray-400'
        }`}>
          {isMyTurn ? '✨ Your turn — pick Truth or Dare' : "Partner's turn — wait for them…"}
        </div>

        {/* Deck selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(Object.keys(DECKS) as DeckKey[]).map(d => (
            <button key={d} onClick={() => selectDeck(d)}
              className={`relative py-3 rounded-2xl text-sm font-bold transition-all ${
                gs?.deck === d
                  ? `bg-gradient-to-r ${DECKS[d].color} text-white shadow-lg scale-105`
                  : 'glass text-gray-400 hover:scale-105'
              }`}>
              {DECKS[d].label}
              {DECKS[d].adult && !gs?.adultUnlocked && (
                <Lock size={10} className="absolute top-1 right-2 text-rose-400" />
              )}
            </button>
          ))}
        </div>

        {/* Custom card panel */}
        {showCustom && (
          <div className="glass-card p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm">Add Custom Card</h3>
              <button onClick={() => setShowCustom(false)} className="text-gray-400 hover:text-red-400"><X size={16} /></button>
            </div>
            <div className="flex gap-2 mb-3">
              {(['truth', 'dare'] as CardType[]).map(t => (
                <button key={t} onClick={() => setNewCustomType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                    newCustomType === t ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'glass text-gray-400'
                  }`}>{t}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCustomText} onChange={e => setNewCustomText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomCard()}
                placeholder={`Write a custom ${newCustomType}…`}
                className="flex-1 glass border-0 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-400" />
              <button onClick={addCustomCard}
                className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-105 transition-transform">
                Add
              </button>
            </div>
            {(gs?.customTruths?.length > 0 || gs?.customDares?.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1">
                {[
                  ...(gs.customTruths || []).map(t => ({ text: t, type: 'truth' })),
                  ...(gs.customDares  || []).map(d => ({ text: d, type: 'dare'  })),
                ].map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink-900/40 text-pink-300 text-xs">
                    {c.type === 'truth' ? '🧠' : '🎯'} {c.text.slice(0, 25)}{c.text.length > 25 ? '…' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main card */}
        <div className={`glass-card overflow-hidden mb-5 transition-all duration-300 ${
          gs?.flipping ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}>
          {!gs?.currentCard ? (
            <div className="p-12 text-center">
              <div className="text-7xl mb-4">🔥</div>
              <p className="text-gray-400">Draw a card to start</p>
            </div>
          ) : (
            <div className={`p-8 ${deck.bg}`}>
              <div className="flex items-center gap-3 mb-5">
                <span className={`px-4 py-1.5 rounded-full text-white font-bold text-sm bg-gradient-to-r ${deck.color}`}>
                  {gs.currentCard.type === 'truth' ? '🧠 TRUTH' : '🎯 DARE'}
                </span>
                <span className="text-xs text-gray-400">{DECKS[gs.currentCard.deck].label}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {gs.currentCard.drawnBy === userEmail ? 'You drew this' : 'Partner drew this'}
                </span>
              </div>
              <p className="text-xl font-bold text-white leading-relaxed">
                {gs.currentCard.text}
              </p>
            </div>
          )}
        </div>

        {/* Draw buttons */}
        <div className={`grid grid-cols-3 gap-3 mb-5 transition-opacity ${
          isMyTurn ? 'opacity-100' : 'opacity-30 pointer-events-none'
        }`}>
          <button onClick={() => drawCard('truth')}
            className="flex flex-col items-center gap-1 glass-btn py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all">
            <span className="text-2xl">🧠</span>
            <span className="text-sm font-bold text-gray-300">Truth</span>
          </button>
          <button onClick={() => drawCard()}
            className={`flex flex-col items-center gap-1 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all bg-gradient-to-r ${deck.color} text-white shadow-lg`}>
            <Shuffle size={22} />
            <span className="text-sm font-bold">Random</span>
          </button>
          <button onClick={() => drawCard('dare')}
            className="flex flex-col items-center gap-1 glass-btn py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all">
            <span className="text-2xl">🎯</span>
            <span className="text-sm font-bold text-gray-300">Dare</span>
          </button>
        </div>

        {/* History */}
        {gs?.history && gs.history.length > 1 && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-3">Card History</h3>
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {gs.history.slice(1).map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-white text-xs font-bold bg-gradient-to-r ${DECKS[h.deck].color}`}>
                    {h.type === 'truth' ? '🧠' : '🎯'}
                  </span>
                  <span className="text-gray-400 line-clamp-2">{h.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
