export const links = {
  discord: "https://discord.gg/4f5Up8sk",
  github: "https://github.com/Alexandre21Farias/BahiaOpenSource",
} as const;

export const collaborators = "30+";

export type Project = {
  title: string;
  description: string;
  tag: string;
  tone: "sky" | "steel";
  status?: "development" | "stable";
  /** Sem href, o card não mostra o "Saber mais". */
  href?: string;
};

export const projects: Project[] = [
  {
    title: "Docs Bahia",
    description:
      "Plataforma centralizada para documentação de projetos open-source locais.",
    tag: "Docs",
    tone: "sky",
    status: "development",
  },
  {
    title: "Comunidade Discord",
    description:
      "Nosso ponto de encontro para trocar ideias, tirar dúvidas e marcar eventos.",
    tag: "Community",
    tone: "steel",
    status: "stable",
    href: links.discord,
  },
];
