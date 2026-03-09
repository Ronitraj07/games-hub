import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { Layout } from './components/layout/Layout';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';
import { GameLobby } from './pages/GameLobby';
import { RPGHub } from './pages/RPGHub';

// RPG Games
import { HeartboundAdventures, MysteryPartners } from './pages/rpg';

// Simple Games - ALL 8 COMPLETE!
import { TicTacToe } from './components/simple-games/TicTacToe/TicTacToe';
import { WordScramble } from './components/simple-games/WordScramble/WordScramble';
import { MemoryMatch } from './components/simple-games/MemoryMatch/MemoryMatch';
import { TriviaQuiz } from './components/simple-games/TriviaQuiz/TriviaQuiz';
import { Connect4 } from './components/simple-games/Connect4/Connect4';
import { RockPaperScissors } from './components/simple-games/RockPaperScissors/RockPaperScissors';
import { Pictionary } from './components/simple-games/Pictionary/Pictionary';
import { MathDuel } from './components/simple-games/MathDuel/MathDuel';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
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

            {/* RPG Hub */}
            <Route
              path="/rpg"
              element={
                <AuthGuard>
                  <Layout>
                    <RPGHub />
                  </Layout>
                </AuthGuard>
              }
            />

            {/* RPG Games */}
            <Route
              path="/rpg/heartbound"
              element={
                <AuthGuard>
                  <Layout>
                    <HeartboundAdventures />
                  </Layout>
                </AuthGuard>
              }
            />
            <Route
              path="/rpg/mystery"
              element={
                <AuthGuard>
                  <Layout>
                    <MysteryPartners />
                  </Layout>
                </AuthGuard>
              }
            />
            
            {/* Simple Game Routes - ALL 8 GAMES */}
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
            <Route
              path="/games/wordscramble"
              element={
                <AuthGuard>
                  <Layout>
                    <WordScramble />
                  </Layout>
                </AuthGuard>
              }
            />
            <Route
              path="/games/memorymatch"
              element={
                <AuthGuard>
                  <Layout>
                    <MemoryMatch />
                  </Layout>
                </AuthGuard>
              }
            />
            <Route
              path="/games/trivia"
              element={
                <AuthGuard>
                  <Layout>
                    <TriviaQuiz />
                  </Layout>
                </AuthGuard>
              }
            />
            <Route
              path="/games/connect4"
              element={
                <AuthGuard>
                  <Layout>
                    <Connect4 />
                  </Layout>
                </AuthGuard>
              }
            />
            <Route
              path="/games/rps"
              element={
                <AuthGuard>
                  <Layout>
                    <RockPaperScissors />
                  </Layout>
                </AuthGuard>
              }
            />
            <Route
              path="/games/pictionary"
              element={
                <AuthGuard>
                  <Layout>
                    <Pictionary />
                  </Layout>
                </AuthGuard>
              }
            />
            <Route
              path="/games/mathduel"
              element={
                <AuthGuard>
                  <Layout>
                    <MathDuel />
                  </Layout>
                </AuthGuard>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;