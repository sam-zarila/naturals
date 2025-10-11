// Client-only Firebase (Web SDK)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!, // ok even if you don't use Storage here
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(firebaseApp);
