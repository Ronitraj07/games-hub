import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Search, Lock, Play, Users, Map, BookOpen } from 'lucide-react';

export const RPGHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-float mb-6">
            <div className="text-6xl">🎮✨</div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 animate-fade-in">
            RPG Adventures
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 mb-8 animate-fade-in">
            Two magical journeys designed for couples
          </p>
          <div className="flex items-center justify-center gap-2 text-purple-300 animate-bounce-subtle">
            <Users className="w-5 h-5" />
            <span>Built for cooperative play</span>
          </div>
        </div>
      </div>

      {/* RPG Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Heartbound Adventures */}
          <div
            onClick={() => navigate('/rpg/heartbound')}
            className="group relative bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all" />
            
            <div className="relative p-8">
              {/* Icon */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Heartbound Adventures</h2>
                  <p className="text-pink-100">Romantic Exploration RPG</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/90 text-lg mb-6">
                Explore magical floating islands together, build your dream home, and strengthen your bond through discovery and cooperation.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white">
                  <Sparkles className="w-5 h-5" />
                  <span>8 magical islands to explore</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Map className="w-5 h-5" />
                  <span>Build your shared home</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Heart className="w-5 h-5" />
                  <span>Bond level progression (1-100)</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Users className="w-5 h-5" />
                  <span>Cozy co-op gameplay</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                  Cozy
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                  Exploration
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                  Building
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                  Wholesome
                </span>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-white text-pink-600 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors group-hover:scale-105 transform duration-300">
                <Play className="w-5 h-5" fill="currentColor" />
                Start Your Journey
              </button>

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  Coming Soon
                </div>
              </div>
            </div>
          </div>

          {/* Mystery Partners */}
          <div
            onClick={() => navigate('/rpg/mystery')}
            className="group relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all" />
            
            <div className="relative p-8">
              {/* Icon */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Mystery Partners</h2>
                  <p className="text-indigo-100">Detective Adventure RPG</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/90 text-lg mb-6">
                Solve thrilling mysteries together as a detective duo. Collect evidence, interrogate suspects, and crack cases through teamwork.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white">
                  <BookOpen className="w-5 h-5" />
                  <span>10+ unique mystery cases</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Search className="w-5 h-5" />
                  <span>Evidence collection system</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Users className="w-5 h-5" />
                  <span>Detective & Analyst roles</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Sparkles className="w-5 h-5" />
                  <span>Noir aesthetic atmosphere</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                  Mystery
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                  Puzzles
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                  Story-Rich
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                  Deduction
                </span>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors group-hover:scale-105 transform duration-300">
                <Play className="w-5 h-5" fill="currentColor" />
                Begin Investigation
              </button>

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Why RPG Adventures?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold mb-2 text-purple-200">💕 Built for Couples</h4>
              <p className="text-sm text-white/80">
                Every mechanic is designed for two players working together, not competing.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-2 text-purple-200">⏳ Hours of Content</h4>
              <p className="text-sm text-white/80">
                Each RPG offers 20+ hours of unique content, quests, and discoveries.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-2 text-purple-200">🌟 Your Story</h4>
              <p className="text-sm text-white/80">
                Make choices together that shape your unique adventure and memories.
              </p>
            </div>
          </div>
        </div>

        {/* Development Status */}
        <div className="mt-8 text-center text-white/80">
          <p className="text-sm">
            Both RPG adventures are currently in development.
          </p>
          <p className="text-sm mt-2">
            Want to be notified when they launch? Check back soon!
          </p>
        </div>
      </div>
    </div>
  );
};