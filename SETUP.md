# Setup Guide - Couple Games Hub

Complete step-by-step guide to set up the development environment and deploy the application.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git installed
- Firebase account
- Supabase account
- Vercel account (for deployment)

## 1. Clone and Install

```bash
git clone https://github.com/Ronitraj07/couple-games-hub.git
cd couple-games-hub
npm install
```

## 2. Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Name: `couple-games-hub`
4. Disable Google Analytics (optional for private app)
5. Click "Create project"

### 2.2 Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get Started**
2. Enable **Email/Password** provider
3. Enable **Google** provider
   - Add your email as Test user
4. Go to **Settings** → **Authorized domains**
   - Add your Vercel domain when deployed

### 2.3 Create Realtime Database

1. Go to **Realtime Database** → **Create Database**
2. Choose location closest to you
3. Start in **Locked mode** (we'll add rules)
4. Go to **Rules** tab
5. Replace with contents from `firebase-rules/realtime-database.rules`
6. Click **Publish**

### 2.4 Create Firestore Database (Optional)

1. Go to **Firestore Database** → **Create Database**
2. Start in **Production mode**
3. Choose location
4. Go to **Rules** tab
5. Replace with contents from `firebase-rules/firestore.rules`
6. Click **Publish**

### 2.5 Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click web icon (</>)
4. Register app: `couple-games-hub-web`
5. Copy the `firebaseConfig` object
6. Add to `.env` file (see step 4)

## 3. Supabase Setup

### 3.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New project"
3. Organization: Create new or select existing
4. Name: `couple-games-hub`
5. Database Password: Generate strong password (save it!)
6. Region: Choose closest to you
7. Click "Create new project" (takes ~2 minutes)

### 3.2 Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - Project URL
   - anon public key
3. Add to `.env` file

### 3.3 Run Database Migrations

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click "New query"
3. Copy contents from `supabase/migrations/001_email_whitelist.sql`
4. Click "Run"
5. Repeat for:
   - `002_rpg_tables.sql`
   - `003_game_history.sql`
   - `004_indexes_and_rls.sql`

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### 3.4 Verify Database Setup

1. Go to **Table Editor**
2. Verify tables exist:
   - `allowed_emails` (with 2 rows)
   - `characters`
   - `items`
   - `inventory`
   - `skills`
   - `character_skills`
   - `game_sessions`
   - `combat_actions`
   - `game_history`
   - `player_stats` (with 2 rows)

### 3.5 Enable Realtime (Optional)

1. Go to **Database** → **Replication**
2. Enable replication for tables:
   - `game_sessions`
   - `combat_actions`
   - `characters`

## 4. Environment Variables

Create `.env` file in root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=couple-games-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=couple-games-hub
VITE_FIREBASE_STORAGE_BUCKET=couple-games-hub.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_DATABASE_URL=https://couple-games-hub-default-rtdb.firebaseio.com

# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# App Configuration
VITE_APP_NAME="Couple Games Hub"
VITE_APP_DESCRIPTION="Private gaming platform for Ronit & Radhika"
```

## 5. Development

```bash
# Start development server
npm run dev

# Open browser
# http://localhost:3000
```

## 6. Testing Security

### Test Email Whitelist

1. Try signing up with unauthorized email:
   - Should show error: "⛔ This app is private. Only Ronit and Radhika can access."
2. Try Google sign-in with unauthorized account:
   - Account should be created then immediately deleted
   - Should show error message
3. Sign up with authorized email:
   - Should succeed and redirect to home

### Test Firebase Rules

1. Open browser console
2. Try to read/write data
3. Should only work for whitelisted emails

### Test Supabase RLS

1. Go to Supabase Dashboard → **SQL Editor**
2. Run test query:

```sql
SELECT is_allowed_user();
-- Should return true only for Ronit and Radhika
```

## 7. Build for Production

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Preview production build
npm run preview
```

## 8. Deploy to Vercel

### 8.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 8.2 Deploy

```bash
# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Project name: couple-games-hub
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

### 8.3 Add Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all variables from `.env` file
5. Redeploy:

```bash
vercel --prod
```

### 8.4 Update Firebase Authorized Domains

1. Go to Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Click **Add domain**
4. Add your Vercel domain: `couple-games-hub.vercel.app`

## 9. Post-Deployment Verification

1. Visit deployed URL
2. Test authentication with both emails
3. Test unauthorized email rejection
4. Play a game and verify data saves
5. Check Supabase dashboard for data
6. Check Firebase Realtime Database for session data

## 10. Maintenance

### Update Dependencies

```bash
npm update
```

### Database Migrations

When adding new migrations:

1. Create new file in `supabase/migrations/`
2. Name format: `XXX_description.sql`
3. Run via Supabase Dashboard SQL Editor
4. Or use CLI: `supabase db push`

### Monitoring

- **Firebase**: Console → **Usage** tab
- **Supabase**: Dashboard → **Database** → **Usage**
- **Vercel**: Dashboard → **Analytics**

## Troubleshooting

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution**: Add your domain to Firebase Authorized domains

### Issue: "Supabase: row-level security policy violation"
**Solution**: Check if user email is in `allowed_emails` table

### Issue: Build fails with TypeScript errors
**Solution**: Run `npm run type-check` and fix type errors

### Issue: Environment variables not working
**Solution**: Restart dev server after changing `.env`

### Issue: Google Sign-In not working
**Solution**: 
1. Check Firebase Google provider is enabled
2. Verify authorized domains include your deployment URL
3. Check browser console for errors

## Support

For issues or questions:
1. Check `SECURITY.md` for security implementation details
2. Check `DATABASE_SCHEMA.md` for database structure
3. Review Firebase/Supabase console logs

---

**Last Updated**: March 9, 2026
**Version**: 1.0.0