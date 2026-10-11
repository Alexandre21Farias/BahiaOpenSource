import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { BottomTabBar } from "../mobile/BottomTabBar";
import { DesktopNavbar } from "./DesktopNavbar";
import { supabase } from "../../lib/supabase";
import "./MainLayout.css";

export function MainLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  // No celular, o app usa a barra de abas; a landing de visitantes mantém o topo.
  const showTabBar = isMobile && !(pathname === "/" && !user);
  // Logado no desktop: navbar nova; visitantes mantêm o topo da landing.
  const showDesktopNav = !isMobile && !!user;
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Fetch profile username if available
      supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setFullName(data?.full_name ?? null);
          setAvatarUrl(data?.avatar_url ?? null);
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
    await supabase.auth.signOut();
    navigate("/login");
  };

  const displayName = profileUsername || user?.email?.split("@")[0] || "Membro";

  return (
    <div className="app-container">
      {showDesktopNav && (
        <DesktopNavbar
          displayName={displayName}
          fullName={fullName}
          avatarUrl={avatarUrl}
          profileUsername={profileUsername}
          onSignOut={handleSignOut}
        />
      )}

      {/* Topo da landing (visitantes) */}
      {!showTabBar && !showDesktopNav && (
        <header className={`top-navbar ${showNavbar ? "" : "navbar-hidden"}`}>
          <div className="navbar-left">
            <Link to="/" className="logo-terminal">
              OpenBahia
            </Link>

            <Link to="/feed" className="nav-forum-btn">
              Fórum
            </Link>

            <Link to="/projects" className="nav-forum-btn">
              Projetos
            </Link>

            <Link to="/vagas" className="nav-forum-btn">
              Vagas
            </Link>

            {pathname === "/" && (
              <nav className="navbar-sections" aria-label="Seções da página">
                <a href="#about">Sobre</a>
                <a href="#projects">Projetos</a>
                <a href="#join">Participe</a>
              </nav>
            )}
          </div>

          <div className="navbar-right">
            <Link
              to="/login"
              className="nav-forum-btn"
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}
            >
              Entrar
            </Link>
          </div>
        </header>
      )}

      {/* Main Content Viewport */}
      <main
        className={`main-content-layout ${showTabBar ? "has-tab-bar" : ""} ${showDesktopNav ? "has-desktop-nav" : ""}`}
      >
        <Outlet />
      </main>

      {showTabBar && <BottomTabBar />}
    </div>
  );
}
