import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ChatCircle,
  Gear,
  Gift,
  ListBullets,
  MagnifyingGlass,
  Plus,
  SignOut,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface DesktopNavbarProps {
  displayName: string;
  fullName: string | null;
  avatarUrl: string | null;
  profileUsername: string | null;
  onSignOut: () => void;
}

const TABS = [
  { to: "/", label: "Início", end: true },
  { to: "/feed", label: "Fórum" },
  { to: "/vagas", label: "Vagas" },
  { to: "/projects", label: "Projetos" },
];

const MENU_BROWN = "text-brown! hover:text-brown!";
const MENU_ITEM =
  "flex w-full items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm font-semibold no-underline! hover:bg-sand";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : name.slice(0, 2);
  return letters.toUpperCase();
}

/** Barra de navegação do desktop logado: marrom, aba ativa em pílula amarela. */
export function DesktopNavbar({
  displayName,
  fullName,
  avatarUrl,
  profileUsername,
  onSignOut,
}: DesktopNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Na tela de Vagas, o botão de ação vira "Anunciar vaga" e a busca sai.
  const onJobs = useLocation().pathname.startsWith("/vagas");

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const profilePath = profileUsername ? `/${profileUsername}` : "/profile";
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-[1000] bg-brown text-cream">
      <div className="mx-auto flex h-[76px] max-w-[1290px] items-center gap-6 px-6">
        <Link
          to="/"
          className="font-display text-[1.5rem] whitespace-nowrap leading-none text-cream no-underline! [text-shadow:2px_2px_0_var(--sun)] hover:text-cream!"
        >
          Bahia Open Source
        </Link>

        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-1"
        >
          {TABS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-[0.95rem] font-bold no-underline! transition-colors ${
                  isActive
                    ? "bg-sun text-brown hover:text-brown!"
                    : "text-cream hover:bg-cream/10 hover:text-cream!"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {onJobs ? (
          <Link
            to="/vagas?action=new"
            className="ml-auto flex h-11 items-center rounded-full border border-cream/40 px-5 text-[0.95rem] font-bold text-cream! no-underline! hover:bg-cream/10"
          >
            Anunciar vaga
          </Link>
        ) : (
          <>
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                toast("A busca geral chega em breve!");
              }}
              className="ml-auto hidden h-11 w-[300px] min-[1100px]:flex items-center gap-3 rounded-full border border-cream/30 bg-cream/10 px-4"
            >
              <MagnifyingGlass size={18} aria-hidden />
              <input
                type="search"
                aria-label="Buscar posts, vagas, pessoas"
                placeholder="Buscar posts, vagas, pessoas"
                className="min-h-0 w-full border-0 bg-transparent p-0 text-sm text-cream outline-none placeholder:text-cream/70 focus:shadow-none"
              />
            </form>

            <Link
              to="/feed?action=new"
              className="flex h-11 items-center gap-2 rounded-full bg-sun px-5 max-[1099px]:ml-auto text-[0.95rem] font-bold text-brown no-underline! hover:text-brown!"
            >
              <Plus size={18} weight="bold" aria-hidden />
              Publicar
            </Link>
          </>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label={`Menu de ${displayName}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-11 items-center justify-center overflow-hidden rounded-full border-0 bg-sun text-[0.95rem] font-bold text-brown"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initialsOf(fullName || displayName)
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.5rem)] w-60 rounded-2xl border-2 border-brown bg-surface p-2 shadow-hard"
            >
              <p className="truncate px-3 py-2 text-sm font-bold text-brown">
                {displayName}
              </p>
              <Link
                to="/feed?action=new"
                className={`${MENU_ITEM} ${MENU_BROWN}`}
                onClick={closeMenu}
              >
                <ChatCircle size={18} aria-hidden /> Publicar no fórum
              </Link>
              <Link
                to={profilePath}
                className={`${MENU_ITEM} ${MENU_BROWN}`}
                onClick={closeMenu}
              >
                <ListBullets size={18} aria-hidden /> Meus conteúdos
              </Link>
              <Link
                to={`${profilePath}?edit=true`}
                className={`${MENU_ITEM} ${MENU_BROWN}`}
                onClick={closeMenu}
              >
                <Gear size={18} aria-hidden /> Editar perfil
              </Link>
              <button
                type="button"
                className={`${MENU_ITEM} ${MENU_BROWN}`}
                onClick={() => {
                  closeMenu();
                  toast("Código promocional / cupom de convite em breve!");
                }}
              >
                <Gift size={18} aria-hidden /> Resgatar código
              </button>
              <button
                type="button"
                className={`${MENU_ITEM} text-clay! hover:text-clay!`}
                onClick={() => {
                  closeMenu();
                  onSignOut();
                }}
              >
                <SignOut size={18} aria-hidden /> Deslogar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
