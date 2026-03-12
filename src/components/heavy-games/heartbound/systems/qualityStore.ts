// ─────────────────────────────────────────────────────────────────────────────
// systems/qualityStore.ts  —  Quality tier detection + settings map
// ─────────────────────────────────────────────────────────────────────────────
import type { QualityTier, QualitySettings } from '../character/types';

// ── Settings per tier ────────────────────────────────────────────────────────
export const QUALITY_SETTINGS: Record<QualityTier, QualitySettings> = {
  ultra: {
    chunkRadius:        1,    // 3×3 active chunks
    grassDensity:       12000,
    shadowMapSize:      2048,
    shadowsEnabled:     true,
    postProcessing:     ['ssao', 'bloom', 'vignette'],
    waterResolution:    512,
    waterReflections:   true,
    treeLODDistance:    60,
    particleMultiplier: 1.0,
    capeSegments:       8,
    rainParticles:      1200,
  },
  high: {
    chunkRadius:        1,
    grassDensity:       8000,
    shadowMapSize:      1024,
    shadowsEnabled:     true,
    postProcessing:     ['bloom', 'vignette'],
    waterResolution:    256,
    waterReflections:   true,
    treeLODDistance:    45,
    particleMultiplier: 0.65,
    capeSegments:       8,
    rainParticles:      700,
  },
  medium: {
    chunkRadius:        0,    // 2×2 — just centre + 1 ring = not used, handled as radius 0 = 1 chunk
    grassDensity:       4000,
    shadowMapSize:      512,
    shadowsEnabled:     true,
    postProcessing:     ['vignette'],
    waterResolution:    128,
    waterReflections:   false,
    treeLODDistance:    30,
    particleMultiplier: 0.35,
    capeSegments:       5,
    rainParticles:      300,
  },
  low: {
    chunkRadius:        0,
    grassDensity:       0,
    shadowMapSize:      0,
    shadowsEnabled:     false,
    postProcessing:     [],
    waterResolution:    0,
    waterReflections:   false,
    treeLODDistance:    15,
    particleMultiplier: 0.1,
    capeSegments:       3,
    rainParticles:      0,
  },
};

// ── Auto-detect GPU tier ─────────────────────────────────────────────────────
export function detectQualityTier(): QualityTier {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'low';
    const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!ext) return 'medium';
    const renderer = (gl as WebGLRenderingContext)
      .getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
    // Mobile / integrated → low or medium
    if (/Intel HD|Intel UHD 4|Intel UHD 5|Mali-4|Mali-T|Adreno 3|Adreno 4|PowerVR/i.test(renderer)) return 'low';
    if (/Intel UHD 6|Adreno 5|Adreno 6|Mali-G5|Mali-G7|Apple GPU/i.test(renderer))                  return 'medium';
    // Mid-range desktop
    if (/GTX 7|GTX 8|GTX 9[0-4]|RX 4|RX 5[0-4]|GTX 10[0-5]/i.test(renderer))                      return 'high';
    // High-end
    return 'ultra';
  } catch {
    return 'medium';
  }
}

// ── Get active settings (call once per component tree) ───────────────────────
export function getQualitySettings(tier: QualityTier): QualitySettings {
  return QUALITY_SETTINGS[tier];
}
