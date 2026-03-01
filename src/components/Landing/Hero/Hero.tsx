import React from "react";
import "./Hero.css";

const Hero: React.FC = () => {
  return (
    <header className="hero reveal">
      <div className="container">
        <h1 className="gradient-text">
          Feira de Santana, Comunidade de Software Livre
        </h1>
        <p className="hero-subtitle">
          Conectamos desenvolvedores da Bahia para criar o futuro do software,
          preservando nossa cultura e impulsionando a tecnologia local.
        </p>
        <div className="hero-actions">
          <a href="#projects" className="btn btn-primary">
            Ver Projetos
          </a>
          <a href="#about" className="btn btn-secondary">
            Nossa Missão
          </a>
        </div>
      </div>
    </header>
  );
};

export default Hero;
