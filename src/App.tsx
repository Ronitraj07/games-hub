import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { TicTacToe } from './components/simple-games/TicTacToe/TicTacToe';
import { WordScramble } from './components/simple-games/WordScramble/WordScramble';
import { MemoryMatch } from './components/simple-games/MemoryMatch/MemoryMatch';
import { Connect4 } from './components/simple-games/Connect4/Connect4';
import { TriviaQuiz } from './components/simple-games/TriviaQuiz/TriviaQuiz';
import { RockPaperScissors } from './components/simple-games/RockPaperScissors/RockPaperScissors';
import { Pictionary } from './components/simple-games/Pictionary/Pictionary';
import { MathDuel } from './components/simple-games/MathDuel/MathDuel';
import { Navbar } from './components/layout/Navbar';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/games/tictactoe" element={<TicTacToe />} />
              <Route path="/games/wordscramble" element={<WordScramble />} />
              <Route path="/games/memorymatch" element={<MemoryMatch />} />
              <Route path="/games/connect4" element={<Connect4 />} />
              <Route path="/games/triviaquiz" element={<TriviaQuiz />} />
              <Route path="/games/rockpaperscissors" element={<RockPaperScissors />} />
              <Route path="/games/pictionary" element={<Pictionary />} />
              <Route path="/games/mathduel" element={<MathDuel />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
