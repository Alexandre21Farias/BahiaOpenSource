import React, { useCallback, useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  At,
  Calendar,
  Camera,
  ChatCircle,
  FloppyDisk,
  LinkSimple,
  MapPin,
  PencilSimple,
  SignOut,
  User,
  WarningCircle,
  Article,
} from "@phosphor-icons/react";
import { Icon } from "../../components/ui/icon";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { AVATAR_MAX_BYTES, uploadAvatar } from "../../services/avatars";
import {
  EMPTY_CAREER,
  normalizeGithub,
  normalizeLinkedin,
  parseSkills,
  removeResume,
  RESUME_MAX_BYTES,
  uploadResume,
  type CareerForm,
} from "../../services/career";
import type { JobLevel, WorkMode } from "../../services/jobs";
import { ProfileCareerFields, ProfileCareerView } from "./ProfileCareer";
import {
  fetchUserPublications,
  Publication,
} from "../../services/publications";
import "./Profile.css";

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
  headline: string | null;
  experience_level: JobLevel | null;
  skills: string[];
  work_modes: string[];
  open_to_work: boolean;
  github_url: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
  resume_public: boolean;
}

const EMPTY_FORM = {
  full_name: "",
  username: "",
  bio: "",
  location: "",
  website: "",
};
const BIO_MAX = 280;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function Profile() {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [career, setCareer] = useState<CareerForm>(EMPTY_CAREER);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeRemoved, setResumeRemoved] = useState(false);

  const cleanUsername = paramUsername?.replace(/^@/, "").trim() || null;
  const isOwn = Boolean(user && profile && user.id === profile.id);

  useEffect(() => {
    if (authLoading) return;
    if (!cleanUsername && !user) {
      navigate("/login");
      return;
    }

    let active = true;
    const find = (col: string, val: string) =>
      supabase.from("profiles").select("*").eq(col, val).maybeSingle();

    (async () => {
      setLoading(true);
      const data = cleanUsername
        ? ((await find("username", cleanUsername)).data ??
          (await find("id", cleanUsername)).data)
        : (await find("id", user!.id)).data;
      if (!active) return;

      setProfile(data);
      setPosts([]);
      setLoading(false);
      if (!data) return;
      if (!cleanUsername && data.username)
        navigate(`/${data.username}`, { replace: true });
      fetchUserPublications(data.id)
        .then((pubs) => active && setPosts(pubs))
        .catch((err) => console.error("Erro ao carregar publicações:", err));
    })();

    return () => {
      active = false;
    };
  }, [cleanUsername, user, authLoading, navigate]);

  const startEdit = useCallback(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      username: profile.username ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      website: profile.website ?? "",
    });
    setCareer({
      headline: profile.headline ?? "",
      experience_level: profile.experience_level ?? "",
      skills: profile.skills.join(", "),
      work_modes: profile.work_modes as WorkMode[],
      open_to_work: profile.open_to_work,
      github: profile.github_url?.replace("https://github.com/", "") ?? "",
      linkedin: profile.linkedin_url?.replace(/^https:\/\//, "") ?? "",
      resume_public: profile.resume_public,
    });
    setResumeFile(null);
    setResumeRemoved(false);
    setError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(true);
  }, [profile]);

  useEffect(() => {
    if (params.get("edit") === "true" && isOwn) {
      startEdit();
      setParams({}, { replace: true });
    }
  }, [params, isOwn, startEdit, setParams]);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > AVATAR_MAX_BYTES) {
      setError("Escolha uma imagem de até 2 MB.");
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const field =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const username = form.username.trim().replace(/^@/, "");
    if (!/^[\w.-]{3,30}$/.test(username)) {
      setError(
        "O @ deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou _.",
      );
      return;
    }

    const github_url = normalizeGithub(career.github);
    if (github_url === undefined) {
      setError("Informe só o usuário do GitHub (ex.: octocat).");
      return;
    }
    const linkedin_url = normalizeLinkedin(career.linkedin);
    if (linkedin_url === undefined) {
      setError("Use o endereço do seu perfil, como linkedin.com/in/usuario.");
      return;
    }

    setSaving(true);
    setError(null);
    let avatar_url = profile.avatar_url;
    if (avatarFile) {
      try {
        avatar_url = await uploadAvatar(user.id, avatarFile);
      } catch (err) {
        console.error("Erro ao enviar avatar:", err);
        setSaving(false);
        setError("Não foi possível enviar a foto. Tente novamente.");
        return;
      }
    }
    let resume_path = resumeRemoved ? null : profile.resume_path;
    try {
      if (resumeFile) resume_path = await uploadResume(user.id, resumeFile);
      else if (resumeRemoved && profile.resume_path)
        await removeResume(profile.resume_path);
    } catch (err) {
      console.error("Erro ao enviar currículo:", err);
      setSaving(false);
      setError("Não foi possível salvar o currículo. Tente novamente.");
      return;
    }
    const changes = {
      avatar_url,
      headline: career.headline.trim() || null,
      experience_level: career.experience_level || null,
      skills: parseSkills(career.skills),
      work_modes: career.work_modes,
      open_to_work: career.open_to_work,
      github_url,
      linkedin_url,
      resume_path,
      resume_public: resume_path ? career.resume_public : false,
      full_name: form.full_name.trim(),
      username,
      bio: form.bio.trim(),
      location: form.location.trim(),
      website: form.website.trim(),
    };
    const { error: saveError } = await supabase
      .from("profiles")
      .update(changes)
      .eq("id", user.id);
    setSaving(false);

    if (saveError) {
      console.error("Erro ao salvar perfil:", saveError);
      setError(
        saveError.code === "23505"
          ? "Este @ já está em uso por outro membro. Escolha outro!"
          : "Não foi possível salvar o perfil. Tente novamente.",
      );
      return;
    }

    setProfile({ ...profile, ...changes });
    setEditing(false);
    if (username !== profile.username)
      navigate(`/${username}`, { replace: true });
  };

  if (authLoading || loading) {
    return (
      <div className="profile-state">
        <span className="spinner-sm" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-state">
        <h2>Perfil não encontrado</h2>
        <p>Não existe nenhum membro com o nome “{cleanUsername}”.</p>
        <Button onClick={() => navigate("/feed")}>Voltar para o Fórum</Button>
      </div>
    );
  }

  const name = profile.full_name || profile.username || "Membro OpenBahia";
  const avatar =
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=eebb48&color=3f1d12&size=256`;
  const websiteUrl =
    profile.website &&
    (profile.website.startsWith("http")
      ? profile.website
      : `https://${profile.website}`);

  return (
    <div className="profile-page">
      <div className="profile-cover" />

      <div className="profile-shell">
        {editing ? (
          <form className="profile-edit" onSubmit={handleSave}>
            <div className="profile-edit-head">
              <label className="profile-avatar-edit" title="Trocar foto">
                <img
                  src={avatarPreview ?? avatar}
                  alt=""
                  className="profile-avatar profile-avatar-sm"
                />
                <span className="profile-avatar-badge">
                  <Icon icon={Camera} size="sm" />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                  disabled={saving}
                />
              </label>
              <div>
                <h2>Editar perfil</h2>
                <p>
                  {form.username
                    ? `Seu perfil ficará em /${form.username.replace(/^@/, "")}`
                    : "Escolha seu @"}
                </p>
              </div>
            </div>

            {error && (
              <div className="auth-error-alert" role="alert">
                <Icon icon={WarningCircle} size="md" />
                <span>{error}</span>
              </div>
            )}

            <div className="profile-form-grid">
              <Input
                label="Nome completo"
                icon={<Icon icon={User} />}
                value={form.full_name}
                onChange={field("full_name")}
                disabled={saving}
                autoComplete="name"
              />
              <Input
                label="Nome de usuário"
                icon={<Icon icon={At} />}
                value={form.username}
                onChange={field("username")}
                disabled={saving}
                autoComplete="username"
                required
              />
              <Input
                label="Localização"
                icon={<Icon icon={MapPin} />}
                placeholder="Feira de Santana, BA"
                value={form.location}
                onChange={field("location")}
                disabled={saving}
              />
              <Input
                label="Website"
                icon={<Icon icon={LinkSimple} />}
                placeholder="seusite.com"
                value={form.website}
                onChange={field("website")}
                disabled={saving}
              />
              <div className="input-wrapper profile-form-full">
                <label className="input-label" htmlFor="profile-bio">
                  Biografia
                </label>
                <textarea
                  id="profile-bio"
                  rows={4}
                  maxLength={BIO_MAX}
                  placeholder="Conte um pouco sobre você e o que gosta de criar..."
                  value={form.bio}
                  onChange={field("bio")}
                  disabled={saving}
                />
                <span className="hint profile-counter">
                  {form.bio.length}/{BIO_MAX}
                </span>
              </div>
            </div>

            <ProfileCareerFields
              value={career}
              onChange={setCareer}
              disabled={saving}
              resumeName={
                resumeFile
                  ? resumeFile.name
                  : profile.resume_path && !resumeRemoved
                    ? "curriculo.pdf"
                    : null
              }
              onPickResume={(file) => {
                if (
                  file.type !== "application/pdf" ||
                  file.size > RESUME_MAX_BYTES
                ) {
                  setError("Envie um PDF de até 5 MB.");
                  return;
                }
                setError(null);
                setResumeFile(file);
                setResumeRemoved(false);
              }}
              onRemoveResume={() => {
                setResumeFile(null);
                setResumeRemoved(true);
              }}
            />

            <div className="profile-edit-foot">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={saving}>
                <Icon icon={FloppyDisk} size="sm" />
                Salvar alterações
              </Button>
            </div>
          </form>
        ) : (
          <>
            <section className="profile-card">
              <img src={avatar} alt={name} className="profile-avatar" />
              <div className="profile-main">
                <h1>{name}</h1>
                <p className="profile-handle">
                  @{profile.username || profile.id.slice(0, 8)}
                </p>
                {profile.headline && (
                  <p className="profile-headline">{profile.headline}</p>
                )}
                <p className="profile-bio">
                  {profile.bio || "Ainda sem biografia por aqui."}
                </p>
              </div>
              {isOwn && (
                <div className="profile-actions">
                  <Button variant="secondary" onClick={startEdit}>
                    <Icon icon={PencilSimple} size="sm" />
                    Editar perfil
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      supabase.auth.signOut().then(() => navigate("/login"))
                    }
                  >
                    <Icon icon={SignOut} size="sm" />
                    Sair
                  </Button>
                </div>
              )}
            </section>

            <div className="profile-grid">
              <aside className="profile-about">
                <h3>Sobre</h3>
                <ul className="list-reset">
                  {profile.location && (
                    <li>
                      <Icon icon={MapPin} size="sm" /> {profile.location}
                    </li>
                  )}
                  {websiteUrl && (
                    <li>
                      <Icon icon={LinkSimple} size="sm" />
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {profile.website!.replace(/^https?:\/\//, "")}
                      </a>
                    </li>
                  )}
                  <li>
                    <Icon icon={Calendar} size="sm" /> Entrou em{" "}
                    {new Date(profile.created_at).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </li>
                  <li>
                    <Icon icon={Article} size="sm" /> {posts.length}{" "}
                    {posts.length === 1 ? "publicação" : "publicações"}
                  </li>
                </ul>
                <ProfileCareerView
                  profile={profile}
                  isOwn={isOwn}
                  loggedIn={Boolean(user)}
                />
              </aside>

              <div className="profile-feed">
                <h3>
                  {isOwn ? "Minhas publicações" : `Publicações de ${name}`}
                </h3>
                {posts.length === 0 ? (
                  <div className="profile-empty">
                    <p>
                      {isOwn
                        ? "Você ainda não publicou nada."
                        : `${name} ainda não publicou nada.`}
                    </p>
                    {isOwn && (
                      <Link
                        to="/feed?action=new"
                        className="btn btn-primary btn-sm"
                      >
                        Criar primeira publicação
                      </Link>
                    )}
                  </div>
                ) : (
                  posts.map((pub) => (
                    <article key={pub.id} className="profile-post">
                      <div className="profile-post-meta">
                        <span className="badge badge-sun">{pub.category}</span>
                        <time dateTime={pub.created_at}>
                          {formatDate(pub.created_at)}
                        </time>
                      </div>
                      <h4>{pub.title}</h4>
                      <p>{pub.content}</p>
                      {pub.image_url && (
                        <img src={pub.image_url} alt="" loading="lazy" />
                      )}
                      <footer>
                        <Icon icon={ChatCircle} size="sm" />{" "}
                        {pub.comments_count || 0}{" "}
                        {pub.comments_count === 1
                          ? "comentário"
                          : "comentários"}
                      </footer>
                    </article>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
