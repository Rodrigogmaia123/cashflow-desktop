"use server";

import { extractTextItems } from "unpdf";
import { parseBankLines } from "@/lib/domain/nubank-statement";
import { linesFromSicoobItems, type SicoobParseResult } from "@/lib/domain/sicoob-statement";

export async function readSicoobPdf(formData: FormData): Promise<SicoobParseResult> {
  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error("Escolha um PDF com texto selecionável.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("O PDF passa de 12 MB.");
  }

  const extracted = await extractTextItems(new Uint8Array(await file.arrayBuffer()));
  const lines = linesFromSicoobItems(
    extracted.items.map((page) => page.map((item) => ({ str: item.str, x: item.x, y: item.y })))
  );
  const parsed = parseBankLines(lines);
  if (!parsed || parsed.rows.length === 0) {
    throw new Error(
      "Não encontrei lançamentos com data e valor. O PDF precisa ter texto selecionável, não uma página só de imagem."
    );
  }
  return parsed;
}
