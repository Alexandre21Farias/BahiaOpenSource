import { MagnifyingGlass } from "@phosphor-icons/react";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className = "",
}: SearchFieldProps) {
  return (
    <label
      className={`flex min-h-12 items-center gap-3 rounded-full bg-[color-mix(in_srgb,var(--brown)_10%,var(--cream))] px-5 text-mocha ${className}`}
    >
      <MagnifyingGlass size={20} aria-hidden />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-base text-brown outline-none placeholder:text-mocha"
      />
    </label>
  );
}
