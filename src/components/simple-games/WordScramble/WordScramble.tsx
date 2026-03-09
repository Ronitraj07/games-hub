import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const WordScramble: React.FC = () => {
  const { user } = useAuth();
  return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><h1 className="text-4xl font-bold">Word Scramble</h1><p className="mt-4">Coming Soon!</p><p className="text-sm text-gray-500 mt-2">Playing as: {user?.email}</p></div></div>;
};