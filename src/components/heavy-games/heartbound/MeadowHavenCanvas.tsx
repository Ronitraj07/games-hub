/**
 * MeadowHavenCanvas
 * -----------------
 * Pure HTML5 Canvas renderer for Meadow Haven island.
 * Renders:
 *  - Tiled grass/path/water map
 *  - Local player sprite (animated walk cycle)
 *  - Remote partner sprite synced via Firebase
 *  - Collectible flowers + sparkles
 *  - HUD: bond XP bar, player names
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useHeartboundSync, PlayerState } from '@/hooks/firebase/useHeartboundSync';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayNameFromEmail } from '@/lib/auth-config';

// ─── Map definition ──────────────────────────────────────────────
// 0=grass, 1=path, 2=water, 3=tree, 4=flower, 5=home
const MAP_W = 24, MAP_H = 18, TILE = 40;

const RAW_MAP: number[][] = [
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,3],
  [3,0,5,5,0,0,0,0,4,0,0,0,0,0,0,4,0,0,0,5,5,0,0,3],
  [3,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,4,0,0,0,0,0,1,1,0,0,1,1,0,0,0,4,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,3],
  [3,0,4,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,4,0,3],
  [3,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,3],
  [3,0,0,0,0,1,0,0,0,4,0,0,0,0,4,0,0,0,1,0,0,0,0,3],
  [3,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,3],
  [3,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
];

// Collectible flowers: {tx, ty, collected}
const FLOWER_TILES = [
  {tx:5,ty:1},{tx:8,ty:2},{tx:15,ty:2},{tx:17,ty:1},
  {tx:3,ty:5},{tx:18,ty:5},{tx:2,ty:11},{tx:21,ty:11},
  {tx:9,ty:13},{tx:14,ty:13},{tx:2,ty:15},{tx:21,ty:15},
];

const TILE_COLORS: Record<number, string> = {
  0: '#86efac', // grass light green
  1: '#d4a574', // dirt path
  2: '#7dd3fc', // water
  3: '#15803d', // dark tree
  4: '#86efac', // flower tile (same grass bg, drawn separately)
  5: '#fef9c3', // home / building
};

const MOVE_SPEED = 3; // px per frame
const ANIM_FRAMES = 4;
const ANIM_SPEED  = 120; // ms per frame

type Dir = 'up' | 'down' | 'left' | 'right';

interface Props {
  roomCode: string;
  myColor:  string;
  onBack:   () => void;
  bondXP:   number;
  onCollect: (count: number) => void;
}

export const MeadowHavenCanvas: React.FC<Props> = ({ roomCode, myColor, onBack, bondXP, onCollect }) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const { user }   = useAuth();
  const myEmail    = user?.email ?? '';
  const myName     = getDisplayNameFromEmail(myEmail);

  // Local player state (mutable ref so canvas loop reads latest without re-render)
  const pos     = useRef({ x: MAP_W / 2 * TILE, y: MAP_H / 2 * TILE });
  const dir     = useRef<Dir>('down');
  const moving  = useRef(false);
  const keys    = useRef<Set<string>>(new Set());
  const animT   = useRef(0);
  const frame   = useRef(0);
  const lastT   = useRef(0);
  const flowers = useRef(FLOWER_TILES.map(f => ({ ...f, collected: false })));
  const collectedCount = useRef(0);

  // Remote players
  const remotePlayers = useRef<Record<string, PlayerState>>({});
  const handleRemote  = useCallback((p: Record<string, PlayerState>) => {
    remotePlayers.current = p;
  }, []);

  const { publish } = useHeartboundSync(roomCode, myEmail, myName, myColor, handleRemote);

  // ── Keyboard input ──────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current.add(e.key.toLowerCase()); e.preventDefault(); };
    const up   = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, []);

  // ── Virtual D-pad ───────────────────────────────────────────────
  const dpadPress   = useCallback((k: string) => keys.current.add(k), []);
  const dpadRelease = useCallback((k: string) => keys.current.delete(k), []);

  // ── Collision helper ────────────────────────────────────────────
  const isWalkable = (px: number, py: number): boolean => {
    const corners = [
      {x: px + 6,         y: py + 24},
      {x: px + TILE - 6,  y: py + 24},
      {x: px + 6,         y: py + TILE - 2},
      {x: px + TILE - 6,  y: py + TILE - 2},
    ];
    return corners.every(c => {
      const tx = Math.floor(c.x / TILE);
      const ty = Math.floor(c.y / TILE);
      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return false;
      const t = RAW_MAP[ty][tx];
      return t !== 3 && t !== 2; // can't walk on trees or water
    });
  };

  // ── Draw helpers ────────────────────────────────────────────────
  const drawMap = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const t = RAW_MAP[ty][tx];
        const sx = tx * TILE - cx;
        const sy = ty * TILE - cy;
        ctx.fillStyle = TILE_COLORS[t] ?? '#86efac';
        ctx.fillRect(sx, sy, TILE, TILE);

        // Tile details
        if (t === 3) { // tree
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.arc(sx + TILE/2, sy + TILE/2, TILE/2 - 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#14532d';
          ctx.beginPath();
          ctx.arc(sx + TILE/2, sy + TILE/2, TILE/2 - 10, 0, Math.PI * 2);
          ctx.fill();
        }
        if (t === 2) { // water shimmer
          ctx.fillStyle = 'rgba(125,211,252,0.4)';
          ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
        }
        if (t === 5) { // home
          ctx.fillStyle = '#fde68a';
          ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(sx + 12, sy + 20, 16, 16);
        }
        if (t === 1) { // path pebble detail
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          ctx.beginPath();
          ctx.arc(sx + 10, sy + 10, 3, 0, Math.PI * 2);
          ctx.arc(sx + 28, sy + 28, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  const drawFlowers = (ctx: CanvasRenderingContext2D, cx: number, cy: number, tick: number) => {
    flowers.current.forEach(f => {
      if (f.collected) return;
      const sx = f.tx * TILE - cx + TILE / 2;
      const sy = f.ty * TILE - cy + TILE / 2;
      const bob = Math.sin(tick / 400 + f.tx) * 2;
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌸', sx, sy + bob);
    });
  };

  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    px: number, py: number,
    color: string,
    spriteDir: Dir,
    isMoving: boolean,
    animFrame: number,
    cx: number, cy: number,
    label: string,
    isMe: boolean,
  ) => {
    const sx = px - cx + TILE / 2;
    const sy = py - cy + TILE / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 14, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body bounce
    const bounce = isMoving ? Math.sin(animFrame / ANIM_FRAMES * Math.PI * 2) * 2 : 0;

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(sx - 10, sy - 18 + bounce, 20, 22, 6);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fde7c3';
    ctx.beginPath();
    ctx.arc(sx, sy - 24 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (direction-dependent)
    ctx.fillStyle = '#1e293b';
    if (spriteDir === 'down' || spriteDir === 'up') {
      const eyeY = spriteDir === 'down' ? sy - 26 + bounce : sy - 22 + bounce;
      ctx.beginPath();
      ctx.arc(sx - 4, eyeY, 2, 0, Math.PI * 2);
      ctx.arc(sx + 4, eyeY, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const eyeX = spriteDir === 'right' ? sx + 4 : sx - 4;
      ctx.beginPath();
      ctx.arc(eyeX, sy - 24 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // "Me" indicator ring
    if (isMe) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(sx, sy - 24 + bounce, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Name label
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(label, sx + 1, sy - 36 + bounce + 1);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, sx, sy - 36 + bounce);
  };

  // ── Main game loop ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;

    const resize = () => {
      canvas.width  = Math.min(window.innerWidth,  MAP_W * TILE);
      canvas.height = Math.min(window.innerHeight - 120, MAP_H * TILE);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (timestamp: number) => {
      const dt = timestamp - lastT.current;
      lastT.current = timestamp;

      // Movement
      let dx = 0, dy = 0;
      const k = keys.current;
      if (k.has('arrowleft')  || k.has('a')) { dx = -MOVE_SPEED; dir.current = 'left';  }
      if (k.has('arrowright') || k.has('d')) { dx =  MOVE_SPEED; dir.current = 'right'; }
      if (k.has('arrowup')    || k.has('w')) { dy = -MOVE_SPEED; dir.current = 'up';    }
      if (k.has('arrowdown')  || k.has('s')) { dy =  MOVE_SPEED; dir.current = 'down';  }

      // Diagonal normalise
      if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

      moving.current = dx !== 0 || dy !== 0;

      // Collision-aware movement
      const np = { ...pos.current };
      if (dx !== 0 && isWalkable(np.x + dx, np.y)) np.x += dx;
      if (dy !== 0 && isWalkable(np.x, np.y + dy)) np.y += dy;
      pos.current = np;

      // Clamp
      pos.current.x = Math.max(0, Math.min(pos.current.x, (MAP_W - 1) * TILE));
      pos.current.y = Math.max(0, Math.min(pos.current.y, (MAP_H - 1) * TILE));

      // Anim
      if (moving.current) {
        animT.current += dt;
        if (animT.current > ANIM_SPEED) { frame.current = (frame.current + 1) % ANIM_FRAMES; animT.current = 0; }
      }

      // Flower collection (proximity)
      flowers.current.forEach(f => {
        if (f.collected) return;
        const fx = f.tx * TILE + TILE / 2;
        const fy = f.ty * TILE + TILE / 2;
        const mx = pos.current.x + TILE / 2;
        const my = pos.current.y + TILE / 2;
        if (Math.hypot(fx - mx, fy - my) < TILE * 0.8) {
          f.collected = true;
          collectedCount.current++;
          onCollect(collectedCount.current);
        }
      });

      // Publish to Firebase
      publish({ x: pos.current.x, y: pos.current.y, dir: dir.current, moving: moving.current });

      // Camera — center on player
      const vw = canvas.width;
      const vh = canvas.height;
      const cx = Math.max(0, Math.min(pos.current.x + TILE / 2 - vw / 2, MAP_W * TILE - vw));
      const cy = Math.max(0, Math.min(pos.current.y + TILE / 2 - vh / 2, MAP_H * TILE - vh));

      // ── Draw ──────────────────────────────────────────────────────
      ctx.clearRect(0, 0, vw, vh);
      drawMap(ctx, cx, cy);
      drawFlowers(ctx, cx, cy, timestamp);

      // Remote players (draw before local so local is always on top)
      Object.values(remotePlayers.current).forEach(p => {
        if (p.email === myEmail) return;
        drawSprite(ctx, p.x, p.y, p.spriteColor, p.dir, p.moving, frame.current, cx, cy, p.name, false);
      });

      // Local player
      drawSprite(ctx, pos.current.x, pos.current.y, myColor, dir.current, moving.current, frame.current, cx, cy, myName, true);

      // Bond XP bar (top HUD)
      const barW = Math.min(vw - 32, 320);
      const barX = (vw - barW) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.roundRect(barX - 8, 8, barW + 16, 22, 11); ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.beginPath(); ctx.roundRect(barX, 12, barW * Math.min(bondXP / 100, 1), 14, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`💕 Bond XP: ${bondXP}/100`, vw / 2, 19);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [myEmail, myName, myColor, publish, bondXP]);

  return (
    <div className="relative select-none">
      <canvas
        ref={canvasRef}
        className="block rounded-2xl shadow-2xl"
        style={{ imageRendering: 'pixelated', touchAction: 'none' }}
      />

      {/* Mobile D-pad */}
      <div className="md:hidden absolute bottom-4 right-4 grid grid-cols-3 gap-1 opacity-80">
        {[
          { label: '↑', key: 'arrowup',    col: 2, row: 1 },
          { label: '←', key: 'arrowleft',  col: 1, row: 2 },
          { label: '↓', key: 'arrowdown',  col: 2, row: 2 },
          { label: '→', key: 'arrowright', col: 3, row: 2 },
        ].map(btn => (
          <button
            key={btn.key}
            onPointerDown={() => dpadPress(btn.key)}
            onPointerUp={()   => dpadRelease(btn.key)}
            onPointerLeave={() => dpadRelease(btn.key)}
            className="w-12 h-12 bg-white/30 backdrop-blur rounded-xl text-xl font-bold text-white active:bg-white/50 transition"
            style={{ gridColumn: btn.col, gridRow: btn.row }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 bg-black/40 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-black/60 transition"
      >
        ← Exit
      </button>

      {/* Controls hint */}
      <div className="hidden md:block absolute bottom-3 left-3 text-white/60 text-xs">
        WASD / Arrow keys to move
      </div>
    </div>
  );
};
