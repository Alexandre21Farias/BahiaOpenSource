import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../../components/ui/icon";
import {
  User,
  BookmarkSimple,
  Users,
  Calendar,
  MapPin,
  Sparkle,
  SignIn,
} from "@phosphor-icons/react";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { UserProfileSummary } from "../types";

interface FeedProfileSidebarProps {
  publicationsCount?: number;
}

export function FeedProfileSidebar({
  publicationsCount = 0,
}: FeedProfileSidebarProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, bio, location")
          .eq("id", user.id)
          .single();

        if (isMounted && !error && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <aside className="feed-sidebar-left">
        <div className="feed-card feed-profile-card text-center p-5">
          <div className="profile-guest-avatar">
            <Icon icon={User} size={32} />
          </div>
          <h3 className="profile-guest-title">Comunidade Bahia</h3>
          <p className="profile-guest-text">
            Conecte-se com desenvolvedores da Bahia, compartilhe projetos e
            colabore em código aberto.
          </p>
          <Link
            to="/login"
            className="feed-btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <Icon icon={SignIn} size="sm" />
            <span>Fazer login</span>
          </Link>
        </div>
      </aside>
    );
  }

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user.email?.split("@")[0] ||
    "Desenvolvedor";
  const username = profile?.username || user.email?.split("@")[0] || "perfil";
  const bio =
    profile?.bio || "Desenvolvedor de Software | Comunidade OpenBahia";
  const location = profile?.location || "Bahia, Brasil";
  const avatarUrl =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=eebb48&color=0f3b59`;

  return (
    <aside className="feed-sidebar-left">
      <div className="feed-card feed-profile-card">
        {/* Banner Cover */}
        <div className="profile-card-cover">
          <span className="profile-cover-tag">OpenBahia</span>
        </div>

        {/* Avatar + Info */}
        <div className="profile-card-header">
          <Link to={`/${username}`} className="profile-card-avatar-wrapper">
            <img
              src={avatarUrl}
              alt={displayName}
              className="profile-card-avatar"
            />
          </Link>

          <Link to={`/${username}`} className="profile-card-name">
            {displayName}
          </Link>
          <p className="profile-card-headline">{bio}</p>

          <div className="profile-card-location">
            <Icon icon={MapPin} size="sm" />
            <span>{location}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="profile-card-stats">
          <div className="profile-stat-row">
            <span className="stat-label">Minhas publicações</span>
            <span className="stat-value">{publicationsCount}</span>
          </div>
        </div>

        {/* Extra Links */}
        <div className="profile-card-links">
          <Link to={`/${username}`} className="profile-card-link-item">
            <Icon icon={BookmarkSimple} size="sm" />
            <span>Itens salvos</span>
          </Link>
          <Link to="/search" className="profile-card-link-item">
            <Icon icon={Users} size="sm" />
            <span>Grupos & Comunidades</span>
          </Link>
          <Link to="/feed" className="profile-card-link-item">
            <Icon icon={Sparkle} size="sm" />
            <span>Projetos em destaque</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
