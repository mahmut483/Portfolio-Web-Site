import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { adminAuth } from "./firebase-admin";

// Data Access Layer for the owner-only admin panel.
// Every admin page loader, Server Action, Route Handler and data function calls requireOwner()
// itself. Proxy and layouts are NOT security boundaries (layouts don't re-run on navigation,
// Server Actions are plain POST endpoints).

export const SESSION_COOKIE = "admin_session";
export const SESSION_DAYS = 5;

export function isOwnerUid(uid: string | undefined): boolean {
  const owner = process.env.ADMIN_UID;
  return Boolean(owner && uid && uid === owner);
}

// Verified once per request (React cache). checkRevoked=true so a sign-out revokes it everywhere.
export const getOwner = cache(async (): Promise<{ uid: string } | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  // Session checks only ever run for a real request, never in a prerender or runtime prefetch:
  // firebase-admin reads the clock (Date.now) to check expiry, and session-derived output
  // shouldn't end up in a prefetched shell anyway.
  await connection();
  try {
    const decoded = await adminAuth().verifySessionCookie(value, true);
    return isOwnerUid(decoded.uid) ? { uid: decoded.uid } : null;
  } catch {
    return null;
  }
});

export async function requireOwner(): Promise<{ uid: string }> {
  const owner = await getOwner();
  if (!owner) redirect("/admin/login");
  return owner;
}
