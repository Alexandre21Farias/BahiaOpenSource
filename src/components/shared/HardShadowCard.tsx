import type { ElementType, ReactNode } from "react";

interface HardShadowCardProps {
  as?: ElementType;
  tone?: "surface" | "sun" | "cream" | "brown";
  /** cor da sombra dura; padrão marrom */
  shadow?: "brown" | "sun";
  dashed?: boolean;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}

const TONES = {
  surface: "bg-surface hover:text-brown!",
  sun: "bg-sun hover:text-brown!",
  cream:
    "bg-[color-mix(in_srgb,var(--sun)_16%,var(--cream))] hover:text-brown!",
  brown: "bg-brown text-cream hover:text-cream!",
};

const SHADOWS = {
  brown: "shadow-hard",
  sun: "shadow-[4px_4px_0_var(--sun)]",
};

/** Card com borda marrom e sombra dura, assinatura visual do app. */
export function HardShadowCard({
  as: Tag = "div",
  tone = "surface",
  shadow = "brown",
  dashed = false,
  className = "",
  children,
  ...rest
}: HardShadowCardProps) {
  return (
    <Tag
      className={`block no-underline! rounded-[1.25rem] border-2 border-brown p-4 ${SHADOWS[shadow]} ${
        dashed ? "border-dashed" : "border-solid"
      } ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
