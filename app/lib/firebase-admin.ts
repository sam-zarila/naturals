// lib/firebase-admin.ts
import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, initializeFirestore } from "firebase-admin/firestore";

/**
 * Normalize env strings copied from dashboards:
 * - strip accidental wrapping quotes
 * - keep as empty string if undefined for clearer error
 */
function norm(v?: string) {
  return (v ?? "").replace(/^"+|"+$/g, "").trim();
}

// ----- REQUIRED SERVER ENVS (set in Netlify/Vercel project settings) -----
const projectId   = norm(process.env.FIREBASE_PROJECT_ID);
const clientEmail = norm(process.env.FIREBASE_CLIENT_EMAIL);
const rawKey      = process.env.FIREBASE_PRIVATE_KEY ?? ""; // don't trim; preserve inner spaces

if (!projectId || !clientEmail || !rawKey) {
  throw new Error(
    "Missing Firebase Admin envs. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
  );
}

// Fix \n in private key when copied from Firebase console
const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

// Use emulator if provided (local dev), else prefer REST (more reliable on serverless)
const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

  // Configure Firestore transport & behavior
  initializeFirestore(getApp(), {
    // REST avoids gRPC/DNS/WebChannel issues on hosts like Netlify
    preferRest: !usingEmulator,
    // Prevents "Cannot use undefined as a Firestore value"
    ignoreUndefinedProperties: true,
  } as import("firebase-admin/firestore").FirestoreSettings);
}

// Export a single shared Admin Firestore instance
export const db = getFirestore(getApp());
