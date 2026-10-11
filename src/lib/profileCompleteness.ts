export interface CompletenessProfile {
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  headline: string | null;
  skills: string[] | null;
  experience_level: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
}

/** Itens que compõem o "% completo" e a dica do que falta. */
export function completeness(p: CompletenessProfile | null) {
  const items: { done: boolean; tip: string }[] = [
    {
      done: Boolean(p?.avatar_url),
      tip: "Adicione sua foto pra o pessoal te reconhecer.",
    },
    { done: Boolean(p?.bio), tip: "Escreva uma bio curtinha sobre você." },
    { done: Boolean(p?.location), tip: "Diga de onde você é." },
    { done: Boolean(p?.headline), tip: "Adicione seu título profissional." },
    {
      done: (p?.skills?.length ?? 0) > 0,
      tip: "Adicione suas habilidades pra aparecer pra recrutadores.",
    },
    {
      done: Boolean(p?.experience_level),
      tip: "Adicione sua experiência mais recente pra aparecer pra recrutadores.",
    },
    {
      done: Boolean(p?.github_url || p?.linkedin_url),
      tip: "Conecte seu GitHub ou LinkedIn.",
    },
    { done: Boolean(p?.resume_path), tip: "Envie seu currículo em PDF." },
  ];
  const done = items.filter((i) => i.done).length;
  return {
    percent: Math.round((done / items.length) * 100),
    tip: items.find((i) => !i.done)?.tip ?? "Seu perfil está completo. 🎉",
  };
}
