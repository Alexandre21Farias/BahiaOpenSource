interface StickerBadgeProps {
  children: React.ReactNode;
  tone?: "sun" | "clay";
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
      className={`inline-block rounded-md border-2 border-brown px-2.5 py-0.5 font-display text-[0.8rem] shadow-[2px_2px_0_var(--brown)] ${
        tone === "sun" ? "bg-sun text-brown" : "bg-clay text-cream"
      } ${className}`}
    >
      {children}
    </span>
  );
}
