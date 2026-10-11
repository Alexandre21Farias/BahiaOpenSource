import { NavLink } from "react-router-dom";
import {
  Briefcase,
  ChatCircle,
  Columns,
  House,
  User,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";

interface Tab {
  to: string;
  label: string;
  icon: PhosphorIcon;
  end?: boolean;
}

const TABS: Tab[] = [
  { to: "/", label: "Início", icon: House, end: true },
  { to: "/feed", label: "Fórum", icon: ChatCircle },
  { to: "/vagas", label: "Vagas", icon: Briefcase },
  { to: "/projects", label: "Projetos", icon: Columns },
  { to: "/profile", label: "Perfil", icon: User },
];

/** Navegação principal do app no celular (5 abas, aba ativa em pílula amarela). */
export function BottomTabBar() {
  const { user } = useAuth();
  const tabs = user
    ? TABS
    : [...TABS.slice(0, 4), { to: "/login", label: "Entrar", icon: User }];

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-[1000] flex items-center justify-around border-t border-border bg-cream px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {tabs.map(({ to, label, icon: TabIcon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="flex min-w-14 flex-col items-center gap-0.5 text-xs text-brown"
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-8 items-center justify-center rounded-full transition-all ${
                  isActive ? "w-16 bg-sun" : "w-10"
                }`}
              >
                <TabIcon
                  size={24}
                  weight={isActive ? "fill" : "regular"}
                  aria-hidden
                />
              </span>
              <span className={isActive ? "font-bold" : "font-medium"}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
