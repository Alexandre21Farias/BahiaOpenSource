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
import { supabase } from "../lib/supabase";
import { fetchJobs, type Job } from "../services/jobs";
import {
  fetchOpenTaskCounts,
  fetchProjects,
  type Project,
} from "../services/projects";

const DISCORD_URL = "https://discord.gg/6FxRWXryCS";

interface HomeProfile {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  headline: string | null;
  skills: string[] | null;
  experience_level: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
}

/** Itens que compõem o "% completo" e a dica do que falta. */
function completeness(p: HomeProfile | null) {
  const items: { done: boolean; tip: string }[] = [
    {
      done: Boolean(p?.avatar_url),
      tip: "Adicione sua foto pra o pessoal te reconhecer.",
    },
    {
      done: Boolean(p?.bio),
      tip: "Escreva uma bio curtinha sobre você.",
    },
    { done: Boolean(p?.location), tip: "Diga de onde você é." },
    { done: Boolean(p?.headline), tip: "Adicione seu título profissional." },
    {
      done: (p?.skills?.length ?? 0) > 0,
      tip: "Adicione suas habilidades pra aparecer pra recrutadores.",
    },
    {
      done: Boolean(p?.experience_level),
      tip: "Adicione sua experiência mais recente pra aparecer pra recrutadores.",
    },
    {
      done: Boolean(p?.github_url || p?.linkedin_url),
      tip: "Conecte seu GitHub ou LinkedIn.",
    },
    { done: Boolean(p?.resume_path), tip: "Envie seu currículo em PDF." },
  ];
  const done = items.filter((i) => i.done).length;
  return {
    percent: Math.round((done / items.length) * 100),
    tip: items.find((i) => !i.done)?.tip ?? "Seu perfil está completo. 🎉",
  };
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "")).toUpperCase();
}

const circle =
  "flex size-16 items-center justify-center rounded-full border-2 border-brown bg-sand text-brown shadow-[2px_2px_0_var(--brown)]";

export function HomeApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [openTasks, setOpenTasks] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as HomeProfile | null));
    fetchJobs({ limit: 100 })
      .then(setJobs)
      .catch(() => undefined);
    fetchProjects()
      .then(async (list) => {
        setProjects(list);
        setOpenTasks(await fetchOpenTaskCounts(list.map((p) => p.id)));
      })
      .catch(() => undefined);
  }, [user]);

  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Membro";
  const firstName = fullName.split(" ")[0];
  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url;
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

  const invite = async () => {
    const url = window.location.origin;
    try {
      if (navigator.share)
        await navigator.share({ title: "Bahia Open Source", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado! Mande pra quem quiser convidar.");
      }
    } catch {
      /* compartilhamento cancelado */
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

  const matchSkills = (profile?.skills ?? []).slice(0, 2).join(" · ");

  return (
    <div className="min-h-dvh bg-cream">
      <header className="bg-brown px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8 text-cream">
        <Link
          to="/profile"
          aria-label="Meu perfil"
          className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-sun text-lg font-extrabold text-brown no-underline! hover:text-brown!"
        >
          {avatar ? (
            <img src={avatar} alt="" className="size-full object-cover" />
          ) : (
            initials(fullName)
          )}
        </Link>
        <h1 className="mt-6 font-display text-[2rem] leading-tight text-cream [text-shadow:2px_2px_0_var(--sun)]">
          Qual é, {firstName}!
        </h1>
        <p className="mt-2 text-cream/90">
          Passa um café e bora criar algo hoje?
        </p>
      </header>

      <section className="border-b border-border px-5 py-5">
        <Link
          to="/profile"
          className="flex items-center justify-between text-[1.05rem] font-extrabold text-brown no-underline! hover:text-brown!"
        >
          Seu perfil <CaretRight size={20} aria-hidden />
        </Link>
        <p className="mt-3 font-display text-[2rem] leading-none text-brown">
          {percent}% completo
        </p>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-3 h-3 overflow-hidden rounded-full bg-sand"
        >
          <div
            className="h-full rounded-full bg-sun"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-3 text-mocha">{tip}</p>
      </section>

      <section className="border-b border-border py-5">
        <div className="flex gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
          {shortcuts.map(({ label, icon: ShortcutIcon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="flex w-[4.75rem] shrink-0 flex-col items-center gap-2 border-0 bg-transparent p-0 text-center text-[0.85rem] font-bold leading-tight text-brown"
            >
              <span className={circle}>
                <ShortcutIcon size={26} aria-hidden />
              </span>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="border-b border-border px-5 py-5">
        <div className="relative">
          <HardShadowCard
            as={Link}
            to={matches.length > 0 ? "/vagas" : "/profile?edit=true"}
            tone="sun"
            className="flex items-center gap-4 no-underline! hover:text-brown!"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brown text-sun">
              <Briefcase size={24} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              {matches.length > 0 ? (
                <>
                  <span className="block text-[1.05rem] font-extrabold leading-snug text-brown">
                    {matches.length}{" "}
                    {matches.length === 1
                      ? "vaga nova combina"
                      : "vagas novas combinam"}{" "}
                    com você
                  </span>
                  {matchSkills && (
                    <span className="block text-sm text-brown/80">
                      {matchSkills}
                    </span>
                  )}
                </>
              ) : (
                <span className="block text-[1.05rem] font-extrabold leading-snug text-brown">
                  Adicione suas habilidades pra ver vagas que combinam
                </span>
              )}
            </span>
            <CaretRight size={20} className="shrink-0 text-brown" aria-hidden />
          </HardShadowCard>
          {matches.length > 0 && (
            <span className="absolute -top-3 right-3">
              <StickerBadge tone="clay" tilt={4}>
                NOVO!
              </StickerBadge>
            </span>
          )}
        </div>
      </section>

      <section className="px-5 py-5">
        <Link
          to="/projects"
          className="flex items-center justify-between text-[1.05rem] font-extrabold text-brown no-underline! hover:text-brown!"
        >
          Seus projetos <CaretRight size={20} aria-hidden />
        </Link>
        {projects.length === 0 ? (
          <p className="mt-3 text-mocha">
            Você ainda não participa de nenhum projeto.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col pl-0">
            {projects.slice(0, 4).map((p) => {
              const open = openTasks.get(p.id) ?? 0;
              return (
                <li key={p.id} className="list-none border-b border-border">
                  <Link
                    to={`/projects/${p.id}`}
                    className="flex min-h-12 items-center justify-between gap-3 py-3 font-bold text-brown no-underline! hover:text-brown!"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-sm font-normal text-mocha">
                      {open} {open === 1 ? "tarefa aberta" : "tarefas abertas"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
