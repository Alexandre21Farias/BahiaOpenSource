import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  CaretRight,
  ChatCircle,
  Columns,
  Plus,
  UserPlus,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { HardShadowCard } from "../components/shared/HardShadowCard";
import { StickerBadge } from "../components/shared/StickerBadge";
import { useAuth } from "../contexts/AuthContext";
import { DISCORD_URL } from "../lib/links";
import {
  completeness,
  type CompletenessProfile,
} from "../lib/profileCompleteness";
import { supabase } from "../lib/supabase";
import { fetchJobs, WORK_MODE_LABELS, type Job } from "../services/jobs";
import {
  fetchOpenTaskCounts,
  fetchProjects,
  type Project,
} from "../services/projects";
import { fetchPublications, type Publication } from "../services/publications";
import { logoColor, logoLetter, techLabel } from "./Jobs/jobUi";
import { CATEGORY_LABELS, relativeTime } from "./Feed/postFormat";

interface HomeProfile extends CompletenessProfile {
  full_name: string | null;
}

const SECTION_TITLE = "font-display text-[1.9rem] leading-none text-brown";
const SEE_ALL = "text-sm font-bold text-navy! underline";

/** Início do app no desktop (usuário logado). */
export function HomeDesktop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [openTasks, setOpenTasks] = useState<Map<string, number>>(new Map());
  const [posts, setPosts] = useState<Publication[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => active && setProfile(data as HomeProfile | null));
    fetchJobs({ limit: 100 })
      .then((list) => active && setJobs(list))
      .catch(() => undefined);
    fetchPublications("all", { from: 0, to: 1 })
      .then((list) => active && setPosts(list))
      .catch(() => undefined);
    fetchProjects()
      .then(async (list) => {
        const counts = await fetchOpenTaskCounts(list.map((p) => p.id));
        if (!active) return;
        setProjects(list);
        setOpenTasks(counts);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Membro";
  const firstName = fullName.split(" ")[0];
  const { percent, tip } = completeness(profile);

  const matches = useMemo(() => {
    const skills = (profile?.skills ?? []).map((s) => s.toLowerCase());
    if (skills.length === 0) return [];
    return jobs.filter((j) =>
      [...j.tags, j.title].some((t) =>
        skills.some((s) => t.toLowerCase().includes(s)),
      ),
    );
  }, [jobs, profile]);
  const matchSkills = (profile?.skills ?? []).slice(0, 2).join(" · ");

  const invite = async () => {
    const url = window.location.origin;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado! Mande pra quem quiser convidar.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const shortcuts = [
    {
      label: "Publicar",
      icon: Plus,
      onClick: () => navigate("/feed?action=new"),
    },
    {
      label: "Buscar vagas",
      icon: Briefcase,
      onClick: () => navigate("/vagas"),
    },
    {
      label: "Meus projetos",
      icon: Columns,
      onClick: () => navigate("/projects"),
    },
    {
      label: "Discord",
      icon: ChatCircle,
      onClick: () => window.open(DISCORD_URL, "_blank", "noopener"),
    },
    { label: "Convidar", icon: UserPlus, onClick: invite },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <section className="bg-brown pb-12 text-cream">
        <div className="mx-auto flex max-w-[1290px] flex-wrap items-start justify-between gap-10 px-6 pt-10">
          <div className="min-w-0">
            <h1 className="font-display text-[4rem] leading-none text-cream [text-shadow:3px_3px_0_var(--sun)]">
              Qual é, {firstName}!
            </h1>
            <p className="mt-4 text-[1.1rem] text-cream/90">
              Passa um café e bora criar algo hoje?
            </p>
            <div className="mt-8 flex gap-6">
              {shortcuts.map(({ label, icon: ShortcutIcon, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="flex w-[84px] flex-col items-center gap-3 border-0 bg-transparent p-0 text-center text-[0.9rem] leading-tight font-bold text-cream"
                >
                  <span className="flex size-[66px] items-center justify-center rounded-full border-2 border-brown bg-surface text-brown shadow-[3px_3px_0_var(--sun)]">
                    <ShortcutIcon size={28} aria-hidden />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <HardShadowCard
            as={Link}
            to="/profile"
            tone="cream"
            shadow="sun"
            className="w-full max-w-[500px] p-6"
          >
            <span className="flex items-center justify-between text-[1.05rem] font-extrabold text-brown">
              Seu perfil <CaretRight size={18} aria-hidden />
            </span>
            <span className="mt-2 block font-display text-[2.6rem] leading-none text-brown">
              {percent}% completo
            </span>
            <span
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-4 block h-3 overflow-hidden rounded-full bg-sand"
            >
              <span
                className="block h-full rounded-full bg-sun"
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="mt-3 block text-text-mid">{tip}</span>
          </HardShadowCard>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1290px] grid-cols-1 gap-10 px-6 py-10 min-[1000px]:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-10">
          <div className="relative">
            <HardShadowCard
              as={Link}
              to={matches.length > 0 ? "/vagas" : "/profile?edit=true"}
              tone="sun"
              className="flex items-center gap-5 p-5"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brown text-sun">
                <Briefcase size={26} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                {matches.length > 0 ? (
                  <>
                    <span className="block text-[1.2rem] font-extrabold text-brown">
                      {matches.length}{" "}
                      {matches.length === 1
                        ? "vaga nova combina"
                        : "vagas novas combinam"}{" "}
                      com você
                    </span>
                    {matchSkills && (
                      <span className="block text-brown/80">{matchSkills}</span>
                    )}
                  </>
                ) : (
                  <span className="block text-[1.2rem] font-extrabold text-brown">
                    Adicione suas habilidades pra ver vagas que combinam
                  </span>
                )}
              </span>
              <CaretRight
                size={22}
                className="shrink-0 text-brown"
                aria-hidden
              />
            </HardShadowCard>
            {matches.length > 0 && (
              <StickerBadge
                tone="clay"
                tilt={4}
                className="absolute -top-3 right-4"
              >
                NOVO!
              </StickerBadge>
            )}
          </div>

          <section aria-labelledby="vagas-recentes">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 id="vagas-recentes" className={SECTION_TITLE}>
                Vagas recentes
              </h2>
              <Link to="/vagas" className={SEE_ALL}>
                Ver todas
              </Link>
            </div>
            {jobs.length === 0 ? (
              <HardShadowCard className="p-6 text-text-mid">
                Ainda não há vagas abertas.
              </HardShadowCard>
            ) : (
              <HardShadowCard className="overflow-hidden p-0">
                <ul className="m-0 list-none pl-0">
                  {jobs.slice(0, 3).map((job) => (
                    <li
                      key={job.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <Link
                        to={`/vagas/${job.id}`}
                        className="flex items-center gap-4 px-6 py-4 text-brown! no-underline! hover:bg-sand/60"
                      >
                        <span
                          className={`flex size-[50px] shrink-0 items-center justify-center rounded-xl font-display text-xl text-cream ${logoColor(job.company)}`}
                        >
                          {logoLetter(job.company)}
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          <span className="block truncate text-[1.05rem] font-bold">
                            {job.title}
                          </span>
                          <span className="block truncate text-sm text-text-muted">
                            {job.company}
                            {job.location ? ` · ${job.location}` : ""} ·{" "}
                            {WORK_MODE_LABELS[job.work_mode]}
                          </span>
                        </span>
                        <span className="hidden gap-2 min-[1150px]:flex">
                          {job.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-sand px-3 py-1 text-xs font-semibold"
                            >
                              {techLabel(t)}
                            </span>
                          ))}
                        </span>
                        <span className="w-10 shrink-0 text-right text-sm text-text-muted">
                          {relativeTime(job.created_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </HardShadowCard>
            )}
          </section>

          <section aria-labelledby="no-forum">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 id="no-forum" className={SECTION_TITLE}>
                No fórum agora
              </h2>
              <Link to="/feed" className={SEE_ALL}>
                Abrir fórum
              </Link>
            </div>
            {posts.length === 0 ? (
              <HardShadowCard className="p-6 text-text-mid">
                Nenhuma publicação ainda. Que tal começar uma conversa?
              </HardShadowCard>
            ) : (
              <div className="grid grid-cols-1 gap-5 min-[1150px]:grid-cols-2">
                {posts.map((post) => {
                  const label = CATEGORY_LABELS[post.category];
                  const who =
                    post.profiles?.full_name ||
                    post.profiles?.username ||
                    "Membro";
                  const n = post.comments_count ?? 0;
                  return (
                    <HardShadowCard
                      key={post.id}
                      as={Link}
                      to={`/feed#post-${post.id}`}
                      className="p-5"
                    >
                      {label && (
                        <StickerBadge
                          tone={post.category === "projetos" ? "clay" : "sun"}
                          tilt={-3}
                          className="text-[0.75rem]"
                        >
                          {label}
                        </StickerBadge>
                      )}
                      <span className="mt-3 block text-[1.15rem] leading-snug font-extrabold text-brown">
                        {post.title}
                      </span>
                      <span className="mt-3 block text-sm text-text-muted">
                        {who} · {n} {n === 1 ? "resposta" : "respostas"} ·{" "}
                        {relativeTime(post.created_at)}
                      </span>
                    </HardShadowCard>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <h2 className={SECTION_TITLE}>Seus projetos</h2>
          {projects.slice(0, 4).map((p) => {
            const open = openTasks.get(p.id) ?? 0;
            return (
              <HardShadowCard
                key={p.id}
                as={Link}
                to={`/projects/${p.id}`}
                className="p-5"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-[1.1rem] font-bold text-brown">
                    {p.name}
                  </span>
                  <StickerBadge tilt={3} className="shrink-0 text-xs">
                    {open} {open === 1 ? "aberta" : "abertas"}
                  </StickerBadge>
                </span>
                {p.description && (
                  <span className="mt-2 line-clamp-2 block text-text-mid">
                    {p.description}
                  </span>
                )}
              </HardShadowCard>
            );
          })}
          <HardShadowCard
            as={Link}
            to="/projects?action=new"
            dashed
            className="p-5 text-center font-bold text-brown shadow-none"
          >
            + Criar projeto
          </HardShadowCard>

          <HardShadowCard tone="brown" shadow="sun" className="p-6">
            <h2 className="font-display text-[1.5rem] text-sun">
              Bora pro Discord?
            </h2>
            <p className="mt-2 text-cream/90">
              Tire dúvidas ao vivo e marque o próximo café com a galera.
            </p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block rounded-full bg-sun px-6 py-3 font-bold text-brown! no-underline! hover:text-brown!"
            >
              Entrar no servidor
            </a>
          </HardShadowCard>
        </aside>
      </div>
    </div>
  );
}
