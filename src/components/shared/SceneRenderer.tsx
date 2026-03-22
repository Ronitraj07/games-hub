import React from 'react';

export interface SceneChar {
  id: string;
  name: string;
  emoji: string;
  position?: 'left' | 'center' | 'right';
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'suspicious';
}

export interface SceneHotspot {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
}

export interface SceneRendererProps {
  title: string;
  description: string;
  backgroundImage?: string;
  characters: SceneChar[];
  hotspots?: SceneHotspot[];
  onHotspotClick?: (hotspotId: string) => void;
  className?: string;
}

const getEmotionStyle = (emotion?: string): string => {
  switch (emotion) {
    case 'happy':
      return 'scale-110 rotate-0';
    case 'sad':
      return 'scale-95 -rotate-3';
    case 'angry':
      return 'scale-105 rotate-1';
    case 'suspicious':
      return 'scale-100 -rotate-2';
    default:
      return 'scale-100 rotate-0';
  }
};

export const SceneRenderer: React.FC<SceneRendererProps> = ({
  title,
  description,
  backgroundImage,
  characters,
  hotspots = [],
  onHotspotClick,
  className = '',
}) => {
  return (
    <div className={`scene-renderer ${className}`}>
      {/* Scene Container */}
      <div
        className="glass-card rounded-2xl overflow-hidden relative w-full aspect-video group"
        style={{
          background: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />

        {/* 3D Characters with perspective */}
        <div className="absolute inset-0 flex items-end justify-around px-8 pb-8" style={{ perspective: '1000px' }}>
          {characters.map((char, idx) => (
            <div
              key={char.id}
              className="flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110 relative group/char"
              style={{
                transform: `translateZ(50px) rotateY(${(idx - 1) * 5}deg)`,
                animation: `float 3s ease-in-out ${idx * 0.2}s infinite`,
              }}>
              {/* Character container with 3D depth */}
              <div
                className={`text-6xl drop-shadow-2xl transition-all duration-200 ${getEmotionStyle(char.emotion)}`}
                style={{
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
                }}>
                {char.emoji}
              </div>

              {/* Character name */}
              <div className="text-center">
                <p className="text-sm font-bold text-white drop-shadow-lg">
                  {char.name}
                </p>
                {char.emotion && (
                  <p className="text-xs text-white/70 capitalize">
                    ({char.emotion})
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Hotspots */}
        {hotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            className="absolute rounded-lg border-2 border-yellow-400/50 hover:border-yellow-400 cursor-pointer transition-all group/hotspot"
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.width}%`,
              height: `${hotspot.height}%`,
            }}
            onClick={() => onHotspotClick?.(hotspot.id)}>
            {/* Hotspot glow */}
            <div className="absolute inset-0 rounded-lg bg-yellow-400 opacity-0 group-hover/hotspot:opacity-20 transition-opacity blur-md" />

            {/* Hotspot label */}
            <div className="absolute -top-8 left-0 opacity-0 group-hover/hotspot:opacity-100 transition-opacity bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
              {hotspot.label}
            </div>
          </div>
        ))}
      </div>

      {/* Scene Info */}
      <div className="mt-6 glass-card p-6 rounded-xl relative group overflow-hidden">
        {/* Shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateY(var(--rotatey)); }
          50% { transform: translateY(-10px) rotateY(var(--rotatey)); }
        }
      `}</style>
    </div>
  );
};
