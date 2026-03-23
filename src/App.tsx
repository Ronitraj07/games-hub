import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GameProvider } from './contexts/GameContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';
import { GameLobby } from './pages/GameLobby';
import { Leaderboard } from './pages/Leaderboard';
import { TicTacToe } from './components/simple-games/TicTacToe/TicTacToe';
import { WordScramble } from './components/simple-games/WordScramble/WordScramble';
import { MemoryMatch } from './components/simple-games/MemoryMatch/MemoryMatch';
import { Connect4 } from './components/simple-games/Connect4/Connect4';
import { TriviaQuiz } from './components/simple-games/TriviaQuiz/TriviaQuiz';
import { RockPaperScissors } from './components/simple-games/RockPaperScissors/RockPaperScissors';
import { Pictionary } from './components/simple-games/Pictionary/Pictionary';
import { MathDuel } from './components/simple-games/MathDuel/MathDuel';
import { TruthOrDare } from './components/simple-games/TruthOrDare/TruthOrDare';
import { Scrabble } from './components/simple-games/Scrabble/Scrabble';
import { StoryBuilder } from './components/simple-games/StoryBuilder/StoryBuilder';
import { KissingWheel } from './components/simple-games/KissingWheel/KissingWheel';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GameProvider>
          <Router>
            <div className="relative min-h-screen flex flex-col">
              {/* Animated background */}
              <div className="romantic-bg" aria-hidden="true" />
              <div className="floating-hearts" aria-hidden="true">
                {'❤️💕💖💗💘💙💜💝💞💟'.split('').filter(c => c.trim()).map((h, i) => (
                  <span key={i} className="heart-particle">{h}</span>
                ))}
              </div>

              {/* App shell */}
              <div className="z-10 flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 overflow-y-auto">
                  <Routes>
                    {/* ── Public routes ───────────────────────── */}
                    <Route path="/login"  element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* ── Protected routes ────────────────────── */}
                    <Route path="/" element={
                      <ProtectedRoute><Home /></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute><Profile /></ProtectedRoute>
                    } />
                    <Route path="/lobby" element={
                      <ProtectedRoute><GameLobby /></ProtectedRoute>
                    } />
                    <Route path="/leaderboard" element={
                      <ProtectedRoute><Leaderboard /></ProtectedRoute>
                    } />

                    {/* Simple Games */}
                    <Route path="/games/tictactoe" element={
                      <ProtectedRoute><TicTacToe /></ProtectedRoute>
                    } />
                    <Route path="/games/wordscramble" element={
                      <ProtectedRoute><WordScramble /></ProtectedRoute>
                    } />
                    <Route path="/games/memorymatch" element={
                      <ProtectedRoute><MemoryMatch /></ProtectedRoute>
                    } />
                    <Route path="/games/connect4" element={
                      <ProtectedRoute><Connect4 /></ProtectedRoute>
                    } />
                    <Route path="/games/triviaquiz" element={
                      <ProtectedRoute><TriviaQuiz /></ProtectedRoute>
                    } />
                    <Route path="/games/rockpaperscissors" element={
                      <ProtectedRoute><RockPaperScissors /></ProtectedRoute>
                    } />
                    <Route path="/games/pictionary" element={
                      <ProtectedRoute><Pictionary /></ProtectedRoute>
                    } />
                    <Route path="/games/mathduel" element={
                      <ProtectedRoute><MathDuel /></ProtectedRoute>
                    } />
                    <Route path="/games/truthordare" element={
                      <ProtectedRoute><TruthOrDare /></ProtectedRoute>
                    } />
                    <Route path="/games/scrabble" element={
                      <ProtectedRoute><Scrabble /></ProtectedRoute>
                    } />
                    <Route path="/games/storybuilder" element={
                      <ProtectedRoute><StoryBuilder /></ProtectedRoute>
                    } />
                    <Route path="/games/kissingwheel" element={
                      <ProtectedRoute><KissingWheel /></ProtectedRoute>
                    } />

                    {/* ── 404 catch-all ───────────────────────── */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>

              {/* Bottom Nav - positioned outside relative container for proper fixed positioning */}
              <BottomNav />
            </div>
            <Analytics />
            <SpeedInsights />
          </Router>
        </GameProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
