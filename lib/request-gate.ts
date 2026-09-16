import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDesktopMode } from "@/lib/desktop";
import { isPersonalBlockedPath, isPersonalEdition } from "@/lib/desktop-edition";
import { isOpsShellPath } from "@/lib/ops";

function nextWithPathname(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function isPublicApi(pathname: string) {
  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/compra") ||
    pathname.startsWith("/api/license") ||
    pathname.startsWith("/api/desktop") ||
    pathname.startsWith("/api/support")
  );
}

/** Só o app logado e APIs privadas pedem sessão. LP, login e CSS passam. */
function needsAuth(pathname: string) {
  if (pathname === "/app" || pathname.startsWith("/app/")) return true;
  if (pathname.startsWith("/api/") && !isPublicApi(pathname)) return true;
  return false;
}

export async function requestGate(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const packagedApp =
    isDesktopMode() && !/getcashflow\.pro/i.test(host);

  if (packagedApp) {
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

  if (!needsAuth(pathname)) {
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
