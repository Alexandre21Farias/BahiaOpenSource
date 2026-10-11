import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Chip } from "../../components/shared/Chip";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { useAuth } from "../../contexts/AuthContext";
import { DISCORD_URL } from "../../lib/links";
import { supabase } from "../../lib/supabase";
import { WORK_MODE_LABELS, type Job } from "../../services/jobs";
import { timeAgo } from "../Jobs/timeAgo";
import { DesktopPostCard } from "./DesktopPostCard";
import { initialsOf } from "./postFormat";
import type { Publication, PublicationComment } from "./types";

const CATEGORIES = [
  { id: "all", label: "Tudo" },
  { id: "duvidas", label: "Dúvidas" },
  { id: "projetos", label: "Mostre seu projeto" },
  { id: "discussao", label: "Discussão" },
  { id: "eventos", label: "Eventos" },
];

const JOB_COLORS = ["bg-navy", "bg-clay", "bg-brown"];

/** Larguras das 3 colunas; abaixo de 1000px vira uma coluna só. */
const GRID =
  "grid grid-cols-1 gap-8 min-[1000px]:grid-cols-[250px_minmax(0,1fr)_310px]";
/** Laterais fixas logo abaixo da navbar; rolam por dentro se não couberem. */
const STICKY =
  "min-[1000px]:sticky min-[1000px]:top-[92px] min-[1000px]:max-h-[calc(100vh-108px)] min-[1000px]:self-start min-[1000px]:overflow-y-auto";

export interface FeedDesktopProps {
  publications: Publication[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onOpenModal: () => void;
  userName: string;
  jobs: Job[] | null;
  commentsMap: Record<string, PublicationComment[]>;
  loadingComments: Record<string, boolean>;
  expandedComments: Record<string, boolean>;
  onToggleComments: (id: string) => void;
  onAddComment: (pubId: string, content: string) => Promise<void>;
  onDeleteComment: (pubId: string, commentId: string) => Promise<void>;
  onDeletePublication: (id: string, e: MouseEvent) => void;
}

interface ProfileSummary {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

function Avatar({
  name,
  url,
  className,
}: {
  name: string;
  url?: string | null;
  className: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brown bg-sky font-bold text-brown ${className}`}
    >
      {url ? (
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

function ProfileCard({ fallbackName }: { fallbackName: string }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => active && setProfile(data));
    return () => {
      active = false;
    };
  }, [user]);

  const name = profile?.full_name || fallbackName;
  const username = profile?.username || user?.email?.split("@")[0];

  return (
    <HardShadowCard className="flex flex-col items-center gap-1 p-5 text-center">
      <Avatar
        name={name}
        url={profile?.avatar_url}
        className="mb-2 size-20 text-2xl"
      />
      <p className="text-[0.95rem] font-bold text-brown">{name}</p>
      {username && <p className="text-xs text-text-muted">@{username}</p>}
      <Link
        to={username ? `/${username}` : "/profile"}
        className="mt-3 w-full rounded-full border-[1.5px] border-brown bg-surface py-2 text-sm font-bold text-brown no-underline! hover:bg-sand hover:text-brown!"
      >
        Ver perfil
      </Link>
    </HardShadowCard>
  );
}

function PostSkeleton() {
  return (
    <div
      aria-hidden
      className="animate-pulse rounded-[1.25rem] border-2 border-border-strong bg-surface p-5"
    >
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-sand" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-sand" />
          <div className="h-3 w-20 rounded bg-sand" />
        </div>
      </div>
      <div className="mt-5 h-4 w-3/4 rounded bg-sand" />
      <div className="mt-3 h-3 w-full rounded bg-sand" />
      <div className="mt-2 h-3 w-2/3 rounded bg-sand" />
    </div>
  );
}

function RecentJobsCard({ jobs }: { jobs: Job[] | null }) {
  if (!jobs || jobs.length === 0) return null;
  return (
    <HardShadowCard as="section" aria-label="Vagas recentes" className="p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-[1.05rem] text-brown">
          Vagas recentes
        </h2>
        <Link to="/vagas" className="text-xs font-bold text-navy underline">
          Ver todas
        </Link>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 pl-0">
        {jobs.map((job, i) => (
          <li key={job.id}>
            <Link
              to={`/vagas/${job.id}`}
              className="flex items-center gap-3 no-underline! hover:text-brown!"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg font-display text-sm text-cream ${JOB_COLORS[i % JOB_COLORS.length]}`}
              >
                {job.company.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-bold text-brown">
                  {job.title}
                </span>
                <span className="block truncate text-xs text-text-muted">
                  {job.company} · {WORK_MODE_LABELS[job.work_mode]} ·{" "}
                  {timeAgo(job.created_at)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </HardShadowCard>
  );
}

/** Fórum no desktop: perfil/categorias | feed | vagas, Discord e regras. */
export function FeedDesktop({
  publications,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  activeCategory,
  onCategoryChange,
  onOpenModal,
  userName,
  jobs,
  commentsMap,
  loadingComments,
  expandedComments,
  onToggleComments,
  onAddComment,
  onDeleteComment,
  onDeletePublication,
}: FeedDesktopProps) {
  const { user } = useAuth();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Scroll infinito: ao chegar perto do fim da lista, pede a próxima página.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onLoadMore(),
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, publications.length, onLoadMore]);

  const firstName = userName.split(" ")[0];

  return (
    // Visitantes têm a navbar antiga, fixa e de 60px, que cobre o topo.
    <div className={`min-h-screen bg-cream ${user ? "" : "pt-[60px]"}`}>
      <section className="bg-brown pb-10 text-cream">
        <div className="mx-auto max-w-[1290px] px-6 pt-8">
          <h1 className="font-display text-[3.2rem] leading-none text-cream [text-shadow:3px_3px_0_var(--sun)]">
            Fórum
          </h1>
          <p className="mt-3 text-[0.95rem] text-cream/90">
            Pergunte, mostre o que você fez e troque ideia com a galera.
          </p>
        </div>
      </section>

      <div className={`mx-auto max-w-[1290px] px-6 py-8 ${GRID}`}>
        <aside className={`space-y-6 ${STICKY}`}>
          {user && (
            <div className="max-[999px]:hidden">
              <ProfileCard fallbackName={userName} />
            </div>
          )}
          <nav aria-label="Categorias">
            <p className="mb-3 text-[0.7rem] font-extrabold tracking-wider text-brown uppercase">
              Categorias
            </p>
            <div className="flex flex-wrap gap-2 min-[1000px]:flex-col">
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  active={activeCategory === c.id}
                  onClick={() => onCategoryChange(c.id)}
                  className="min-[1000px]:w-full min-[1000px]:text-left"
                />
              ))}
            </div>
          </nav>
        </aside>

        <main className="min-w-0 space-y-6">
          {user && (
            <HardShadowCard className="flex items-center gap-3 p-3">
              <Avatar name={userName} className="size-10 text-sm" />
              <button
                type="button"
                onClick={onOpenModal}
                className="flex-1 rounded-full border border-border-strong bg-cream px-4 py-2.5 text-left text-sm text-text-muted"
              >
                No que você está pensando, {firstName}?
              </button>
              <button
                type="button"
                onClick={onOpenModal}
                className="rounded-full border-0 bg-sun px-5 py-2.5 text-sm font-bold text-brown"
              >
                Publicar
              </button>
            </HardShadowCard>
          )}

          {loading ? (
            <div className="space-y-6">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : publications.length === 0 ? (
            <HardShadowCard className="p-8 text-center">
              <h2 className="font-display text-xl text-brown">
                Nenhuma publicação por aqui
              </h2>
              <p className="mt-2 text-sm text-text-mid">
                {activeCategory === "all"
                  ? "Seja a primeira pessoa a compartilhar um projeto, dúvida ou novidade!"
                  : "Nada nessa categoria ainda. Que tal criar a primeira?"}
              </p>
            </HardShadowCard>
          ) : (
            publications.map((pub) => (
              <DesktopPostCard
                key={pub.id}
                publication={pub}
                comments={commentsMap[pub.id] || []}
                loadingComments={!!loadingComments[pub.id]}
                isCommentsOpen={!!expandedComments[pub.id]}
                onToggleComments={onToggleComments}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onDeletePublication={onDeletePublication}
              />
            ))
          )}

          {loadingMore && (
            <>
              <PostSkeleton />
              <p
                role="status"
                className="flex items-center justify-center gap-2 text-sm font-bold text-text-mid"
              >
                <span className="size-3 rounded-full border border-brown bg-sun" />
                Passando mais café… carregando posts
              </p>
            </>
          )}
          <div ref={sentinelRef} aria-hidden />
        </main>

        <aside className={`space-y-6 max-[999px]:hidden ${STICKY}`}>
          <RecentJobsCard jobs={jobs} />
          <HardShadowCard tone="sun" className="p-4">
            <h2 className="font-display text-[1.05rem] text-brown">
              Bora pro Discord?
            </h2>
            <p className="mt-2 text-sm text-brown">
              Dúvida rápida? Lá a resposta sai na hora.
            </p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-full bg-brown px-4 py-2 text-sm font-bold text-cream! no-underline! hover:text-cream!"
            >
              Entrar no servidor
            </a>
          </HardShadowCard>
          <HardShadowCard dashed className="p-4 shadow-none">
            <h2 className="text-sm font-bold text-brown">Regras da casa</h2>
            <p className="mt-1 text-xs text-text-mid">
              Respeito sempre, código em bloco, e marque a dúvida como resolvida
              quando ajudarem você.
            </p>
          </HardShadowCard>
        </aside>
      </div>
    </div>
  );
}
