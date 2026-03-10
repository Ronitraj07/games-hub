import React, { useState, useCallback } from 'react';
import { ArrowLeft, Plus, X, Shuffle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─────────────────── Card Decks ───────────────────
const DECKS = {
  sweet: {
    label: '🌸 Sweet',
    color: 'from-pink-400 to-rose-400',
    bg:    'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    adult: false,
    truths: [
      'What is your happiest memory with me?',
      'What is the nicest thing I have ever done for you?',
      'When did you first realize you had feelings for me?',
      'What song reminds you of us?',
      'What is your favourite thing about our relationship?',
      'What is a small thing I do that makes you smile?',
      'What is your dream date with me?',
      'What is something you have always wanted to tell me but never have?',
      'What is your favourite nickname for me?',
      'If you could relive one moment with me, which would it be?',
      'What is the most romantic thing I have ever done?',
      'What does love mean to you?',
    ],
    dares: [
      'Give me the longest hug you can.',
      'Write me a 3-sentence love note and read it aloud.',
      'Tell me 5 things you love about me in under 30 seconds.',
      'Recreate our first meeting in 30 seconds.',
      'Sing one line of our favourite song to me.',
      'Give me a forehead kiss.',
      'Hold my hand and tell me one thing you appreciate about me.',
      'Do your best impression of how I walk.',
      'Draw a quick portrait of me and show it.',
      'Write "I love you" on my hand.',
    ],
  },
  spicy: {
    label: '🌶️ Spicy',
    color: 'from-orange-500 to-red-500',
    bg:    'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
    adult: false,
    truths: [
      'What is your biggest secret that I do not know?',
      'Have you ever lied to me and regretted it?',
      'What is something you are embarrassed to admit you like?',
      'Who do you think is the better kisser — me or your ex?',
      'Have you ever stalked my social media?',
      'What is one thing you would change about our relationship?',
      'Have you ever had feelings for one of my friends?',
      'What is your most controversial opinion about us?',
      'What is the weirdest dream you have had about me?',
      'Have you ever gone through my phone? What did you find?',
    ],
    dares: [
      'Send the last photo in your camera roll right now.',
      'Show me the last 5 messages you sent someone.',
      'Let me choose your next social media post caption.',
      'Text your mum something I choose right now.',
      'Do 10 push-ups while I sit on your back.',
      'Let me style your hair any way I want for the rest of the game.',
      'Speak only in a whisper for the next 3 rounds.',
      'Let me go through your search history for 60 seconds.',
      'Do your best "sexy walk" across the room.',
      'Let me draw a small tattoo design on your arm.',
    ],
  },
  funny: {
    label: '🤣 Funny',
    color: 'from-yellow-400 to-orange-400',
    bg:    'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    adult: false,
    truths: [
      'What is the most embarrassing thing that has happened to you in front of me?',
      'What animal do I remind you of and why?',
      'Have you ever farted and blamed it on someone else when with me?',
      'What is the weirdest food you actually enjoy?',
      'What is your most embarrassing childhood memory?',
      'Have you ever walked into a glass door or wall?',
      'What is the dumbest thing you have ever done?',
      'Have you ever accidentally called a teacher "Mum"?',
      'What is the most ridiculous reason you have ever cried?',
      'What is a habit of yours that even you find weird?',
    ],
    dares: [
      'Do your best robot dance for 30 seconds.',
      'Speak in an accent of my choice for the next 3 rounds.',
      'Let me tickle you for 10 seconds without laughing.',
      'Try to lick your elbow for 10 seconds.',
      'Do 10 star jumps while singing "Twinkle Twinkle Little Star".',
      'Narrate everything you do for the next 2 minutes like a nature documentary.',
      'Make the ugliest face you can and hold it for 30 seconds.',
      'Text a friend saying "I just saw a unicorn" and wait for their reply.',
      'Walk to the fridge and back while pretending to be a catwalk model.',
      'Let me write anything I want on your forehead with my finger (invisible ink).',
    ],
  },
  challenge: {
    label: '🏆 Challenge',
    color: 'from-purple-500 to-indigo-500',
    bg:    'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    adult: false,
    truths: [
      'What is one goal you have been secretly working towards?',
      'What is something you wish I understood better about you?',
      'What is your biggest fear in our relationship?',
      'What is something you have always wanted to try with me?',
      'If you had one wish for our future, what would it be?',
      'What is a promise you are willing to make to me right now?',
      'What is one habit of yours you want to change?',
      'What is something you are proud of yourself for?',
      'If we could travel anywhere together, where and why?',
      'What is the bravest thing you have ever done?',
    ],
    dares: [
      'Do not use your phone for the next hour.',
      'Cook or order my favourite meal for our next date.',
      'Plan a surprise mini-date for me within the next week.',
      'Write a list of 10 reasons you love me and share it.',
      'Learn one line of my favourite song and perform it.',
      'Give me a 5-minute back massage right now.',
      'Take a photo of us together right now and set it as your wallpaper.',
      'For the rest of the game, you must compliment me every 5 minutes.',
      'Write me a poem with at least 4 lines right now.',
      'Give me control of the TV/music for the rest of the evening.',
    ],
  },
  adult: {
    label: '🔞 After Dark',
    color: 'from-rose-600 to-red-700',
    bg:    'bg-gradient-to-br from-rose-950/40 to-red-950/40 dark:from-rose-950/60 dark:to-red-950/60',
    adult: true,
    truths: [
      'What is your favourite thing about our intimate life?',
      'What is one fantasy you have never told me about?',
      'Where is your favourite place to be kissed?',
      'What is one thing you want me to do more of in the bedroom?',
      'What is the most turned on you have ever been because of something I did?',
      'What outfit of mine drives you the most crazy?',
      'What is something new you would like us to try together?',
      'What is your all-time favourite intimate memory of us?',
      'What is your biggest turn-on that I might not know about?',
      'If you could design our perfect intimate evening, what would it look like?',
      'What body part of mine do you find most attractive?',
      'What is something you have always wanted to say to me in the moment but held back?',
      'What is the most seductive thing I have ever done without knowing it?',
      'Have you ever thought about me at an inappropriate time? When?',
      'What is one word that best describes our chemistry?',
      'What is something you secretly love that I do during a kiss?',
      'If we had the house completely to ourselves for 24 hours, what would you plan?',
      'What is one thing about your body you want me to appreciate more?',
    ],
    dares: [
      'Give me the most passionate kiss you can right now.',
      'Whisper the most attractive thing about me into my ear.',
      'Give me a 3-minute shoulder and neck massage.',
      'Look into my eyes without laughing or looking away for 60 seconds.',
      'Describe in detail what you find most physically attractive about me.',
      'Send me a flirty text right now as if we just met.',
      'Let me blindfold you with a scarf for 2 minutes — I choose what happens.',
      'Kiss me somewhere unexpected (not the lips).',
      'Act out what you would do if you were trying to seduce me from scratch.',
      'Slow dance with me for one full song with no phones.',
      'Whisper something you have always wanted to do with me.',
      'Feed me something sweet without using your hands.',
      'Let me choose a compliment you have to say to me with full eye contact.',
      'Take a photo of just us right now and set it as your lock screen.',
      'Tell me exactly what you are thinking about me right now — no filter.',
      'Let me trace a shape on your back with my finger and guess what it is.',
      'Give me a kiss that lasts at least 10 seconds.',
      'Tell me the hottest dream you have ever had about me.',
    ],
  },
} as const;

type DeckKey = keyof typeof DECKS;
type CardType = 'truth' | 'dare';

interface Card { type: CardType; text: string; deck: DeckKey; }

const pickRandom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const TruthOrDare: React.FC = () => {
  const [activeDeck,   setActiveDeck]   = useState<DeckKey>('sweet');
  const [card,         setCard]         = useState<Card | null>(null);
  const [flipping,     setFlipping]     = useState(false);
  const [history,      setHistory]      = useState<Card[]>([]);
  const [showCustom,   setShowCustom]   = useState(false);
  const [customTruths, setCustomTruths] = useState<string[]>([]);
  const [customDares,  setCustomDares]  = useState<string[]>([]);
  const [newCustom,    setNewCustom]    = useState('');
  const [customType,   setCustomType]   = useState<CardType>('truth');
  // Age-gate state
  const [adultUnlocked, setAdultUnlocked] = useState(false);
  const [showAgeGate,   setShowAgeGate]   = useState(false);

  const handleDeckSelect = (d: DeckKey) => {
    if (DECKS[d].adult && !adultUnlocked) {
      setShowAgeGate(true);
      return;
    }
    setActiveDeck(d);
    setCard(null);
  };

  const confirmAge = () => {
    setAdultUnlocked(true);
    setShowAgeGate(false);
    setActiveDeck('adult');
    setCard(null);
  };

  const drawCard = useCallback((type?: CardType) => {
    if (flipping) return;
    setFlipping(true);
    const t: CardType = type ?? (Math.random() > .5 ? 'truth' : 'dare');
    const deck = DECKS[activeDeck];
    const pool = [
      ...deck[t === 'truth' ? 'truths' : 'dares'],
      ...(t === 'truth' ? customTruths : customDares),
    ];
    const text = pickRandom(pool);
    setTimeout(() => {
      const c: Card = { type: t, text, deck: activeDeck };
      setCard(c);
      setHistory(h => [c, ...h].slice(0, 20));
      setFlipping(false);
    }, 350);
  }, [flipping, activeDeck, customTruths, customDares]);

  const addCustomCard = () => {
    if (!newCustom.trim()) return;
    if (customType === 'truth') setCustomTruths(t => [...t, newCustom.trim()]);
    else                        setCustomDares(d  => [...d, newCustom.trim()]);
    setNewCustom('');
  };

  const deck = DECKS[activeDeck];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">

        {/* Age-gate modal */}
        {showAgeGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-card max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200">
              <div className="text-6xl mb-4">🔞</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Adults Only</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                The <span className="font-bold text-rose-500">After Dark</span> deck contains mature content intended for couples aged 18+.
                By continuing you confirm that both players are 18 or older.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAgeGate(false)}
                  className="flex-1 glass-btn py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-300">
                  Cancel
                </button>
                <button
                  onClick={confirmAge}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-rose-600 to-red-700 shadow-lg hover:scale-105 transition-transform">
                  I am 18+ ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20}/> Back
          </Link>
          <h1 className={`text-2xl font-bold bg-gradient-to-r ${deck.color} bg-clip-text text-transparent`}>
            🔥 Truth or Dare
          </h1>
          <button onClick={() => setShowCustom(s => !s)}
            className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400">
            <Plus size={20}/>
          </button>
        </div>

        {/* Deck selector */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {(Object.keys(DECKS) as DeckKey[]).map(d => (
            <button key={d} onClick={() => handleDeckSelect(d)}
              className={`relative py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeDeck === d
                  ? `bg-gradient-to-r ${DECKS[d].color} text-white shadow-md scale-105`
                  : 'glass text-gray-600 dark:text-gray-400 hover:scale-105'
              }`}>
              {DECKS[d].label.split(' ').slice(0,1)}
              {DECKS[d].adult && !adultUnlocked && (
                <span className="absolute -top-1 -right-1">
                  <Lock size={10} className="text-rose-400"/>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Custom card panel */}
        {showCustom && (
          <div className="glass-card p-4 mb-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Add Custom Card</h3>
              <button onClick={() => setShowCustom(false)} className="text-gray-400 hover:text-red-500 transition"><X size={16}/></button>
            </div>
            <div className="flex gap-2 mb-3">
              {(['truth','dare'] as CardType[]).map(t => (
                <button key={t} onClick={() => setCustomType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                    customType===t?'bg-gradient-to-r from-pink-500 to-purple-500 text-white':'glass text-gray-500'
                  }`}>{t}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCustom} onChange={e=>setNewCustom(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addCustomCard()}
                placeholder={`Write a ${customType}…`}
                className="flex-1 glass border-0 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"/>
              <button onClick={addCustomCard}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold px-4 py-2 rounded-xl transition hover:scale-105">
                Add
              </button>
            </div>
            {(customTruths.length > 0 || customDares.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1">
                {[...customTruths.map(t=>({text:t,type:'truth'})),...customDares.map(d=>({text:d,type:'dare'}))]
                  .map((c,i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-xs">
                      {c.type==='truth'?'🧠':'🎯'} {c.text.slice(0,25)}{c.text.length>25?'…':''}
                    </span>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Main card */}
        <div className={`glass-card overflow-hidden transition-all duration-300 mb-6 ${
          flipping ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}>
          {!card ? (
            <div className="p-12 text-center">
              <div className="text-7xl mb-6">🔥</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">Ready to play?</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Pick Truth or Dare below</p>
            </div>
          ) : (
            <div className={`p-8 ${deck.bg}`}>
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-4 py-1.5 rounded-full text-white font-bold text-sm bg-gradient-to-r ${deck.color}`}>
                  {card.type === 'truth' ? '🧠 TRUTH' : '🎯 DARE'}
                </span>
                <span className="text-xs text-gray-400">{DECKS[card.deck].label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {card.text}
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={() => drawCard('truth')}
            className="flex flex-col items-center gap-1 glass-btn py-4 rounded-2xl transition-all hover:scale-105 active:scale-95">
            <span className="text-2xl">🧠</span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Truth</span>
          </button>
          <button onClick={() => drawCard()}
            className={`flex flex-col items-center gap-1 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 bg-gradient-to-r ${deck.color} text-white shadow-lg`}>
            <Shuffle size={22}/>
            <span className="text-sm font-bold">Random</span>
          </button>
          <button onClick={() => drawCard('dare')}
            className="flex flex-col items-center gap-1 glass-btn py-4 rounded-2xl transition-all hover:scale-105 active:scale-95">
            <span className="text-2xl">🎯</span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Dare</span>
          </button>
        </div>

        {/* History */}
        {history.length > 1 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Previous Cards</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.slice(1).map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-white text-xs font-bold bg-gradient-to-r ${DECKS[h.deck].color}`}>
                    {h.type === 'truth' ? '🧠' : '🎯'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 line-clamp-2">{h.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
