import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { initializeFirestore, type Firestore } from "firebase-admin/firestore";

// Lazy getters: nothing initializes at import time, so `next build` works without the secret
// and a missing secret only fails the admin request that needs it.

let app: App | undefined;
let db: Firestore | undefined;

function adminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) return (app = existing);

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!encoded) throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 is not set");
  // Stored base64-encoded so the private key's newlines survive env var handling
  const serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  return (app = initializeApp({ credential: cert(serviceAccount) }));
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

// The only place Firestore is created. preferRest avoids loading gRPC on cold starts.
// Never call getFirestore() elsewhere: mixing it with initializeFirestore throws.
export function adminDb(): Firestore {
  return (db ??= initializeFirestore(adminApp(), { preferRest: true }));
}
