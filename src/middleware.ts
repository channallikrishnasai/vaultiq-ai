import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = [
    "/",
    "/sign-in",
    "/sign-up",
    "/data-safe",
    "/api/auth",
    "/api/register",
  ];

  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for session cookie (next-auth session token)
  const sessionToken = request.cookies.get("next-auth.session-token")?.value
    || request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    // Redirect to data-safe page instead of sign-in
    const url = request.nextUrl.clone();
    url.pathname = "/data-safe";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
