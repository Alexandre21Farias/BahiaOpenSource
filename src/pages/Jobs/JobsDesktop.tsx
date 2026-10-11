import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  BookmarkSimple,
  Check,
  Clock,
  MapPin,
  MagnifyingGlass,
  Plus,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Chip } from "../../components/shared/Chip";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { StickerBadge } from "../../components/shared/StickerBadge";
import { useAuth } from "../../contexts/AuthContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { supabase } from "../../lib/supabase";
import {
  deleteJob,
  fetchBookmarkedJobIds,
  fetchJobs,
  JOB_TYPE_LABELS,
  setJobBookmark,
  setJobOpen,
  SOURCE_LABELS,
  WORK_MODE_LABELS,
  type Job,
  type JobLevel,
  type WorkMode,
} from "../../services/jobs";
import { JobForm } from "./JobForm";
import { isNewJob, logoColor, logoLetter, matchJob, techLabel } from "./jobUi";
import { timeAgo } from "./timeAgo";
import "./Jobs.css";

const MODES: { id: WorkMode; label: string }[] = [
  { id: "remote", label: "Remoto" },
  { id: "hybrid", label: "Híbrido" },
  { id: "onsite", label: "Presencial" },
];

const LEVELS: { id: JobLevel; label: string }[] = [
  { id: "estagio", label: "Estágio" },
  { id: "junior", label: "Júnior" },
  { id: "pleno", label: "Pleno" },
  { id: "senior", label: "Sênior" },
];

const TAG_PILL =
  "rounded-full bg-sand px-3 py-1 text-xs font-semibold text-brown";

const BIG_FIELD =
  "flex h-[60px] items-center gap-3 rounded-full bg-surface px-6 text-text-muted shadow-[3px_4px_0_var(--sun)]";
const BIG_INPUT =
  "min-h-0 w-full border-0 bg-transparent p-0 text-base text-brown outline-none placeholder:text-text-ghost focus:shadow-none";

function Logo({ company, className }: { company: string; className: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl font-display text-cream ${logoColor(company)} ${className}`}
    >
      {logoLetter(company)}
    </span>
  );
}

/** Vagas no desktop: lista à esquerda, detalhe fixo à direita. */
export function JobsDesktop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  // Entre 769 e 999px não há espaço para o painel: o card abre a página da vaga.
  const narrow = useMediaQuery("(max-width: 999px)");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(jobId ?? null);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [skills, setSkills] = useState<string[]>([]);

  // Busca digitada x busca aplicada (botão Buscar / Enter).
  const [typedQuery, setTypedQuery] = useState("");
  const [typedPlace, setTypedPlace] = useState("");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState("");
  const [mode, setMode] = useState<WorkMode | null>(null);
  const [level, setLevel] = useState<JobLevel | null>(null);

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch(() => toast.error("Não foi possível carregar as vagas."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    // Sem a tabela job_bookmarks (migration pendente) a lista segue funcionando.
    fetchBookmarkedJobIds(user.id)
      .then((ids) => active && setSaved(ids))
      .catch(() => undefined);
    supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => active && setSkills(data?.skills ?? []));
    return () => {
      active = false;
    };
  }, [user]);

  // "Anunciar vaga" da navbar chega como ?action=new.
  useEffect(() => {
    if (searchParams.get("action") !== "new") return;
    if (user) setShowForm(true);
    else navigate("/login");
    searchParams.delete("action");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, user, navigate]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const p = place.trim().toLowerCase();
    return jobs.filter((j) => {
      if (mode && j.work_mode !== mode) return false;
      if (level && j.level !== level) return false;
      if (
        q &&
        ![j.title, j.company, ...j.tags].join(" ").toLowerCase().includes(q)
      )
        return false;
      if (p) {
        const where = `${j.location ?? ""} ${WORK_MODE_LABELS[j.work_mode]}`;
        if (!where.toLowerCase().includes(p)) return false;
      }
      return true;
    });
  }, [jobs, query, place, mode, level]);

  const selected = narrow
    ? null
    : (visible.find((j) => j.id === selectedId) ?? visible[0] ?? null);

  const applySearch = (e: FormEvent) => {
    e.preventDefault();
    setQuery(typedQuery);
    setPlace(typedPlace);
  };

  const toggleSaved = async (id: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const willSave = !saved.has(id);
    const apply = (on: boolean) =>
      setSaved((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    apply(willSave);
    try {
      await setJobBookmark(user.id, id, willSave);
    } catch {
      apply(!willSave);
      toast.error("Não foi possível salvar a vaga.");
    }
  };

  const share = async (id: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/vagas/${id}`,
      );
      toast.success("Link da vaga copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const toggleOpen = async (job: Job) => {
    try {
      await setJobOpen(job.id, !job.is_open);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_open: !j.is_open } : j)),
      );
      toast.success(job.is_open ? "Vaga encerrada." : "Vaga reaberta.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(
        message.includes("limite de 5 vagas")
          ? "Você já tem 5 vagas abertas. Feche uma antes de reabrir esta."
          : "Não foi possível atualizar a vaga.",
      );
    }
  };

  const remove = async (job: Job) => {
    if (!window.confirm("Excluir esta vaga definitivamente?")) return;
    try {
      await deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success("Vaga excluída.");
    } catch {
      toast.error("Não foi possível excluir a vaga.");
    }
  };

  return (
    // Visitantes têm a navbar antiga, fixa e de 60px, que cobre o topo.
    <div className={`min-h-screen bg-cream ${user ? "" : "pt-[60px]"}`}>
      <section className="bg-brown pb-10 text-cream">
        <div className="mx-auto max-w-[1290px] px-6 pt-8">
          <h1 className="font-display text-[3.2rem] leading-none text-cream [text-shadow:3px_3px_0_var(--sun)]">
            Vagas
          </h1>
          <p className="mt-3 text-[1.05rem] text-cream/90">
            Oportunidades de tecnologia pra galera da Bahia — e de qualquer
            lugar, se for remoto.
          </p>
          <form
            role="search"
            onSubmit={applySearch}
            className="mt-6 flex flex-wrap items-center gap-4"
          >
            <label className={`${BIG_FIELD} min-w-[260px] flex-[3]`}>
              <MagnifyingGlass size={22} aria-hidden />
              <input
                value={typedQuery}
                onChange={(e) => setTypedQuery(e.target.value)}
                placeholder="Cargo, empresa ou tecnologia"
                className={BIG_INPUT}
              />
            </label>
            <label className={`${BIG_FIELD} min-w-[200px] flex-[1.3]`}>
              <MapPin size={22} aria-hidden />
              <input
                value={typedPlace}
                onChange={(e) => setTypedPlace(e.target.value)}
                placeholder="Cidade ou remoto"
                className={BIG_INPUT}
              />
            </label>
            <button
              type="submit"
              className="h-[54px] rounded-full border-0 bg-sun px-8 text-[1.05rem] font-bold text-brown"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-[1290px] px-6 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <Chip label="Todas" active={!mode} onClick={() => setMode(null)} />
          {MODES.map((m) => (
            <Chip
              key={m.id}
              label={m.label}
              active={mode === m.id}
              onClick={() => setMode(mode === m.id ? null : m.id)}
            />
          ))}
          <span aria-hidden className="mx-1 h-8 w-px bg-border-strong" />
          {LEVELS.map((l) => (
            <Chip
              key={l.id}
              label={l.label}
              active={level === l.id}
              onClick={() => setLevel(level === l.id ? null : l.id)}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 items-start gap-9 min-[1000px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <section aria-label="Lista de vagas" className="min-w-0">
            <p className="mb-3 flex items-center justify-between text-sm text-text-mid">
              <span>
                {visible.length}{" "}
                {visible.length === 1 ? "vaga aberta" : "vagas abertas"}
              </span>
              <span className="font-bold text-clay">Mais recentes</span>
            </p>

            {loading ? (
              <p className="text-text-mid">Carregando vagas…</p>
            ) : visible.length === 0 ? (
              <HardShadowCard className="p-8 text-center">
                <p className="text-text-mid">
                  {jobs.length === 0
                    ? "Ainda não há vagas abertas. Que tal ser a primeira pessoa a publicar?"
                    : "Nenhuma vaga encontrada para essa busca."}
                </p>
              </HardShadowCard>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 pl-0">
                {visible.map((job) => {
                  const isSelected = selected?.id === job.id;
                  const match =
                    skills.length > 0 ? matchJob(job, skills) : null;
                  const showMatch = match && match.matched.length > 0;
                  return (
                    <li key={job.id}>
                      <button
                        type="button"
                        aria-current={isSelected}
                        onClick={() =>
                          narrow
                            ? navigate(`/vagas/${job.id}`)
                            : (setSelectedId(job.id), setShowForm(false))
                        }
                        className={`relative block w-full rounded-[1.25rem] border-2 p-4 text-left text-brown ${
                          isSelected
                            ? "border-brown bg-[color-mix(in_srgb,var(--sun)_16%,var(--cream))] shadow-hard"
                            : "border-border-strong bg-surface hover:border-brown"
                        }`}
                      >
                        {isNewJob(job) && (
                          <StickerBadge
                            tone="clay"
                            tilt={4}
                            className="absolute -top-2 right-3 text-[0.7rem]"
                          >
                            NOVO!
                          </StickerBadge>
                        )}
                        <span className="flex items-start gap-4">
                          <Logo
                            company={job.company}
                            className="size-[50px] text-xl"
                          />
                          <span className="min-w-0 leading-snug">
                            <span className="block text-[1.05rem] font-bold">
                              {job.title}
                            </span>
                            <span className="block text-sm text-text-muted">
                              {job.company}
                              {job.location ? ` · ${job.location}` : ""} ·{" "}
                              {WORK_MODE_LABELS[job.work_mode]}
                            </span>
                          </span>
                        </span>
                        {job.tags.length > 0 && (
                          <span className="mt-3 flex flex-wrap gap-2">
                            {job.tags.slice(0, 5).map((t) => (
                              <span key={t} className={TAG_PILL}>
                                {techLabel(t)}
                              </span>
                            ))}
                          </span>
                        )}
                        {showMatch && (
                          <span className="mt-3 flex items-center gap-3">
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                              <span
                                className="block h-full rounded-full bg-success"
                                style={{
                                  width: `${(match.matched.length / match.total) * 100}%`,
                                }}
                              />
                            </span>
                            <span className="text-xs font-bold">
                              Combina {match.matched.length} de {match.total}
                            </span>
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {!narrow && (
            <aside
              aria-label="Detalhe da vaga"
              className="min-w-0 min-[1000px]:sticky min-[1000px]:top-[92px] min-[1000px]:max-h-[calc(100vh-108px)] min-[1000px]:overflow-y-auto min-[1000px]:pr-2 min-[1000px]:pb-2"
            >
              {showForm && user ? (
                <HardShadowCard className="p-8">
                  <h2 className="mb-4 font-display text-2xl text-brown">
                    Anunciar vaga
                  </h2>
                  <JobForm
                    userId={user.id}
                    onCancel={() => setShowForm(false)}
                    onCreated={(job) => {
                      setJobs((prev) => [job, ...prev]);
                      setSelectedId(job.id);
                      setShowForm(false);
                    }}
                  />
                </HardShadowCard>
              ) : selected ? (
                <JobPanel
                  job={selected}
                  isOwner={user?.id === selected.user_id}
                  saved={saved.has(selected.id)}
                  skills={skills}
                  onToggleSaved={() => toggleSaved(selected.id)}
                  onShare={() => share(selected.id)}
                  onToggleOpen={() => toggleOpen(selected)}
                  onDelete={() => remove(selected)}
                />
              ) : (
                !loading && (
                  <HardShadowCard className="p-10 text-center">
                    <p className="text-text-mid">
                      Escolha uma vaga na lista pra ver os detalhes.
                    </p>
                  </HardShadowCard>
                )
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

interface JobPanelProps {
  job: Job;
  isOwner: boolean;
  saved: boolean;
  skills: string[];
  onToggleSaved: () => void;
  onShare: () => void;
  onToggleOpen: () => void;
  onDelete: () => void;
}

function JobPanel({
  job,
  isOwner,
  saved,
  skills,
  onToggleSaved,
  onShare,
  onToggleOpen,
  onDelete,
}: JobPanelProps) {
  const expired = new Date(job.expires_at).getTime() <= Date.now();
  const closed = !job.is_open || expired;
  const match = matchJob(job, skills);
  const rel = job.source
    ? "noopener noreferrer"
    : "noopener noreferrer nofollow ugc";
  const SECTION = "font-display text-[1.4rem] text-brown";

  return (
    <HardShadowCard as="article" className="p-8">
      {closed && (
        <p className="mb-4 rounded-lg bg-sand px-3 py-2 text-sm font-bold text-clay">
          {expired ? "Esta vaga expirou." : "Esta vaga foi encerrada."}
        </p>
      )}

      <header className="flex items-start gap-5">
        <Logo company={job.company} className="size-20 text-3xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.75rem] leading-tight font-extrabold text-brown">
            {job.title}
          </h2>
          <p className="mt-1 text-[1.05rem] text-text-mid">{job.company}</p>
        </div>
        <button
          type="button"
          aria-label={saved ? "Remover dos salvos" : "Salvar vaga"}
          aria-pressed={saved}
          onClick={onToggleSaved}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-brown bg-surface text-brown"
        >
          <BookmarkSimple
            size={22}
            weight={saved ? "fill" : "regular"}
            aria-hidden
          />
        </button>
      </header>

      <ul className="mt-5 m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-2 pl-0 text-[0.95rem] text-text-mid">
        <li className="flex items-center gap-2">
          <MapPin size={18} aria-hidden />
          {[job.location, WORK_MODE_LABELS[job.work_mode]]
            .filter(Boolean)
            .join(" · ")}
        </li>
        <li className="flex items-center gap-2">
          <Clock size={18} aria-hidden />
          Publicada {timeAgo(job.created_at)}
        </li>
        <li>{JOB_TYPE_LABELS[job.job_type]}</li>
        {job.salary && (
          <li>
            <StickerBadge tilt={-2}>{job.salary}</StickerBadge>
          </li>
        )}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3 border-b border-border pb-6">
        {!closed && job.apply_url && (
          <a
            href={job.apply_url}
            target="_blank"
            rel={rel}
            className="rounded-full bg-sun px-7 py-3 text-base font-bold text-brown! no-underline! shadow-[0_4px_0_var(--brown)] hover:text-brown!"
          >
            {job.source
              ? `Ver vaga no ${SOURCE_LABELS[job.source]}`
              : "Candidatar-se"}
          </a>
        )}
        {!closed && job.apply_email && (
          <a
            href={`mailto:${job.apply_email}?subject=${encodeURIComponent(`Candidatura: ${job.title}`)}`}
            className={
              job.apply_url
                ? "rounded-full border-[1.5px] border-brown bg-surface px-7 py-3 text-base font-bold text-brown! no-underline! hover:text-brown!"
                : "rounded-full bg-sun px-7 py-3 text-base font-bold text-brown! no-underline! shadow-[0_4px_0_var(--brown)] hover:text-brown!"
            }
          >
            {job.apply_url ? job.apply_email : "Candidatar-se por e-mail"}
          </a>
        )}
        <button
          type="button"
          onClick={onShare}
          className="rounded-full border-[1.5px] border-brown bg-surface px-7 py-3 text-base font-bold text-brown"
        >
          Compartilhar
        </button>
      </div>

      <h3 className={`${SECTION} mt-6`}>Sobre a vaga</h3>
      <p className="mt-2 whitespace-pre-wrap text-[1rem] leading-relaxed text-text-mid">
        {job.description}
      </p>

      {job.tags.length > 0 && (
        <>
          <h3 className={`${SECTION} mt-7`}>Tecnologias</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {job.tags.map((t) => (
              <span key={t} className={`${TAG_PILL} px-4 py-1.5 text-sm`}>
                {techLabel(t)}
              </span>
            ))}
          </div>
        </>
      )}

      {job.tags.length > 0 && (
        <MatchPanel match={match} hasSkills={skills.length > 0} />
      )}

      {job.source && job.source_url && (
        <p className="mt-6 text-sm text-text-mid">
          Fonte:{" "}
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-navy! underline"
          >
            {SOURCE_LABELS[job.source]}
          </a>
          . Vaga importada automaticamente; a candidatura é feita no site
          original.
        </p>
      )}

      {isOwner && (
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onToggleOpen}
            disabled={expired}
            className="rounded-full border-[1.5px] border-brown bg-surface px-5 py-2 text-sm font-bold text-brown disabled:opacity-50"
          >
            {job.is_open ? "Encerrar vaga" : "Reabrir vaga"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border-[1.5px] border-clay bg-surface px-5 py-2 text-sm font-bold text-clay"
          >
            Excluir
          </button>
        </div>
      )}

      <p className="mt-6 text-xs text-text-muted">
        A comunidade não verifica as vagas. Desconfie de pedidos de pagamento ou
        de dados sensíveis antes de uma contratação.
      </p>
    </HardShadowCard>
  );
}

function MatchPanel({
  match,
  hasSkills,
}: {
  match: ReturnType<typeof matchJob>;
  hasSkills: boolean;
}) {
  const box =
    "mt-7 rounded-[1.25rem] border-2 border-brown bg-[color-mix(in_srgb,var(--sun)_16%,var(--cream))] p-6 shadow-[4px_4px_0_var(--sun)]";

  if (!hasSkills) {
    return (
      <div className={box}>
        <h3 className="font-display text-[1.4rem] text-brown">
          Por que combina com você
        </h3>
        <p className="mt-2 text-sm text-text-mid">
          Adicione suas habilidades ao perfil pra ver quanto essa vaga combina
          com você.{" "}
          <Link
            to="/profile?edit=true"
            className="font-bold text-navy! underline"
          >
            Editar perfil
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={box}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[1.4rem] text-brown">
          Por que combina com você
        </h3>
        <StickerBadge tilt={3} className="text-xs">
          {match.matched.length} de {match.total}
        </StickerBadge>
      </div>
      <ul className="m-0 mt-4 flex list-none flex-col gap-3 pl-0">
        {match.matched.map((t) => (
          <li
            key={t}
            className="flex items-center gap-3 text-[0.95rem] text-brown"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-cream">
              <Check size={16} weight="bold" aria-hidden />
            </span>
            <span>
              <strong>{techLabel(t)}</strong> — no seu perfil
            </span>
          </li>
        ))}
        {match.missing.map((t) => (
          <li
            key={t}
            className="flex items-center gap-3 text-[0.95rem] text-brown"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-clay text-clay">
              <Plus size={14} weight="bold" aria-hidden />
            </span>
            <span>
              <strong>{techLabel(t)}</strong> — ainda falta no seu perfil
            </span>
          </li>
        ))}
      </ul>
      {match.missing.length > 0 && (
        <p className="mt-4 text-sm text-text-mid">
          Já sabe {techLabel(match.missing[0])}?{" "}
          <Link
            to="/profile?edit=true"
            className="font-bold text-navy! underline"
          >
            Adicionar ao perfil
          </Link>
        </p>
      )}
    </div>
  );
}
