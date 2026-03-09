import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { TicTacToe } from './components/simple-games/TicTacToe/TicTacToe';
import { WordScramble } from './components/simple-games/WordScramble/WordScramble';
import { MemoryMatch } from './components/simple-games/MemoryMatch/MemoryMatch';
import { Connect4 } from './components/simple-games/Connect4/Connect4';
import { TriviaQuiz } from './components/simple-games/TriviaQuiz/TriviaQuiz';
import { RockPaperScissors } from './components/simple-games/RockPaperScissors/RockPaperScissors';
import { Pictionary } from './components/simple-games/Pictionary/Pictionary';
import { MathDuel } from './components/simple-games/MathDuel/MathDuel';
import { BattleArena } from './components/heavy-games/BattleArena/BattleArena';
import { DungeonCrawlers } from './components/heavy-games/DungeonCrawlers/DungeonCrawlers';
import { Profile } from './pages/Profile';
import { RPGHub } from './pages/RPGHub';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/tictactoe"
                element={
                  <ProtectedRoute>
                    <TicTacToe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/wordscramble"
                element={
                  <ProtectedRoute>
                    <WordScramble />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/memorymatch"
                element={
                  <ProtectedRoute>
                    <MemoryMatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/connect4"
                element={
                  <ProtectedRoute>
                    <Connect4 />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/triviaquiz"
                element={
                  <ProtectedRoute>
                    <TriviaQuiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/rockpaperscissors"
                element={
                  <ProtectedRoute>
                    <RockPaperScissors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/pictionary"
                element={
                  <ProtectedRoute>
                    <Pictionary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/mathduel"
                element={
                  <ProtectedRoute>
                    <MathDuel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/rpg"
                element={
                  <ProtectedRoute>
                    <RPGHub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/battlearena"
                element={
                  <ProtectedRoute>
                    <BattleArena />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/dungeoncrawlers"
                element={
                  <ProtectedRoute>
                    <DungeonCrawlers />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;