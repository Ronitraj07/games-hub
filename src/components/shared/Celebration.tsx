import React, { useEffect, useState } from 'react';
import { Trophy, Star, Heart, Sparkles } from 'lucide-react';

interface CelebrationProps {
  show: boolean;
  type?: 'win' | 'achievement' | 'levelup';
  message?: string;
  onComplete?: () => void;
}

export const Celebration: React.FC<CelebrationProps> = ({
  show,
  type = 'win',
  message = 'Victory!',
  onComplete
}) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 2
      }));
      setConfetti(particles);

      // Auto-complete after 3 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const icons = {
    win: Trophy,
    achievement: Star,
    levelup: Sparkles
  };

  const Icon = icons[type];

  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500'
  ];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Confetti */}
      {confetti.map(particle => (
        <div
          key={particle.id}
          className={`absolute w-2 h-2 ${colors[particle.id % colors.length]} rounded-full animate-confetti`}
          style={{
            left: `${particle.left}%`,
            top: '-10px',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}

      {/* Main celebration element */}
      <div className="animate-celebration-bounce">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border-4 border-yellow-400">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 animate-pulse-slow">
            <Icon className="w-12 h-12 text-white" />
          </div>

          {/* Message */}
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 animate-bounce-subtle">
            {message}
          </h2>

          {/* Hearts */}
          <div className="flex justify-center gap-2 mt-4">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                className="w-6 h-6 text-red-500 animate-heartbeat"
                style={{ animationDelay: `${i * 0.2}s` }}
                fill="currentColor"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Smaller celebration for correct answers, matches, etc.
interface MiniCelebrationProps {
  show: boolean;
  message: string;
  icon?: 'check' | 'star' | 'heart';
}

export const MiniCelebration: React.FC<MiniCelebrationProps> = ({
  show,
  message,
  icon = 'check'
}) => {
  if (!show) return null;

  const iconElement = {
    check: '✓',
    star: '⭐',
    heart: '❤️'
  }[icon];

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg animate-pop-in">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="text-2xl">{iconElement}</span>
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

// Score popup animation
interface ScorePopupProps {
  show: boolean;
  score: number;
  position?: { x: number; y: number };
}

export const ScorePopup: React.FC<ScorePopupProps> = ({
  show,
  score,
  position = { x: 50, y: 50 }
}) => {
  if (!show) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="text-3xl font-bold text-yellow-500 animate-score-popup drop-shadow-lg">
        +{score}
      </div>
    </div>
  );
};