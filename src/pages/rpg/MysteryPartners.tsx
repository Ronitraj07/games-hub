import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Users, Fingerprint, Lock, ArrowLeft, Sparkles, ChevronRight, Star } from 'lucide-react';

const CASES = [
  {
    id: 1,
    emoji: '🎁',
    title: 'The Missing Anniversary Gift',
    tagline: 'A stolen necklace on the most important night of the year.',
    difficulty: 'Easy',
    difficultyColor: 'text-green-400',
    difficultyBg: 'bg-green-900/30 border-green-700/40',
    suspects: 3,
    clues: 8,
    isTutorial: true,
    status: 'Coming in Phase 2',
  },
  {
    id: 2,
    emoji: '🎭',
    title: 'The Theater Phantom',
    tagline: 'An actor vanishes mid-performance on opening night.',
    difficulty: 'Medium',
    difficultyColor: 'text-yellow-400',
    difficultyBg: 'bg-yellow-900/30 border-yellow-700/40',
    suspects: 6,
    clues: 14,
    isTutorial: false,
    status: 'Planned',
  },
  {
    id: 3,
    emoji: '🖼️',
    title: "The Art Collector's Curse",
    tagline: 'Mysterious deaths trail a stolen painting across the city.',
    difficulty: 'Hard',
    difficultyColor: 'text-red-400',
    difficultyBg: 'bg-red-900/30 border-red-700/40',
    suspects: 9,
    clues: 22,
    isTutorial: false,
    status: 'Planned',
  },
];

export const MysteryPartners: React.FC = () => {
  const [activeCase, setActiveCase] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950">

      {/* Back button */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link to="/rpg" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition font-medium">
          <ArrowLeft size={18} /> Back to RPG Hub
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        {/* Noir rain effect bar */}
        <div className="flex justify-center gap-1 mb-6 opacity-30">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="w-px bg-indigo-400" style={{ height: `${20 + Math.random() * 30}px`, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-4">
          Mystery Partners
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
          A co-op noir detective adventure set in the rain-soaked streets of 1940s. Two roles, one truth — you can only solve it together.
        </p>
        <p className="text-indigo-400 italic text-sm mb-6">"The game is afoot, partner."</p>
        <div className="inline-flex items-center gap-2 bg-yellow-900/30 text-yellow-300 border border-yellow-700/40 px-5 py-2 rounded-full font-semibold">
          <Lock size={15} /> In Development — Beta: Q4 2026
        </div>
      </div>

      {/* 4 Core Pillars */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <BookOpen size={22} className="text-white" />, color: 'from-indigo-500 to-blue-600', title: '10+ Cases', desc: 'Missing persons, art heists, theater scandals — each case is unique with real twists.' },
            { icon: <Fingerprint size={22} className="text-white" />, color: 'from-purple-500 to-violet-600', title: 'Evidence Board', desc: 'Gather clues, pin connections, and build your deduction map piece by piece.' },
            { icon: <Users size={22} className="text-white" />, color: 'from-pink-500 to-rose-600', title: 'Split Roles', desc: 'One interrogates, one analyzes. Switch roles on harder cases.' },
            { icon: <Search size={22} className="text-white" />, color: 'from-blue-500 to-indigo-600', title: 'Noir World', desc: 'Jazz, rain, dim lights. A fully atmospheric 1940s detective world.' },
          ].map(p => (
            <div key={p.title} className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/50 hover:border-indigo-500/50 transition-colors">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>{p.icon}</div>
              <h3 className="font-bold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Case Files */}
      <div className="bg-gray-900/60 backdrop-blur-sm border-y border-gray-700/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-white mb-2">📁 Case Files</h2>
          <p className="text-center text-gray-500 mb-10">Three mysteries designed — more in development</p>

          {/* Case tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {CASES.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveCase(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
                  activeCase === i
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <span>{c.emoji}</span>
                <span>Case {c.id}</span>
                {c.isTutorial && <span className="text-xs bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">Tutorial</span>}
              </button>
            ))}
          </div>

          {/* Active case card */}
          <div className="max-w-2xl mx-auto">
            <div className={`rounded-2xl p-8 border ${CASES[activeCase].difficultyBg} bg-gray-900/80 shadow-2xl`}>
              <div className="flex items-start justify-between mb-4">
                <div className="text-6xl">{CASES[activeCase].emoji}</div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${CASES[activeCase].difficultyColor}`}>
                    {CASES[activeCase].difficulty}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{CASES[activeCase].status}</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{CASES[activeCase].title}</h3>
              <p className="text-gray-400 italic mb-6">"{CASES[activeCase].tagline}"</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800/70 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-400">{CASES[activeCase].suspects}</p>
                  <p className="text-xs text-gray-500">Suspects</p>
                </div>
                <div className="bg-gray-800/70 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-400">{CASES[activeCase].clues}</p>
                  <p className="text-xs text-gray-500">Clues</p>
                </div>
                <div className="bg-gray-800/70 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-pink-400">2</p>
                  <p className="text-xs text-gray-500">Players</p>
                </div>
              </div>

              {CASES[activeCase].isTutorial && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
                  <Star size={14} fill="currentColor" />
                  Tutorial case — perfect for your first investigation
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Roles Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-white mb-2">🕵️ The Two Roles</h2>
        <p className="text-center text-gray-500 mb-10">The case breaks only when both of you play your part</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-2xl p-8">
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-xl font-bold text-white mb-3">The Interrogator</h3>
            <p className="text-gray-400 mb-4">You face the suspects. Ask the right questions, read their body language, and push for the truth under pressure.</p>
            <div className="space-y-2">
              {['Conduct suspect interviews', 'Unlock new dialogue paths', 'Call for backup when stuck'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-indigo-300">
                  <ChevronRight size={14} />{item}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-purple-900/30 border border-purple-700/40 rounded-2xl p-8">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="text-xl font-bold text-white mb-3">The Analyst</h3>
            <p className="text-gray-400 mb-4">You work the evidence board. Connect clues, spot contradictions in testimony, and reveal what the interrogator should ask next.</p>
            <div className="space-y-2">
              {['Manage the evidence board', 'Cross-reference clue connections', 'Flag contradictions in testimony'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-purple-300">
                  <ChevronRight size={14} />{item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inspiration + Roadmap */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border-y border-indigo-700/30 py-12">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10 text-white">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-indigo-400" />
              <h3 className="text-xl font-bold">Inspired By</h3>
            </div>
            <div className="space-y-3">
              {[
                { emoji: '⚖️', title: 'Ace Attorney', desc: 'Interrogation mechanics and dramatic reveals' },
                { emoji: '📼', title: 'Her Story', desc: 'Non-linear evidence discovery' },
                { emoji: '⛵', title: 'Return of the Obra Dinn', desc: 'Deduction board puzzle solving' },
              ].map(s => (
                <div key={s.title} className="bg-white/10 rounded-xl p-4">
                  <p className="font-semibold">{s.emoji} {s.title}</p>
                  <p className="text-sm text-indigo-200">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">🗓️ Development Roadmap</h3>
            <div className="space-y-3">
              {[
                { phase: '1', title: 'Case Structure & UI', desc: 'Evidence board, case files, interrogation interface', active: true },
                { phase: '2', title: 'First Mystery', desc: '"The Missing Anniversary Gift" — tutorial case', active: false },
                { phase: '3', title: 'Core Systems', desc: 'Deduction engine, ranking system, case progression', active: false },
              ].map(step => (
                <div key={step.phase} className={`rounded-xl p-4 flex items-start gap-4 ${ step.active ? 'bg-white/20' : 'bg-white/10'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ step.active ? 'bg-yellow-400 text-gray-900' : 'bg-white/20 text-white'}`}>{step.phase}</div>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-indigo-200">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-indigo-400 mt-4 text-center">Estimated Beta: Q4 2026</p>
          </div>
        </div>
      </div>

      {/* CTA footer */}
      <div className="text-center py-12 px-4">
        <p className="text-gray-600 italic mb-6">"Every lie leaves a trace. Every truth hides one too."</p>
        <Link to="/rpg" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold transition">
          <ArrowLeft size={16} /> Back to RPG Hub
        </Link>
      </div>
    </div>
  );
};
