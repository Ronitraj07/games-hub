import { useEffect } from 'react';
import { ref, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { database } from '../../lib/firebase';
import { useAuth } from '../shared/useAuth';

export const usePresence = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid || !user?.email) return;

    const userStatusRef = ref(database, `presence/${user.uid}`);

    // Set user as online
    const setOnline = async () => {
      await set(userStatusRef, {
        email: user.email,
        status: 'online',
        lastSeen: Date.now(),
        currentGame: null,
      });
    };

    // Set user as offline on disconnect
    onDisconnect(userStatusRef).set({
      email: user.email,
      status: 'offline',
      lastSeen: Date.now(),
      currentGame: null,
    });

    setOnline();

    // Cleanup
    return () => {
      set(userStatusRef, {
        email: user.email,
        status: 'offline',
        lastSeen: Date.now(),
        currentGame: null,
      });
    };
  }, [user]);

  const updatePresence = async (status: 'online' | 'offline' | 'in-game', currentGame?: string) => {
    if (!user?.uid || !user?.email) return;

    const userStatusRef = ref(database, `presence/${user.uid}`);
    await set(userStatusRef, {
      email: user.email,
      status,
      lastSeen: Date.now(),
      currentGame: currentGame || null,
    });
  };

  return { updatePresence };
};
