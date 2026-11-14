"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/server/firebase-admin";
import { SESSION_COOKIE, getOwner } from "@/server/auth";

export async function signOutAction() {
  try {
    const owner = await getOwner();
    // Revoking refresh tokens also invalidates every session cookie issued before now
    if (owner) await adminAuth().revokeRefreshTokens(owner.uid);
  } catch (e) {
    console.error("Admin sign-out: revoking tokens failed", e);
  } finally {
    // Always clear the local session, even if Firebase couldn't be reached.
    // cookies().delete(name) would target path "/", but this cookie lives on "/admin".
    (await cookies()).set(SESSION_COOKIE, "", {
      path: "/admin",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
  // Outside try/finally: redirect() works by throwing
  redirect("/admin/login");
}
