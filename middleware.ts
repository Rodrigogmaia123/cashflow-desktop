import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
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

const authMiddleware = withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (
      !isDesktopMode() &&
      token?.isAdmin &&
      pathname.startsWith("/app") &&
      !isOpsShellPath(pathname)
    ) {
      return NextResponse.redirect(new URL("/app/admin", req.url));
    }

    return nextWithPathname(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/api/webhooks")) {
          return true;
        }
        if (req.nextUrl.pathname.startsWith("/api/compra")) {
          return true;
        }
        if (req.nextUrl.pathname.startsWith("/api/license")) {
          return true;
        }
        if (process.env.NODE_ENV === "development") {
          console.log("[middleware] Token:", token ? "exists" : "null");
          console.log("[middleware] Path:", req.nextUrl.pathname);
        }
        return !!token;
      }
    },
    pages: {
      signIn: "/login"
    }
  }
);

export default function middleware(req: NextRequest, event: unknown) {
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

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/compra") ||
    pathname.startsWith("/download") ||
    pathname.startsWith("/api/compra") ||
    pathname.startsWith("/api/license") ||
    pathname === "/pricing";

  if (isPublic) {
    return NextResponse.next();
  }

  return authMiddleware(req as never, event as never);
}

export const config = {
  matcher: [
    "/",
    "/login/:path*",
    "/register/:path*",
    "/app/:path*",
    "/api/:path*",
    "/download/:path*",
  ]
};
