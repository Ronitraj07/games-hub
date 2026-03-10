import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';
import { RPGHub } from './pages/RPGHub';
import { HeartboundAdventures } from './pages/rpg/HeartboundAdventures';
import { MysteryPartners } from './pages/rpg/MysteryPartners';
import { TicTacToe } from './components/simple-games/TicTacToe/TicTacToe';
import { WordScramble } from './components/simple-games/WordScramble/WordScramble';
import { MemoryMatch } from './components/simple-games/MemoryMatch/MemoryMatch';
import { Connect4 } from './components/simple-games/Connect4/Connect4';
import { TriviaQuiz } from './components/simple-games/TriviaQuiz/TriviaQuiz';
import { RockPaperScissors } from './components/simple-games/RockPaperScissors/RockPaperScissors';
import { Pictionary } from './components/simple-games/Pictionary/Pictionary';
import { MathDuel } from './components/simple-games/MathDuel/MathDuel';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="relative min-h-screen">
            <div className="romantic-bg" aria-hidden="true" />
            <div className="floating-hearts" aria-hidden="true">
              {'❤️💕💖💗💘💙💜💝💞💟'.split('').filter(c => c.trim()).map((h, i) => (
                <span key={i} className="heart-particle">{h}</span>
              ))}
            </div>
            <div className="relative z-10">
              <Navbar />
              <Routes>
                {/* Auth */}
                <Route path="/login"   element={<Login />} />
                <Route path="/signup"  element={<Signup />} />
                {/* Main */}
                <Route path="/"        element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                {/* RPG */}
                <Route path="/rpg"              element={<RPGHub />} />
                <Route path="/rpg/heartbound"   element={<HeartboundAdventures />} />
                <Route path="/rpg/mystery"      element={<MysteryPartners />} />
                {/* Simple Games */}
                <Route path="/games/tictactoe"        element={<TicTacToe />} />
                <Route path="/games/wordscramble"      element={<WordScramble />} />
                <Route path="/games/memorymatch"       element={<MemoryMatch />} />
                <Route path="/games/connect4"          element={<Connect4 />} />
                <Route path="/games/triviaquiz"        element={<TriviaQuiz />} />
                <Route path="/games/rockpaperscissors" element={<RockPaperScissors />} />
                <Route path="/games/pictionary"        element={<Pictionary />} />
                <Route path="/games/mathduel"          element={<MathDuel />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
