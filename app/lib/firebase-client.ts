// app/lib/firebase-client.ts
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,         // literal access
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, // literal access
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  // optional (only if you use Storage in the web app)
  ...(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET && {
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  }),
} as const;

// Optional: runtime sanity check (works because keys above are literal)
for (const [k, v] of Object.entries(firebaseConfig)) {
  if (!v) {
    // allow storageBucket to be absent
    if (k === 'storageBucket') continue;
    throw new Error(`Missing required environment variable for Firebase: ${k}`);
  }
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export default app;
