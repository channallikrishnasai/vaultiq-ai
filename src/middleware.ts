import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // If not authenticated and trying to access protected route
  if (!req.auth) {
    const isPublic =
      pathname === "/" ||
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up") ||
      pathname.startsWith("/data-safe") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/register");

    if (!isPublic) {
      const url = req.nextUrl.clone();
      url.pathname = "/data-safe";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
