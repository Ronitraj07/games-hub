// ============================================================
// useHeartboundPresence — real-time player positions & states
// Replaces the basic useHeartboundSync for the new system
// ============================================================
import { useEffect, useRef, useCallback } from 'react';
import { ref, set, onValue, off, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import type { HeartboundPlayerState, IslandId, AnimationState } from '../../types/heartbound.types';

interface UseHeartboundPresenceOptions {
  email: string;
  name: string;
  avatarUrl: string;
  islandId: IslandId;
  onPlayersUpdate: (players: Record<string, HeartboundPlayerState>) => void;
}

const PUBLISH_THROTTLE_MS = 50; // 20 updates/sec max

export function useHeartboundPresence({
  email,
  name,
  avatarUrl,
  islandId,
  onPlayersUpdate,
}: UseHeartboundPresenceOptions) {
  const pathKey    = email.replace(/[.#$[\]]/g, '_');
  const playerRef  = ref(db, `heartbound/players/${pathKey}`);
  const islandRef  = ref(db, `heartbound/islands/${islandId}/players`);
  const lastPublish = useRef(0);
  const pendingState = useRef<Partial<HeartboundPlayerState> | null>(null);

  // Mark online on mount, offline on unmount
  useEffect(() => {
    const state: HeartboundPlayerState = {
      email, name, avatarUrl,
      x: 0, z: 0,
      islandId,
      animationState: 'idle',
      facingAngle: 0,
      online: true,
      lastSeen: Date.now(),
    };
    set(playerRef, { ...state, lastSeen: serverTimestamp() });

    return () => {
      set(playerRef, { ...state, online: false, lastSeen: serverTimestamp() });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // Subscribe to all players on this island
  useEffect(() => {
    const handleSnapshot = (snap: any) => {
      if (!snap.exists()) return;
      onPlayersUpdate(snap.val() as Record<string, HeartboundPlayerState>);
    };
    onValue(islandRef, handleSnapshot);
    return () => off(islandRef, 'value', handleSnapshot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [islandId]);

  // Throttled publish
  const publish = useCallback((
    x: number,
    z: number,
    animationState: AnimationState,
    facingAngle: number,
  ) => {
    const now = Date.now();
    if (now - lastPublish.current < PUBLISH_THROTTLE_MS) return;
    lastPublish.current = now;
    set(playerRef, {
      email, name, avatarUrl,
      x, z, islandId,
      animationState, facingAngle,
      online: true,
      lastSeen: serverTimestamp(),
    });
  }, [email, name, avatarUrl, islandId, playerRef]);

  return { publish };
}
