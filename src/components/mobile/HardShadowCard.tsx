import type { ElementType, ReactNode } from "react";

interface HardShadowCardProps {
  as?: ElementType;
  tone?: "surface" | "sun" | "cream";
  dashed?: boolean;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}

const TONES = {
  surface: "bg-surface",
  sun: "bg-sun",
  cream: "bg-[color-mix(in_srgb,var(--sun)_16%,var(--cream))]",
};

/** Card com borda marrom e sombra dura, assinatura visual do app. */
export function HardShadowCard({
  as: Tag = "div",
  tone = "surface",
  dashed = false,
  className = "",
  children,
  ...rest
}: HardShadowCardProps) {
  return (
    <Tag
      className={`block rounded-[1.25rem] border-2 border-brown p-4 shadow-hard ${
        dashed ? "border-dashed" : "border-solid"
      } ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
