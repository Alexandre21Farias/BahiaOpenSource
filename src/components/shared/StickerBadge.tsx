const TONES = {
  sun: "bg-sun text-brown",
  clay: "bg-clay text-cream",
  sky: "bg-sky text-brown",
  success: "bg-success text-cream",
};

interface StickerBadgeProps {
  children: React.ReactNode;
  tone?: "sun" | "clay" | "sky" | "success";
  tilt?: number;
  className?: string;
}

/** Selo "adesivo" levemente inclinado (Dúvida, Projeto, NOVO!, [R$ faixa]). */
export function StickerBadge({
  children,
  tone = "sun",
  tilt = -3,
  className = "",
}: StickerBadgeProps) {
  return (
    <span
      style={{ transform: `rotate(${tilt}deg)` }}
      className={`inline-block rounded-md border-2 border-brown px-2.5 py-0.5 font-display text-[0.8rem] shadow-[2px_2px_0_var(--brown)] ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
