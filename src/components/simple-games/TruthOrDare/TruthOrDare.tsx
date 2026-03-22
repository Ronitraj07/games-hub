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

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [inGame, setInGame] = useState(false);
  const seededRef = useRef(false);

  const [showAgeGate,   setShowAgeGate]   = useState(false);
  const [showCustom,    setShowCustom]    = useState(false);
  const [newCustomText, setNewCustomText] = useState('');
  const [newCustomType, setNewCustomType] = useState<CardType>('truth');

  const safeRoom = activeRoomId
    ? `tod-room-${sanitizeFirebasePath(activeRoomId)}`
    : 'tod-placeholder';

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

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room = params.get('room');
    if (room && !activeRoomId) {
      setActiveRoomId(room.toUpperCase());
      setIsHost(false);
      setInGame(true);
    }
  }, [location.search, activeRoomId]);

  React.useEffect(() => {
    if (!activeRoomId || isHost || !gs) return;
    if (gs.player1 === userEmail) return;
    if (gs.player2) return;
    updateGameState({ ...gs, player2: userEmail, status: 'active' });
  }, [activeRoomId, isHost, gs?.player1, gs?.player2, gs?.status]);

  React.useEffect(() => {
    if (!isHost || !gs) return;
    if (gs.player2 && gs.status === 'lobby') {
      updateGameState({ ...gs, status: 'active' });
    }
  }, [gs?.player2, gs?.status]);

  const handleStartVsPartner = (roomId: string, hostFlag: boolean) => {
    setActiveRoomId(roomId);
    setIsHost(hostFlag);
    setInGame(true);
    seededRef.current = false;
  };

  React.useEffect(() => {
    if (!activeRoomId || !isHost || seededRef.current) return;
    seededRef.current = true;
    updateGameState(makeInitialState(userEmail));
  }, [activeRoomId, isHost, safeRoom]);

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

    // Update state to show card with flip animation
    const flippingState = { ...gs, flipping: true, currentCard: card, history: newHistory };
    updateGameState(flippingState);

    // After animation, update turn (without spreading gs to avoid stale state overwrite)
    setTimeout(() => {
      updateGameState({
        ...flippingState,
        flipping: false,
        currentTurn: nextTurn,
      });
    }, 400);
  }, [gs, isMyTurn, amPlayer1, userEmail]);

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
    setActiveRoomId(null); setIsHost(false); setInGame(false); seededRef.current = false;
  };

  // ─── LOBBY ───
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

  // ─── WAITING ───
  if (isHost && !partnerJoined) return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-sm w-full p-10 text-center">
        <div className="text-6xl mb-4 animate-pulse">⏳</div>
        <h2 className="text-xl font-bold text-white mb-2">Room Created!</h2>
        <p className="text-gray-400 text-sm mb-6">Waiting for partner to join…</p>
        <div className="glass rounded-2xl px-6 py-4 mb-4">
          <p className="text-4xl font-black tracking-widest text-pink-400">{activeRoomId}</p>
        </div>
        <button onClick={leaveGame} className="text-sm text-gray-500 hover:text-red-400 transition mt-4">← Leave room</button>
      </div>
    </div>
  );

  // ─── ACTIVE GAME ───
  const deck = DECKS[gs?.deck ?? 'romantic'];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-3">

          {/* Age gate modal */}
          {showAgeGate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="glass-card max-w-sm w-full p-8 text-center">
                <div className="text-6xl mb-4">🔞</div>
                <h2 className="text-2xl font-bold text-white mb-2">Adults Only</h2>
                <p className="text-gray-400 text-sm mb-6">
                  The <span className="font-bold text-rose-400">After Dark</span> deck contains explicit 18+ content.
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
          <div className="flex items-center justify-between mb-3">
            <button onClick={leaveGame}
              className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition text-sm">
              <ArrowLeft size={18} /> Leave
            </button>
            <div className="text-center">
              <h1 className={`text-lg font-bold bg-gradient-to-r ${deck.color} bg-clip-text text-transparent`}>
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
          <div className={`text-center py-1.5 px-4 rounded-full text-sm font-semibold mb-3 ${
            isMyTurn
              ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border border-pink-500/30'
              : 'glass text-gray-400'
          }`}>
            {isMyTurn ? '✨ Your turn — pick Truth or Dare' : "Partner's turn — wait for them…"}
          </div>

          {/* Deck selector */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {(Object.keys(DECKS) as DeckKey[]).map(d => (
              <button key={d} onClick={() => selectDeck(d)}
                className={`relative py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  gs?.deck === d
                    ? `bg-gradient-to-r ${DECKS[d].color} text-white shadow-lg`
                    : 'glass text-gray-400 hover:text-white'
                }`}>
                {DECKS[d].adult && !gs?.adultUnlocked && (
                  <Lock size={12} className="inline mr-1" />
                )}
                {DECKS[d].label}
              </button>
            ))}
          </div>

          {/* Current card */}
          <div className={`rounded-3xl p-5 mb-3 text-center transition-all ${
            gs?.currentCard
              ? gs.currentCard.type === 'truth'
                ? 'bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border border-blue-500/20'
                : 'bg-gradient-to-br from-orange-950/60 to-red-950/60 border border-orange-500/20'
              : 'glass'
          } ${gs?.flipping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {gs?.currentCard ? (
              <>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                  gs.currentCard.type === 'truth'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-orange-500/20 text-orange-300'
                }`}>
                  {gs.currentCard.type === 'truth' ? '💡 TRUTH' : '🔥 DARE'}
                </span>
                <p className="text-white text-base font-medium leading-relaxed">{gs.currentCard.text}</p>
              </>
            ) : (
              <div className="py-4">
                <div className="text-4xl mb-2">🂴</div>
                <p className="text-gray-500 text-sm">Draw a card to start!</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button onClick={() => drawCard('truth')} disabled={!isMyTurn}
              className="py-3 rounded-2xl font-bold text-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
              💡 Truth
            </button>
            <button onClick={() => drawCard()} disabled={!isMyTurn}
              className="py-3 rounded-2xl font-bold text-sm bg-gradient-to-br from-purple-600 to-pink-600 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
              🎴 Random
            </button>
            <button onClick={() => drawCard('dare')} disabled={!isMyTurn}
              className="py-3 rounded-2xl font-bold text-sm bg-gradient-to-br from-orange-500 to-red-600 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
              🔥 Dare
            </button>
          </div>

          {/* Custom card panel */}
          {showCustom && (
            <div className="glass-card p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm">Add Custom Card</h3>
                <button onClick={() => setShowCustom(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
              </div>
              <div className="flex gap-2 mb-3">
                {(['truth','dare'] as CardType[]).map(t => (
                  <button key={t} onClick={() => setNewCustomType(t)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      newCustomType === t ? 'bg-pink-500 text-white' : 'glass text-gray-400'
                    }`}>{t}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newCustomText} onChange={e => setNewCustomText(e.target.value)}
                  placeholder={`Enter ${newCustomType}…`}
                  className="flex-1 glass border-0 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
                <button onClick={addCustomCard}
                  className="px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition">Add</button>
              </div>
              {(gs?.customTruths?.length || gs?.customDares?.length) ? (
                <div className="mt-3 text-xs text-gray-500">
                  {gs.customTruths.length} custom truths · {gs.customDares.length} custom dares
                </div>
              ) : null}
            </div>
          )}

          {/* History — compact, scrollable */}
          {(gs?.history?.length ?? 0) > 1 && (
            <div className="glass-card p-3">
              <p className="text-xs font-bold text-gray-500 mb-2">📜 Recent Cards</p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {gs!.history.slice(1).map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded font-bold ${
                      c.type === 'truth' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>{c.type}</span>
                    <span className="text-gray-400 line-clamp-1">{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
