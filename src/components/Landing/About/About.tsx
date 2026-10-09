import React from "react";
import CoffeeBeans from "../CoffeeBeans";
import "./About.css";

const About: React.FC = () => {
  return (
    <section id="about" className="about-section landing-dark">
      <CoffeeBeans
        beans={[
          [3, 8, 28, 30],
          [94, 30, 34, -20],
          [88, 88, 24, 55],
        ]}
      />
      <div className="container">
        <div className="about-grid">
          <figure className="about-photo reveal">
            <img
              src="/alexandre.webp"
              alt="Alexandre Farias sorrindo, de óculos e camiseta azul"
              width={560}
              height={700}
              loading="lazy"
            />
          </figure>

          <div className="about-copy reveal reveal-delay-1">
            <span className="landing-eyebrow">{"// quem está por trás"}</span>
            <h2 className="about-heading">Oi, eu sou Alexandre.</h2>
            <p>
              Sou de Feira de Santana e criei o Open Source Bahia para juntar
              quem programa por aqui em torno de software livre — com código
              aberto, troca de experiência e muito café.
            </p>

            <div className="about-cards">
              <div className="landing-card">
                <h3>Nossa missão</h3>
                <p>
                  Democratizar o acesso à criação de software de alta qualidade
                  na nossa região. Acreditamos que o código é uma forma de
                  expressão e transformação social.
                </p>
              </div>
              <div className="landing-card">
                <h3>30+ Colaboradores</h3>
                <p>
                  Trabalhando em projetos que impactam a comunidade local. Faça
                  parte dessa equipe também!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
