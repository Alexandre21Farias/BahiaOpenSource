import React from "react";

/**
 * Xícara usada no Hero. A inclinação, o vapor e o nível do café são
 * controlados por variáveis CSS (--cup-rot, --steam, --cup-coffee)
 * que o Hero atualiza conforme o scroll.
 */
const CoffeeCup: React.FC = () => {
  return (
    <svg
      className="hero-cup-svg"
      width="300"
      height="300"
      viewBox="0 0 300 300"
      role="img"
      aria-label="Xícara de café com o símbolo </BA>"
    >
      <g
        className="hero-cup-steam"
        fill="none"
        stroke="var(--mocha)"
        strokeWidth="5"
        strokeLinecap="round"
      >
        <path d="M110 70 C95 50, 125 40, 110 18" />
        <path d="M145 62 C130 42, 160 32, 145 10" />
        <path d="M180 70 C165 50, 195 40, 180 18" />
      </g>
      <path
        d="M226 130 C276 130, 276 200, 220 205"
        fill="none"
        stroke="var(--cup-line, var(--brown))"
        strokeWidth="16"
      />
      <path
        d="M58 100 L242 100 L226 236 C222 256, 206 266, 186 266 L114 266 C94 266, 78 256, 74 236 Z"
        fill="var(--surface)"
        stroke="var(--cup-line, var(--brown))"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <ellipse
        className="hero-cup-coffee"
        cx="150"
        cy="116"
        rx="84"
        ry="12"
        fill="var(--brown)"
      />
      <ellipse
        cx="150"
        cy="100"
        rx="92"
        ry="14"
        fill="none"
        stroke="var(--cup-line, var(--brown))"
        strokeWidth="7"
      />
      <rect x="94" y="160" width="112" height="40" rx="4" fill="var(--sun)" />
      <text
        x="150"
        y="187"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="17"
        fontWeight="600"
        fill="var(--brown)"
      >
        {"</BA>"}
      </text>
    </svg>
  );
};

export default CoffeeCup;
