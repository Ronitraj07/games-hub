import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Gamepad2, Trophy, Sparkles, ArrowRight, Shield, Clock, Users } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {['❤️', '💕', '💖', '💗', '💘'].map((heart, i) => (
            <span
              key={i}
              className="absolute text-4xl opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `heartFloat ${3 + i}s ease-in-out ${i * 0.5}s infinite`,
              }}
            >
              {heart}
            </span>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* App Name & Logo */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg">
                <Heart className="w-12 h-12 text-white" fill="white" />
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Couple Games Hub
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              A private multiplayer gaming platform designed specifically for couples. Play fun games together, compete on leaderboards, and create lasting memories! 💕
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/login"
                className="group flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-2 bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 transform hover:scale-105 transition-all duration-300"
              >
                Sign Up Free
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <Gamepad2 className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">13 Fun Games</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Play Tic-Tac-Toe, Pictionary, Scrabble, Word Scramble, Memory Match, Connect 4, Trivia Quiz, and more together!
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Trophy className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Compete & Track</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track your scores, view detailed statistics, compete on leaderboards, and unlock achievements together.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Private & Secure</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is protected with secure authentication via Google OAuth. Only you and your partner can access your gaming history.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Why Couples Love Us
            </span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-4">
                <Clock className="text-pink-600 dark:text-pink-400" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Quick Games</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">2-10 minute games perfect for date nights</p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                <Users className="text-purple-600 dark:text-purple-400" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Real-Time Play</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Play together in real-time multiplayer mode</p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-4">
                <Sparkles className="text-pink-600 dark:text-pink-400" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Achievement System</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Unlock badges and track your milestones</p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                <Heart className="text-purple-600 dark:text-purple-400" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Made for Love</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Designed specifically for couples</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Play Together?</h2>
          <p className="text-xl text-pink-100 mb-8">
            Join Couple Games Hub today and start creating fun memories with your partner!
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-pink-600 px-10 py-5 rounded-full font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
          >
            Sign Up Now - It's Free!
            <ArrowRight size={24} />
          </Link>
        </div>
      </div>

      {/* Footer with Legal Links */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Couple Games Hub</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                A private multiplayer gaming platform for couples. Play 13 fun games together, compete on leaderboards, and track your gaming history.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Get Started</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors">
                    Log In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              <strong className="text-gray-900 dark:text-white">Couple Games Hub</strong> - Love & Gaming 💕
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              © 2026 Couple Games Hub. All rights reserved. |
              <a href="https://games.shizzandsparkles.fun/" className="hover:text-pink-600 dark:hover:text-pink-400 ml-1">
                https://games.shizzandsparkles.fun/
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
