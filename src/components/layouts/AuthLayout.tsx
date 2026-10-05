import React from "react";
import { Outlet, Link } from "react-router-dom";
import "./AuthLayout.css";

export function AuthLayout() {
  return (
    <div className="auth-layout reveal">
      <div className="auth-content">
        <div className="auth-header">
          <Link to="/" className="auth-logo gradient-text">
            Open Source Bahia
          </Link>
        </div>
        <div className="auth-form-container">
          <Outlet />
        </div>
      </div>
      <div className="auth-image-panel glass">
        <div className="auth-image-overlay">
          <h2 className="reveal-delay-1">Bem-vindo à comunidade.</h2>
          <p className="reveal-delay-2">
            Conecte-se com desenvolvedores e impulsione projetos open source.
          </p>
        </div>
      </div>
    </div>
  );
}
