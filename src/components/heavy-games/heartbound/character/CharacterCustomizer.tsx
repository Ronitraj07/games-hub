/**
 * CharacterCustomizer
 * Full-screen character editor with live 3D preview.
 * Saves avatar_config to Supabase player_profiles on confirm.
 */
import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { SkyCharacterV2, AvatarConfigV2, DEFAULT_AVATAR_V2 } from './SkyCharacterV2';
import { saveAvatarConfig } from './avatarSync';

// ── Palette data ───────────────────────────────────────────────────
const SKIN_TONES    = ['#fde7c3','#f5cba7','#d4a574','#c68642','#8d5524','#5c3317'];
const HAIR_COLORS   = ['#3b1f0a','#7c4b1e','#c8a96e','#d4af37','#cc0000','#9b59b6','#2196f3','#f1f1f1','#1a1a1a'];
const OUTFIT_COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f97316','#64748b'];
const CAPE_COLORS   = ['#6366f1','#ec4899','#10b981','#dc2626','#b45309','#1e293b','#7c3aed','#0f766e'];
const ACCENT_COLORS = ['#f472b6','#a78bfa','#34d399','#fbbf24','#f87171','#38bdf8','#c084fc'];

const HAIR_STYLES: Array<AvatarConfigV2['hairStyle']> = ['short','long','bun','none','flowing','wild','windswept'];
const HAIR_LABELS: Record<AvatarConfigV2['hairStyle'], string> = {
  short:'Short', long:'Long', bun:'Bun', none:'None',
  flowing:'Flowing', wild:'Wild', windswept:'Windswept',
};

const CAPE_STYLES: Array<AvatarConfigV2['capeStyle']> = ['standard','tattered','royal','none'];
const CAPE_LABELS: Record<AvatarConfigV2['capeStyle'], string> = {
  standard:'Standard', tattered:'Tattered', royal:'Royal', none:'None',
};

const MASK_STYLES: Array<AvatarConfigV2['maskStyle']> = ['none','half','full','visor'];
const MASK_LABELS: Record<AvatarConfigV2['maskStyle'], string> = {
  none:'None', half:'Half', full:'Full', visor:'Visor',
};

const ACCESSORIES: Array<AvatarConfigV2['accessory']> = ['none','hat','crown','halo'];
const ACC_LABELS:  Record<AvatarConfigV2['accessory'], string> = {
  none:'None', hat:'🎩 Hat', crown:'👑 Crown', halo:'😇 Halo',
};

// ── Section sub-component ─────────────────────────────────────────
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
        <button key={c} onClick={() => onPick(c)}
          className="w-8 h-8 rounded-full border-2 transition hover:scale-110"
          style={{ background: c, borderColor: active === c ? 'white' : 'transparent' }} />
      ))}
    </div>
  );
}

function ChipRow<T extends string>({
  options, labels, active, onPick,
}: { options: T[]; labels: Record<T, string>; active: T; onPick: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} onClick={() => onPick(o)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            active === o ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
          }`}>{labels[o]}</button>
      ))}
    </div>
  );
}

// ── Height slider ─────────────────────────────────────────────────
function HeightSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/40 text-xs">Short</span>
      <input type="range" min={0.8} max={1.2} step={0.01} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-pink-400" />
      <span className="text-white/40 text-xs">Tall</span>
      <span className="text-white/70 text-xs w-8 text-right">{value.toFixed(2)}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
interface CharacterCustomizerProps {
  initial?: Partial<AvatarConfigV2>;
  userEmail: string;
  onConfirm: (cfg: AvatarConfigV2) => void;
  onCancel?: () => void;
}

export function CharacterCustomizer({
  initial, userEmail, onConfirm, onCancel,
}: CharacterCustomizerProps) {
  const [cfg, setCfg] = useState<AvatarConfigV2>({ ...DEFAULT_AVATAR_V2, ...initial });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'body' | 'outfit' | 'cape' | 'advanced'>('body');

  const set = useCallback(<K extends keyof AvatarConfigV2>(key: K, val: AvatarConfigV2[K]) => {
    setCfg(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    await saveAvatarConfig(userEmail, cfg);
    setSaving(false);
    onConfirm(cfg);
  }, [cfg, userEmail, onConfirm]);

  const tabs = [
    { key: 'body'     as const, label: '🧍 Body' },
    { key: 'outfit'   as const, label: '👘 Outfit' },
    { key: 'cape'     as const, label: '🧣 Cape' },
    { key: 'advanced' as const, label: '⚙️ More' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-auto py-4"
      style={{ background: 'linear-gradient(135deg,#0a1628 0%,#0d2218 60%,#0a1628 100%)' }}>

      <div className="mb-3 text-center">
        <h1 className="text-2xl font-bold text-white">🌿 Customise Your Character</h1>
        <p className="text-white/35 text-sm mt-1">Changes are saved to your profile</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5 w-full max-w-2xl px-4">

        {/* 3D Preview */}
        <div className="w-full md:w-56 flex-shrink-0 rounded-2xl overflow-hidden"
          style={{ height: 300, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Canvas camera={{ position: [0, 0.9, 2.4], fov: 52 }} style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[3, 5, 3]} intensity={2.2} />
            <directionalLight position={[-3, 2, 3]} intensity={0.6} color="#b0c8f8" />
            <Suspense fallback={null}>
              <Environment preset="sunset" />
              <group position={[0, -0.9, 0]}>
                <SkyCharacterV2 config={cfg} name="" isMe={false} staticPos={[0, 0, 0]} />
              </group>
            </Suspense>
            <OrbitControls enableZoom enablePan={false}
              minDistance={1.5} maxDistance={4.0}
              minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.8}
              autoRotate autoRotateSpeed={1.5} target={[0, 0.1, 0]} />
          </Canvas>
          <p className="text-center text-white/20 text-xs py-1 -mt-5 relative z-10 pointer-events-none">
            drag · scroll to zoom
          </p>
        </div>

        {/* Editor panel */}
        <div className="flex-1 flex flex-col" style={{ minHeight: 300 }}>

          {/* Tab bar */}
          <div className="flex rounded-xl overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2 text-xs font-semibold transition ${
                  tab === t.key ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/60'
                }`}>{t.label}</button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[45vh] pr-1">

            {tab === 'body' && (<>
              <Section label="Skin Tone">
                <ColorRow colors={SKIN_TONES} active={cfg.skinTone} onPick={c => set('skinTone', c)} />
              </Section>
              <Section label="Hair Colour">
                <ColorRow colors={HAIR_COLORS} active={cfg.hairColor} onPick={c => set('hairColor', c)} />
              </Section>
              <Section label="Hair Style">
                <ChipRow options={HAIR_STYLES} labels={HAIR_LABELS} active={cfg.hairStyle} onPick={v => set('hairStyle', v)} />
              </Section>
              <Section label="Height">
                <HeightSlider value={cfg.height} onChange={v => set('height', v)} />
              </Section>
            </>)}

            {tab === 'outfit' && (<>
              <Section label="Outfit Colour">
                <ColorRow colors={OUTFIT_COLORS} active={cfg.outfitColor} onPick={c => set('outfitColor', c)} />
              </Section>
              <Section label="Accent Colour">
                <ColorRow colors={ACCENT_COLORS} active={cfg.accentColor} onPick={c => set('accentColor', c)} />
              </Section>
              <Section label="Accessory">
                <ChipRow options={ACCESSORIES} labels={ACC_LABELS} active={cfg.accessory} onPick={v => set('accessory', v)} />
              </Section>
              <Section label="Mask">
                <ChipRow options={MASK_STYLES} labels={MASK_LABELS} active={cfg.maskStyle} onPick={v => set('maskStyle', v)} />
              </Section>
            </>)}

            {tab === 'cape' && (<>
              <Section label="Cape Style">
                <ChipRow options={CAPE_STYLES} labels={CAPE_LABELS} active={cfg.capeStyle} onPick={v => set('capeStyle', v)} />
              </Section>
              <Section label="Cape Colour">
                <ColorRow colors={CAPE_COLORS} active={cfg.capeColor} onPick={c => set('capeColor', c)} />
              </Section>
              <Section label="Clasp / Accent Colour">
                <ColorRow colors={ACCENT_COLORS} active={cfg.capeAccent} onPick={c => set('capeAccent', c)} />
              </Section>
            </>)}

            {tab === 'advanced' && (<>
              <Section label="Preset">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '🌿 Wanderer', preset: DEFAULT_AVATAR_V2 },
                    { label: '🔥 Warrior',  preset: { ...DEFAULT_AVATAR_V2, outfitColor:'#dc2626', capeColor:'#991b1b', maskStyle:'half' as const, hairStyle:'wild' as const } },
                    { label: '✨ Mage',     preset: { ...DEFAULT_AVATAR_V2, outfitColor:'#7c3aed', capeColor:'#4c1d95', accessory:'halo' as const, hairStyle:'flowing' as const } },
                    { label: '🌸 Blossom',  preset: { ...DEFAULT_AVATAR_V2, outfitColor:'#ec4899', capeColor:'#be185d', capeAccent:'#fda4af', hairStyle:'bun' as const } },
                  ].map(({ label, preset }) => (
                    <button key={label} onClick={() => setCfg(prev => ({ ...prev, ...preset }))}
                      className="py-2 rounded-xl text-xs font-semibold text-white transition hover:bg-white/15"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </Section>
              <Section label="Reset">
                <button onClick={() => setCfg(DEFAULT_AVATAR_V2)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>Reset to defaults</button>
              </Section>
            </>)}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-5">
        {onCancel && (
          <button onClick={onCancel}
            className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white/50 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
        )}
        <button onClick={handleConfirm} disabled={saving}
          className="px-10 py-3 rounded-2xl text-base font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)' }}>
          {saving ? 'Saving…' : 'Enter Meadow Haven 🌿'}
        </button>
      </div>
    </div>
  );
}
