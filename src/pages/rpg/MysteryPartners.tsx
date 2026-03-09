import React from 'react';
import { Search, BookOpen, Users, Fingerprint, Lock, Map } from 'lucide-react';

export const MysteryPartners: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-6 animate-float">
            <div className="text-8xl">🔍</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-indigo-300 mb-4">
            Mystery Partners
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Solve thrilling detective cases together as a crime-solving duo
          </p>
          <div className="flex items-center justify-center gap-2 text-yellow-400 bg-yellow-900/30 px-4 py-2 rounded-full inline-flex">
            <Lock className="w-5 h-5" />
            <span className="font-semibold">In Development</span>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-indigo-500/20 animate-slide-in-left">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              10+ Mystery Cases
            </h3>
            <p className="text-gray-300">
              From missing persons to art heists, each case offers unique challenges, suspects, and twists to unravel together.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-purple-500/20 animate-slide-in-right">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Evidence Collection
            </h3>
            <p className="text-gray-300">
              Gather clues, analyze evidence, and piece together the truth using your detective board and deduction skills.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-blue-500/20 animate-slide-in-left">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Detective & Analyst Roles
            </h3>
            <p className="text-gray-300">
              One player leads interrogations while the other analyzes evidence. Switch roles or work together on tough cases.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-pink-500/20 animate-slide-in-right">
            <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-4">
              <Map className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Noir Atmosphere
            </h3>
            <p className="text-gray-300">
              Atmospheric 1940s noir aesthetic with jazz music, rain-soaked streets, and moody lighting throughout.
            </p>
          </div>
        </div>

        {/* Sample Cases */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white mb-16 animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-6 h-6" />
            <h3 className="text-2xl font-bold">Sample Cases</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-black/20 rounded-xl p-4">
              <p className="font-bold mb-2">🎁 The Missing Anniversary Gift</p>
              <p className="text-sm text-indigo-100">Tutorial case: A stolen necklace on your anniversary</p>
              <p className="text-xs text-indigo-200 mt-2">Difficulty: Easy</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <p className="font-bold mb-2">🎭 The Theater Phantom</p>
              <p className="text-sm text-indigo-100">An actor vanishes during opening night</p>
              <p className="text-xs text-indigo-200 mt-2">Difficulty: Medium</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <p className="font-bold mb-2">🖼️ The Art Collector's Curse</p>
              <p className="text-sm text-indigo-100">Mysterious deaths follow a stolen painting</p>
              <p className="text-xs text-indigo-200 mt-2">Difficulty: Hard</p>
            </div>
          </div>
        </div>

        {/* Inspiration */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 mb-16">
          <h3 className="text-2xl font-bold text-white mb-4">Inspired By</h3>
          <div className="grid md:grid-cols-3 gap-4 text-gray-300">
            <div>
              <p className="font-bold mb-1 text-indigo-300">⚖️ Ace Attorney</p>
              <p className="text-sm">Interrogation and deduction mechanics</p>
            </div>
            <div>
              <p className="font-bold mb-1 text-purple-300">📼 Her Story</p>
              <p className="text-sm">Non-linear evidence discovery</p>
            </div>
            <div>
              <p className="font-bold mb-1 text-blue-300">⛵ Return of the Obra Dinn</p>
              <p className="text-sm">Deduction board puzzle solving</p>
            </div>
          </div>
        </div>

        {/* Development Status */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Development Roadmap
          </h3>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 mt-1">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Phase 1: Case Structure & UI</p>
                  <p className="text-sm text-gray-400">Evidence board, case files, interrogation interface</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 mt-1">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Phase 2: First Mystery</p>
                  <p className="text-sm text-gray-400">"The Missing Anniversary Gift" - tutorial case</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 mt-1">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">Phase 3: Core Systems</p>
                  <p className="text-sm text-gray-400">Deduction engine, ranking system, case progression</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">
            The game is afoot! Stay tuned for development updates.
          </p>
          <p className="text-sm text-gray-500">
            Estimated Beta: Q4 2026
          </p>
        </div>
      </div>
    </div>
  );
};