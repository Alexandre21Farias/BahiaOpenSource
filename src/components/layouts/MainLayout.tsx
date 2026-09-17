import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Home, User, Search, Bell } from "lucide-react";

export function MainLayout() {
  return (
    <div className="main-layout">
      <nav className="sidebar glass">
        <Link to="/" className="sidebar-logo gradient-text">
          OSB
        </Link>
        <div className="sidebar-links">
          <Link to="/" className="sidebar-link active">
            <Home size={24} />
          </Link>
          <Link to="/search" className="sidebar-link">
            <Search size={24} />
          </Link>
          <Link to="/notifications" className="sidebar-link">
            <Bell size={24} />
          </Link>
          <Link to="/profile" className="sidebar-link">
            <User size={24} />
          </Link>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
