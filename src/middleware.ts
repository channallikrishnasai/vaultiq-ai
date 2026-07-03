import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — always allow
  if (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/data-safe") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/chat")
  ) {
    return NextResponse.next();
  }

  // Check for ANY session cookie (NextAuth sets multiple cookie variants)
  const cookies = request.cookies;
  const hasSession = cookies.has("next-auth.session-token")
    || cookies.has("__Secure-next-auth.session-token")
    || cookies.has("authjs.session-token")
    || cookies.has("__Secure-authjs.session-token");

  // Protected routes
  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/data-safe";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
