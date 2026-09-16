import type { NextRequest } from "next/server";
import { requestGate } from "@/lib/request-gate";

export function proxy(req: NextRequest) {
  return requestGate(req);
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
