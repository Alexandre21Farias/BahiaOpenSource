interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Filtro em pílula. Ativo = marrom cheio. */
export function Chip({
  label,
  active = false,
  onClick,
  className = "",
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 min-h-11 rounded-full border-[1.5px] px-5 text-[0.95rem] font-bold transition-colors ${
        active
          ? "border-brown bg-brown text-cream"
          : "border-border-strong bg-surface text-brown"
      } ${className}`}
    >
      {label}
    </button>
  );
}

/** Linha de chips rolável na horizontal. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
      {children}
    </div>
  );
}
