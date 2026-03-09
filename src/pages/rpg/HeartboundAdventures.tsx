import React from 'react';
import { Heart, Map, Home, Users, Sparkles, Lock } from 'lucide-react';

export const HeartboundAdventures: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900 dark:via-purple-900 dark:to-blue-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-6 animate-float">
            <div className="text-8xl">🌸</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-pink-600 dark:text-pink-300 mb-4">
            Heartbound Adventures
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
            A cozy romantic RPG where you explore magical islands together
          </p>
          <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full inline-flex">
            <Lock className="w-5 h-5" />
            <span className="font-semibold">In Development</span>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl animate-slide-in-left">
            <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-4">
              <Map className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              8 Magical Islands
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              From Meadow Haven to Crystal Caves, each island offers unique biomes, creatures to befriend, and secrets to uncover together.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl animate-slide-in-right">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
              <Home className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Build Your Dream Home
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Customize and expand your shared home with furniture, decorations, and features you discover on your adventures.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl animate-slide-in-left">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Bond Level System
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Level up your relationship from 1-100 by completing quests together, unlocking new abilities and island areas as you grow.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl animate-slide-in-right">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Pure Co-op Gameplay
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No combat, no competition. Just exploration, discovery, and building memories together in a peaceful world.
            </p>
          </div>
        </div>

        {/* Inspiration */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white mb-16 animate-scale-in">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6" />
            <h3 className="text-2xl font-bold">Inspired By</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="font-bold mb-1">🌃 Sky: Children of the Light</p>
              <p className="text-sm text-pink-100">Emotional connection and discovery</p>
            </div>
            <div>
              <p className="font-bold mb-1">🏔️ Minecraft</p>
              <p className="text-sm text-pink-100">Exploration and building</p>
            </div>
            <div>
              <p className="font-bold mb-1">🏡 Animal Crossing</p>
              <p className="text-sm text-pink-100">Cozy customization</p>
            </div>
          </div>
        </div>

        {/* Development Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Development Roadmap
          </h3>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold mt-1">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Phase 1: 3D World Setup</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">React Three Fiber, character models, basic movement</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold mt-1">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Phase 2: First Island</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Meadow Haven tutorial island with basic interactions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold mt-1">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Phase 3: Core Systems</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Home building, inventory, bond progression</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Stay tuned for updates on development progress!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Estimated Beta: Q3 2026
          </p>
        </div>
      </div>
    </div>
  );
};