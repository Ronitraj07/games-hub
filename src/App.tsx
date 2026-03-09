import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { Layout } from './components/layout/Layout';

// Pages (to be created)
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';
import { GameLobby } from './pages/GameLobby';

// Games
import { TicTacToe } from './components/simple-games/TicTacToe/TicTacToe';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <Layout>
                  <Home />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <Layout>
                  <Profile />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/lobby"
            element={
              <AuthGuard>
                <Layout>
                  <GameLobby />
                </Layout>
              </AuthGuard>
            }
          />
          
          {/* Game routes */}
          <Route
            path="/games/tictactoe"
            element={
              <AuthGuard>
                <Layout>
                  <TicTacToe />
                </Layout>
              </AuthGuard>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;