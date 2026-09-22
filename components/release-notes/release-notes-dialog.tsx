"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  unseenReleaseNotes,
  type ReleaseNote,
} from "@/lib/release-notes";
import { prefKey, readLocalJson, writeLocalJson } from "@/lib/ui/local-prefs";

type SeenPref = {
  version: string;
};

type ReleaseNotesDialogProps = {
  version: string;
  enabled: boolean;
};

function seenKey() {
  return prefKey("release-notes-seen");
}

function readSeenVersion() {
  return readLocalJson<SeenPref>(seenKey())?.version ?? null;
}

function markSeen(version: string) {
  writeLocalJson(seenKey(), { version } satisfies SeenPref);
}

export function ReleaseNotesDialog({ version, enabled }: ReleaseNotesDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<ReleaseNote[]>([]);

  useEffect(() => {
    const seen = readSeenVersion();

    if (!enabled) {
      if (seen !== version) markSeen(version);
      return;
    }

    const pending = unseenReleaseNotes(version, seen);
    if (pending.length === 0) {
      if (seen !== version) markSeen(version);
      return;
    }

    setNotes(pending);
    setOpen(true);
  }, [enabled, version]);

  function acknowledge() {
    markSeen(version);
    setOpen(false);
  }

  const several = notes.length > 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) acknowledge();
      }}
    >
      <DialogContent className="max-h-[min(85vh,640px)] w-[calc(100%-2rem)] gap-0 overflow-hidden border-white/10 bg-card p-0 sm:max-w-md">
        <button
          type="button"
          onClick={acknowledge}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Fechar novidades"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-white/5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pb-5 pt-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Versão {version}
          </p>
          <DialogTitle className="mt-2 text-xl">O Cashflow foi atualizado</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed">
            {several
              ? "Estas são as mudanças desde a última vez que você abriu o app."
              : "Veja o que mudou nesta versão."}
          </DialogDescription>
        </div>

        <div className="max-h-[46vh] space-y-5 overflow-y-auto px-6 py-5">
          {notes.map((note) => (
            <section key={note.version} className="space-y-3">
              {several ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Versão {note.version}
                </p>
              ) : null}
              <ul className="space-y-3">
                {note.items.map((item) => (
                  <li key={`${note.version}:${item.title}`} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="border-t border-white/5 px-6 py-4">
          <Button className="w-full" onClick={acknowledge}>
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
