import React from "react";
import CoffeeBeans from "../CoffeeBeans";
import { links } from "../content";
import "./Join.css";

const Join: React.FC = () => {
  return (
    <section id="join" className="join-section landing-dark landing-blue">
      <CoffeeBeans
        beans={[
          [70, 14, 38, 25],
          [84, 52, 28, -50],
          [62, 78, 24, 60],
          [93, 84, 32, 10],
        ]}
      />
      <div className="container">
        <span className="landing-eyebrow reveal">{"// puxe uma cadeira"}</span>
        <h2 className="join-title reveal">
          Bora tomar
          <br />
          um café?
        </h2>
        <p className="join-text reveal reveal-delay-1">
          Entre na comunidade, mande sua primeira contribuição ou só apareça
          para conversar sobre código.
        </p>
        <div className="join-actions reveal reveal-delay-2">
          <a
            href={links.discord}
            className="btn btn-primary"
            target="_blank"
            rel="noreferrer"
          >
            Entrar no Discord
          </a>
          <a
            href={links.github}
            className="btn btn-secondary join-secondary"
            target="_blank"
            rel="noreferrer"
          >
            Ver no GitHub
          </a>
        </div>
      </div>
    </section>
  );
};

export default Join;
