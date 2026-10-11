import { useEffect, useState } from "react";
import {
  Calendar,
  GithubLogo,
  LinkedinLogo,
  MapPin,
  ShareNetwork,
  SignOut,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { getResumeUrl } from "../../services/career";
import { JOB_LEVEL_LABELS, type JobLevel } from "../../services/jobs";
import { fetchProfileCounts } from "../../services/projects";

export interface MobileProfile {
  id: string;
  username: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
  headline?: string | null;
  experience_level: JobLevel | null;
  skills: string[];
  open_to_work: boolean;
  github_url: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
  resume_public: boolean;
}

interface Props {
  profile: MobileProfile;
  name: string;
  avatar: string;
  isOwn: boolean;
  loggedIn: boolean;
  posts: { id: string; title: string; category: string }[];
  onEdit: () => void;
  onSignOut: () => void;
}

const btn =
  "flex min-h-12 flex-1 items-center justify-center rounded-full border-2 border-brown px-4 text-[0.95rem] font-bold text-brown";

export function ProfileMobile({
  profile,
  name,
  avatar,
  isOwn,
  loggedIn,
  posts,
  onEdit,
  onSignOut,
}: Props) {
  const [counts, setCounts] = useState({ projects: 0, tasksDone: 0 });
  const canResume =
    Boolean(profile.resume_path) &&
    (isOwn || (profile.resume_public && loggedIn));

  useEffect(() => {
    fetchProfileCounts(profile.id)
      .then(setCounts)
      .catch(() => undefined);
  }, [profile.id]);

  const share = async () => {
    const url = `${window.location.origin}/${profile.username ?? "profile"}`;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link do perfil copiado!");
      }
    } catch {
      /* compartilhamento cancelado */
    }
  };

  const downloadResume = async () => {
    if (!profile.resume_path) return;
    try {
      window.open(
        await getResumeUrl(profile.resume_path),
        "_blank",
        "noopener",
      );
    } catch {
      toast.error("Não foi possível abrir o currículo.");
    }
  };

  const stats = [
    { value: posts.length, label: "publicações" },
    { value: counts.projects, label: "projetos", highlight: true },
    { value: counts.tasksDone, label: "tarefas feitas" },
  ];

  const timeline = [
    profile.experience_level && {
      title: `Nível ${JOB_LEVEL_LABELS[profile.experience_level]}`,
      note: profile.open_to_work ? "Aberto a oportunidades" : undefined,
    },
    {
      title: "Entrou no Bahia Open Source",
      note: new Date(profile.created_at).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    },
  ].filter(Boolean) as { title: string; note?: string }[];

  return (
    <div className="min-h-dvh bg-cream pb-6">
      <div className="h-32 bg-brown px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[1.6rem] text-sun">Perfil</h1>
          <div className="flex gap-2">
            {isOwn && (
              <button
                type="button"
                aria-label="Sair"
                onClick={onSignOut}
                className="flex size-11 items-center justify-center rounded-full border-0 bg-cream/15 p-0 text-cream"
              >
                <SignOut size={20} aria-hidden />
              </button>
            )}
            <button
              type="button"
              aria-label="Compartilhar perfil"
              onClick={share}
              className="flex size-11 items-center justify-center rounded-full border-0 bg-cream/15 p-0 text-cream"
            >
              <ShareNetwork size={20} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="-mt-12 px-5">
        <img
          src={avatar}
          alt={name}
          className="size-24 rounded-[1.25rem] border-2 border-brown bg-sun object-cover shadow-[3px_3px_0_var(--brown)]"
        />
        <h2 className="mt-4 text-[1.6rem] font-extrabold leading-tight text-brown">
          {name}
        </h2>
        <p className="text-mocha">
          @{profile.username || profile.id.slice(0, 8)}
          {profile.headline ? ` · ${profile.headline}` : ""}
        </p>
        <p className="mt-3 text-[1rem] leading-relaxed text-brown">
          {profile.bio || "Ainda sem biografia por aqui."}
        </p>
        <p className="mt-3 flex items-center gap-2 text-mocha">
          {profile.location && (
            <>
              <MapPin size={18} aria-hidden /> {profile.location}
            </>
          )}
        </p>

        {(isOwn || canResume) && (
          <div className="mt-4 flex gap-3">
            {isOwn && (
              <button
                type="button"
                onClick={onEdit}
                className={`${btn} bg-sun shadow-[0_3px_0_var(--brown)]`}
              >
                Editar perfil
              </button>
            )}
            {canResume && (
              <button
                type="button"
                onClick={downloadResume}
                className={`${btn} bg-transparent`}
              >
                Baixar currículo
              </button>
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-[1.25rem] border-2 border-brown bg-surface">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`flex flex-col items-center py-3 ${
                s.highlight
                  ? "border-x-2 border-brown bg-sun"
                  : "bg-transparent"
              }`}
            >
              <p className="font-display text-[1.5rem] leading-none text-brown">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-brown">{s.label}</p>
            </div>
          ))}
        </div>

        {profile.skills.length > 0 && (
          <section className="mt-6">
            <h3 className="text-[1.1rem] font-extrabold text-brown">
              Habilidades
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-sand px-4 py-2 text-[0.95rem] font-semibold text-brown"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {(profile.github_url || profile.linkedin_url) && (
          <div className="mt-5 flex gap-3">
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn} gap-2 no-underline! hover:text-brown!`}
              >
                <GithubLogo size={20} aria-hidden /> GitHub
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn} gap-2 no-underline! hover:text-brown!`}
              >
                <LinkedinLogo size={20} aria-hidden /> LinkedIn
              </a>
            )}
          </div>
        )}

        <section className="mt-6">
          <h3 className="text-[1.1rem] font-extrabold text-brown">
            Trajetória
          </h3>
          <ul className="mt-3 flex flex-col gap-4 pl-0">
            {timeline.map((t) => (
              <li key={t.title} className="flex list-none gap-3">
                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-sun text-brown">
                  <Calendar size={16} aria-hidden />
                </span>
                <div>
                  <p className="font-bold text-brown">{t.title}</p>
                  {t.note && <p className="text-sm text-mocha">{t.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {posts.length > 0 && (
          <section className="mt-6">
            <h3 className="text-[1.1rem] font-extrabold text-brown">
              Publicações
            </h3>
            <ul className="mt-3 flex flex-col gap-2 pl-0">
              {posts.slice(0, 5).map((p) => (
                <li
                  key={p.id}
                  className="list-none rounded-xl bg-sand px-4 py-3 font-semibold text-brown"
                >
                  {p.title}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
