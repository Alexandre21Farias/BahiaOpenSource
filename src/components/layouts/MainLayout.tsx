import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Icon } from "../ui/icon";
import {
  ChatCircle,
  ListBullets,
  Gear,
  Gift,
  SignOut,
  User,
  List,
  CaretDown,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import "./MainLayout.css";

export function MainLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      // Fetch profile username if available
      supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.username) {
            setProfileUsername(data.username);
          } else if (data?.full_name) {
            setProfileUsername(data.full_name.split(" ")[0]);
          } else if (user.email) {
            setProfileUsername(user.email.split("@")[0]);
          }
        });
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide header on scroll down, show on scroll up
  const [showNavbar, setShowNavbar] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const currentScrollY = window.scrollY;

      // setState só quando o valor muda (evita re-render a cada pixel rolado)
      if (currentScrollY > lastScrollY && currentScrollY > 75) {
        setShowNavbar(false);
      } else if (currentScrollY < lastScrollY) {
        setShowNavbar(true);
      }

      lastScrollY = currentScrollY;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  };

  const displayName = profileUsername || user?.email?.split("@")[0] || "Membro";

  return (
    <div className="app-container">
      {/* curso.dev Top Header Navbar */}
      <header className={`top-navbar ${showNavbar ? "" : "navbar-hidden"}`}>
        <div className="navbar-left">
          <Link to="/" className="logo-terminal">
            OpenBahia
          </Link>

          <Link to="/feed" className="nav-forum-btn">
            Fórum
          </Link>
        </div>

        <div className="navbar-right" ref={dropdownRef}>
          {user ? (
            <button
              className="user-menu-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <Icon icon={User} size="md" />
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                {displayName}
              </span>
              <Icon icon={List} size="md" style={{ marginLeft: "0.2rem" }} />
            </button>
          ) : (
            <Link
              to="/login"
              className="nav-forum-btn"
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}
            >
              Entrar
            </Link>
          )}

          {/* Floating Dropdown Menu (curso.dev style) */}
          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-header">
                <Icon icon={User} size="sm" style={{ color: "var(--sun)" }} />
                <span>{displayName}</span>
              </div>

              <Link
                to="/feed?action=new"
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <Icon icon={ChatCircle} size="sm" />
                <span>Publicar no fórum</span>
              </Link>

              <Link
                to={profileUsername ? `/${profileUsername}` : "/profile"}
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <Icon icon={ListBullets} size="sm" />
                <span>Meus conteúdos</span>
              </Link>

              <Link
                to={
                  profileUsername
                    ? `/${profileUsername}?edit=true`
                    : "/profile?edit=true"
                }
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <Icon icon={Gear} size="sm" />
                <span>Editar perfil</span>
              </Link>

              <button
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  toast("Código promocional / cupom de convite em breve!");
                }}
              >
                <Icon icon={Gift} size="sm" />
                <span>Resgatar código</span>
              </button>

              <button className="dropdown-item logout" onClick={handleSignOut}>
                <Icon icon={SignOut} size="sm" />
                <span>Deslogar</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="main-content-layout">
        <Outlet />
      </main>
    </div>
  );
}
