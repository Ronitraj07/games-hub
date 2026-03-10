import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, ArrowRight, Sparkles, Clock } from 'lucide-react';

export const RPGHub: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 py-24 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-pink-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="text-7xl mb-6">🎮</div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            RPG Adventures
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Two epic experiences crafted exclusively for couples — explore magical worlds or unravel dark mysteries together.
          </p>
        </div>
      </div>

      {/* Game Cards */}
      <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10">

        {/* Heartbound Adventures */}
        <div className="group relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border border-pink-200 dark:border-pink-800 flex flex-col">
          {/* Card top accent */}
          <div className="h-2 bg-gradient-to-r from-pink-400 to-purple-500" />
          <div className="p-8 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🌸</div>
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-full">
                <Clock size={12} /> Beta: Q3 2026
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Heartbound Adventures</h2>
            <p className="text-pink-600 dark:text-pink-300 font-medium mb-4">Cozy Co-op Romantic RPG</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Explore 8 magical islands together, build your dream home, and grow your Bond Level from 1 to 100. No combat — just exploration, discovery, and love.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['🗺️ 8 Islands', '🏡 Home Building', '💕 Bond Level 1–100', '🌿 No Combat'].map(f => (
                <span key={f} className="text-xs bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 px-3 py-1 rounded-full font-medium">{f}</span>
              ))}
            </div>

            {/* Inspired by */}
            <div className="text-xs text-gray-500 dark:text-gray-500 mb-6">
              Inspired by: Sky: Children of the Light · Minecraft · Animal Crossing
            </div>

            <Link
              to="/rpg/heartbound"
              className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-pink-200/50 dark:shadow-pink-900/30"
            >
              <Heart size={18} fill="currentColor" />
              View Game Details
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Mystery Partners */}
        <div className="group relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-gray-900 to-indigo-950 border border-indigo-700/40 flex flex-col">
          {/* Card top accent */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
          <div className="p-8 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🔍</div>
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-yellow-900/40 text-yellow-300 px-3 py-1.5 rounded-full">
                <Clock size={12} /> Beta: Q4 2026
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Mystery Partners</h2>
            <p className="text-indigo-300 font-medium mb-4">Co-op Noir Detective Adventure</p>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Crack 10+ thrilling cases in 1940s noir streets. One of you interrogates suspects, the other analyzes evidence — the truth only emerges when you work together.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['🕵️ 10+ Cases', '🔎 Evidence Board', '🎭 Split Roles', '🎷 Noir Atmosphere'].map(f => (
                <span key={f} className="text-xs bg-indigo-900/60 text-indigo-300 px-3 py-1 rounded-full font-medium border border-indigo-700/40">{f}</span>
              ))}
            </div>

            {/* Inspired by */}
            <div className="text-xs text-gray-600 mb-6">
              Inspired by: Ace Attorney · Her Story · Return of the Obra Dinn
            </div>

            <Link
              to="/rpg/mystery"
              className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold hover:from-indigo-700 hover:to-purple-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-900/50"
            >
              <Search size={18} />
              View Game Details
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="text-center pb-16 px-4">
        <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Sparkles size={16} className="text-pink-400" />
          <span className="text-sm">Both games are built exclusively for couples — only your two accounts can play together.</span>
          <Sparkles size={16} className="text-indigo-400" />
        </div>
      </div>
    </div>
  );
};
