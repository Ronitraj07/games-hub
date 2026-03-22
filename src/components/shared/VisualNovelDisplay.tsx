import React, { useState, useEffect } from 'react';

export interface VisualNovelEntry {
  playerName: string;
  playerEmoji?: string;
  playerColor?: string;
  text: string;
  timestamp: number;
}

export interface VisualNovelDisplayProps {
  entries: VisualNovelEntry[];
  storyStarter?: string;
  enableTypeAnimation?: boolean;
  className?: string;
}

export const VisualNovelDisplay: React.FC<VisualNovelDisplayProps> = ({
  entries,
  storyStarter,
  enableTypeAnimation = true,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  const fullStory = [
    storyStarter || '',
    ...entries.map(e => e.text)
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (!enableTypeAnimation) {
      setDisplayedText(fullStory);
      return;
    }

    setIsAnimating(true);
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullStory.length) {
        setDisplayedText(fullStory.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [fullStory, enableTypeAnimation]);

  return (
    <div className={`visual-novel-container ${className}`}>
      {/* Story Display */}
      <div className="glass-card p-8 rounded-2xl min-h-80 mb-6 relative overflow-hidden group">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Inner light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/3 bg-gradient-to-b from-white/20 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10">
          {/* Story Title/Category */}
          <div className="mb-6 pb-4 border-b border-pink-200/30 dark:border-pink-800/30">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Your Story
            </h2>
          </div>

          {/* Story Text */}
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-pink-100/90 dark:text-pink-50 whitespace-pre-wrap font-serif">
              {displayedText}
              {isAnimating && <span className="animate-pulse">▌</span>}
            </p>
          </div>

          {/* Word Count */}
          <div className="mt-6 text-sm text-pink-300/70">
            📝 {fullStory.split(' ').filter(Boolean).length} words
          </div>
        </div>
      </div>

      {/* Contributions Timeline */}
      <div className="space-y-3 mt-6">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Story Timeline</h3>
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="glass-card p-4 rounded-xl transition-all hover:scale-102 cursor-pointer group relative overflow-hidden"
            style={{
              animationDelay: `${idx * 0.1}s`,
              animation: 'slideInUp 0.4s ease-out both',
            }}>
            {/* Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative z-10 flex items-start gap-3">
              {/* Player indicator */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg"
                style={{
                  background: entry.playerColor || `hsl(${idx * 137.5}, 70%, 50%)`,
                }}>
                {entry.playerEmoji || entry.playerName.charAt(0)}
              </div>

              {/* Contribution */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                  {entry.playerName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  "{entry.text}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
