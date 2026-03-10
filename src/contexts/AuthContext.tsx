import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  deleteUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isEmailAllowed, AUTH_ERRORS, getDisplayNameFromEmail } from '@/lib/auth-config';
import type { User, AuthState } from '@/types/auth.types';

interface AuthContextType extends AuthState {
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Sign up with email
  const signUpWithEmail = async (email: string, password: string) => {
    setError(null);

    if (!isEmailAllowed(email)) {
      throw new Error(AUTH_ERRORS.UNAUTHORIZED_EMAIL);
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error(AUTH_ERRORS.EMAIL_IN_USE);
      } else if (err.code === 'auth/weak-password') {
        throw new Error(AUTH_ERRORS.WEAK_PASSWORD);
      } else if (err.code === 'auth/network-request-failed') {
        throw new Error(AUTH_ERRORS.NETWORK_ERROR);
      } else if (err.message === AUTH_ERRORS.UNAUTHORIZED_EMAIL) {
        throw err;
      } else {
        throw new Error(AUTH_ERRORS.UNKNOWN_ERROR);
      }
    }
  };

  // Sign in with email
  const signInWithEmail = async (email: string, password: string) => {
    setError(null);

    if (!isEmailAllowed(email)) {
      throw new Error(AUTH_ERRORS.UNAUTHORIZED_EMAIL);
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // Firebase SDK v9+ unified these into auth/invalid-credential
      if (
        err.code === 'auth/user-not-found'      ||
        err.code === 'auth/wrong-password'       ||
        err.code === 'auth/invalid-credential'
      ) {
        throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
      } else if (err.code === 'auth/network-request-failed') {
        throw new Error(AUTH_ERRORS.NETWORK_ERROR);
      } else if (err.message === AUTH_ERRORS.UNAUTHORIZED_EMAIL) {
        throw err;
      } else {
        throw new Error(AUTH_ERRORS.UNKNOWN_ERROR);
      }
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;

      if (!userEmail || !isEmailAllowed(userEmail)) {
        await deleteUser(result.user);
        await firebaseSignOut(auth);
        throw new Error(AUTH_ERRORS.ACCOUNT_DELETED);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      } else if (err.code === 'auth/network-request-failed') {
        throw new Error(AUTH_ERRORS.NETWORK_ERROR);
      } else if (err.message === AUTH_ERRORS.ACCOUNT_DELETED) {
        throw err;
      } else {
        throw new Error(AUTH_ERRORS.UNKNOWN_ERROR);
      }
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch {
      throw new Error(AUTH_ERRORS.UNKNOWN_ERROR);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email) {
        if (!isEmailAllowed(firebaseUser.email)) {
          await firebaseSignOut(auth);
          setUser(null);
          setError(AUTH_ERRORS.UNAUTHORIZED_EMAIL);
        } else {
          setUser({
            uid:         firebaseUser.uid,
            email:       firebaseUser.email,
            displayName: getDisplayNameFromEmail(firebaseUser.email),
            photoURL:    firebaseUser.photoURL || undefined,
          });
          setError(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
