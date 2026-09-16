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
        if (isPublicApi(req.nextUrl.pathname)) {
          return true;
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

  if (isPublicApi(pathname)) {
    return nextWithPathname(req);
  }

  return authMiddleware(req as never, event as never);
}

export const config = {
  // Só o app autenticado e a API. A LP, login, CSS e imagens não passam
  // daqui — o matcher "/" do Next 16 pega tudo (incluindo /_next/static)
  // e o withAuth manda o anônimo para /login em loop.
  matcher: ["/app/:path*", "/api/:path*"],
};
