import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import {
  Search,
  Code,
  MessageSquare,
  List,
  Settings,
  Gift,
  LogOut,
  User,
  Menu,
  ChevronDown
} from "lucide-react";
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  };

  const displayName = profileUsername || (user?.email ? user.email.split("@")[0] : "AlexDev21");

  return (
    <div className="app-container">
      {/* curso.dev Top Header Navbar */}
      <header className="top-navbar">
        <div className="navbar-left">
          <Link to="/" className="logo-terminal">
            OpenBahia
          </Link>

          <Link to="/code" className="nav-icon-btn" title="Código / Exercícios">
            <Code size={16} />
          </Link>

          <Link to="/search" className="nav-icon-btn" title="Buscar">
            <Search size={16} />
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
              <User size={18} />
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{displayName}</span>
              <Menu size={18} style={{ marginLeft: "0.2rem" }} />
            </button>
          ) : (
            <Link to="/login" className="nav-forum-btn" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
              Entrar
            </Link>
          )}

          {/* Floating Dropdown Menu (curso.dev style) */}
          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-header">
                <User size={16} style={{ color: "var(--supernova-cyan)" }} />
                <span>{displayName}</span>
              </div>

              <Link
                to="/feed?action=new"
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <MessageSquare size={16} />
                <span>Publicar no fórum</span>
              </Link>

              <Link
                to="/profile"
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <List size={16} />
                <span>Meus conteúdos</span>
              </Link>

              <Link
                to="/profile"
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings size={16} />
                <span>Editar perfil</span>
              </Link>

              <button
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  alert("Código promocional / cupom de convite em breve!");
                }}
              >
                <Gift size={16} />
                <span>Resgatar código</span>
              </button>

              <button
                className="dropdown-item logout"
                onClick={handleSignOut}
              >
                <LogOut size={16} />
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
