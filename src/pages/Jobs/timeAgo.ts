/** "hoje", "ontem", "há 3 dias", "há 2 semanas"... */
export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "há 1 semana" : `há ${weeks} semanas`;
  const months = Math.floor(days / 30);
  return months <= 1 ? "há 1 mês" : `há ${months} meses`;
}
