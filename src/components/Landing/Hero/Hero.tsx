import React, { useEffect, useRef } from "react";
import CoffeeCup from "./CoffeeCup";
import "./Hero.css";

const clamp = (v: number): number => Math.min(1, Math.max(0, v));
const smoothstep = (t: number): number => t * t * (3 - 2 * t);

/**
 * Hero com a xícara que derrama ao rolar.
 *
 * O bloco tem 240vh de altura e o "palco" fica preso (sticky) enquanto o
 * usuário rola. O progresso (0 → 1) vira variáveis CSS que inclinam a
 * xícara, liberam o filete de café e fazem a poça marrom subir até cobrir
 * a tela — a partir daí o marrom é o próprio fundo das seções seguintes.
 */
const Hero: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = (): void => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const p =
        reduceMotion.matches || range <= 0 ? 0 : clamp(-rect.top / range);

      const tilt = smoothstep(clamp(p / 0.4));
      const pour = clamp((p - 0.3) / 0.12) * (1 - clamp((p - 0.86) / 0.1));
      const pool = Math.pow(clamp((p - 0.34) / 0.56), 1.3);
      const ink = clamp((pool * 112 - 45) / 30);

      el.style.setProperty("--tilt", tilt.toFixed(4));
      el.style.setProperty("--stream", pour.toFixed(4));
      el.style.setProperty("--pool", pool.toFixed(4));
      el.style.setProperty("--ink", ink.toFixed(4));
      el.style.setProperty("--steam", (1 - clamp(p / 0.15)).toFixed(3));
      el.style.setProperty(
        "--cup-coffee",
        (1 - clamp((p - 0.2) / 0.3)).toFixed(3),
      );
      el.style.setProperty("--hint", (1 - clamp(p / 0.08)).toFixed(3));
    };

    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduceMotion.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduceMotion.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <header className="hero-pour" ref={rootRef}>
      <div className="hero-stage">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="landing-eyebrow hero-eyebrow">
              {"// Feira de Santana · comunidade de software livre"}
            </span>
            <h1 className="hero-title">
              Bahia
              <br />
              Open
              <br />
              Source
            </h1>
            <p className="hero-subtitle">
              Conectamos desenvolvedores da Bahia para criar o futuro do
              software, preservando nossa cultura e impulsionando a tecnologia
              local.
            </p>
            <div className="hero-actions">
              <a href="#projects" className="btn btn-primary">
                Ver Projetos
              </a>
              <a href="#about" className="btn btn-secondary">
                Nossa Missão
              </a>
            </div>
            <span className="hero-hint" aria-hidden="true">
              role para baixo ↓
            </span>
          </div>

          <div className="hero-cup">
            <div className="hero-cup-inner">
              <div className="hero-stream" aria-hidden="true" />
              <div className="hero-cup-tilt">
                <CoffeeCup />
              </div>
            </div>
          </div>
        </div>

        <div className="hero-pool" aria-hidden="true">
          <svg
            className="hero-pool-wave"
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
          >
            <path d="M0 40 C 180 0, 360 60, 540 30 S 900 0, 1080 30 S 1320 60, 1440 20 L1440 60 L0 60 Z" />
          </svg>
        </div>
      </div>
    </header>
  );
};

export default Hero;
