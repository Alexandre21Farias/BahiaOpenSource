import React from "react";

const line = "var(--cup-line, var(--brown))";

/** Estrelinha de quatro pontas dos cartazes retrô. */
const Sparkle: React.FC<{ x: number; y: number; s: number }> = ({
  x,
  y,
  s,
}) => (
  <path
    transform={`translate(${x} ${y})`}
    d={`M0 ${-s} Q0 0 ${s} 0 Q0 0 0 ${s} Q0 0 ${-s} 0 Q0 0 0 ${-s} Z`}
  />
);

/**
 * Xícara do Hero. O giro (em torno do próprio centro), o vapor e o
 * nível do café são controlados por variáveis CSS (--tilt, --steam,
 * --cup-coffee) que o Hero atualiza conforme o scroll.
 */
const CoffeeCup: React.FC = () => {
  return (
    <svg
      className="hero-cup-svg"
      width="300"
      height="300"
      viewBox="0 0 300 300"
    >
      {/* some quando a xícara começa a girar */}
      <g className="hero-cup-steam">
        <ellipse cx="152" cy="285" rx="74" ry="7" fill={line} />
        <g fill={line}>
          <Sparkle x={52} y={62} s={13} />
          <Sparkle x={28} y={92} s={6} />
          <Sparkle x={266} y={70} s={10} />
          <Sparkle x={272} y={244} s={12} />
          <Sparkle x={34} y={248} s={8} />
        </g>
        <g
          fill="none"
          stroke="var(--mocha)"
          strokeWidth="5"
          strokeLinecap="round"
        >
          <path d="M118 80 C104 62, 132 52, 118 32" />
          <path d="M152 74 C138 56, 166 46, 152 26" />
          <path d="M186 80 C172 62, 200 52, 186 32" />
        </g>
      </g>

      <g className="hero-cup-tilt">
        {/* asa */}
        <path
          d="M230 128 C282 122, 282 190, 220 184"
          fill="none"
          stroke={line}
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d="M230 128 C282 122, 282 190, 220 184"
          fill="none"
          stroke="var(--surface)"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* corpo arredondado */}
        <path
          d="M65 110 C65 192, 104 236, 150 236 C196 236, 235 192, 235 110 Z"
          fill="var(--surface)"
          stroke={line}
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <ellipse
          cx="150"
          cy="110"
          rx="85"
          ry="15"
          fill="var(--surface)"
          stroke={line}
          strokeWidth="7"
        />
        <ellipse
          className="hero-cup-coffee"
          cx="150"
          cy="112"
          rx="72"
          ry="9"
          fill="var(--brown)"
        />
      </g>
    </svg>
  );
};

export default CoffeeCup;
