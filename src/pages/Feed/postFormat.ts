/** Iniciais para o avatar sem foto ("Maria Souza" → "MS"). */
export function initialsOf(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "")).toUpperCase();
}

/** "40min", "2h", "3d". */
export function relativeTime(iso: string) {
  const min = Math.max(1, Math.floor((Date.now() - +new Date(iso)) / 60000));
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Quebra o texto em trechos comuns e blocos de código (```). */
export function splitCode(content: string) {
  return content
    .split(/```(?:\w+)?\n?/)
    .map((text, i) => ({ text, code: i % 2 === 1 }))
    .filter((s) => s.text.trim().length > 0);
}

export const CATEGORY_LABELS: Record<string, string> = {
  duvidas: "Dúvida",
  projetos: "Projeto",
  discussao: "Discussão",
  artigo: "Artigo",
  eventos: "Evento",
};
