/**
 * ControlsPanel
 * -------------
 * In-game settings panel for remapping movement keys.
 * Persisted to localStorage under key 'heartbound-controls'.
 *
 * Usage:
 *   <ControlsPanel controls={controls} onChange={setControls} onClose={...} />
 */
import React, { useState, useEffect, useCallback } from 'react';

export interface ControlsConfig {
  up:    string;
  down:  string;
  left:  string;
  right: string;
}

export const DEFAULT_CONTROLS: ControlsConfig = {
  up:    'ArrowUp',
  down:  'ArrowDown',
  left:  'ArrowLeft',
  right: 'ArrowRight',
};

const STORAGE_KEY = 'heartbound-controls';

export const loadControls = (): ControlsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONTROLS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONTROLS;
};

export const saveControls = (c: ControlsConfig) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
};

const DIR_LABELS: { key: keyof ControlsConfig; label: string; arrow: string }[] = [
  { key: 'up',    label: 'Move Up',    arrow: '↑' },
  { key: 'down',  label: 'Move Down',  arrow: '↓' },
  { key: 'left',  label: 'Move Left',  arrow: '←' },
  { key: 'right', label: 'Move Right', arrow: '→' },
];

const prettyKey = (k: string): string => {
  const map: Record<string, string> = {
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    ' ': 'Space', Escape: 'Esc', Control: 'Ctrl', Shift: 'Shift',
  };
  return map[k] ?? k.toUpperCase();
};

interface Props {
  controls: ControlsConfig;
  onChange: (c: ControlsConfig) => void;
  onClose:  () => void;
}

export const ControlsPanel: React.FC<Props> = ({ controls, onChange, onClose }) => {
  const [binding, setBinding]   = useState<keyof ControlsConfig | null>(null);
  const [local,   setLocal]     = useState<ControlsConfig>(controls);
  const [saved,   setSaved]     = useState(false);

  // Listen for key when binding
  useEffect(() => {
    if (!binding) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Ignore Escape — cancel binding
      if (e.key === 'Escape') { setBinding(null); return; }
      // Prevent duplicate bindings
      const conflict = Object.entries(local).find(
        ([k, v]) => v === e.key && k !== binding
      );
      if (conflict) return; // silently ignore conflicts
      setLocal(prev => ({ ...prev, [binding]: e.key }));
      setBinding(null);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [binding, local]);

  const handleSave = useCallback(() => {
    saveControls(local);
    onChange(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [local, onChange]);

  const handleReset = useCallback(() => {
    setLocal(DEFAULT_CONTROLS);
    saveControls(DEFAULT_CONTROLS);
    onChange(DEFAULT_CONTROLS);
  }, [onChange]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            ⚙️ Controls
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-xl leading-none">×</button>
        </div>

        {/* Key bindings */}
        <div className="space-y-3 mb-6">
          {DIR_LABELS.map(({ key, label, arrow }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">
                <span className="text-white font-bold mr-2">{arrow}</span>{label}
              </span>
              <button
                onClick={() => setBinding(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-mono font-bold transition min-w-[80px] text-center ${
                  binding === key
                    ? 'bg-pink-500 text-white animate-pulse'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {binding === key ? 'Press key…' : prettyKey(local[key])}
              </button>
            </div>
          ))}
        </div>

        {binding && (
          <p className="text-center text-xs text-pink-300 mb-4">
            Press any key to bind — Esc to cancel
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-2 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10 transition"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 transition"
          >
            {saved ? '✓ Saved!' : 'Save'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-3">Settings saved locally to your browser</p>
      </div>
    </div>
  );
};
