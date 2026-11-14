"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/server/firebase-admin";
import { SESSION_COOKIE, SESSION_DAYS, isOwnerUid } from "@/server/auth";

export type LoginResult = { error: string } | undefined;

// Exchanges a fresh Firebase ID token for an httpOnly session cookie, for the owner only.
export async function createSession(idToken: unknown): Promise<LoginResult> {
  if (typeof idToken !== "string" || idToken.length < 100 || idToken.length > 8000) {
    return { error: "Geçersiz istek." };
  }

  let decoded;
  try {
    // Signature/expiry check only (local, cached certs). The revocation check below is a network
    // call, so it runs only once we know this is the owner.
    decoded = await adminAuth().verifyIdToken(idToken);
  } catch {
    return { error: "Giriş doğrulanamadı. Tekrar dene." };
  }

  // Same generic message for every refusal, so it doesn't reveal which check failed
  if (decoded.firebase?.sign_in_provider !== "google.com" || !isOwnerUid(decoded.uid)) {
    return { error: "Bu hesabın panele erişimi yok." };
  }
  // Only a sign-in from the last 5 minutes can start a session (Firebase's recommendation)
  if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
    return { error: "Giriş süresi doldu. Tekrar dene." };
  }
  try {
    await adminAuth().verifyIdToken(idToken, true);
  } catch {
    return { error: "Giriş doğrulanamadı. Tekrar dene." };
  }

  const maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60;
  // Firebase takes milliseconds, the cookie takes seconds
  const session = await adminAuth().createSessionCookie(idToken, { expiresIn: maxAgeSeconds * 1000 });
  (await cookies()).set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: maxAgeSeconds,
  });

  // Outside any try/catch: redirect() works by throwing
  redirect("/admin");
}
