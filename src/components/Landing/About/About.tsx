import React from "react";
import "./About.css";

const About: React.FC = () => {
  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="about-grid">
          <div className="reveal reveal-delay-1">
            <h2 className="section-title">Sobre Nós</h2>
            <p>
              O Open Source Bahia é um movimento que nasceu da vontade de
              democratizar o acesso à criação de software de alta qualidade na
              nossa região. Acreditamos que o código é uma forma de expressão e
              transformação social.
            </p>
          </div>
          <div className="reveal reveal-delay-2 stats-card glass">
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
