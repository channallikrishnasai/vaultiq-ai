import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const cookies = request.cookies;
    const hasSession =
      cookies.has("next-auth.session-token") ||
      cookies.has("__Secure-next-auth.session-token") ||
      cookies.has("authjs.session-token") ||
      cookies.has("__Secure-authjs.session-token");

    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/data-safe";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
