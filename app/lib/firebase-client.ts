// // lib/firebase-client.ts
// import { getApp, getApps, initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore/lite'; // Lite for client-side

// // Guard against missing env vars (throw in dev, log in prod)
// const requiredVars = [
//   'NEXT_PUBLIC_FIREBASE_API_KEY',
//   'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
//   'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
//   'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
//   'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
//   'NEXT_PUBLIC_FIREBASE_APP_ID',
// ];
// requiredVars.forEach((varName) => {
//   if (!process.env[varName]) {
//     if (process.env.NODE_ENV === 'development') {
//       throw new Error(`Missing env var: ${varName}`);
//     } else {
//       console.error(`Missing env var: ${varName}`);
//     }
//   }
// });

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// export const firestore = getFirestore(app); // Lite Firestore instance

// lib/firebase-client.ts
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; // Use full Firestore SDK

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCOUPbaKyRW9pTZRz8Wj9gyLNP8VANKSw0',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'delightful-naturals-7a09d.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'delightful-naturals-7a09d',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'delightful-naturals-7a09d.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '839628010855',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:839628010855:web:010784f9d67fbef82eabc2',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firestore = getFirestore(app); // Full Firestore instance