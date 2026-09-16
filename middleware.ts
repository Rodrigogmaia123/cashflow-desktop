import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPersonalBlockedPath, isPersonalEdition } from "@/lib/desktop-edition";
import { isOpsShellPath } from "@/lib/ops";

function isDesktopMode() {
  return (
    process.env.DESKTOP_MODE === "true" ||
    process.env.NEXT_PUBLIC_DESKTOP_MODE === "true"
  );
}

function nextWithPathname(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function isPublicPath(pathname: string) {
  if (!pathname || pathname === "/") return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/brand")) return true;

  const publicExact = new Set([
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/pricing",
    "/ativar",
    "/favicon.ico",
    "/apple-icon.png",
  ]);
  if (publicExact.has(pathname)) return true;

  return (
    pathname.startsWith("/login/") ||
    pathname.startsWith("/register/") ||
    pathname.startsWith("/forgot-password/") ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/compra") ||
    pathname.startsWith("/download") ||
    pathname.startsWith("/ativar/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/compra") ||
    pathname.startsWith("/api/license") ||
    pathname.startsWith("/api/desktop") ||
    pathname.startsWith("/api/support")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isDesktopMode()) {
    if (
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/login/") ||
      pathname.startsWith("/register/")
    ) {
      return NextResponse.redirect(new URL("/app/overview", req.url));
    }
    if (isPersonalEdition() && isPersonalBlockedPath(pathname)) {
      return NextResponse.redirect(new URL("/app/overview", req.url));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    token.isAdmin &&
    pathname.startsWith("/app") &&
    !isOpsShellPath(pathname)
  ) {
    return NextResponse.redirect(new URL("/app/admin", req.url));
  }

  return nextWithPathname(req);
}
