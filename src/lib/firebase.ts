import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
};

// Warn about missing critical env vars (won't throw, but surfaces issues fast)
const criticalKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
criticalKeys.forEach((key) => {
  if (!firebaseConfig[key]) {
    console.error(
      `[Firebase] ⚠️ Missing env var: VITE_FIREBASE_${
        key.replace(/([A-Z])/g, '_$1').toUpperCase()
      } — auth will not work.`
    );
  }
});

const app = initializeApp(firebaseConfig);
export const auth      = getAuth(app);
export const database  = getDatabase(app);
export const firestore = getFirestore(app);

export default app;
