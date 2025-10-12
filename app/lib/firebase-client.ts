// lib/firebase-client.ts  (client-side only)
import { getApp, getApps, initializeApp } from 'firebase/app';
// 👇 use the *lite* package
import { getFirestore } from 'firebase/firestore/lite';

const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      // measurementId optional
    });

export const firestore = getFirestore(app); // from 'firebase/firestore/lite'
