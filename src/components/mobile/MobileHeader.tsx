import type { ReactNode } from "react";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  /** brown = Início/Vagas · sun = Projetos */
  tone?: "brown" | "sun";
  action?: ReactNode;
  /** linha acima do título (ex.: botão voltar) */
  leading?: ReactNode;
  children?: ReactNode;
}

/** Cabeçalho colorido das telas do app, com título Titan One e sombra de gota. */
export function MobileHeader({
  title,
  subtitle,
  tone = "brown",
  action,
  leading,
  children,
}: MobileHeaderProps) {
  const isBrown = tone === "brown";
  return (
    <header
      className={`px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-5 ${
        isBrown ? "bg-brown text-cream" : "bg-sun text-brown"
      }`}
    >
      {leading && <div className="mb-4">{leading}</div>}
      <div className="flex items-start justify-between gap-3">
        <h1
          className={`font-display text-[2.4rem] leading-none ${
            isBrown
              ? "text-cream [text-shadow:2px_2px_0_var(--sun)]"
              : "text-cream [text-shadow:2px_2px_0_var(--brown)]"
          }`}
        >
          {title}
        </h1>
        {action}
      </div>
      {subtitle && (
        <p
          className={`mt-2 text-[0.95rem] ${isBrown ? "text-cream/90" : "text-brown"}`}
        >
          {subtitle}
        </p>
      )}
      {children}
    </header>
  );
}
