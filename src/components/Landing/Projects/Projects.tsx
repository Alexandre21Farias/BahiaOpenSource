import React from "react";
import CoffeeBeans from "../CoffeeBeans";
import Drip from "../Drip";
import { projects } from "../content";
import "./Projects.css";

const Projects: React.FC = () => {
  return (
    <section
      id="projects"
      className="projects-section landing-dark landing-blue"
    >
      <Drip />
      <CoffeeBeans
        beans={[
          [92, 42, 30, -40],
          [2, 48, 26, 20],
          [96, 78, 22, 70],
        ]}
      />
      <div className="container">
        <span className="landing-eyebrow reveal">
          {"// o que estamos fermentando"}
        </span>
        <h2 className="landing-title reveal">Projetos em Destaque</h2>
        <div className="projects-grid">
          {projects.map((p, i) => (
            <div
              key={p.title}
              className={`landing-card project-card reveal reveal-delay-${i + 1}`}
            >
              {p.status === "development" && (
                <div className="status-badge-dev">
                  <span className="dot"></span>
                  Em desenvolvimento
                </div>
              )}
              <span className={`landing-tag landing-tag--${p.tone}`}>
                {p.tag}
              </span>
              <h3>{p.title}</h3>
              <p className="project-description">{p.description}</p>
              {p.href && (
                <a
                  href={p.href}
                  className="project-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  Saber mais →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
