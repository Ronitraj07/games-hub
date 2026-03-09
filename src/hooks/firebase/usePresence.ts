import { useEffect, useRef } from 'react';
import { ref, onDisconnect, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export const usePresence = (sessionId: string) => {
  const { user } = useAuth();
  const presenceRef = useRef<any>(null);

  useEffect(() => {
    if (!user || !sessionId || !database) return;

    const userStatusRef = ref(database, `sessions/${sessionId}/presence/${user.uid}`);
    presenceRef.current = userStatusRef;

    const isOnline = {
      state: 'online',
      lastChanged: Date.now(),
      email: user.email
    };

    const isOffline = {
      state: 'offline',
      lastChanged: Date.now(),
      email: user.email
    };

    set(userStatusRef, isOnline);
    onDisconnect(userStatusRef).set(isOffline);

    return () => {
      if (presenceRef.current) {
        set(presenceRef.current, isOffline);
      }
    };
  }, [user, sessionId]);
};