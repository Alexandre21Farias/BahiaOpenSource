import React from "react";

/** [esquerda %, topo %, largura px, rotação °] */
export type Bean = [number, number, number, number];

/** Grãos de café decorativos espalhados no fundo de uma seção. */
const CoffeeBeans: React.FC<{ beans: Bean[] }> = ({ beans }) => {
  return (
    <div className="landing-beans" aria-hidden="true">
      {beans.map(([left, top, size, rot], i) => (
        <svg
          key={i}
          viewBox="0 0 24 32"
          width={size}
          style={{ left: `${left}%`, top: `${top}%`, rotate: `${rot}deg` }}
        >
          <ellipse cx="12" cy="16" rx="11" ry="15" fill="currentColor" />
          <path
            d="M14 2 C5 11, 19 20, 10 30"
            fill="none"
            stroke="var(--bean-crease)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  );
};

export default CoffeeBeans;
