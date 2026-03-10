import React, { useState } from 'react';
import { Bot, Users, Gamepad2, ChevronRight } from 'lucide-react';
import { InviteModal } from '@/components/games/InviteModal';

export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'solo' | 'vs-ai' | 'vs-partner';

interface GameLobbyProps {
  /** Display name shown in the lobby card */
  gameName: string;
  /** Large emoji shown as the game icon */
  gameIcon: string;
  /** Tailwind from-X to-Y gradient for the title and buttons */
  gradient: string;
  /** Short description shown under the title */
  description?: string;
  /** Whether to show a Solo play button */
  supportsSolo?: boolean;
  /** Whether to show the vs-AI section */
  supportsAI?: boolean;
  /** Labels shown for each AI difficulty — defaults to easy/medium/hard descriptions */
  aiLabels?: { easy: string; medium: string; hard: string };
  /** gameType string passed to InviteModal / useGameInvite */
  gameType: string;
  /** Called when user picks Solo */
  onStartSolo?: () => void;
  /** Called when user picks a difficulty — AI game should start immediately */
  onStartVsAI?: (difficulty: AIDifficulty) => void;
  /** Called when invite handshake completes (roomId = Firebase room code) */
  onStartVsPartner: (roomId: string, isHost: boolean) => void;
}

const DIFFICULTY_STYLES: Record<AIDifficulty, string> = {
  easy:   'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400  hover:bg-green-200  dark:hover:bg-green-900/50',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
  hard:   'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400    hover:bg-red-200    dark:hover:bg-red-900/50',
};

const DIFFICULTY_ICONS: Record<AIDifficulty, string> = {
  easy: '🟢', medium: '🟡', hard: '🔴',
};

export const GameLobby: React.FC<GameLobbyProps> = ({
  gameName,
  gameIcon,
  gradient,
  description = 'Choose how you want to play',
  supportsSolo = false,
  supportsAI = true,
  aiLabels,
  gameType,
  onStartSolo,
  onStartVsAI,
  onStartVsPartner,
}) => {
  const [showInvite, setShowInvite] = useState(false);

  const defaultAiLabels = {
    easy:   'Easy   — relaxed pace',
    medium: 'Medium — balanced challenge',
    hard:   'Hard   — no mercy',
  };
  const labels = aiLabels ?? defaultAiLabels;

  return (
    <>
      <div className="glass-card p-8 max-w-md w-full mx-auto">
        {/* Game icon + title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">{gameIcon}</div>
          <h2 className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {gameName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>

        <div className="space-y-3">
          {/* ── Solo ── */}
          {supportsSolo && onStartSolo && (
            <button
              onClick={onStartSolo}
              className="w-full flex items-center gap-4 glass-btn px-5 py-4 rounded-2xl text-left hover:scale-[1.02] transition-all"
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shrink-0`}>
                <Gamepad2 size={22} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">Play Solo</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Practice on your own</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          )}

          {/* ── vs Partner ── */}
          <button
            onClick={() => setShowInvite(true)}
            className="w-full flex items-center gap-4 glass-btn px-5 py-4 rounded-2xl text-left hover:scale-[1.02] transition-all"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shrink-0">
              <Users size={22} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-white">Play vs Partner</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Invite with a 6-letter code</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          {/* ── vs AI ── */}
          {supportsAI && onStartVsAI && (
            <div className="glass-btn px-5 py-4 rounded-2xl">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shrink-0">
                  <Bot size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Play vs AI</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pick a difficulty</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as AIDifficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => onStartVsAI(d)}
                    className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all hover:scale-105 active:scale-95 ${DIFFICULTY_STYLES[d]}`}
                  >
                    <span className="block text-base mb-0.5">{DIFFICULTY_ICONS[d]}</span>
                    {d}
                  </button>
                ))}
              </div>

              {/* AI label descriptions */}
              <div className="mt-2 space-y-1">
                {(['easy','medium','hard'] as AIDifficulty[]).map(d => (
                  <p key={d} className="text-xs text-gray-400 dark:text-gray-500">
                    <span className="font-semibold capitalize text-gray-500 dark:text-gray-400">{d}:</span>{' '}
                    {labels[d]}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showInvite && (
        <InviteModal
          gameType={gameType}
          onClose={() => setShowInvite(false)}
          onReady={(roomId, isHost) => {
            setShowInvite(false);
            onStartVsPartner(roomId, isHost);
          }}
        />
      )}
    </>
  );
};
