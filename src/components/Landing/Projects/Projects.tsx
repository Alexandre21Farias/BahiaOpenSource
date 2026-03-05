import React from "react";
import "./Projects.css";

export type Project = {
  title: string;
  description: string;
  tag: string;
  status?: "development" | "stable";
};

const projects: Project[] = [
  /**{
    title: "Bahia UI Kit",
    description: "Componentes React: leves, coloridos e acessíveis.",
    tag: "UI/UX",
    status: "development",
  }, */
  {
    title: "Docs Bahia",
    description:
      "Plataforma centralizada para documentação de projetos open-source locais.",
    tag: "Docs",
    status: "development",
  },
  {
    title: "Comunidade Discord",
    description:
      "Nosso ponto de encontro para trocar ideias, tirar dúvidas e marcar eventos.",
    tag: "Community",
    status: "stable",
  },
];

const Projects: React.FC = () => {
  return (
    <section id="projects" className="projects-section">
      <div className="container">
        <h2 className="section-title reveal">Projetos em Destaque</h2>
        <div className="projects-grid">
          {projects.map((p, i) => (
            <div
              key={p.title}
              className={`project-card glass reveal reveal-delay-${i + 1}`}
            >
              {p.status === "development" && (
                <div className="status-badge-dev">
                  <span className="dot"></span>
                  Em desenvolvimento
                </div>
              )}
              <span className="project-tag">{p.tag}</span>
              <h3>{p.title}</h3>
              <p className="project-description">{p.description}</p>
              <a
                href="https://discord.gg/4f5Up8sk"
                className="project-link"
                target="_blank"
              >
                Saber mais →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
