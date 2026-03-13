import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatarProfile } from '../../hooks/useAvatarProfile';
import { AvatarSetup } from '../avatar/AvatarSetup';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { loading: avatarLoading, hasAvatar } = useAvatarProfile(user?.uid ?? null);

  // 1. Firebase auth still loading
  if (loading || avatarLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-heartbeat mb-4">💕</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your couple space…</p>
        </div>
      </div>
    );
  }

  // 2. Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Logged in but no avatar yet → show avatar setup
  if (!hasAvatar) {
    return (
      <AvatarSetup
        firebaseUid={user.uid}
        onComplete={() => window.location.reload()}
      />
    );
  }

  // 4. All good → show the page
  return <>{children}</>;
};
