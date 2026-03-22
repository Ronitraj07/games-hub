import React, { useState, useEffect, useRef } from 'react';

export interface PlayerAvatar {
  id: string;
  name: string;
  x: number; // Position on scene (0-100%)
  y: number; // Position on scene (0-100%)
  color: string;
  emoji?: string;
  isMoving?: boolean;
}

export interface InteractiveObject {
  id: string;
  name: string;
  x: number; // Position (0-100%)
  y: number; // Position (0-100%)
  width: number;
  height: number;
  sprite?: string; // Emoji or icon
  isDiscovered?: boolean;
  onClick?: () => void;
}

export interface SceneLayer {
  id: string;
  imageUrl?: string;
  color?: string;
  depth: number; // 0 = background, 100 = foreground
  parallaxSpeed?: number; // For depth effect
}

export interface IsometricSceneProps {
  title: string;
  description?: string;
  layers: SceneLayer[];
  objects: InteractiveObject[];
  players: PlayerAvatar[];
  onPlayerMove?: (x: number, y: number) => void;
  onObjectClick?: (objectId: string) => void;
  allowMovement?: boolean;
  className?: string;
}

export const IsometricScene: React.FC<IsometricSceneProps> = ({
  title,
  description,
  layers,
  objects,
  players,
  onPlayerMove,
  onObjectClick,
  allowMovement = true,
  className = '',
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  const handleSceneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowMovement || !onPlayerMove || !sceneRef.current) return;

    const rect = sceneRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onPlayerMove(x, y);
  };

  const handleObjectClick = (objectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onObjectClick) {
      onObjectClick(objectId);
    }
  };

  const isNearObject = (obj: InteractiveObject, player: PlayerAvatar): boolean => {
    const distance = Math.sqrt(
      Math.pow(obj.x - player.x, 2) + Math.pow(obj.y - player.y, 2)
    );
    return distance < 10; // Within 10% distance
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sceneRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Title & Description */}
      {(title || description) && (
        <div className="mb-4 glass-card p-4 rounded-xl bg-gradient-to-r from-purple-800/40 to-indigo-800/40 border border-purple-500/30">
          <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
          {description && <p className="text-sm text-purple-200">{description}</p>}
        </div>
      )}

      {/* 2.5D Scene */}
      <div
        ref={sceneRef}
        onClick={handleSceneClick}
        className="relative w-full h-[500px] rounded-2xl overflow-hidden border-4 border-purple-500/30 shadow-2xl cursor-crosshair"
        style={{ perspective: '1000px' }}
      >
        {/* Background Layers (sorted by depth) */}
        {layers
          .sort((a, b) => a.depth - b.depth)
          .map((layer) => (
            <div
              key={layer.id}
              className="absolute inset-0 transition-transform duration-200"
              style={{
                backgroundImage: layer.imageUrl ? `url(${layer.imageUrl})` : undefined,
                backgroundColor: layer.color,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: layer.parallaxSpeed
                  ? `translateX(${mousePos.x * layer.parallaxSpeed * 0.01}px) translateY(${mousePos.y * layer.parallaxSpeed * 0.01}px)`
                  : undefined,
                zIndex: layer.depth,
              }}
            />
          ))}

        {/* Interactive Objects */}
        {objects.map((obj) => {
          const nearbyPlayer = players.find((p) => isNearObject(obj, p));
          const isHovered = hoveredObject === obj.id;

          return (
            <div
              key={obj.id}
              onClick={(e) => handleObjectClick(obj.id, e)}
              onMouseEnter={() => setHoveredObject(obj.id)}
              onMouseLeave={() => setHoveredObject(null)}
              className={`absolute cursor-pointer transition-all duration-200 ${
                isHovered ? 'scale-110 z-50' : 'hover:scale-105'
              } ${obj.isDiscovered ? 'opacity-60' : ''} ${
                nearbyPlayer ? 'ring-4 ring-yellow-400 animate-pulse' : ''
              }`}
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                width: `${obj.width}px`,
                height: `${obj.height}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 50 + Math.floor(obj.y), // Objects further down appear in front
              }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Object sprite/icon */}
                <div
                  className={`text-4xl ${
                    obj.isDiscovered
                      ? 'grayscale'
                      : 'filter drop-shadow-lg hover:drop-shadow-2xl'
                  }`}
                >
                  {obj.sprite || '📦'}
                </div>

                {/* Hover tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap animate-fadeIn pointer-events-none">
                    {obj.name}
                    {obj.isDiscovered && ' ✓'}
                  </div>
                )}

                {/* Interaction prompt for nearby players */}
                {nearbyPlayer && !obj.isDiscovered && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold animate-bounce whitespace-nowrap">
                    Press E or Click
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Player Avatars */}
        {players.map((player) => (
          <div
            key={player.id}
            className="absolute transition-all duration-300 ease-in-out"
            style={{
              left: `${player.x}%`,
              top: `${player.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 100 + Math.floor(player.y), // Players render on top, with depth
            }}
          >
            {/* Player avatar */}
            <div className="relative flex flex-col items-center">
              {/* Avatar body */}
              <div
                className={`w-12 h-16 rounded-full shadow-lg border-4 border-white flex items-center justify-center text-2xl ${
                  player.isMoving ? 'animate-bounce' : ''
                }`}
                style={{
                  backgroundColor: player.color,
                  boxShadow: `0 4px 20px ${player.color}80`,
                }}
              >
                {player.emoji || '👤'}
              </div>

              {/* Player name tag */}
              <div className="mt-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                {player.name}
              </div>

              {/* Shadow under player */}
              <div
                className="absolute -bottom-1 w-10 h-2 bg-black/30 rounded-full blur-sm"
                style={{ zIndex: -1 }}
              />
            </div>
          </div>
        ))}

        {/* Click indicator (for movement) */}
        {allowMovement && (
          <div className="absolute bottom-4 right-4 text-white/60 text-xs bg-black/40 px-3 py-2 rounded-lg backdrop-blur-sm">
            🖱️ Click to move • 🎯 Click objects to interact
          </div>
        )}
      </div>

      {/* Scene Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm text-purple-200 bg-black/30 px-3 py-2 rounded-lg">
          <span className="text-yellow-400">⚡</span>
          <span>Yellow glow = Interactable nearby</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-purple-200 bg-black/30 px-3 py-2 rounded-lg">
          <span className="text-gray-400">✓</span>
          <span>Grayscale = Already discovered</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-purple-200 bg-black/30 px-3 py-2 rounded-lg">
          <span>👥</span>
          <span>{players.length} player(s) in scene</span>
        </div>
      </div>
    </div>
  );
};
