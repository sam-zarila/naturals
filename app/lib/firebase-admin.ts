import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  initializeFirestore,
} from "firebase-admin/firestore";

const projectId   = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const rawKey      = process.env.FIREBASE_PRIVATE_KEY!;
const privateKey  = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

  // 👇 Avoid gRPC/DNS issues: use HTTPS REST transport
  initializeFirestore(getApp(), {
    preferRest: true,
    ignoreUndefinedProperties: true,
  } as any);
}

export const db = getFirestore(getApp());
