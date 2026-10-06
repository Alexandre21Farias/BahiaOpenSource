import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../../components/ui/icon";
import { Info, TrendUp, ArrowUpRight, Hash } from "@phosphor-icons/react";

export function FeedRightSidebar() {
  const newsItems = [
    {
      id: "1",
      title: "Como pode um peixe vivo viver fora d'água fria?",
    },
  ];

  const tags = [
    "opensource",
    "bahia",
    "react",
    "typescript",
    "python",
    "carreira",
  ];

  return (
    <aside className="feed-sidebar-right">
      {/* News Card */}
      <div className="feed-card news-card">
        <div className="news-header">
          <div className="news-title-row">
            <Icon icon={TrendUp} size="md" className="text-sun" />
            <h3 className="news-title">OpenBahia Notícias</h3>
          </div>
          <span title="Notícias e destaques curados para a comunidade">
            <Icon icon={Info} size="sm" className="text-muted" />
          </span>
        </div>

        <p className="news-subtitle">Assuntos em alta</p>

        <div className="news-list">
          {newsItems.map((item) => (
            <div key={item.id} className="news-item">
              <span className="news-item-bullet">•</span>
              <div className="news-item-content">
                <span className="news-item-title">{item.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Tags Card */}
      <div className="feed-card tags-card">
        <h4 className="tags-card-title">Tags da Comunidade</h4>
        <div className="tags-cloud">
          {tags.map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Community Footer Links */}
      <footer className="feed-sidebar-footer">
        <div className="footer-links-grid">
          <Link to="/" className="footer-link">
            Sobre
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            GitHub
          </a>
          <Link to="/ui-demo" className="footer-link">
            Design System
          </Link>
          <span className="footer-link">Privacidade</span>
          <span className="footer-link">Diretrizes</span>
        </div>
        <p className="footer-copyright">
          Bahia Open Source © 2026. Feito com orgulho na Bahia.
        </p>
      </footer>
    </aside>
  );
}
