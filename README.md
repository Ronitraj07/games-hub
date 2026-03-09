# 🎮 Couple Games Hub

> Private multiplayer games platform for couples with 8 simple games and 2 complex RPG-style games

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1.0-646cff)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.8.0-orange)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39.0-green)](https://supabase.com/)

## 👥 Access Control

**🔒 Private Repository - Restricted Access Only**

This application is exclusively designed for two users:
- 👨 Ronit (sinharonitraj@gmail.com)
- 👩 Radhika (radhikadidwania567@gmail.com)

### 🔐 3-Layer Security System

1. **Frontend Email Whitelist**: Blocks unauthorized signups before account creation
2. **Firebase Security Rules**: Prevents data access even if frontend is bypassed
3. **Supabase RLS Policies**: Database-level security on all tables

## ✨ Features

### 🎲 8 Simple Multiplayer Games

1. **Tic-Tac-Toe** ✅ - Classic 3x3 grid game (FULLY IMPLEMENTED)
2. **Word Scramble** 🔤 - Unscramble words against time (Scaffolded)
3. **Memory Match** 🃏 - Find matching pairs (Scaffolded)
4. **Trivia Quiz** ❓ - Test knowledge across categories (Scaffolded)
5. **Connect 4** 🔴 - Classic vertical strategy game (Scaffolded)
6. **Rock Paper Scissors** ✊ - Best of X rounds (Scaffolded)
7. **Pictionary** 🎨 - Draw and guess game (Scaffolded)
8. **Math Duel** 🧮 - Speed math competition (Scaffolded)

### ⚔️ 2 Complex RPG Games

1. **Dungeon Crawlers** 🎰 - Co-op dungeon exploration with:
   - Character creation & progression
   - Turn-based combat system
   - Inventory & equipment management
   - Procedural dungeon generation
   - Loot and treasure system

2. **Battle Arena** 🎯 - Real-time PvP combat with:
   - Character classes (Warrior, Mage, Rogue, Archer)
   - Skill trees and abilities
   - Matchmaking system
   - Ranking and leaderboards
   - Combat statistics tracking

### 📊 Analytics & Social

- Game history tracking
- Player statistics and win rates
- Leaderboard system
- Achievement system
- Head-to-head records
- Real-time presence (online/offline status)

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.1.0
- **Styling**: Tailwind CSS 3.4.1
- **Routing**: React Router 6.22.0
- **State Management**: Zustand 4.5.0
- **Form Handling**: React Hook Form 7.50.0 + Zod validation
- **Animations**: Framer Motion 11.0.3
- **Icons**: Lucide React 0.323.0

### Backend & Database
- **Real-time Database**: Firebase Realtime Database (simple games)
- **PostgreSQL**: Supabase (RPG data, analytics)
- **Authentication**: Firebase Auth with email whitelist
- **Storage**: Firebase Storage (future: game assets)

### Deployment
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions (planned)
- **Monitoring**: Vercel Analytics (planned)

## 📁 Project Structure

```
couple-games-hub/
├── src/
│   ├── components/
│   │   ├── simple-games/        # 8 casual multiplayer games
│   │   │   ├── TicTacToe/        # ✅ Fully implemented
│   │   │   ├── WordScramble/     # 🔤 Scaffolded
│   │   │   ├── MemoryMatch/      # 🔤 Scaffolded
│   │   │   ├── TriviaQuiz/       # 🔤 Scaffolded
│   │   │   ├── Connect4/         # 🔤 Scaffolded
│   │   │   ├── RockPaperScissors/# 🔤 Scaffolded
│   │   │   ├── Pictionary/       # 🔤 Scaffolded
│   │   │   └── MathDuel/         # 🔤 Scaffolded
│   │   ├── heavy-games/         # Complex RPG games
│   │   │   ├── DungeonCrawlers/  # 🔤 Scaffolded
│   │   │   └── BattleArena/      # ✅ Scaffolded
│   │   ├── shared/              # Reusable UI components
│   │   ├── auth/                # Authentication components
│   │   └── layout/              # Layout wrappers
│   ├── hooks/
│   │   ├── firebase/            # Firebase hooks
│   │   ├── supabase/            # Supabase hooks
│   │   └── shared/              # Common hooks
│   ├── lib/                     # Configuration & utilities
│   ├── types/                   # TypeScript type definitions
│   ├── contexts/                # React Context providers
│   ├── pages/                   # Page components
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── firebase-rules/              # Firebase security rules
├── supabase/
│   └── migrations/              # Database migrations
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── README.md                    # This file
├── SETUP.md                     # Detailed setup instructions
├── DATABASE_SCHEMA.md           # Database documentation
├── SECURITY.md                  # Security implementation
└── PROJECT_STATUS.md            # Development progress tracker
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account
- Supabase account
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Ronitraj07/couple-games-hub.git
cd couple-games-hub
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your Firebase and Supabase credentials
```

4. **Run development server**

```bash
npm run dev
```

5. **Open browser**

```
http://localhost:3000
```

### Full Setup Guide

For complete setup instructions including Firebase and Supabase configuration, see **[SETUP.md](./SETUP.md)**

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide with Firebase, Supabase, and deployment
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Full database architecture and schema
- **[SECURITY.md](./SECURITY.md)** - Security implementation details
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current development status and roadmap

## 🎮 Game Routes

### Simple Games
- `/games/tictactoe` - Tic-Tac-Toe ✅
- `/games/wordscramble` - Word Scramble 🔤
- `/games/memorymatch` - Memory Match 🔤
- `/games/triviaquiz` - Trivia Quiz 🔤
- `/games/connect4` - Connect 4 🔤
- `/games/rps` - Rock Paper Scissors 🔤
- `/games/pictionary` - Pictionary 🔤
- `/games/mathduel` - Math Duel 🔤

### Heavy Games
- `/games/dungeon-crawlers` - Dungeon Crawlers RPG 🔤
- `/games/battle-arena` - Battle Arena PvP ✅

### Other Pages
- `/` - Home (game lobby)
- `/profile` - User profile and stats
- `/lobby` - Active games and matchmaking
- `/login` - Login page
- `/signup` - Signup page (restricted)

## 📦 Database Schema

### Firebase Realtime Database
- **sessions**: Active game sessions
- **presence**: Online/offline status

### Supabase PostgreSQL
- **allowed_emails**: Email whitelist (2 rows)
- **characters**: RPG character data
- **items**: Master items list
- **inventory**: Character inventories
- **skills**: Master skills list
- **character_skills**: Learned skills
- **game_sessions**: RPG game sessions
- **combat_actions**: Combat logs
- **game_history**: Historical game records
- **player_stats**: Aggregate statistics
- **leaderboard**: View for rankings

See **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** for complete schema documentation.

## 🛡️ Security Features

### Email Whitelist
```typescript
const ALLOWED_EMAILS = [
  'sinharonitraj@gmail.com',
  'radhikadidwania567@gmail.com'
];
```

### Firebase Rules
- Firestore: Read/write only for whitelisted emails
- Realtime Database: Access restricted to allowed users

### Supabase RLS
- Row Level Security on all tables
- `is_allowed_user()` function checks email against whitelist
- Policies enforce user-level data isolation

## 📊 Development Progress

**Overall: ~60% Complete**

- ✅ Infrastructure: 100%
- ✅ Security: 100%
- ✅ Database: 100%
- ✅ Authentication: 100%
- ✅ Layout/Pages: 100%
- 🔤 Simple Games: 12.5% (1/8)
- 🔤 Heavy Games: 50%
- ✅ Documentation: 100%
- ❌ Testing: 0%
- ❌ Deployment: 0%

See **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** for detailed progress tracking.

## 📝 Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Testing (planned)
npm run test         # Run tests
npm run test:e2e     # Run E2E tests
```

## 🐛 Known Issues

No critical issues currently identified. See GitHub Issues for bug reports and feature requests.

## 🛣️ Roadmap

### Phase 1: Core Games (Current)
- ✅ TicTacToe complete
- 🚧 Implement remaining 7 simple games
- 🚧 Complete Battle Arena matchmaking

### Phase 2: RPG Systems
- 🔮 Complete Dungeon Crawlers
- 🔮 Finalize Battle Arena combat
- 🔮 Character progression system

### Phase 3: Polish & Deploy
- 🔮 UI/UX refinement
- 🔮 Testing & bug fixes
- 🔮 Vercel deployment
- 🔮 Performance optimization

### Phase 4: Enhancements
- 🔮 Chat system
- 🔮 Achievement badges
- 🔮 Tournament mode
- 🔮 Mobile PWA

## 🤝 Contributing

**This is a private project restricted to two users.** No external contributions accepted.

## 📝 License

**Private & Confidential**

This repository is private and restricted. Unauthorized access, use, or distribution is prohibited.

Copyright © 2026 Ronit & Radhika. All rights reserved.

---

## 📞 Support

For technical issues or questions:
- Check documentation files (SETUP.md, DATABASE_SCHEMA.md, SECURITY.md)
- Review Firebase/Supabase console logs
- Contact: sinharonitraj@gmail.com

---

**Built with ❤️ by Ronit for Ronit & Radhika**

🎮 Happy Gaming! 🎮