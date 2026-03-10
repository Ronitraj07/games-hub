import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Map, Home, Users, Sparkles, Lock, ArrowLeft, Star, ChevronRight } from 'lucide-react';

const ISLANDS = [
  { name: 'Meadow Haven', emoji: '🌿', desc: 'A sun-drenched starting island with wildflowers, friendly deer, and your first shared home.', unlockLevel: 1, status: 'tutorial' },
  { name: 'Starlight Shore', emoji: '🌊', desc: 'Glittering beaches where bioluminescent creatures emerge at night.', unlockLevel: 10, status: 'locked' },
  { name: 'Ember Peak', emoji: '🌋', desc: 'A dormant volcano island home to fire-foxes and ancient ruins.', unlockLevel: 20, status: 'locked' },
  { name: 'Frosted Hollow', emoji: '❄️', desc: 'An eternal winter wonderland with ice castles and snow spirits.', unlockLevel: 35, status: 'locked' },
  { name: 'Canopy City', emoji: '🌳', desc: 'A giant treehouse civilization hidden in an ancient forest.', unlockLevel: 50, status: 'locked' },
  { name: 'Cloud Citadel', emoji: '☁️', desc: 'Floating islands above the clouds, reachable only at Bond Level 60.', unlockLevel: 60, status: 'locked' },
  { name: 'Coral Kingdom', emoji: '🐠', desc: 'An underwater paradise with sunken treasure and sea dragons.', unlockLevel: 75, status: 'locked' },
  { name: 'Crystal Caves', emoji: '💎', desc: 'The legendary final island — a glowing crystal cavern hiding the greatest secret of all.', unlockLevel: 90, status: 'locked' },
];

const BOND_MILESTONES = [
  { level: 1,  label: 'Wanderers',     perk: 'Access Meadow Haven',           emoji: '🌱' },
  { level: 10, label: 'Companions',    perk: 'Unlock home customization',     emoji: '🏡' },
  { level: 25, label: 'Partners',      perk: 'Shared inventory & gifting',    emoji: '🎁' },
  { level: 50, label: 'Soulmates',     perk: 'Rare creatures can be befriended', emoji: '🦋' },
  { level: 75, label: 'Heartbound',    perk: 'Cloud Citadel + secret quests', emoji: '☁️' },
  { level: 100, label: 'Eternal Pair', perk: 'Crystal Caves & true ending',   emoji: '💎' },
];

export const HeartboundAdventures: React.FC = () => {
  const [activeIsland, setActiveIsland] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 dark:from-pink-950 dark:via-rose-950 dark:to-purple-950">

      {/* Back button */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link to="/rpg" className="inline-flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition font-medium">
          <ArrowLeft size={18} /> Back to RPG Hub
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="text-8xl mb-4 inline-block animate-bounce">🌸</div>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 bg-clip-text text-transparent mb-4">
          Heartbound Adventures
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
          A cozy co-op RPG where you and your partner explore magical islands, build a shared home, and grow your bond from 1 to 100.
        </p>
        <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-5 py-2 rounded-full font-semibold">
          <Lock size={15} /> In Development — Beta: Q3 2026
        </div>
      </div>

      {/* 4 Core Pillars */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">Core Pillars</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Map size={24} className="text-white" />, color: 'from-pink-500 to-rose-500', title: '8 Magical Islands', desc: 'From Meadow Haven to Crystal Caves, each island has unique biomes, creatures, and secrets.' },
            { icon: <Home size={24} className="text-white" />, color: 'from-purple-500 to-violet-500', title: 'Dream Home Builder', desc: 'Decorate your shared home with furniture and items discovered on your adventures.' },
            { icon: <Heart size={24} className="text-white" fill="white" />, color: 'from-rose-500 to-pink-600', title: 'Bond Level 1–100', desc: 'Earn relationship XP together. Higher Bond levels unlock new islands and abilities.' },
            { icon: <Users size={24} className="text-white" />, color: 'from-violet-500 to-purple-600', title: 'Pure Co-op', desc: 'No combat, no competition. Just exploration, discovery, and building memories.' },
          ].map(p => (
            <div key={p.title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>{p.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Island Explorer */}
      <div className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">🗺️ Island Explorer</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10">8 unique worlds to discover as your Bond grows</p>

          {/* Island selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {ISLANDS.map((island, i) => (
              <button
                key={island.name}
                onClick={() => setActiveIsland(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  activeIsland === i
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{island.emoji}</span>
                <span>{island.name}</span>
                {island.status === 'locked' && <Lock size={11} className="opacity-60" />}
              </button>
            ))}
          </div>

          {/* Active island card */}
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-2xl p-8 shadow-xl border border-pink-200 dark:border-pink-800 text-center">
            <div className="text-7xl mb-4">{ISLANDS[activeIsland].emoji}</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{ISLANDS[activeIsland].name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{ISLANDS[activeIsland].desc}</p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              ISLANDS[activeIsland].unlockLevel === 1
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              {ISLANDS[activeIsland].unlockLevel === 1 ? (
                <><Star size={14} fill="currentColor" /> Starting Island</>
              ) : (
                <><Lock size={14} /> Unlocks at Bond Level {ISLANDS[activeIsland].unlockLevel}</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bond Level Milestones */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">💕 Bond Level Milestones</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Grow together from Wanderers to Eternal Pair</p>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-pink-300 to-purple-400 dark:from-pink-700 dark:to-purple-700 hidden md:block" style={{left: '2rem'}} />

          <div className="space-y-4">
            {BOND_MILESTONES.map((m, i) => (
              <div key={m.level} className="relative flex items-center gap-6 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow">
                {/* Level bubble */}
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-white text-xs font-bold">Lv.{m.level}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white text-lg">{m.label}</span>
                    {i === 0 && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Starting</span>}
                    {i === BOND_MILESTONES.length - 1 && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">True Ending</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <ChevronRight size={14} className="text-pink-400" />
                    {m.perk}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inspiration + Roadmap */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 py-12">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10 text-white">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} />
              <h3 className="text-xl font-bold">Inspired By</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="font-semibold">🌃 Sky: Children of the Light</p>
                <p className="text-sm text-pink-100">Emotional co-op connection and discovery</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="font-semibold">🏔️ Minecraft</p>
                <p className="text-sm text-pink-100">Shared world exploration and building</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="font-semibold">🏡 Animal Crossing</p>
                <p className="text-sm text-pink-100">Cozy customization and life sim vibes</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">🗓️ Development Roadmap</h3>
            <div className="space-y-3">
              {[
                { phase: '1', title: '3D World Setup', desc: 'React Three Fiber, character models, basic movement', active: true },
                { phase: '2', title: 'First Island', desc: 'Meadow Haven tutorial with basic interactions', active: false },
                { phase: '3', title: 'Core Systems', desc: 'Home building, inventory, bond progression', active: false },
              ].map(step => (
                <div key={step.phase} className={`rounded-xl p-4 flex items-start gap-4 ${ step.active ? 'bg-white/20' : 'bg-white/10'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ step.active ? 'bg-yellow-400 text-gray-900' : 'bg-white/20 text-white'}`}>{step.phase}</div>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-pink-100">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-pink-200 mt-4 text-center">Estimated Beta: Q3 2026</p>
          </div>
        </div>
      </div>

      {/* CTA footer */}
      <div className="text-center py-12 px-4">
        <Link to="/rpg" className="inline-flex items-center gap-2 text-pink-500 dark:text-pink-400 hover:text-pink-600 font-semibold transition">
          <ArrowLeft size={16} /> Back to RPG Hub
        </Link>
      </div>
    </div>
  );
};
