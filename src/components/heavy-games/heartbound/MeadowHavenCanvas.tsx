/**
 * MeadowHavenCanvas
 * -----------------
 * HTML5 Canvas renderer for Meadow Haven.
 * Uses a FIXED persistent Firebase world (no room codes).
 * Controls are fully remappable via ControlsConfig.
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useHeartboundSync, PlayerState } from '@/hooks/firebase/useHeartboundSync';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayNameFromEmail } from '@/lib/auth-config';
import { ControlsPanel, ControlsConfig, loadControls } from './ControlsPanel';

// ── Map ─────────────────────────────────────────────────────────
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

const FLOWER_TILES = [
  {tx:5,ty:1},{tx:8,ty:2},{tx:15,ty:2},{tx:17,ty:1},
  {tx:3,ty:5},{tx:18,ty:5},{tx:2,ty:11},{tx:21,ty:11},
  {tx:9,ty:13},{tx:14,ty:13},{tx:2,ty:15},{tx:21,ty:15},
];

const TILE_COLORS: Record<number,string> = {
  0:'#86efac', 1:'#d4a574', 2:'#7dd3fc', 3:'#15803d', 4:'#86efac', 5:'#fef9c3',
};

const MOVE_SPEED = 3;
const ANIM_FRAMES = 4;
const ANIM_SPEED  = 120;
type Dir = 'up'|'down'|'left'|'right';

interface Props {
  myColor:   string;
  onBack:    () => void;
  bondXP:    number;
  onCollect: (count: number) => void;
}

export const MeadowHavenCanvas: React.FC<Props> = ({ myColor, onBack, bondXP, onCollect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user }  = useAuth();
  const myEmail   = user?.email ?? '';
  const myName    = getDisplayNameFromEmail(myEmail);

  // Controls config (remappable)
  const [controls,     setControls]     = useState<ControlsConfig>(loadControls);
  const [showControls, setShowControls] = useState(false);
  const controlsRef = useRef<ControlsConfig>(controls);
  useEffect(() => { controlsRef.current = controls; }, [controls]);

  // Local player state (mutable refs — read in rAF without re-render)
  const pos     = useRef({ x: MAP_W / 2 * TILE, y: MAP_H / 2 * TILE });
  const dir     = useRef<Dir>('down');
  const moving  = useRef(false);
  const keys    = useRef<Set<string>>(new Set());
  const animT   = useRef(0);
  const frame   = useRef(0);
  const lastT   = useRef(0);
  const flowers = useRef(FLOWER_TILES.map(f => ({ ...f, collected: false })));
  const collected = useRef(0);

  // Remote players
  const remotePlayers = useRef<Record<string, PlayerState>>({});
  const handleRemote  = useCallback((p: Record<string,PlayerState>) => {
    remotePlayers.current = p;
  }, []);

  // Now uses the persistent world (no roomCode needed)
  const { publish, markOnline } = useHeartboundSync(myEmail, myName, myColor, handleRemote);

  // Mark online when canvas mounts
  useEffect(() => { markOnline(); }, [markOnline]);

  // ── Keyboard ──────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const c = controlsRef.current;
      if ([c.up,c.down,c.left,c.right].includes(e.key)) e.preventDefault();
      keys.current.add(e.key);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, []);

  // ── D-pad ─────────────────────────────────────────────────────────
  const dpadPress   = useCallback((dir: keyof ControlsConfig) => {
    keys.current.add(controlsRef.current[dir]);
  }, []);
  const dpadRelease = useCallback((dir: keyof ControlsConfig) => {
    keys.current.delete(controlsRef.current[dir]);
  }, []);

  // ── Collision ──────────────────────────────────────────────────────
  const isWalkable = (px: number, py: number): boolean => [
    {x: px+6,       y: py+24},
    {x: px+TILE-6,  y: py+24},
    {x: px+6,       y: py+TILE-2},
    {x: px+TILE-6,  y: py+TILE-2},
  ].every(c => {
    const tx = Math.floor(c.x/TILE), ty = Math.floor(c.y/TILE);
    if (tx<0||tx>=MAP_W||ty<0||ty>=MAP_H) return false;
    const t = RAW_MAP[ty][tx];
    return t!==3 && t!==2;
  });

  // ── Draw helpers ─────────────────────────────────────────────────────
  const drawMap = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    for (let ty=0;ty<MAP_H;ty++) for (let tx=0;tx<MAP_W;tx++) {
      const t = RAW_MAP[ty][tx];
      const sx = tx*TILE-cx, sy = ty*TILE-cy;
      ctx.fillStyle = TILE_COLORS[t]??'#86efac';
      ctx.fillRect(sx,sy,TILE,TILE);
      if (t===3) {
        ctx.fillStyle='#166534'; ctx.beginPath(); ctx.arc(sx+TILE/2,sy+TILE/2,TILE/2-4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#14532d'; ctx.beginPath(); ctx.arc(sx+TILE/2,sy+TILE/2,TILE/2-10,0,Math.PI*2); ctx.fill();
      }
      if (t===2) { ctx.fillStyle='rgba(125,211,252,0.4)'; ctx.fillRect(sx+4,sy+4,TILE-8,TILE-8); }
      if (t===5) {
        ctx.fillStyle='#fde68a'; ctx.fillRect(sx+4,sy+4,TILE-8,TILE-8);
        ctx.fillStyle='#f59e0b'; ctx.fillRect(sx+12,sy+20,16,16);
      }
      if (t===1) {
        ctx.fillStyle='rgba(0,0,0,0.06)';
        ctx.beginPath(); ctx.arc(sx+10,sy+10,3,0,Math.PI*2); ctx.arc(sx+28,sy+28,3,0,Math.PI*2); ctx.fill();
      }
    }
  };

  const drawFlowers = (ctx: CanvasRenderingContext2D, cx: number, cy: number, tick: number) => {
    flowers.current.forEach(f => {
      if (f.collected) return;
      const sx = f.tx*TILE-cx+TILE/2, sy = f.ty*TILE-cy+TILE/2;
      const bob = Math.sin(tick/400+f.tx)*2;
      ctx.font='18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🌸', sx, sy+bob);
    });
  };

  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    px: number, py: number, color: string, spriteDir: Dir,
    isMoving: boolean, animFrame: number,
    cx: number, cy: number, label: string, isMe: boolean,
  ) => {
    const sx = px-cx+TILE/2, sy = py-cy+TILE/2;
    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(sx,sy+14,10,5,0,0,Math.PI*2); ctx.fill();
    const bounce = isMoving ? Math.sin(animFrame/ANIM_FRAMES*Math.PI*2)*2 : 0;
    ctx.fillStyle=color;
    ctx.beginPath(); ctx.roundRect(sx-10,sy-18+bounce,20,22,6); ctx.fill();
    ctx.fillStyle='#fde7c3'; ctx.beginPath(); ctx.arc(sx,sy-24+bounce,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1e293b';
    if (spriteDir==='down'||spriteDir==='up') {
      const ey = spriteDir==='down' ? sy-26+bounce : sy-22+bounce;
      ctx.beginPath(); ctx.arc(sx-4,ey,2,0,Math.PI*2); ctx.arc(sx+4,ey,2,0,Math.PI*2); ctx.fill();
    } else {
      const ex = spriteDir==='right' ? sx+4 : sx-4;
      ctx.beginPath(); ctx.arc(ex,sy-24+bounce,2,0,Math.PI*2); ctx.fill();
    }
    if (isMe) {
      ctx.strokeStyle=color; ctx.lineWidth=2; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.arc(sx,sy-24+bounce,13,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.font='bold 11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillText(label,sx+1,sy-36+bounce+1);
    ctx.fillStyle='#fff';             ctx.fillText(label,sx,  sy-36+bounce);
  };

  // ── Game loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;

    const resize = () => {
      canvas.width  = Math.min(window.innerWidth,  MAP_W*TILE);
      canvas.height = Math.min(window.innerHeight-120, MAP_H*TILE);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (ts: number) => {
      const dt = ts - lastT.current;
      lastT.current = ts;

      // Read current controls from ref (always up-to-date)
      const c = controlsRef.current;
      const k = keys.current;
      let dx=0, dy=0;
      if (k.has(c.left))  { dx=-MOVE_SPEED; dir.current='left';  }
      if (k.has(c.right)) { dx= MOVE_SPEED; dir.current='right'; }
      if (k.has(c.up))    { dy=-MOVE_SPEED; dir.current='up';    }
      if (k.has(c.down))  { dy= MOVE_SPEED; dir.current='down';  }
      if (dx!==0&&dy!==0) { dx*=0.707; dy*=0.707; }
      moving.current = dx!==0||dy!==0;

      const np = {...pos.current};
      if (dx!==0&&isWalkable(np.x+dx,np.y))   np.x+=dx;
      if (dy!==0&&isWalkable(np.x,np.y+dy))   np.y+=dy;
      pos.current = np;
      pos.current.x = Math.max(0,Math.min(pos.current.x,(MAP_W-1)*TILE));
      pos.current.y = Math.max(0,Math.min(pos.current.y,(MAP_H-1)*TILE));

      if (moving.current) {
        animT.current+=dt;
        if (animT.current>ANIM_SPEED) { frame.current=(frame.current+1)%ANIM_FRAMES; animT.current=0; }
      }

      // Collect flowers
      flowers.current.forEach(f => {
        if (f.collected) return;
        const fx=f.tx*TILE+TILE/2, fy=f.ty*TILE+TILE/2;
        const mx=pos.current.x+TILE/2, my=pos.current.y+TILE/2;
        if (Math.hypot(fx-mx,fy-my)<TILE*0.8) {
          f.collected=true; collected.current++; onCollect(collected.current);
        }
      });

      publish({ x:pos.current.x, y:pos.current.y, dir:dir.current, moving:moving.current });

      // Camera
      const vw=canvas.width, vh=canvas.height;
      const cx=Math.max(0,Math.min(pos.current.x+TILE/2-vw/2, MAP_W*TILE-vw));
      const cy=Math.max(0,Math.min(pos.current.y+TILE/2-vh/2, MAP_H*TILE-vh));

      ctx.clearRect(0,0,vw,vh);
      drawMap(ctx,cx,cy);
      drawFlowers(ctx,cx,cy,ts);

      // Remote players first (local renders on top)
      Object.values(remotePlayers.current).forEach(p => {
        if (p.email===myEmail||!p.online) return;
        drawSprite(ctx,p.x,p.y,p.spriteColor,p.dir,p.moving,frame.current,cx,cy,p.name,false);
      });
      drawSprite(ctx,pos.current.x,pos.current.y,myColor,dir.current,moving.current,frame.current,cx,cy,myName,true);

      // Bond XP HUD
      const barW=Math.min(vw-32,320), barX=(vw-barW)/2;
      ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.roundRect(barX-8,8,barW+16,22,11); ctx.fill();
      ctx.fillStyle='#4ade80';          ctx.beginPath(); ctx.roundRect(barX,12,barW*Math.min(bondXP/100,1),14,7); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(`💕 Bond XP: ${bondXP}/100`, vw/2, 19);

      raf=requestAnimationFrame(loop);
    };

    raf=requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, [myEmail, myName, myColor, publish, bondXP]);

  return (
    <div className="relative select-none">
      <canvas
        ref={canvasRef}
        className="block rounded-2xl shadow-2xl"
        style={{ imageRendering:'pixelated', touchAction:'none' }}
      />

      {/* Mobile D-pad — now uses controls config */}
      <div className="md:hidden absolute bottom-4 right-4 grid grid-cols-3 gap-1 opacity-80">
        {([
          { label:'↑', d:'up'    as const, col:2, row:1 },
          { label:'←', d:'left'  as const, col:1, row:2 },
          { label:'↓', d:'down'  as const, col:2, row:2 },
          { label:'→', d:'right' as const, col:3, row:2 },
        ]).map(btn => (
          <button key={btn.d}
            onPointerDown={()  => dpadPress(btn.d)}
            onPointerUp={()    => dpadRelease(btn.d)}
            onPointerLeave={() => dpadRelease(btn.d)}
            className="w-12 h-12 bg-white/30 backdrop-blur rounded-xl text-xl font-bold text-white active:bg-white/50 transition"
            style={{ gridColumn:btn.col, gridRow:btn.row }}
          >{btn.label}</button>
        ))}
      </div>

      {/* Controls button (⚙️) */}
      <button
        onClick={() => setShowControls(true)}
        className="absolute top-3 right-3 bg-black/40 backdrop-blur text-white text-sm px-3 py-1.5 rounded-full hover:bg-black/60 transition"
        title="Customize controls"
      >
        ⚙️ Controls
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 bg-black/40 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-black/60 transition"
      >
        ← Exit
      </button>

      {/* Desktop hint */}
      <div className="hidden md:block absolute bottom-3 left-3 text-white/50 text-xs">
        Move: {controls.up}/{controls.left}/{controls.down}/{controls.right}
      </div>

      {/* Controls panel modal */}
      {showControls && (
        <ControlsPanel
          controls={controls}
          onChange={c => setControls(c)}
          onClose={() => setShowControls(false)}
        />
      )}
    </div>
  );
};
