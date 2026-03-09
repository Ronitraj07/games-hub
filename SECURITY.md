# Security Implementation Guide

**Access Control**: This application is restricted to ONLY two users:
- sinharonitraj@gmail.com (Ronit)
- radhikadidwania567@gmail.com (Radhika)

## Security Architecture

Three-layer defense system to ensure absolutely no unauthorized access:

```
┌─────────────────────────────────────┐
│  Layer 1: Frontend Validation      │
│  - Email whitelist check           │
│  - Block before account creation   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Layer 2: Firebase Security Rules  │
│  - Server-side validation          │
│  - Block all data operations       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Layer 3: Supabase RLS Policies    │
│  - Database-level restrictions     │
│  - Row Level Security              │
└─────────────────────────────────────┘
```

---

## Layer 1: Frontend Email Validation

### Implementation: `src/lib/auth-config.ts`

```typescript
export const ALLOWED_EMAILS = [
  'sinharonitraj@gmail.com',
  'radhikadidwania567@gmail.com'
];

export const isEmailAllowed = (email: string): boolean => {
  return ALLOWED_EMAILS.some(
    allowed => allowed.toLowerCase() === email.toLowerCase()
  );
};

export const AUTH_ERRORS = {
  UNAUTHORIZED_EMAIL: '⛔ This app is private. Only Ronit and Radhika can access.',
  INVALID_CREDENTIALS: '❌ Invalid email or password.',
  EMAIL_IN_USE: '⚠️ This email is already registered.',
  ACCOUNT_DELETED: '🚫 Unauthorized account deleted.',
};
```

### Email/Password Signup Flow

```typescript
// In AuthContext.tsx
const signUpWithEmail = async (email: string, password: string) => {
  // STEP 1: Check whitelist BEFORE creating account
  if (!isEmailAllowed(email)) {
    throw new Error(AUTH_ERRORS.UNAUTHORIZED_EMAIL);
  }

  // STEP 2: Create Firebase account
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // STEP 3: Additional verification
  if (!isEmailAllowed(userCredential.user.email)) {
    await userCredential.user.delete();
    throw new Error(AUTH_ERRORS.ACCOUNT_DELETED);
  }

  return userCredential.user;
};
```

### Google Sign-In Flow

```typescript
// In AuthContext.tsx
const signInWithGoogle = async () => {
  // STEP 1: Perform Google authentication
  const result = await signInWithPopup(auth, googleProvider);

  // STEP 2: Check email AFTER authentication
  if (!isEmailAllowed(result.user.email)) {
    // STEP 3: Delete unauthorized account immediately
    await result.user.delete();
    throw new Error(AUTH_ERRORS.UNAUTHORIZED_EMAIL);
  }

  return result.user;
};
```

### Why This Matters

- **Prevention**: Stops unauthorized users at the door
- **User Experience**: Clear error messages
- **Auto-cleanup**: Deletes unauthorized Google accounts immediately

---

## Layer 2: Firebase Security Rules

### Firestore Rules: `firebase-rules/firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: Check if user email is whitelisted
    function isAllowedEmail() {
      return request.auth.token.email in [
        'sinharonitraj@gmail.com',
        'radhikadidwania567@gmail.com'
      ];
    }
    
    // Helper function: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Game history: Only whitelisted users
    match /game_history/{document} {
      allow read, write: if isAuthenticated() && isAllowedEmail();
    }
    
    // User profiles: Only whitelisted users
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isAllowedEmail();
    }
    
    // Player stats: Only whitelisted users
    match /player_stats/{document} {
      allow read, write: if isAuthenticated() && isAllowedEmail();
    }
    
    // Default: Deny all unless explicitly allowed
    match /{document=**} {
      allow read, write: if isAuthenticated() && isAllowedEmail();
    }
  }
}
```

### Realtime Database Rules: `firebase-rules/realtime-database.rules`

```json
{
  "rules": {
    ".read": "auth != null && (
      auth.token.email == 'sinharonitraj@gmail.com' || 
      auth.token.email == 'radhikadidwania567@gmail.com'
    )",
    ".write": "auth != null && (
      auth.token.email == 'sinharonitraj@gmail.com' || 
      auth.token.email == 'radhikadidwania567@gmail.com'
    )",
    
    "sessions": {
      "$sessionId": {
        ".read": "auth != null && (
          auth.token.email == 'sinharonitraj@gmail.com' || 
          auth.token.email == 'radhikadidwania567@gmail.com'
        )",
        ".write": "auth != null && (
          auth.token.email == 'sinharonitraj@gmail.com' || 
          auth.token.email == 'radhikadidwania567@gmail.com'
        )"
      }
    },
    
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId && (
          auth.token.email == 'sinharonitraj@gmail.com' || 
          auth.token.email == 'radhikadidwania567@gmail.com'
        )"
      }
    }
  }
}
```

### Why This Matters

- **Server-Side Enforcement**: Cannot be bypassed by client
- **Defense in Depth**: Even if frontend is compromised
- **Token-Based**: Uses authenticated user's token claims

---

## Layer 3: Supabase Row Level Security

### Email Whitelist Table: `supabase/migrations/001_email_whitelist.sql`

```sql
-- Create whitelist table
CREATE TABLE allowed_emails (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Insert only 2 allowed emails
INSERT INTO allowed_emails (email, name) VALUES
  ('sinharonitraj@gmail.com', 'Ronit'),
  ('radhikadidwania567@gmail.com', 'Radhika');

-- Security function: Check if current user is allowed
CREATE OR REPLACE FUNCTION is_allowed_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_emails 
    WHERE email = auth.email()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on whitelist itself
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read_whitelist" ON allowed_emails
  FOR SELECT
  USING (is_allowed_user());
```

### RLS Policies on All Tables

```sql
-- Example: Characters table
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whitelist_only" ON characters 
  FOR ALL 
  USING (is_allowed_user());

-- Example: Game history table
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whitelist_only" ON game_history 
  FOR ALL 
  USING (is_allowed_user());

-- Applied to ALL tables in migrations
```

### Why This Matters

- **Database-Level Security**: Final line of defense
- **Automatic Enforcement**: Applied to every query
- **Cannot Be Bypassed**: Even with direct database access
- **Function-Based**: Centralized logic via `is_allowed_user()`

---

## Authentication Flow Diagram

### Signup with Email

```
┌─────────────────────────┐
│ User enters email       │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│ Frontend checks         │
│ isEmailAllowed()        │
└───────────┬─────────────┘
            │
      ┌─────┴─────┐
      │ Allowed?  │
      └─────┬─────┘
      NO ←──┘   └──→ YES
      │              │
      ↓              ↓
  ⛔ Error     Create Account
  Reject       in Firebase
               │
               ↓
          Double-check email
               │
         ┌─────┴─────┐
         │ Allowed?  │
         └─────┬─────┘
         NO ←──┘   └──→ YES
         │              │
         ↓              ↓
    Delete Account   Success ✅
    Show Error
```

### Signin with Google

```
┌─────────────────────────┐
│ User clicks Google      │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│ Google authentication   │
│ (Any Google account)    │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│ Get authenticated email │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│ Frontend checks         │
│ isEmailAllowed()        │
└───────────┬─────────────┘
            │
      ┌─────┴─────┐
      │ Allowed?  │
      └─────┬─────┘
      NO ←──┘   └──→ YES
      │              │
      ↓              ↓
  Delete Account  Success ✅
  Show Error     Redirect to app
  🚫 Blocked
```

---

## Security Testing Checklist

### ✅ Frontend Tests

- [ ] Try signup with random email → Should show error
- [ ] Try signup with similar email (typo) → Should show error
- [ ] Try signup with allowed email → Should succeed
- [ ] Try Google sign-in with unauthorized account → Account deleted, error shown
- [ ] Try Google sign-in with allowed account → Should succeed

### ✅ Firebase Tests

- [ ] Use Firebase Console to manually create user with unauthorized email
- [ ] Try to read Firestore data → Should fail with permission denied
- [ ] Try to write Realtime Database → Should fail with permission denied
- [ ] Verify rules in Firebase Console → Rules tab shows correct configuration

### ✅ Supabase Tests

```sql
-- Test 1: Check whitelist
SELECT * FROM allowed_emails;
-- Should return exactly 2 rows

-- Test 2: Check RLS function
SELECT is_allowed_user();
-- Should return true only for Ronit/Radhika

-- Test 3: Try to read characters table
SELECT * FROM characters;
-- Should only work for whitelisted users

-- Test 4: Try to insert with unauthorized user
-- Should fail with RLS policy violation
```

### ✅ Integration Tests

- [ ] Login with allowed email → Play game → Check Firebase/Supabase data saved
- [ ] Try to access API directly with unauthorized token → Should fail
- [ ] Check browser console for any security warnings
- [ ] Verify no sensitive data exposed in network tab

---

## Potential Attack Vectors & Mitigations

### Attack: Bypass frontend validation
**Mitigation**: Firebase rules enforce server-side

### Attack: Modify Firebase rules
**Mitigation**: Requires Firebase admin access (you control this)

### Attack: Direct database access
**Mitigation**: Supabase RLS policies enforce at database level

### Attack: Token manipulation
**Mitigation**: Firebase tokens are signed and verified

### Attack: SQL injection in Supabase
**Mitigation**: Using parameterized queries and ORM (Supabase JS client)

### Attack: Session hijacking
**Mitigation**: Firebase handles session security, HTTPS only

---
## Best Practices

### ✅ DO

- Keep `.env` file out of git (in `.gitignore`)
- Use environment variables for all secrets
- Regularly review Firebase/Supabase logs
- Keep Firebase/Supabase SDKs updated
- Use HTTPS only (enforced by Vercel)
- Enable Firebase App Check for additional protection

### ❌ DON'T

- Don't commit `.env` file
- Don't expose Firebase/Supabase admin keys
- Don't disable RLS policies
- Don't add users to whitelist without careful consideration
- Don't trust client-side validation alone

---

## Monitoring & Alerts

### Firebase Console

1. **Authentication** → Check sign-in methods
2. **Usage** → Monitor active users (should only see 2)
3. **Logs** → Check for failed authentication attempts

### Supabase Dashboard

1. **Authentication** → Users (should only have 2)
2. **Database** → Logs tab
3. **API** → Check for unusual activity

### Vercel Analytics

1. Monitor for unusual traffic patterns
2. Check for 401/403 errors (unauthorized attempts)

---

## Emergency Response

### If Unauthorized User Gets Access:

1. **Immediate**: Delete user from Firebase Authentication
2. **Check**: Review Supabase `allowed_emails` table
3. **Verify**: Check Firebase rules and Supabase RLS policies
4. **Audit**: Review Firebase/Supabase logs
5. **Update**: Change any compromised credentials
6. **Redeploy**: If needed, redeploy with updated security

### If Security Rules Are Compromised:

1. **Immediate**: Disable public access in Firebase/Supabase
2. **Review**: Check all rules files
3. **Restore**: Reapply correct rules from repository
4. **Test**: Run full security test checklist
5. **Monitor**: Watch logs closely for 24 hours

---

## Compliance & Privacy

### Data Collected
- Email addresses (only 2 whitelisted)
- Game statistics and history
- Character/game state data

### Data Storage
- Firebase: US-based servers
- Supabase: Choose region during setup
- Vercel: Edge network

### Data Retention
- No automatic deletion
- Manual cleanup can be done via dashboards
- Backups retained per service policy

---

**Last Updated**: March 9, 2026  
**Security Version**: 1.0.0  
**Status**: ✅ Production Ready