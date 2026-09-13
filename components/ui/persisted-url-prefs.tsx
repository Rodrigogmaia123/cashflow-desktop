"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { replaceAndRefresh } from "@/lib/navigation/replace-and-refresh";
import { readLocalJson, writeLocalJson } from "@/lib/ui/local-prefs";

type Props = {
  storageKey: string;
  keys: readonly string[];
  pathname?: string;
};

export function PersistedUrlPrefs({ storageKey, keys, pathname }: Props) {
  const router = useRouter();
  const currentPath = usePathname();
  const searchParams = useSearchParams();
  const skipSave = useRef(true);
  const path = pathname ?? currentPath ?? "/";

  useLayoutEffect(() => {
    const urlHasPref = keys.some((key) => searchParams.get(key));
    if (urlHasPref) {
      skipSave.current = false;
      return;
    }

    const saved = readLocalJson<Record<string, string>>(storageKey);
    if (!saved) {
      skipSave.current = false;
      return;
    }

    const sp = new URLSearchParams(searchParams.toString());
    let applied = false;
    for (const key of keys) {
      const value = saved[key];
      if (typeof value === "string" && value.length > 0) {
        sp.set(key, value);
        applied = true;
      }
    }

    if (!applied) {
      skipSave.current = false;
      return;
    }

    const qs = sp.toString();
    replaceAndRefresh(router, qs ? `${path}?${qs}` : path);
  }, [storageKey]);

  useEffect(() => {
    const urlHasPref = keys.some((key) => searchParams.get(key));
    if (skipSave.current) {
      if (urlHasPref) skipSave.current = false;
      else return;
    }

    const snapshot: Record<string, string> = {};
    for (const key of keys) {
      const value = searchParams.get(key);
      if (value) snapshot[key] = value;
    }
    writeLocalJson(storageKey, snapshot);
  }, [searchParams, storageKey, keys]);

  return null;
}
