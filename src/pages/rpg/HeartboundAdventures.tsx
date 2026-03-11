import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHeartboundPresence } from '@/hooks/firebase/useHeartboundSync';
import { MeadowHaven3D } from '@/components/heavy-games/heartbound/MeadowHaven3D';
import { getDisplayNameFromEmail } from '@/lib/auth-config';
import {
  Heart, Map, Home as HomeIcon, Users, Sparkles, Lock,
  ArrowLeft, Star, ChevronRight, Wifi, WifiOff,
} from 'lucide-react';

const SPRITE_COLOR: Record<string, string> = {
  'sinharonitraj@gmail.com':      '#60a5fa',
  'radhikadidwania567@gmail.com': '#f472b6',
  'shizzandsparkles@gmail.com':   '#a78bfa',
};

const ISLANDS = [
  { name: 'Meadow Haven',    emoji: '🌿', desc: 'A sun-drenched starting island with wildflowers, friendly deer, and your first shared home.',  unlockLevel: 1,  status: 'available' },
  { name: 'Starlight Shore', emoji: '🌊', desc: 'Glittering beaches where bioluminescent creatures emerge at night.',                             unlockLevel: 10, status: 'locked' },
  { name: 'Ember Peak',      emoji: '🌋', desc: 'A dormant volcano island home to fire-foxes and ancient ruins.',                                unlockLevel: 20, status: 'locked' },
  { name: 'Frosted Hollow',  emoji: '❄️', desc: 'An eternal winter wonderland with ice castles and snow spirits.',                               unlockLevel: 35, status: 'locked' },
  { name: 'Canopy City',     emoji: '🌳', desc: 'A giant treehouse civilization hidden in an ancient forest.',                                   unlockLevel: 50, status: 'locked' },
  { name: 'Cloud Citadel',   emoji: '⛅', desc: 'Floating islands above the clouds, reachable only at Bond Level 60.',                          unlockLevel: 60, status: 'locked' },
  { name: 'Coral Kingdom',   emoji: '🐠', desc: 'An underwater paradise with sunken treasure and sea dragons.',                                  unlockLevel: 75, status: 'locked' },
  { name: 'Crystal Caves',   emoji: '💎', desc: 'The legendary final island — a glowing crystal cavern hiding the greatest secret.',             unlockLevel: 90, status: 'locked' },
];

const BOND_MILESTONES = [
  { level: 1,   label: 'Wanderers',    perk: 'Access Meadow Haven',              emoji: '🌱' },
  { level: 10,  label: 'Companions',   perk: 'Unlock home customization',        emoji: '🏡' },
  { level: 25,  label: 'Partners',     perk: 'Shared inventory & gifting',       emoji: '🎁' },
  { level: 50,  label: 'Soulmates',    perk: 'Rare creatures can be befriended', emoji: '🦋' },
  { level: 75,  label: 'Heartbound',   perk: 'Cloud Citadel + secret quests',    emoji: '⛅' },
  { level: 100, label: 'Eternal Pair', perk: 'Crystal Caves & true ending',      emoji: '💎' },
];

type View = 'hub' | 'meadow';

export const HeartboundAdventures: React.FC = () => {
  const { user }  = useAuth();
  const myEmail   = user?.email ?? '';
  const myColor   = SPRITE_COLOR[myEmail] ?? '#a78bfa';
  const meadowRef = useRef<HTMLDivElement>(null);

  const [view,         setView]         = useState<View>('hub');
  const [activeIsland, setActiveIsland] = useState(0);
  const [bondXP,       setBondXP]       = useState(0);
  const [flowerCount,  setFlowerCount]  = useState(0);

  const allPlayers     = useHeartboundPresence();
  const partnerPlayers = allPlayers.filter(p => p.email !== myEmail);

  const handleCollect = useCallback((total: number) => setFlowerCount(total), []);
  const handleBondXP  = useCallback((xp: number) => setBondXP(prev => Math.min(100, prev + xp)), []);

  // Enter meadow: switch view AND request fullscreen (user gesture = button click)
  const enterMeadow = useCallback(() => {
    setView('meadow');
    // Small timeout so the meadow div mounts first
    setTimeout(() => {
      const el = document.querySelector('[data-meadow-container]') as HTMLElement | null;
      if (el && !document.fullscreenElement) {
        el.requestFullscreen().catch(() => {});
      }
    }, 150);
  }, []);

  // ── MEADOW VIEW ───────────────────────────────────────────────────
  if (view === 'meadow') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌿</span>
            <span className="text-white font-bold text-sm">Meadow Haven</span>
            {partnerPlayers.filter(p => p.online).map(p => (
              <span key={p.email} className="flex items-center gap-1 bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full border border-green-500/30">
                <Wifi size={10} /> {p.name} is here
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span>🌸 {flowerCount} flowers</span>
            <span>💕 {bondXP} XP</span>
          </div>
        </div>
        <div className="flex-1" data-meadow-container>
          <MeadowHaven3D
            myColor={myColor}
            onBack={() => setView('hub')}
            bondXP={bondXP}
            onCollect={handleCollect}
            onBondXP={handleBondXP}
          />
        </div>
      </div>
    );
  }

  // ── HUB VIEW ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 dark:from-pink-950 dark:via-rose-950 dark:to-purple-950">

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link to="/rpg" className="inline-flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 transition font-medium">
          <ArrowLeft size={18} /> Back to RPG Hub
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <div className="text-8xl mb-4 inline-block animate-bounce">🌸</div>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 bg-clip-text text-transparent mb-4">
          Heartbound Adventures
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          A cozy 3D co-op RPG. Explore magical islands, meet friendly NPCs, collect flowers, and grow your Bond from 1 to 100.
        </p>

        {partnerPlayers.length > 0 && (
          <div className="max-w-sm mx-auto mb-6">
            {partnerPlayers.map(p => (
              <div key={p.email} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-medium ${
                p.online
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500'
              }`}>
                <span className="text-xl" style={{ color: SPRITE_COLOR[p.email] }}>●</span>
                <span className="flex-1 text-left">
                  <span className="font-bold">{p.name}</span>
                  <span className="ml-2 font-normal opacity-70">
                    {p.online ? 'is in Meadow Haven right now!' : 'is offline'}
                  </span>
                </span>
                {p.online ? <Wifi size={14} /> : <WifiOff size={14} className="opacity-40" />}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-3">
          <button
            onClick={enterMeadow}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-xl hover:shadow-pink-300/50 hover:scale-105 transition-all"
          >
            <Heart size={20} fill="currentColor" /> Enter Meadow Haven 🌿
          </button>
        </div>
        <p className="text-sm text-gray-400">
          {partnerPlayers.some(p => p.online)
            ? `💕 ${partnerPlayers.find(p => p.online)?.name} is already inside — join them!`
            : 'Enter anytime — your partner will see you when they join 🌿'
          }
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md">
          <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-lg">🐾 Meadow Haven Residents</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { e: '🦌', n: 'Sunny the Deer',   x: '+8 Bond XP' },
              { e: '🧚', n: 'Luna the Fairy',   x: '+10 Bond XP' },
              { e: '🐇', n: 'Pebble the Bunny', x: '+5 Bond XP' },
              { e: '🦉', n: 'Sage the Owl',     x: '+6 Bond XP' },
            ].map(r => (
              <div key={r.n} className="flex flex-col items-center gap-1 p-3 bg-pink-50 dark:bg-pink-950/30 rounded-xl">
                <span className="text-3xl">{r.e}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{r.n}</span>
                <span className="text-xs text-pink-500 font-medium">{r.x}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Walk close and press <kbd className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">E</kbd> to talk
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">Core Pillars</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Map size={24} className="text-white" />,               color: 'from-pink-500 to-rose-500',     title: '8 Magical Islands',  desc: 'From Meadow Haven to Crystal Caves, each island has unique biomes, creatures, and secrets.' },
            { icon: <HomeIcon size={24} className="text-white" />,           color: 'from-purple-500 to-violet-500', title: 'Dream Home Builder', desc: 'Decorate your shared home with furniture discovered on your adventures.' },
            { icon: <Heart size={24} className="text-white" fill="white" />, color: 'from-rose-500 to-pink-600',    title: 'Bond Level 1–100',   desc: 'Earn relationship XP together. Higher Bond unlocks new islands and abilities.' },
            { icon: <Users size={24} className="text-white" />,              color: 'from-violet-500 to-purple-600',title: 'Pure Co-op',          desc: 'No combat. Just 3D exploration, discovery, and building memories together.' },
          ].map(p => (
            <div key={p.title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>{p.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">🗺️ Island Explorer</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10">8 unique worlds to discover as your Bond grows</p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {ISLANDS.map((island, i) => (
              <button key={island.name} onClick={() => setActiveIsland(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  activeIsland === i
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>
                {island.emoji} {island.name}
                {island.status === 'locked' && <Lock size={11} className="opacity-60" />}
              </button>
            ))}
          </div>
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-2xl p-8 shadow-xl border border-pink-200 dark:border-pink-800 text-center">
            <div className="text-7xl mb-4">{ISLANDS[activeIsland].emoji}</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{ISLANDS[activeIsland].name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{ISLANDS[activeIsland].desc}</p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              ISLANDS[activeIsland].unlockLevel === 1
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              {ISLANDS[activeIsland].unlockLevel === 1
                ? <><Star size={14} fill="currentColor" /> Playable Now!</>
                : <><Lock size={14} /> Unlocks at Bond Level {ISLANDS[activeIsland].unlockLevel}</>
              }
            </div>
            {activeIsland === 0 && (
              <button onClick={enterMeadow}
                className="mt-5 block w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition">
                🌿 Enter Meadow Haven (3D)
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">💕 Bond Level Milestones</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Grow together from Wanderers to Eternal Pair</p>
        <div className="space-y-4">
          {BOND_MILESTONES.map((m, i) => (
            <div key={m.level} className="flex items-center gap-6 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex flex-col items-center justify-center shadow-lg">
                <span className="text-xl">{m.emoji}</span>
                <span className="text-white text-xs font-bold">Lv.{m.level}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{m.label}</span>
                  {i === 0 && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>}
                  {i === BOND_MILESTONES.length - 1 && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-2 py-0.5 rounded-full">True Ending</span>}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <ChevronRight size={14} className="text-pink-400" />{m.perk}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-pink-500 to-purple-600 py-12">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10 text-white">
          <div>
            <div className="flex items-center gap-2 mb-4"><Sparkles size={20} /><h3 className="text-xl font-bold">Inspired By</h3></div>
            <div className="space-y-3">
              {[
                { g: '🌅 Sky: Children of the Light', d: 'Emotional co-op connection and atmospheric 3D exploration' },
                { g: '🏔️ Minecraft', d: 'Shared world exploration and building' },
                { g: '🏡 Animal Crossing', d: 'Cozy 3D customization and life sim vibes' },
              ].map(x => (
                <div key={x.g} className="bg-white/10 rounded-xl p-4">
                  <p className="font-semibold">{x.g}</p><p className="text-sm text-pink-100">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">🗓️ Development Roadmap</h3>
            <div className="space-y-3">
              {[
                { phase: '✓', title: 'Phase 7A: Controls + Menu (Live!)', desc: 'Fixed controls, auto-fullscreen, in-game menu (Inventory / Profile / Controls / Settings)', done: true },
                { phase: '2', title: 'Phase 7C: Realistic 3D World',      desc: 'PBR terrain, real trees, animated pond, firefly particles, Environment map', done: false },
                { phase: '3', title: 'Phase 7D: Audio Atmosphere',         desc: 'Ambient meadow loop, footsteps, NPC chimes, flower collect sound', done: false },
              ].map(s => (
                <div key={s.phase} className={`rounded-xl p-4 flex items-start gap-4 ${s.done ? 'bg-white/20' : 'bg-white/10'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    s.done ? 'bg-yellow-400 text-gray-900' : 'bg-white/20 text-white'
                  }`}>{s.phase}</div>
                  <div><p className="font-semibold">{s.title}</p><p className="text-sm text-pink-100">{s.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-12 px-4">
        <Link to="/rpg" className="inline-flex items-center gap-2 text-pink-500 dark:text-pink-400 hover:text-pink-600 font-semibold transition">
          <ArrowLeft size={16} /> Back to RPG Hub
        </Link>
      </div>
    </div>
  );
};
