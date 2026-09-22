export type ReleaseNoteItem = {
  title: string;
  description: string;
};

export type ReleaseNote = {
  version: string;
  items: ReleaseNoteItem[];
};

/**
 * Novidades mostradas uma vez, na primeira abertura depois da atualização.
 * Ao publicar uma versão, acrescente a entrada no topo da lista.
 */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "0.2.3",
    items: [
      {
        title: "Atualizar não apaga o caixa",
        description:
          "Lançamentos, workspaces e a licença ficam no computador. Instalar a versão nova por cima da atual preserva o que você já registrou.",
      },
      {
        title: "Relatórios por período estáveis",
        description:
          "A comparação de períodos deixa de recarregar em loop e de interromper a leitura com erro de conexão.",
      },
    ],
  },
];

function versionParts(value: string): number[] {
  const core = value.trim().replace(/^v/i, "").split("-")[0] ?? "";
  return core.split(".").map((part) => {
    const n = Number.parseInt(part, 10);
    return Number.isFinite(n) ? n : 0;
  });
}

/** Negativo se `left` for mais antiga, zero se forem iguais, positivo se `left` for mais nova. */
export function compareVersions(left: string, right: string): number {
  const a = versionParts(left);
  const b = versionParts(right);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const delta = (a[i] ?? 0) - (b[i] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

export function unseenReleaseNotes(
  currentVersion: string,
  seenVersion: string | null
): ReleaseNote[] {
  const published = RELEASE_NOTES.filter(
    (note) => note.items.length > 0 && compareVersions(note.version, currentVersion) <= 0
  ).sort((a, b) => compareVersions(b.version, a.version));

  if (!seenVersion) {
    const current = published.find((note) => compareVersions(note.version, currentVersion) === 0);
    return current ? [current] : [];
  }

  return published.filter((note) => compareVersions(note.version, seenVersion) > 0);
}
