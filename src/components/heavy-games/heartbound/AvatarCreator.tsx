/**
 * AvatarCreator — Phase 1
 * Sky: Children of Light inspired avatar customisation screen.
 * Fully procedural — zero external assets, zero downloads.
 * Character is rendered live in R3F with real-time preview.
 */
import React, { useRef, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useHeartboundStore } from '@/stores/heartboundStore';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface AvatarConfig {
  skinTone:    string;
  hairStyle:   number;   // 0–5
  hairColor:   string;
  eyeColor:    string;
  capeColor:   string;
  capeStyle:   number;   // 0–4
  maskStyle:   number;   // 0–3  (0 = no mask)
  accessory:   number;   // 0–4  (0 = none)
  glowColor:   string;
  name:        string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skinTone:  '#f5cba7',
  hairStyle:  1,
  hairColor: '#3d2314',
  eyeColor:  '#1a6b3a',
  capeColor: '#7c3aed',
  capeStyle:  1,
  maskStyle:  0,
  accessory:  0,
  glowColor: '#a78bfa',
  name:      '',
};

// ─────────────────────────────────────────────────────────────
// Preset palettes
// ─────────────────────────────────────────────────────────────
const SKIN_TONES   = ['#fde7c3','#f5cba7','#e8a87c','#c68642','#8d5524','#4a2912'];
const HAIR_COLORS  = ['#1a1a1a','#3d2314','#6b3a2a','#c19a6b','#e8c97a','#d4607a','#7c3aed','#2563eb','#16a34a'];
const EYE_COLORS   = ['#1a6b3a','#2563eb','#7c3aed','#c2410c','#0e7490','#be185d','#1e293b','#92400e'];
const CAPE_COLORS  = ['#7c3aed','#be185d','#0e7490','#16a34a','#c2410c','#1d4ed8','#92400e','#0f172a','#fbbf24','#f472b6'];
const GLOW_COLORS  = ['#a78bfa','#f472b6','#34d399','#60a5fa','#fbbf24','#f87171','#a3e635','#67e8f9'];

const HAIR_NAMES   = ['Bald','Short Soft','Wavy Long','Twin Tails','Side Swept','Wild Spiky'];
const CAPE_NAMES   = ['None','Starfield','Flowing Silk','Tattered','Feathered'];
const MASK_NAMES   = ['None','Crescent','Flower','Spiral','Sunburst'];
const ACCESSORY_NAMES = ['None','Flower Crown','Star Pin','Leaf Clip','Cloud Band'];

// ─────────────────────────────────────────────────────────────
// 3D Character — Sky-style procedural mesh
// ─────────────────────────────────────────────────────────────
interface CharacterProps { cfg: AvatarConfig; rotate?: boolean; }

function SkyCharacter({ cfg, rotate = true }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const capeRef  = useRef<THREE.Mesh>(null);
  const t        = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (!groupRef.current) return;
    if (rotate) groupRef.current.rotation.y += delta * 0.6;
    // Gentle breathing bob
    groupRef.current.position.y = Math.sin(t.current * 1.2) * 0.04;
    // Cape flutter
    if (capeRef.current) {
      capeRef.current.rotation.x = Math.sin(t.current * 2.1) * 0.06;
      capeRef.current.rotation.z = Math.sin(t.current * 1.7) * 0.04;
    }
  });

  const skinMat  = new THREE.MeshToonMaterial({ color: cfg.skinTone });
  const hairMat  = new THREE.MeshToonMaterial({ color: cfg.hairColor });
  const eyeMat   = new THREE.MeshToonMaterial({ color: cfg.eyeColor, emissive: cfg.eyeColor, emissiveIntensity: 0.4 });
  const capeMat  = new THREE.MeshToonMaterial({ color: cfg.capeColor, side: THREE.DoubleSide });
  const glowMat  = new THREE.MeshToonMaterial({ color: cfg.glowColor, emissive: cfg.glowColor, emissiveIntensity: 0.8, transparent: true, opacity: 0.7 });
  const whiteMat = new THREE.MeshToonMaterial({ color: '#ffffff' });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]} scale={1.1}>

      {/* ── Body ── */}
      <mesh position={[0, 0.78, 0]} material={skinMat}>
        <capsuleGeometry args={[0.21, 0.38, 6, 12]} />
      </mesh>

      {/* ── Head ── */}
      <mesh position={[0, 1.32, 0]} material={skinMat}>
        <sphereGeometry args={[0.28, 16, 12]} />
      </mesh>

      {/* ── Eyes ── */}
      <mesh position={[0.1, 1.35, 0.24]} material={eyeMat}>
        <sphereGeometry args={[0.055, 8, 8]} />
      </mesh>
      <mesh position={[-0.1, 1.35, 0.24]} material={eyeMat}>
        <sphereGeometry args={[0.055, 8, 8]} />
      </mesh>

      {/* ── Eye glow ── */}
      <mesh position={[0.1, 1.35, 0.26]} material={glowMat}>
        <sphereGeometry args={[0.035, 8, 8]} />
      </mesh>
      <mesh position={[-0.1, 1.35, 0.26]} material={glowMat}>
        <sphereGeometry args={[0.035, 8, 8]} />
      </mesh>

      {/* ── Arms ── */}
      <mesh position={[0.34, 0.82, 0]} rotation={[0, 0, 0.3]} material={skinMat}>
        <capsuleGeometry args={[0.085, 0.32, 4, 8]} />
      </mesh>
      <mesh position={[-0.34, 0.82, 0]} rotation={[0, 0, -0.3]} material={skinMat}>
        <capsuleGeometry args={[0.085, 0.32, 4, 8]} />
      </mesh>

      {/* ── Legs ── */}
      <mesh position={[0.11, 0.32, 0]} material={skinMat}>
        <capsuleGeometry args={[0.09, 0.3, 4, 8]} />
      </mesh>
      <mesh position={[-0.11, 0.32, 0]} material={skinMat}>
        <capsuleGeometry args={[0.09, 0.3, 4, 8]} />
      </mesh>

      {/* ── Hair ── */}
      {cfg.hairStyle === 1 && (
        <mesh position={[0, 1.52, 0]} material={hairMat}>
          <sphereGeometry args={[0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        </mesh>
      )}
      {cfg.hairStyle === 2 && (
        <>
          <mesh position={[0, 1.52, 0]} material={hairMat}>
            <sphereGeometry args={[0.27, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </mesh>
          <mesh position={[0, 1.22, -0.18]} rotation={[0.3,0,0]} material={hairMat}>
            <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
          </mesh>
          <mesh position={[0.14, 1.22, -0.16]} rotation={[0.3,0.2,0]} material={hairMat}>
            <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
          </mesh>
          <mesh position={[-0.14, 1.22, -0.16]} rotation={[0.3,-0.2,0]} material={hairMat}>
            <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
          </mesh>
        </>
      )}
      {cfg.hairStyle === 3 && (
        <>
          <mesh position={[0, 1.52, 0]} material={hairMat}>
            <sphereGeometry args={[0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </mesh>
          <mesh position={[0.26, 1.58, 0]} material={hairMat}>
            <sphereGeometry args={[0.1, 8, 8]} />
          </mesh>
          <mesh position={[-0.26, 1.58, 0]} material={hairMat}>
            <sphereGeometry args={[0.1, 8, 8]} />
          </mesh>
          <mesh position={[0.26, 1.42, 0]} rotation={[0,0,0.2]} material={hairMat}>
            <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          </mesh>
          <mesh position={[-0.26, 1.42, 0]} rotation={[0,0,-0.2]} material={hairMat}>
            <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          </mesh>
        </>
      )}
      {cfg.hairStyle === 4 && (
        <>
          <mesh position={[0, 1.52, 0]} material={hairMat}>
            <sphereGeometry args={[0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </mesh>
          <mesh position={[0.22, 1.38, 0.08]} rotation={[0.1, 0, 0.5]} material={hairMat}>
            <capsuleGeometry args={[0.06, 0.26, 4, 8]} />
          </mesh>
        </>
      )}
      {cfg.hairStyle === 5 && (
        <>
          <mesh position={[0, 1.52, 0]} material={hairMat}>
            <sphereGeometry args={[0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </mesh>
          {[0,1,2,3,4,5].map(i => (
            <mesh key={i} position={[Math.sin(i*1.05)*0.18, 1.62+Math.cos(i*0.9)*0.04, Math.cos(i*1.05)*0.18]} material={hairMat}>
              <coneGeometry args={[0.055, 0.18, 6]} />
            </mesh>
          ))}
        </>
      )}

      {/* ── Cape ── */}
      {cfg.capeStyle > 0 && (
        <mesh ref={capeRef} position={[0, 0.92, -0.18]} rotation={[-0.15, 0, 0]} material={capeMat}>
          <coneGeometry args={[
            cfg.capeStyle === 4 ? 0.52 : 0.48,
            cfg.capeStyle === 1 ? 0.82 : cfg.capeStyle === 3 ? 0.72 : 0.78,
            cfg.capeStyle === 4 ? 10 : 8,
            1,
            true
          ]} />
        </mesh>
      )}
      {cfg.capeStyle === 1 && (
        // Star pattern on Starfield cape — small glow dots
        [[-0.1,0.85],[ 0.08,0.72],[-0.06,0.62],[0.12,0.58],[-0.14,0.52]].map(([ox,oy],i) => (
          <mesh key={i} position={[ox as number, oy as number, -0.28]} material={glowMat}>
            <sphereGeometry args={[0.016, 4, 4]} />
          </mesh>
        ))
      )}

      {/* ── Mask ── */}
      {cfg.maskStyle === 1 && (
        <mesh position={[0, 1.3, 0.27]} material={whiteMat}>
          <torusGeometry args={[0.1, 0.022, 6, 16, Math.PI]} />
        </mesh>
      )}
      {cfg.maskStyle === 2 && (
        <mesh position={[0, 1.35, 0.28]} rotation={[0,0,0]} material={whiteMat}>
          <sphereGeometry args={[0.065, 6, 6]} />
        </mesh>
      )}
      {cfg.maskStyle === 3 && (
        <mesh position={[0, 1.3, 0.27]} rotation={[0,0,0]} material={whiteMat}>
          <torusGeometry args={[0.07, 0.018, 6, 12]} />
        </mesh>
      )}
      {cfg.maskStyle === 4 && (
        <mesh position={[0, 1.33, 0.27]} material={whiteMat}>
          <circleGeometry args={[0.09, 8]} />
        </mesh>
      )}

      {/* ── Accessories ── */}
      {cfg.accessory === 1 && (
        // Flower crown
        [0,1,2,3,4,5,6].map(i => (
          <mesh key={i}
            position={[
              Math.sin(i * Math.PI * 2 / 7) * 0.26,
              1.6,
              Math.cos(i * Math.PI * 2 / 7) * 0.26
            ]}
            material={new THREE.MeshToonMaterial({ color: ['#f472b6','#fb923c','#facc15','#4ade80','#60a5fa'][i%5] })}
          >
            <sphereGeometry args={[0.042, 6, 6]} />
          </mesh>
        ))
      )}
      {cfg.accessory === 2 && (
        // Star pin
        <mesh position={[0.22, 1.55, 0.12]} material={new THREE.MeshToonMaterial({ color:'#fbbf24', emissive:'#fbbf24', emissiveIntensity:0.6 })}>
          <octahedronGeometry args={[0.06]} />
        </mesh>
      )}
      {cfg.accessory === 3 && (
        // Leaf clip
        <mesh position={[-0.2, 1.55, 0.1]} rotation={[0,0,0.4]} material={new THREE.MeshToonMaterial({ color:'#4ade80' })}>
          <capsuleGeometry args={[0.03, 0.1, 3, 6]} />
        </mesh>
      )}
      {cfg.accessory === 4 && (
        // Cloud band
        <mesh position={[0, 1.62, 0]} rotation={[Math.PI/2, 0, 0]} material={new THREE.MeshToonMaterial({ color:'#e2e8f0', transparent:true, opacity:0.9 })}>
          <torusGeometry args={[0.28, 0.042, 6, 20]} />
        </mesh>
      )}

      {/* ── Ground glow ── */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]} material={glowMat}>
        <circleGeometry args={[0.32, 24]} />
      </mesh>

    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Scene
// ─────────────────────────────────────────────────────────────
function AvatarScene({ cfg }: { cfg: AvatarConfig }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow />
      <pointLight position={[-2, 2, 2]} intensity={0.5} color={cfg.glowColor} />
      <pointLight position={[0, -0.5, 1]} intensity={0.4} color={cfg.capeColor} />
      <Suspense fallback={null}>
        <Environment preset="sunset" />
        <SkyCharacter cfg={cfg} rotate />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
        autoRotate={false}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────
function Swatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-full border-2 transition-all duration-150"
      style={{
        background: color,
        borderColor: active ? '#fff' : 'transparent',
        boxShadow: active ? `0 0 8px ${color}` : 'none',
        transform: active ? 'scale(1.22)' : 'scale(1)',
      }}
    />
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">{label}</span>
      <div className="flex flex-wrap gap-2 items-center">{children}</div>
    </div>
  );
}

function Cycler({ options, value, onChange }: { options: string[]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange((value - 1 + options.length) % options.length)}
        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition"
      >◀</button>
      <span className="text-white text-sm font-medium min-w-[90px] text-center">{options[value]}</span>
      <button
        onClick={() => onChange((value + 1) % options.length)}
        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition"
      >▶</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
interface Props {
  onEnterWorld: (cfg: AvatarConfig) => void;
}

export const AvatarCreator: React.FC<Props> = ({ onEnterWorld }) => {
  const [cfg, setCfg] = useState<AvatarConfig>({ ...DEFAULT_AVATAR });
  const [nameError, setNameError] = useState('');
  const setAvatarUrl  = useHeartboundStore(s => s.setAvatarUrl);
  const setPlayerName = useHeartboundStore(s => s.setPlayerName);

  const update = useCallback(<K extends keyof AvatarConfig>(key: K, val: AvatarConfig[K]) => {
    setCfg(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleRandom = useCallback(() => {
    const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    setCfg(prev => ({
      ...prev,
      skinTone:  rand(SKIN_TONES),
      hairStyle: Math.floor(Math.random() * HAIR_NAMES.length),
      hairColor: rand(HAIR_COLORS),
      eyeColor:  rand(EYE_COLORS),
      capeColor: rand(CAPE_COLORS),
      capeStyle: Math.floor(Math.random() * CAPE_NAMES.length),
      maskStyle: Math.floor(Math.random() * MASK_NAMES.length),
      accessory: Math.floor(Math.random() * ACCESSORY_NAMES.length),
      glowColor: rand(GLOW_COLORS),
    }));
  }, []);

  const handleEnter = useCallback(() => {
    if (!cfg.name.trim()) { setNameError('Please enter your name'); return; }
    if (cfg.name.trim().length < 2) { setNameError('Name must be at least 2 characters'); return; }
    setNameError('');
    // Encode config as URL-safe string to store as avatarUrl
    const encoded = btoa(JSON.stringify(cfg));
    setAvatarUrl(encoded);
    setPlayerName(cfg.name.trim());
    onEnterWorld(cfg);
  }, [cfg, setAvatarUrl, setPlayerName, onEnterWorld]);

  return (
    <div
      className="min-h-screen w-full flex flex-col md:flex-row items-stretch"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a0533 40%, #0d1b3e 100%)',
      }}
    >
      {/* ── 3D Preview ── */}
      <div className="flex-1 min-h-[320px] md:min-h-0 relative">
        <Canvas
          camera={{ position: [0, 1, 3.2], fov: 42 }}
          shadows
          className="w-full h-full"
          style={{ background: 'transparent' }}
        >
          <AvatarScene cfg={cfg} />
        </Canvas>

        {/* Title overlay */}
        <div className="absolute top-6 left-0 right-0 text-center pointer-events-none">
          <h1 className="text-3xl font-bold text-white tracking-wide" style={{ textShadow: '0 0 20px rgba(167,139,250,0.8)' }}>
            Heartbound Adventures
          </h1>
          <p className="text-white/50 text-sm mt-1">Create your Sky traveller</p>
        </div>

        {/* Drag hint */}
        <p className="absolute bottom-4 left-0 right-0 text-center text-white/30 text-xs pointer-events-none">
          Drag to rotate preview
        </p>
      </div>

      {/* ── Customiser panel ── */}
      <div
        className="w-full md:w-[360px] flex flex-col gap-5 p-6 overflow-y-auto"
        style={{ background: 'rgba(10,8,30,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <h2 className="text-white font-bold text-lg">Customise</h2>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Your Name</span>
          <input
            value={cfg.name}
            onChange={e => { update('name', e.target.value); setNameError(''); }}
            maxLength={20}
            placeholder="Enter your name…"
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition"
          />
          {nameError && <span className="text-red-400 text-xs">{nameError}</span>}
        </div>

        {/* Skin */}
        <Row label="Skin Tone">
          {SKIN_TONES.map(c => <Swatch key={c} color={c} active={cfg.skinTone===c} onClick={() => update('skinTone', c)} />)}
        </Row>

        {/* Hair style */}
        <Row label="Hair Style">
          <Cycler options={HAIR_NAMES} value={cfg.hairStyle} onChange={v => update('hairStyle', v)} />
        </Row>

        {/* Hair colour */}
        <Row label="Hair Colour">
          {HAIR_COLORS.map(c => <Swatch key={c} color={c} active={cfg.hairColor===c} onClick={() => update('hairColor', c)} />)}
        </Row>

        {/* Eye colour */}
        <Row label="Eye Colour">
          {EYE_COLORS.map(c => <Swatch key={c} color={c} active={cfg.eyeColor===c} onClick={() => update('eyeColor', c)} />)}
        </Row>

        {/* Cape style */}
        <Row label="Cape Style">
          <Cycler options={CAPE_NAMES} value={cfg.capeStyle} onChange={v => update('capeStyle', v)} />
        </Row>

        {/* Cape colour */}
        <Row label="Cape Colour">
          {CAPE_COLORS.map(c => <Swatch key={c} color={c} active={cfg.capeColor===c} onClick={() => update('capeColor', c)} />)}
        </Row>

        {/* Mask */}
        <Row label="Face Mask">
          <Cycler options={MASK_NAMES} value={cfg.maskStyle} onChange={v => update('maskStyle', v)} />
        </Row>

        {/* Accessory */}
        <Row label="Accessory">
          <Cycler options={ACCESSORY_NAMES} value={cfg.accessory} onChange={v => update('accessory', v)} />
        </Row>

        {/* Glow */}
        <Row label="Soul Glow">
          {GLOW_COLORS.map(c => <Swatch key={c} color={c} active={cfg.glowColor===c} onClick={() => update('glowColor', c)} />)}
        </Row>

        {/* Divider */}
        <div className="h-px bg-white/10" />

        {/* Buttons */}
        <button
          onClick={handleRandom}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/70 border border-white/20 hover:bg-white/10 transition"
        >
          🎲 Randomise
        </button>

        <button
          onClick={handleEnter}
          className="w-full py-3 rounded-xl text-base font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${cfg.capeColor}, ${cfg.glowColor})`,
            boxShadow: `0 0 24px ${cfg.glowColor}60`,
          }}
        >
          ✨ Enter World
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Export character renderer for use inside the 3D world
// ─────────────────────────────────────────────────────────────
export { SkyCharacter };
export type { CharacterProps };
