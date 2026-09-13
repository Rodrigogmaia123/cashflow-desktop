"use client";

import { useCallback, useLayoutEffect, useState } from "react";

export function prefKey(...parts: Array<string | null | undefined>) {
  return ["cashflowpro", ...parts.filter((part): part is string => Boolean(part))].join(":");
}

export function readLocalJson<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function writeLocalJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / modo privado
  }
}

export function useLocalPref<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  useLayoutEffect(() => {
    const stored = readLocalJson<T>(key);
    if (stored === undefined || stored === null) return;
    if (
      stored &&
      typeof stored === "object" &&
      !Array.isArray(stored) &&
      defaultValue &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue)
    ) {
      setValue({ ...defaultValue, ...stored });
      return;
    }
    setValue(stored);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        writeLocalJson(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, update] as const;
}
