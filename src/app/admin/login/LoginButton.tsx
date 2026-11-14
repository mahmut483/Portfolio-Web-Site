"use client";

import { useState, useTransition } from "react";
import { getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  signInWithPopup,
  signOut,
  type Auth,
} from "firebase/auth";
import { createSession } from "./actions";

// Public web config (not secret). The session lives in an httpOnly cookie set by the server,
// so the browser keeps no Firebase login of its own (in-memory persistence, signed out right after).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function clientAuth(): Auth {
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  try {
    return initializeAuth(app, {
      persistence: inMemoryPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    // Already initialized (e.g. after a hot reload)
    return getAuth(app);
  }
}

export default function LoginButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const signIn = () => {
    setError(null);
    startTransition(async () => {
      const auth = clientAuth();
      let idToken: string;
      try {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        idToken = await result.user.getIdToken();
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
          setError("Google ile giriş açılamadı. Tekrar dene.");
        }
        return;
      }
      await signOut(auth);
      const result = await createSession(idToken);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-night transition-colors hover:bg-white disabled:opacity-60"
      >
        {pending ? "Giriş yapılıyor…" : "Google ile giriş yap"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
