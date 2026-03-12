/**
 * CharacterCustomizer
 * ─────────────────────────────────────────────────────────────────
 * Full-screen character editor with live 3D preview.
 * Now uses SkyKidCharacter (real GLB) in the preview panel.
 * Options simplified to colour pickers + height — mesh shape is
 * fixed to the Sky kid GLB.
 * Saves to Supabase on confirm (via avatarSync).
 */
import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { SkyKidCharacter, SkyKidConfig, DEFAULT_SKYKID_CONFIG } from './SkyKidCharacter';
import { saveAvatarConfig } from './avatarSync';

// ── Palettes ───────────────────────────────────────────────────────
const SKIN_TONES    = ['#fde7c3','#f5cba7','#d4a574','#c68642','#8d5524','#5c3317'];
const HAIR_COLORS   = ['#3b1f0a','#7c4b1e','#c8a96e','#d4af37','#cc0000','#9b59b6','#2196f3','#f1f1f1','#1a1a1a'];
const OUTFIT_COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f97316','#64748b','#1e293b'];
const CAPE_COLORS   = ['#6366f1','#ec4899','#10b981','#dc2626','#b45309','#1e293b','#7c3aed','#0f766e','#831843'];
const ACCENT_COLORS = ['#f472b6','#a78bfa','#34d399','#fbbf24','#f87171','#38bdf8','#c084fc','#fb923c'];

// ── Presets ────────────────────────────────────────────────────────
const PRESETS: { label: string; cfg: SkyKidConfig }[] = [
  { label: '🌿 Wanderer', cfg: { ...DEFAULT_SKYKID_CONFIG } },
  { label: '🔥 Warrior',  cfg: { ...DEFAULT_SKYKID_CONFIG, outfitColor:'#dc2626', capeColor:'#991b1b', accentColor:'#f97316' } },
  { label: '✨ Mage',     cfg: { ...DEFAULT_SKYKID_CONFIG, outfitColor:'#7c3aed', capeColor:'#4c1d95', accentColor:'#c084fc' } },
  { label: '🌸 Blossom',  cfg: { ...DEFAULT_SKYKID_CONFIG, outfitColor:'#ec4899', capeColor:'#be185d', accentColor:'#fda4af' } },
  { label: '🌊 Tide',     cfg: { ...DEFAULT_SKYKID_CONFIG, outfitColor:'#0891b2', capeColor:'#164e63', accentColor:'#38bdf8' } },
  { label: '🍂 Autumn',   cfg: { ...DEFAULT_SKYKID_CONFIG, outfitColor:'#b45309', capeColor:'#78350f', accentColor:'#fbbf24', hairColor:'#c8a96e' } },
];

// ── Sub-components ─────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

function ColorRow({ colors, active, onPick }: { colors: string[]; active: string; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map(c => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className="w-8 h-8 rounded-full border-2 transition hover:scale-110 active:scale-95"
          style={{ background: c, borderColor: active === c ? 'white' : 'rgba(255,255,255,0.15)' }}
        />
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────
interface Props {
  initial?:    Partial<SkyKidConfig>;
  userEmail:   string;
  onConfirm:   (cfg: SkyKidConfig) => void;
  onCancel?:   () => void;
}

export function CharacterCustomizer({ initial, userEmail, onConfirm, onCancel }: Props) {
  const [cfg, setCfg] = useState<SkyKidConfig>({ ...DEFAULT_SKYKID_CONFIG, ...initial });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'colours' | 'presets'>('colours');

  const set = useCallback(<K extends keyof SkyKidConfig>(key: K, val: SkyKidConfig[K]) => {
    setCfg(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    // avatarSync still expects AvatarConfigV2 shape — bridge the fields
    await saveAvatarConfig(userEmail, {
      skinTone:    cfg.skinTone,
      hairColor:   cfg.hairColor,
      hairStyle:   'flowing',
      outfitColor: cfg.outfitColor,
      accessory:   'none',
      capeColor:   cfg.capeColor,
      capeAccent:  cfg.accentColor,
      capeStyle:   'standard',
      maskStyle:   'none',
      accentColor: cfg.accentColor,
      height:      cfg.height,
    } as any);
    setSaving(false);
    onConfirm(cfg);
  }, [cfg, userEmail, onConfirm]);

  const tabs = [
    { key: 'colours' as const, label: '🎨 Colours' },
    { key: 'presets' as const, label: '✨ Presets'  },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-auto py-6"
      style={{ background: 'linear-gradient(135deg,#0a1628 0%,#0d2218 60%,#0a1628 100%)' }}
    >
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-white">🌿 Your Sky Kid</h1>
        <p className="text-white/35 text-sm mt-1">Customise your colours — changes are saved to your profile</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5 w-full max-w-2xl px-4">

        {/* ── 3D Preview ── */}
        <div
          className="w-full md:w-60 flex-shrink-0 rounded-2xl overflow-hidden"
          style={{
            height: 320,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.18), rgba(0,0,0,0.6))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Canvas camera={{ position: [0, 1.2, 2.8], fov: 50 }} style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={1.0} />
            <directionalLight position={[3, 5, 3]}  intensity={2.0} />
            <directionalLight position={[-3, 2, 3]} intensity={0.5} color="#b0c8f8" />
            <Suspense fallback={null}>
              <Environment preset="sunset" />
              <group position={[0, -1.1, 0]}>
                <SkyKidCharacter
                  config={cfg}
                  name=""
                  isMe={false}
                  staticPos={[0, 0, 0]}
                />
              </group>
            </Suspense>
            <OrbitControls
              enableZoom
              enablePan={false}
              minDistance={1.8}
              maxDistance={4.5}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.8}
              autoRotate
              autoRotateSpeed={1.8}
              target={[0, 0.3, 0]}
            />
          </Canvas>
          <p className="text-center text-white/20 text-xs py-1 -mt-6 relative z-10 pointer-events-none">
            drag · scroll to zoom
          </p>
        </div>

        {/* ── Editor panel ── */}
        <div className="flex-1 flex flex-col" style={{ minHeight: 320 }}>

          {/* Tab bar */}
          <div className="flex rounded-xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 text-sm font-semibold transition ${
                  tab === t.key ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 space-y-5 overflow-y-auto max-h-[48vh] pr-1">

            {tab === 'colours' && (
              <>
                <Section label="Outfit Colour">
                  <ColorRow colors={OUTFIT_COLORS} active={cfg.outfitColor} onPick={c => set('outfitColor', c)} />
                </Section>

                <Section label="Cape Colour">
                  <ColorRow colors={CAPE_COLORS} active={cfg.capeColor} onPick={c => set('capeColor', c)} />
                </Section>

                <Section label="Hair Colour">
                  <ColorRow colors={HAIR_COLORS} active={cfg.hairColor} onPick={c => set('hairColor', c)} />
                </Section>

                <Section label="Accent / Trim">
                  <ColorRow colors={ACCENT_COLORS} active={cfg.accentColor} onPick={c => set('accentColor', c)} />
                </Section>

                <Section label="Skin Tone">
                  <ColorRow colors={SKIN_TONES} active={cfg.skinTone} onPick={c => set('skinTone', c)} />
                </Section>

                <Section label="Height">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-xs">Short</span>
                    <input
                      type="range" min={0.8} max={1.2} step={0.01}
                      value={cfg.height}
                      onChange={e => set('height', parseFloat(e.target.value))}
                      className="flex-1 accent-pink-400"
                    />
                    <span className="text-white/40 text-xs">Tall</span>
                    <span className="text-white/60 text-xs w-8 text-right">{cfg.height.toFixed(2)}×</span>
                  </div>
                </Section>
              </>
            )}

            {tab === 'presets' && (
              <>
                <Section label="Choose a Preset">
                  <div className="grid grid-cols-2 gap-3">
                    {PRESETS.map(({ label, cfg: preset }) => (
                      <button
                        key={label}
                        onClick={() => setCfg(preset)}
                        className="py-3 rounded-2xl text-sm font-semibold text-white transition hover:scale-[1.03] active:scale-95"
                        style={{
                          background: `linear-gradient(135deg, ${preset.outfitColor}55, ${preset.capeColor}33)`,
                          border: `1px solid ${preset.outfitColor}55`,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section label="Reset">
                  <button
                    onClick={() => setCfg(DEFAULT_SKYKID_CONFIG)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Reset to defaults
                  </button>
                </Section>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white/50 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="px-10 py-3 rounded-2xl text-base font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)', boxShadow: '0 4px 24px rgba(99,102,241,0.4)' }}
        >
          {saving ? 'Saving…' : 'Enter Meadow Haven 🌿'}
        </button>
      </div>
    </div>
  );
}
