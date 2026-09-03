"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncDesktopLicenseHeartbeat } from "@/app/ativar/heartbeat-actions";

const INTERVAL_MS = 6 * 60 * 60 * 1000;

export function LicenseHeartbeatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      const result = await syncDesktopLicenseHeartbeat();
      if (cancelled) return;
      if (!result.allowed) {
        router.replace("/ativar");
        router.refresh();
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [router]);

  return <>{children}</>;
}
