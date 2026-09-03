"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  CURRENCY_VIEW_COOKIE,
  parseCurrencyViewMode
} from "@/lib/domain/currency-view";

export async function setCurrencyViewMode(formData: FormData) {
  const parsed = parseCurrencyViewMode(String(formData.get("currencyView") ?? ""));
  if (!parsed) {
    throw new Error("Modo de moeda inválido.");
  }

  const jar = await cookies();
  jar.set(CURRENCY_VIEW_COOKIE, parsed, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365
  });

  revalidatePath("/app");
}
