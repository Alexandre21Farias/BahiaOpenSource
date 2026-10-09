import React from "react";
import "./About.css";

const About: React.FC = () => {
  return (
    <section id="about" className="about-section">
      <div className="container">
        <h2 className="landing-title reveal">Sobre Nós</h2>
        <div className="about-grid">
          <div className="landing-card reveal reveal-delay-1">
            <h3>Nossa missão</h3>
            <p>
              O Open Source Bahia é um movimento que nasceu da vontade de
              democratizar o acesso à criação de software de alta qualidade na
              nossa região. Acreditamos que o código é uma forma de expressão e
              transformação social.
            </p>
          </div>
          <div className="landing-card reveal reveal-delay-2">
            <h3>30+ Colaboradores</h3>
            <p>
              Trabalhando em projetos que impactam a comunidade local. Faça
              parte dessa equipe também!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
