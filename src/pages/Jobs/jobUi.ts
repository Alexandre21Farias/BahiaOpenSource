import type { Job } from "../../services/jobs";

const LOGO_COLORS = ["bg-navy", "bg-clay", "bg-brown", "bg-success"];

/** Cor estável do logo da empresa, derivada do nome. */
export function logoColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return LOGO_COLORS[h % LOGO_COLORS.length];
}

export function logoLetter(company: string) {
  return (company.trim()[0] ?? "?").toUpperCase();
}

/** Vaga publicada nos últimos 3 dias. */
export function isNewJob(job: Job) {
  return Date.now() - new Date(job.created_at).getTime() < 3 * 86_400_000;
}

/** Quais tecnologias da vaga já aparecem nas habilidades do perfil. */
export function matchJob(job: Job, skills: string[]) {
  const mine = skills.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const tag of job.tags) {
    const t = tag.toLowerCase();
    (mine.some((s) => t.includes(s)) ? matched : missing).push(tag);
  }
  return { matched, missing, total: job.tags.length };
}

const TECH_LABELS: Record<string, string> = {
  css: "CSS",
  html: "HTML",
  sql: "SQL",
  php: "PHP",
  aws: "AWS",
  api: "API",
  git: "Git",
  react: "React",
  vue: "Vue",
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  javascript: "JavaScript",
  typescript: "TypeScript",
  postgresql: "PostgreSQL",
  postgres: "Postgres",
  mysql: "MySQL",
  mongodb: "MongoDB",
  graphql: "GraphQL",
  nextjs: "Next.js",
  "next.js": "Next.js",
  "c#": "C#",
  ".net": ".NET",
};

/** Nome de exibição da tecnologia ("typescript" → "TypeScript"). */
export function techLabel(tag: string) {
  const known = TECH_LABELS[tag.toLowerCase()];
  return known ?? tag.charAt(0).toUpperCase() + tag.slice(1);
}
