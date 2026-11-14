import { NextResponse, type NextRequest } from "next/server";

// Optimistic redirect only: sends visitors without a session cookie to the login page.
// It does not verify the cookie. The real check is requireOwner() in src/server/auth.ts,
// which every admin page, action and data function calls itself.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return NextResponse.next();

  if (!request.cookies.has("admin_session")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
