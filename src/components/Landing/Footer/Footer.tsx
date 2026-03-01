import React from "react";
import "./Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo gradient-text">Open Source Bahia</div>
          <p>
            &copy; {new Date().getFullYear()} — Comunidade Open Source Bahia.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
