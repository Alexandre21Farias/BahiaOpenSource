import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChatCircle,
  Check,
  Columns,
  DownloadSimple,
  Flag,
  GitPullRequest,
  Lock,
  Medal,
  GithubLogo,
  LinkedinLogo,
  LinkSimple,
  MapPin,
} from "@phosphor-icons/react";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { StickerBadge } from "../../components/shared/StickerBadge";
import {
  completeness,
  type CompletenessProfile,
} from "../../lib/profileCompleteness";
import { getResumeUrl } from "../../services/career";
import {
  JOB_LEVEL_LABELS,
  WORK_MODE_LABELS,
  type JobLevel,
  type WorkMode,
} from "../../services/jobs";
import {
  fetchContributions,
  type Contributions,
} from "../../services/projects";
import { timeAgo } from "../Jobs/timeAgo";
import type { Publication } from "../../services/publications";
import { CATEGORY_LABELS, initialsOf } from "../Feed/postFormat";

export interface DesktopProfile extends CompletenessProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  website: string | null;
  created_at: string;
  experience_level: JobLevel | null;
  skills: string[];
  work_modes: string[];
  open_to_work: boolean;
  resume_public: boolean;
}

type Tab = "contrib" | "career" | "posts";

const TABS: { id: Tab; label: string }[] = [
  { id: "contrib", label: "Contribuições" },
  { id: "career", label: "Carreira" },
  { id: "posts", label: "Publicações" },
];

const CARD_TITLE = "font-display text-[1.5rem] text-brown";
const LINK_ROW =
  "flex items-center gap-3 font-bold text-brown! no-underline! hover:text-clay!";

interface Props {
  profile: DesktopProfile;
  name: string;
  isOwn: boolean;
  loggedIn: boolean;
  posts: Publication[];
  onEdit: () => void;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** Perfil no desktop: capa marrom, coluna "sobre" e abas de atividade. */
export function ProfileDesktop({
  profile,
  name,
  isOwn,
  loggedIn,
  posts,
  onEdit,
}: Props) {
  const [tab, setTab] = useState<Tab>("contrib");
  const [contrib, setContrib] = useState<Contributions | null>(null);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  const canSeeResume =
    Boolean(profile.resume_path) &&
    (isOwn || (profile.resume_public && loggedIn));

  useEffect(() => {
    let active = true;
    setContrib(null);
    fetchContributions(profile.id)
      .then((c) => active && setContrib(c))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [profile.id]);

  useEffect(() => {
    if (!canSeeResume || !profile.resume_path) {
      setResumeUrl(null);
      return;
    }
    let active = true;
    getResumeUrl(profile.resume_path)
      .then((url) => active && setResumeUrl(url))
      .catch(() => active && setResumeUrl(null));
    return () => {
      active = false;
    };
  }, [canSeeResume, profile.resume_path]);

  const { percent, tip } = completeness(profile);
  const handle = profile.username || profile.id.slice(0, 8);
  const websiteUrl =
    profile.website &&
    (profile.website.startsWith("http")
      ? profile.website
      : `https://${profile.website}`);
  const modes = profile.work_modes
    .map((m) => WORK_MODE_LABELS[m as WorkMode])
    .filter(Boolean);
  const hasLinks = Boolean(
    profile.github_url || profile.linkedin_url || websiteUrl,
  );

  const tasksDone = contrib?.tasks_done ?? 0;
  const helpful = contrib?.helpful_answers ?? 0;
  const stats = [
    {
      value: tasksDone,
      label: tasksDone === 1 ? "tarefa concluída" : "tarefas concluídas",
    },
    {
      value: helpful,
      label: helpful === 1 ? "resposta que ajudou" : "respostas que ajudaram",
    },
    {
      value: contrib?.projects ?? 0,
      label:
        contrib?.projects === 1
          ? "projeto contribuído"
          : "projetos contribuídos",
    },
  ];

  const badges = [
    {
      label: "Primeira contribuição",
      icon: Flag,
      tone: "bg-sun text-brown",
      earned: tasksDone >= 1,
      goal: "1ª tarefa",
    },
    {
      label: "Resposta que ajudou",
      icon: Check,
      tone: "bg-success text-cream",
      earned: helpful >= 1,
      goal: "1 resposta útil",
    },
    {
      label: "Primeiro PR aceito",
      icon: GitPullRequest,
      tone: "bg-clay text-cream",
      earned: (contrib?.prs_merged ?? 0) >= 1,
      goal: "1 PR aceito",
    },
    {
      label: "Puxou conversa",
      icon: ChatCircle,
      tone: "bg-sky text-navy",
      earned: posts.length >= 1,
      goal: "1ª publicação",
    },
    {
      label: "10 tarefas",
      icon: Columns,
      tone: "bg-sun text-brown",
      earned: tasksDone >= 10,
      goal: `10 tarefas · faltam ${Math.max(10 - tasksDone, 0)}`,
    },
    {
      label: "Mentor · 10 respostas",
      icon: Medal,
      tone: "bg-success text-cream",
      earned: helpful >= 10,
      goal: `Mentor · faltam ${Math.max(10 - helpful, 0)}`,
    },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  // Linha do tempo: contribuições (RPC) + publicações no fórum.
  const activity = [
    ...(contrib?.timeline ?? []).map((item) => ({
      ...item,
      key: `${item.kind}-${item.at}-${item.title}`,
    })),
    ...posts.map((pub) => ({
      kind: "post" as const,
      title: pub.title,
      context: CATEGORY_LABELS[pub.category] ?? "Fórum",
      pr_url: null,
      pr_state: null,
      publication_id: pub.id,
      at: pub.created_at,
      key: `post-${pub.id}`,
    })),
  ].sort((x, y) => +new Date(y.at) - +new Date(x.at));
  const shownActivity = showAllActivity ? activity : activity.slice(0, 5);

  return (
    <div className="min-h-screen bg-cream">
      <div className="h-[140px] bg-brown" />

      <div className="mx-auto max-w-[1290px] px-6 pb-12">
        <header className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <span className="-mt-[90px] flex size-[180px] shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-cream bg-sun font-display text-[4rem] text-brown shadow-[6px_6px_0_var(--brown)]">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="size-full object-cover"
              />
            ) : (
              initialsOf(name)
            )}
          </span>
          <div className="min-w-0 flex-1 pt-4">
            <h1 className="text-[2.4rem] leading-tight font-extrabold text-brown">
              {name}
            </h1>
            <p className="mt-1 text-[1.1rem] text-text-mid">
              @{handle}
              {profile.headline ? ` · ${profile.headline}` : ""}
            </p>
            {profile.location && (
              <p className="mt-1 flex items-center gap-2 text-text-mid">
                <MapPin size={18} aria-hidden /> {profile.location}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {isOwn && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full border-2 border-brown bg-sun px-6 py-3 font-bold text-brown shadow-hard"
              >
                Editar perfil
              </button>
            )}
            {resumeUrl && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border-[1.5px] border-brown bg-surface px-6 py-3 font-bold text-brown! no-underline! hover:text-brown!"
              >
                <DownloadSimple size={18} aria-hidden /> Currículo
              </a>
            )}
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 items-start gap-9 min-[1000px]:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            {isOwn && (
              <HardShadowCard
                as={Link}
                to="/profile?edit=true"
                tone="cream"
                className="p-6"
              >
                <span className="block font-bold text-brown">Seu perfil</span>
                <span className="mt-1 block font-display text-[2.2rem] leading-none text-brown">
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
                <span className="mt-3 block text-sm text-text-mid">{tip}</span>
              </HardShadowCard>
            )}

            <HardShadowCard className="space-y-6 p-6">
              <section>
                <h2 className={CARD_TITLE}>Sobre</h2>
                <p className="mt-2 leading-relaxed whitespace-pre-wrap text-text-mid">
                  {profile.bio || "Ainda sem biografia por aqui."}
                </p>
                <p className="mt-3 text-sm text-text-muted">
                  Entrou em{" "}
                  {new Date(profile.created_at).toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </section>

              {profile.skills.length > 0 && (
                <section>
                  <h2 className={CARD_TITLE}>Habilidades</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-sand px-3 py-1.5 text-sm font-semibold text-brown"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {hasLinks && (
                <section>
                  <h2 className={CARD_TITLE}>Links</h2>
                  <ul className="m-0 mt-3 flex list-none flex-col gap-3 pl-0">
                    {profile.github_url && (
                      <li>
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={LINK_ROW}
                        >
                          <GithubLogo size={20} aria-hidden />
                          {profile.github_url.replace(/^https:\/\//, "")}
                        </a>
                      </li>
                    )}
                    {profile.linkedin_url && (
                      <li>
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={LINK_ROW}
                        >
                          <LinkedinLogo size={20} aria-hidden /> LinkedIn
                        </a>
                      </li>
                    )}
                    {websiteUrl && (
                      <li>
                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={LINK_ROW}
                        >
                          <LinkSimple size={20} aria-hidden />
                          {profile.website!.replace(/^https?:\/\//, "")}
                        </a>
                      </li>
                    )}
                  </ul>
                </section>
              )}
            </HardShadowCard>
          </aside>

          <main className="min-w-0">
            <div
              role="tablist"
              aria-label="Seções do perfil"
              className="flex gap-2 border-b-2 border-border pb-3"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-full border-0 px-5 py-2.5 font-bold text-brown ${
                    tab === t.id ? "bg-sun" : "bg-transparent hover:bg-sand"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="mt-6 space-y-6">
              {tab === "contrib" && (
                <>
                  <div className="grid grid-cols-1 gap-5 min-[1150px]:grid-cols-3">
                    {stats.map((s) => (
                      <HardShadowCard key={s.label} className="p-5">
                        <span className="block font-display text-[2.4rem] leading-none text-brown">
                          {s.value}
                        </span>
                        <span className="mt-2 block font-bold text-brown">
                          {s.label}
                        </span>
                      </HardShadowCard>
                    ))}
                  </div>
                  <HardShadowCard className="p-6">
                    <div className="flex items-baseline justify-between">
                      <h2 className={CARD_TITLE}>Selos</h2>
                      <span className="text-sm text-text-muted">
                        {earnedCount} de {badges.length}
                      </span>
                    </div>
                    <ul className="m-0 mt-5 grid list-none grid-cols-3 gap-y-6 pl-0 min-[1150px]:grid-cols-6">
                      {badges.map(
                        ({ label, icon: BadgeIcon, tone, earned, goal }) => (
                          <li
                            key={label}
                            className="flex flex-col items-center gap-2 text-center"
                          >
                            <span
                              className={`flex size-[76px] items-center justify-center rounded-full ${
                                earned
                                  ? `border-2 border-brown shadow-[3px_3px_0_var(--brown)] ${tone}`
                                  : "border-2 border-dashed border-border-strong bg-bg-soft text-text-ghost"
                              }`}
                            >
                              {earned ? (
                                <BadgeIcon
                                  size={32}
                                  weight="bold"
                                  aria-hidden
                                />
                              ) : (
                                <Lock size={28} aria-hidden />
                              )}
                            </span>
                            <span
                              className={`max-w-[110px] text-[0.8rem] leading-tight font-bold ${
                                earned ? "text-brown" : "text-text-muted"
                              }`}
                            >
                              {earned ? label : goal}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </HardShadowCard>

                  <HardShadowCard className="p-6">
                    <div className="flex items-baseline justify-between">
                      <h2 className={CARD_TITLE}>Linha do tempo</h2>
                      {activity.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowAllActivity((v) => !v)}
                          className="border-0 bg-transparent p-0 text-sm font-bold text-navy underline"
                        >
                          {showAllActivity ? "Ver menos" : "Ver tudo"}
                        </button>
                      )}
                    </div>
                    {activity.length === 0 ? (
                      <p className="mt-3 text-text-mid">
                        Nenhuma atividade por aqui ainda.
                      </p>
                    ) : (
                      <ul className="m-0 mt-4 list-none pl-0">
                        {shownActivity.map((item) => {
                          const merged =
                            item.kind === "task" && item.pr_state === "merged";
                          const Icon =
                            item.kind === "answer"
                              ? Check
                              : item.kind === "post"
                                ? ChatCircle
                                : merged
                                  ? GitPullRequest
                                  : Columns;
                          const tone =
                            item.kind === "answer"
                              ? "bg-sun text-brown"
                              : item.kind === "post"
                                ? "bg-surface text-brown"
                                : merged
                                  ? "bg-success text-cream"
                                  : "bg-sky text-navy";
                          const heading =
                            item.kind === "answer"
                              ? "Resposta marcada como útil"
                              : item.kind === "post"
                                ? `Publicou no fórum: ${item.title}`
                                : merged
                                  ? `PR aceito: ${item.title}`
                                  : `Tarefa concluída: ${item.title}`;
                          return (
                            <li
                              key={item.key}
                              className="flex items-start gap-4 border-b border-border py-4 last:border-b-0"
                            >
                              <span
                                className={`flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-brown ${tone}`}
                              >
                                <Icon size={20} aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-bold text-brown">
                                  {heading}
                                </span>
                                <span className="block text-sm text-text-muted">
                                  {item.kind === "answer"
                                    ? `Fórum · “${item.title}”`
                                    : item.context}
                                  {item.pr_url && (
                                    <>
                                      {" · "}
                                      <a
                                        href={item.pr_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-navy! underline"
                                      >
                                        ver no GitHub
                                      </a>
                                    </>
                                  )}
                                </span>
                              </span>
                              <time
                                dateTime={item.at}
                                className="shrink-0 text-sm text-text-muted"
                              >
                                {timeAgo(item.at)}
                              </time>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </HardShadowCard>
                </>
              )}

              {tab === "career" && (
                <HardShadowCard className="space-y-4 p-6">
                  <h2 className={CARD_TITLE}>Carreira</h2>
                  {profile.open_to_work && (
                    <StickerBadge tilt={-2}>
                      Aberto a oportunidades
                    </StickerBadge>
                  )}
                  <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-brown">
                    <dt className="font-bold">Título</dt>
                    <dd className="m-0 text-text-mid">
                      {profile.headline || "—"}
                    </dd>
                    <dt className="font-bold">Nível</dt>
                    <dd className="m-0 text-text-mid">
                      {profile.experience_level
                        ? JOB_LEVEL_LABELS[profile.experience_level]
                        : "—"}
                    </dd>
                    <dt className="font-bold">Prefere</dt>
                    <dd className="m-0 text-text-mid">
                      {modes.length > 0 ? modes.join(", ") : "—"}
                    </dd>
                  </dl>
                  {resumeUrl ? (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-bold text-navy! underline"
                    >
                      <DownloadSimple size={18} aria-hidden /> Ver currículo
                      (PDF)
                    </a>
                  ) : (
                    isOwn && (
                      <p className="text-sm text-text-mid">
                        Envie seu currículo em PDF em{" "}
                        <button
                          type="button"
                          onClick={onEdit}
                          className="border-0 bg-transparent p-0 font-bold text-navy underline"
                        >
                          Editar perfil
                        </button>
                        .
                      </p>
                    )
                  )}
                </HardShadowCard>
              )}

              {tab === "posts" &&
                (posts.length === 0 ? (
                  <HardShadowCard className="p-8 text-center">
                    <p className="text-text-mid">
                      {isOwn
                        ? "Você ainda não publicou nada."
                        : `${name} ainda não publicou nada.`}
                    </p>
                    {isOwn && (
                      <Link
                        to="/feed?action=new"
                        className="mt-4 inline-block rounded-full bg-sun px-6 py-2.5 font-bold text-brown! no-underline! hover:text-brown!"
                      >
                        Criar primeira publicação
                      </Link>
                    )}
                  </HardShadowCard>
                ) : (
                  posts.map((pub) => (
                    <HardShadowCard
                      key={pub.id}
                      as={Link}
                      to={`/feed#post-${pub.id}`}
                      className="p-6"
                    >
                      <span className="flex items-center justify-between gap-3">
                        {CATEGORY_LABELS[pub.category] && (
                          <StickerBadge tilt={-3} className="text-xs">
                            {CATEGORY_LABELS[pub.category]}
                          </StickerBadge>
                        )}
                        <time
                          dateTime={pub.created_at}
                          className="ml-auto text-sm text-text-muted"
                        >
                          {formatDate(pub.created_at)}
                        </time>
                      </span>
                      <span className="mt-3 block text-[1.2rem] font-extrabold text-brown">
                        {pub.title}
                      </span>
                      <span className="mt-2 line-clamp-3 block text-text-mid">
                        {pub.content}
                      </span>
                      <span className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                        <ChatCircle size={16} aria-hidden />
                        {pub.comments_count ?? 0}{" "}
                        {pub.comments_count === 1 ? "resposta" : "respostas"}
                      </span>
                    </HardShadowCard>
                  ))
                ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
