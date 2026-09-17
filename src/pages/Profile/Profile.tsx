import React, { useEffect, useState } from "react";
import { MapPin, Link as LinkIcon, Calendar, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface ProfileData {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  created_at: string;
}

export function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading || loadingProfile) {
    return (
      <div
        className="container"
        style={{ paddingTop: "100px", textAlign: "center" }}
      >
        Carregando perfil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="container"
        style={{ paddingTop: "100px", textAlign: "center" }}
      >
        Perfil não encontrado.
      </div>
    );
  }

  return (
    <div className="profile-page reveal">
      <div className="profile-cover"></div>
      <div className="profile-header container glass">
        <div className="profile-avatar">
          <img
            src={
              profile.avatar_url || "https://github.com/identicons/bahia.png"
            }
            alt="Avatar"
          />
        </div>
        <div className="profile-info">
          <div className="profile-title-row">
            <div>
              <h1>{profile.full_name || "Usuário"}</h1>
              <p className="profile-username">
                @{profile.username || profile.id.substring(0, 8)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-secondary">Editar Perfil</button>
              <button
                className="btn btn-secondary"
                onClick={handleSignOut}
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <p className="profile-bio">
            {profile.bio || "Nenhuma bio informada."}
          </p>
          <div className="profile-meta">
            <span>
              <Calendar size={16} /> Entrou em{" "}
              {new Date(profile.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-content container">
        <div className="profile-tabs">
          <button className="tab active">Visão Geral</button>
          <button className="tab">Repositórios</button>
          <button className="tab">Projetos</button>
        </div>

        <div className="profile-feed">
          <div className="feed-item glass reveal-delay-1">
            <h3>Bem-vindo ao Open Source Bahia!</h3>
            <p>Seu perfil foi criado com sucesso utilizando o Supabase.</p>
            <span className="feed-date">Hoje</span>
          </div>
        </div>
      </div>
    </div>
  );
}
