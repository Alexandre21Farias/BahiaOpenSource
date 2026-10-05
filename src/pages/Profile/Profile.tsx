import React, { useEffect, useState } from "react";
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  LogOut,
  Edit2,
  Save,
  X,
  MessageSquare,
  Clock,
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  fetchUserPublications,
  Publication,
} from "../../services/publications";
import "./Profile.css";

interface ProfileData {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  location: string;
  website: string;
  created_at: string;
}

export function Profile() {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userPublications, setUserPublications] = useState<Publication[]>([]);
  const [loadingUserPubs, setLoadingUserPubs] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clean username if it comes with `@` prefix
  const cleanUsername = paramUsername
    ? paramUsername.replace(/^@/, "").trim()
    : null;

  const isOwnProfile = Boolean(user && profile && user.id === profile.id);

  useEffect(() => {
    if (authLoading) return;

    if (cleanUsername) {
      fetchProfileByUsername(cleanUsername);
    } else if (user) {
      fetchOwnProfileAndRedirect();
    } else {
      navigate("/login");
    }
  }, [cleanUsername, user, authLoading]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("edit") === "true" && profile && isOwnProfile) {
      handleEditClick();
    }
  }, [location.search, profile, isOwnProfile]);

  const fetchProfileByUsername = async (targetUsername: string) => {
    setLoadingProfile(true);
    try {
      // 1. Try search by username
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", targetUsername)
        .single();

      if (error || !data) {
        // 2. Fallback search by ID (if URL was /profile/UUID)
        const { data: dataById } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetUsername)
          .single();

        if (dataById) {
          setProfile(dataById);
          loadUserPublications(dataById.id);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(data);
        loadUserPublications(data.id);
      }
    } catch (err) {
      console.error("Error fetching profile by username:", err);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchOwnProfileAndRedirect = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data?.username) {
        setProfile(data);
        loadUserPublications(data.id);
        navigate(`/${data.username}`, { replace: true });
      } else {
        setProfile(data || null);
        if (data) loadUserPublications(data.id);
      }
    } catch (err) {
      console.error("Error fetching own profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadUserPublications = async (userId: string) => {
    setLoadingUserPubs(true);
    try {
      const pubs = await fetchUserPublications(userId);
      setUserPublications(pubs);
    } catch (err) {
      console.error("Error loading user publications:", err);
    } finally {
      setLoadingUserPubs(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleEditClick = () => {
    setFormData({
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      website: profile?.website || "",
    });
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const newUsername = formData.username?.trim().replace(/^@/, "");
    if (!newUsername) {
      setErrorMsg("O nome de usuário não pode ficar em branco.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          username: newUsername,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
        })
        .eq("id", user.id);

      if (error) throw error;

      const updatedProfile = { ...profile, ...formData, username: newUsername };
      setProfile(updatedProfile);
      setIsEditing(false);

      if (newUsername !== profile.username) {
        navigate(`/${newUsername}`, { replace: true });
      }
    } catch (err: any) {
      console.error("Error saving profile:", err);
      if (
        err?.code === "23505" ||
        err?.message?.includes("profiles_username_key") ||
        err?.message?.includes("unique constraint")
      ) {
        setErrorMsg(
          "Este nome de usuário (@) já está em uso por outro membro. Escolha outro!",
        );
      } else {
        setErrorMsg("Ocorreu um erro ao salvar o perfil. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div
        className="container"
        style={{ paddingTop: "100px", textAlign: "center" }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="container"
        style={{ paddingTop: "100px", textAlign: "center" }}
      >
        <h2 style={{ color: "var(--red-star)", marginBottom: "1rem" }}>
          Perfil não encontrado
        </h2>
        <p style={{ color: "var(--text-mid)", marginBottom: "2rem" }}>
          Não foi possível encontrar nenhum membro com o nome de usuário "
          {cleanUsername || "especificado"}".
        </p>
        <Button onClick={() => navigate("/feed")}>Voltar para o Fórum</Button>
      </div>
    );
  }

  const displayName =
    profile.full_name || profile.username || "Membro OpenBahia";

  return (
    <div className="profile-page reveal">
      <div className="profile-cover"></div>

      <div className="profile-header container glass">
        <div className="profile-avatar">
          <img
            src={
              profile.avatar_url || "https://github.com/identicons/bahia.png"
            }
            alt={displayName}
          />
        </div>

        <div className="profile-info">
          {!isEditing ? (
            // VISUALIZATION MODE
            <>
              <div className="profile-title-row">
                <div>
                  <h1>{displayName}</h1>
                  <p className="profile-username">
                    {profile.username || profile.id.substring(0, 8)}
                  </p>
                </div>
                {isOwnProfile && (
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <Button
                      variant="secondary"
                      onClick={handleEditClick}
                      title="Editar Perfil"
                    >
                      <Edit2 size={18} style={{ marginRight: "0.5rem" }} />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      title="Sair"
                      style={{ padding: "0.8rem" }}
                    >
                      <LogOut size={20} />
                    </Button>
                  </div>
                )}
              </div>

              <p className="profile-bio">
                {profile.bio ||
                  "Este viajante do cosmos ainda não escreveu sua biografia."}
              </p>

              <div
                className="profile-meta"
                style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}
              >
                {profile.location && (
                  <span>
                    <MapPin size={16} /> {profile.location}
                  </span>
                )}
                {profile.website && (
                  <span>
                    <LinkIcon size={16} />
                    <a
                      href={
                        profile.website.startsWith("http")
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </span>
                )}
                <span>
                  <Calendar size={16} /> Entrou em{" "}
                  {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </>
          ) : (
            // EDIT MODE
            <form
              onSubmit={handleSaveProfile}
              style={{ animation: "fadeInUp 0.3s ease" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Editar Perfil</h2>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    style={{ padding: "0.5rem" }}
                  >
                    <X size={20} />
                  </Button>
                </div>
              </div>

              {errorMsg && (
                <span className="error-text" style={{ marginBottom: "1rem" }}>
                  {errorMsg}
                </span>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <Input
                  label="Nome Completo"
                  value={formData.full_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  disabled={saving}
                />
                <Input
                  label="Nome de Usuário (@)"
                  value={formData.username || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={saving}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.82rem",
                    color: "var(--text-mid)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Biografia
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.bio || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Conte um pouco sobre sua jornada..."
                  disabled={saving}
                  style={{ resize: "vertical" }}
                ></textarea>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <Input
                  label="Localização"
                  value={formData.location || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Sua galáxia / cidade"
                  icon={<MapPin size={16} />}
                  disabled={saving}
                />
                <Input
                  label="Website / Link"
                  value={formData.website || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="seusite.com"
                  icon={<LinkIcon size={16} />}
                  disabled={saving}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <Button type="submit" isLoading={saving}>
                  <Save size={18} style={{ marginRight: "0.5rem" }} />
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {!isEditing && (
        <div
          className="profile-content container"
          style={{ marginTop: "2rem" }}
        >
          <div className="profile-tabs" style={{ marginBottom: "1.5rem" }}>
            <button className="tab active">
              {isOwnProfile
                ? "Minhas Publicações"
                : `Publicações de ${displayName}`}{" "}
              ({userPublications.length})
            </button>
          </div>

          <div
            className="profile-feed"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {loadingUserPubs ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div className="spinner"></div>
              </div>
            ) : userPublications.length === 0 ? (
              <div
                className="feed-item glass"
                style={{ padding: "1.5rem", borderRadius: "var(--radius-md)" }}
              >
                <h3>Nenhuma publicação realizada</h3>
                <p style={{ color: "var(--text-mid)", lineHeight: "1.6" }}>
                  {isOwnProfile
                    ? "Você ainda não criou nenhuma publicação no fórum da comunidade."
                    : `${displayName} ainda não criou nenhuma publicação.`}
                </p>
              </div>
            ) : (
              userPublications.map((pub) => (
                <div
                  key={pub.id}
                  className="feed-item glass"
                  style={{
                    padding: "1.5rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                      {pub.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--supernova-cyan)",
                        textTransform: "uppercase",
                      }}
                    >
                      {pub.category}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "var(--text-mid)",
                      lineHeight: "1.5",
                      fontSize: "0.92rem",
                      marginBottom: "0.8rem",
                    }}
                  >
                    {pub.content}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      fontSize: "0.8rem",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <Clock size={14} />
                      {new Date(pub.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <MessageSquare size={14} />
                      {pub.comments_count || 0} comentários
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
