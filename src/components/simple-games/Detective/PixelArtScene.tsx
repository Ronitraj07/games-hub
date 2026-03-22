/**
 * PixelArtScene.tsx - 2.5D pixel-art rendering for Detective game
 * Features: parallax backgrounds, animated NPCs, interactive objects, smooth z-ordering
 */

import React, { useState, useMemo, useCallback } from 'react';

export interface ParallaxLayer {
  url: string;
  depth: number; // 0.1 - 1.0, lower = further back
  offsetX?: number;
  offsetY?: number;
}

export interface InteractiveObject {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  discovered?: boolean;
  isNPC?: boolean;
  emotionalState?: string; // 'calm', 'nervous', 'scared', 'suspicious'
  onClick?: () => void;
}

export interface PlayerAvatar {
  id: string;
  name: string;
  x: number;
  y: number;
  emoji: string;
  isCurrentPlayer?: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
}

export interface PixelArtSceneProps {
  room: Room;
  objects: InteractiveObject[];
  players: PlayerAvatar[];
  onObjectClick?: (objectId: string) => void;
  onPlayerMove?: (x: number, y: number) => void;
  allowMovement?: boolean;
  layers?: ParallaxLayer[];
}

// Emotional state emojis that float above NPCs
const EMOTIONAL_INDICATORS: Record<string, string> = {
  calm: '😌',
  nervous: '😰',
  scared: '👻',
  suspicious: '🤔',
  angry: '😠',
  thinking: '💭',
};

// CSS for pixel-art effects
const pixelArtStyles = `
  .pixel-art-npc {
    font-size: 3rem;
    display: inline-block;
    text-shadow:
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000,
      0 -2px 0 #000,
      0 2px 0 #000,
      -2px 0 0 #000,
      2px 0 0 #000;
    filter: drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.5));
    transition: transform 0.2s ease;
  }

  .pixel-art-npc:hover {
    transform: scale(1.1);
  }

  .pixel-art-npc.selected {
    animation: pixelPulse 0.6s ease-in-out;
  }

  .npc-idle-bob {
    animation: pixelBob 2s ease-in-out infinite;
  }

  @keyframes pixelBob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  @keyframes pixelPulse {
    0%, 100% { filter: drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.5)); }
    50% { filter: drop-shadow(6px 6px 0px rgba(255, 215, 0, 0.8)); }
  }

  .emotional-indicator {
    font-size: 1.2rem;
    animation: floatUp 2s ease-in infinite;
    position: absolute;
  }

  @keyframes floatUp {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-30px); opacity: 0; }
  }

  .proximity-ring {
    animation: proximityPulse 1s ease-in-out infinite;
  }

  @keyframes proximityPulse {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(138, 43, 226, 0.6)); }
    50% { filter: drop-shadow(0 0 8px rgba(138, 43, 226, 0.9)); }
  }

  .object-discovered {
    opacity: 1;
  }

  .object-undiscovered {
    opacity: 0.6;
    filter: grayscale(50%);
  }
`;

/**
 * Pixel-Art NPC Component
 */
const PixelArtNPC: React.FC<{
  object: InteractiveObject;
  isCurrentPlayer?: boolean;
  isProximityTriggered?: boolean;
  isSelected?: boolean;
  onHover?: () => void;
  onClick?: () => void;
}> = ({ object, isCurrentPlayer, isProximityTriggered, isSelected, onHover, onClick }) => {
  return (
    <div
      className={`pixel-art-npc npc-idle-bob ${
        isProximityTriggered ? 'proximity-ring' : ''
      } ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${object.x}%`,
        top: `${object.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: Math.floor(object.y * 1000) + (isCurrentPlayer ? 10 : 0),
      }}
      onMouseEnter={onHover}
      onClick={onClick}
      title={object.name}
    >
      {object.emoji}
      {object.emotionalState && isProximityTriggered && (
        <div className="emotional-indicator">
          {EMOTIONAL_INDICATORS[object.emotionalState] || '💭'}
        </div>
      )}
    </div>
  );
};

/**
 * Pixel-Art Object Component
 */
const PixelArtObject: React.FC<{
  object: InteractiveObject;
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ object, isSelected, onClick }) => {
  return (
    <div
      className={`pixel-art-npc ${object.discovered ? 'object-discovered' : 'object-undiscovered'} ${
        isSelected ? 'selected' : ''
      }`}
      style={{
        position: 'absolute',
        left: `${object.x}%`,
        top: `${object.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: Math.floor(object.y * 1000),
        opacity: object.discovered ? 1 : 0.6,
      }}
      onClick={onClick}
      title={object.name}
    >
      {object.emoji}
    </div>
  );
};

/**
 * Player Avatar Display
 */
const PlayerAvatarDisplay: React.FC<{
  avatar: PlayerAvatar;
  isCurrentPlayer?: boolean;
}> = ({ avatar, isCurrentPlayer }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${avatar.x}%`,
        top: `${avatar.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: Math.floor(avatar.y * 1000) + 50,
        textAlign: 'center',
      }}
    >
      <div
        className={isCurrentPlayer ? 'proximity-ring' : ''}
        style={{
          fontSize: '3.5rem',
          textShadow:
            '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
          filter: isCurrentPlayer
            ? 'drop-shadow(0 0 6px rgb(59, 130, 246))'
            : 'drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.5))',
        }}
      >
        {avatar.emoji}
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: isCurrentPlayer ? '#60A5FA' : '#9CA3AF',
          marginTop: '4px',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
        }}
      >
        {isCurrentPlayer ? 'You' : avatar.name}
      </div>
    </div>
  );
};

/**
 * Main PixelArtScene Component
 */
export const PixelArtScene: React.FC<PixelArtSceneProps> = ({
  room,
  objects,
  players,
  onObjectClick,
  onPlayerMove,
  allowMovement = true,
  layers = [],
}) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Calculate proximity for object highlighting
  const proximityRange = 12; // 12% distance range
  const proximityObjects = useMemo(() => {
    if (!players.length) return new Set<string>();

    const triggered = new Set<string>();
    const currentPlayer = players[0]; // Focus on first player

    objects.forEach(obj => {
      if (obj.isNPC) {
        const distance = Math.sqrt(
          Math.pow(obj.x - currentPlayer.x, 2) + Math.pow(obj.y - currentPlayer.y, 2)
        );
        if (distance < proximityRange) {
          triggered.add(obj.id);
        }
      }
    });

    return triggered;
  }, [objects, players]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowMovement || !players.length) return;

    const canvas = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - canvas.left) / canvas.width) * 100;
    const y = ((e.clientY - canvas.top) / canvas.height) * 100;

    onPlayerMove?.(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = e.currentTarget.getBoundingClientRect();
    setMouseX((e.clientX - canvas.left) / canvas.width);
    setMouseY((e.clientY - canvas.top) / canvas.height);
  };

  const parallelEffect = {
    backgroundPosition: `${mouseX * 5}px ${mouseY * 5}px`,
  };

  return (
    <>
      <style>{pixelArtStyles}</style>
      <div
        className="relative w-full bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl overflow-hidden border-2 border-purple-500/30"
        style={{
          aspectRatio: '16 / 9',
          cursor: allowMovement ? 'crosshair' : 'default',
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      >
        {/* Parallax Backgrounds */}
        {layers.map((layer, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: `url(${layer.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.3 + layer.depth * 0.4,
              transform: `translate(${(mouseX - 0.5) * layer.depth * 20}px, ${
                (mouseY - 0.5) * layer.depth * 20
              }px)`,
              transition: 'transform 0.1s ease-out',
            }}
          />
        ))}

        {/* Scene background */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(135deg, rgba(88, 28, 135, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
            zIndex: 1,
          }}
        />

        {/* Objects layer */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 10 }}>
          {objects.map(obj => (
            obj.isNPC ? (
              <PixelArtNPC
                key={obj.id}
                object={obj}
                isProximityTriggered={proximityObjects.has(obj.id)}
                isSelected={selectedObjectId === obj.id}
                onHover={() => setSelectedObjectId(obj.id)}
                onClick={() => {
                  setSelectedObjectId(obj.id);
                  onObjectClick?.(obj.id);
                }}
              />
            ) : (
              <PixelArtObject
                key={obj.id}
                object={obj}
                isSelected={selectedObjectId === obj.id}
                onClick={() => {
                  setSelectedObjectId(obj.id);
                  onObjectClick?.(obj.id);
                }}
              />
            )
          ))}

          {/* Players */}
          {players.map((player, idx) => (
            <PlayerAvatarDisplay
              key={player.id}
              avatar={player}
              isCurrentPlayer={idx === 0}
            />
          ))}
        </div>

        {/* Top-left room description */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#E0E7FF',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            maxWidth: '200px',
            border: '1px solid rgba(168, 85, 247, 0.5)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{room.name}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            {room.description}
          </div>
        </div>

        {/* Bottom-right UI controls hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#A78BFA',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            border: '1px solid rgba(168, 85, 247, 0.5)',
          }}
        >
          {allowMovement ? '🖱️ Click to move | 🎯 Click objects to interact' : '⏸️ Investigation locked'}
        </div>
      </div>
    </>
  );
};

export default PixelArtScene;
