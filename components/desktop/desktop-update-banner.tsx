"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Sparkles, X } from "lucide-react";
import { checkDesktopAppUpdate } from "@/app/app/desktop-update-actions";
import { Button } from "@/components/ui/button";
import { prefKey, readLocalJson, writeLocalJson } from "@/lib/ui/local-prefs";
import type { DesktopUpdateCheck } from "@/lib/desktop-update";

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const SNOOZE_MS = 24 * 60 * 60 * 1000;
const AFTER_DOWNLOAD_SNOOZE_MS = 6 * 60 * 60 * 1000;

type SnoozePref = {
  version: string;
  until: number;
};

function snoozeKey() {
  return prefKey("desktop-update-snooze");
}

function isSnoozed(version: string) {
  const stored = readLocalJson<SnoozePref>(snoozeKey());
  if (!stored || stored.version !== version) return false;
  return stored.until > Date.now();
}

function snooze(version: string, ms: number) {
  writeLocalJson(snoozeKey(), { version, until: Date.now() + ms });
}

function openDownload(url: string) {
  const desktop = window.cashflowDesktop;
  if (desktop?.openExternal) {
    void desktop.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function DesktopUpdateBanner() {
  const [update, setUpdate] = useState<Extract<
    DesktopUpdateCheck,
    { available: true }
  > | null>(null);
  const [hidden, setHidden] = useState(false);

  const refresh = useCallback(async () => {
    const result = await checkDesktopAppUpdate();
    if (!result.available || isSnoozed(result.latestVersion)) {
      setUpdate(null);
      return;
    }
    setUpdate(result);
    setHidden(false);
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (!update || hidden) return null;

  const latest = update;

  function dismiss() {
    snooze(latest.latestVersion, SNOOZE_MS);
    setHidden(true);
  }

  return (
    <div className="sticky top-0 z-20 mb-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-blue-500/10 px-4 py-3 shadow-card sm:px-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-primary/15 p-2 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Nova versão disponível · v{latest.latestVersion}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Você está na v{latest.currentVersion}. {latest.notes}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                openDownload(latest.downloadUrl);
                snooze(latest.latestVersion, AFTER_DOWNLOAD_SNOOZE_MS);
                setHidden(true);
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Baixar atualização
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Agora não
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Fechar aviso de atualização"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
