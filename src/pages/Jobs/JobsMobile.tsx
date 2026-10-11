import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookmarkSimple, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Chip, ChipRow } from "../../components/shared/Chip";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { SearchField } from "../../components/mobile/SearchField";
import { StickerBadge } from "../../components/shared/StickerBadge";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchBookmarkedJobIds,
  fetchJobs,
  JOB_LEVEL_LABELS,
  JOB_TYPE_LABELS,
  setJobBookmark,
  WORK_MODE_LABELS,
  type Job,
} from "../../services/jobs";
import { timeAgo } from "./timeAgo";

type Filter = "remote" | "salvador" | "junior" | "pleno" | "saved";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "remote", label: "Remoto" },
  { id: "salvador", label: "Salvador" },
  { id: "junior", label: "Júnior" },
  { id: "pleno", label: "Pleno" },
  { id: "saved", label: "Salvas" },
];

const LOGO_COLORS = ["bg-navy", "bg-clay", "bg-brown", "bg-[#3c7a58]"];

function logoColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return LOGO_COLORS[h % LOGO_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
}

export function JobsMobile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Set<Filter>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch(() => toast.error("Não foi possível carregar as vagas."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    // Sem a tabela job_bookmarks (migration pendente) a lista segue funcionando.
    fetchBookmarkedJobIds(user.id)
      .then(setSaved)
      .catch(() => undefined);
  }, [user]);

  const toggleFilter = (f: Filter) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  const toggleSaved = async (jobId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const willSave = !saved.has(jobId);
    setSaved((prev) => {
      const next = new Set(prev);
      if (willSave) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
    try {
      await setJobBookmark(user.id, jobId, willSave);
    } catch {
      setSaved((prev) => {
        const next = new Set(prev);
        if (willSave) next.delete(jobId);
        else next.add(jobId);
        return next;
      });
      toast.error("Não foi possível salvar a vaga.");
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (active.has("remote") && j.work_mode !== "remote") return false;
      if (
        active.has("salvador") &&
        !(j.location ?? "").toLowerCase().includes("salvador")
      )
        return false;
      if (active.has("junior") && j.level !== "junior") return false;
      if (active.has("pleno") && j.level !== "pleno") return false;
      if (active.has("saved") && !saved.has(j.id)) return false;
      if (!q) return true;
      return [j.title, j.company, j.location ?? "", ...j.tags]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [jobs, search, active, saved]);

  return (
    <div className="min-h-dvh bg-cream">
      <MobileHeader
        title="Vagas"
        subtitle="Trampo da Bahia e remoto, fresquinho todo dia."
      >
        <SearchField
          className="mt-4 bg-cream"
          value={search}
          onChange={setSearch}
          placeholder="Cargo, tecnologia ou empresa"
        />
      </MobileHeader>

      <div className="px-5 pt-5">
        <ChipRow>
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              active={active.has(f.id)}
              onClick={() => toggleFilter(f.id)}
            />
          ))}
        </ChipRow>

        <div className="mt-5 flex items-baseline justify-between text-[0.95rem] text-mocha">
          <span>
            {visible.length} {visible.length === 1 ? "vaga" : "vagas"}{" "}
            {visible.length === 1 ? "encontrada" : "encontradas"}
          </span>
          <span className="font-bold text-clay">Mais recentes</span>
        </div>

        {loading ? (
          <p className="py-10 text-center text-mocha">Carregando vagas…</p>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-mocha">
            Nenhuma vaga por aqui. Tente limpar os filtros.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-5 pb-4 pl-0">
            {visible.map((job) => {
              const isSaved = saved.has(job.id);
              return (
                <li key={job.id} className="relative list-none">
                  <HardShadowCard as={Link} to={`/vagas/${job.id}`}>
                    <div className="flex gap-3">
                      <div
                        aria-hidden
                        className={`flex size-12 shrink-0 items-center justify-center rounded-xl font-display text-lg uppercase text-cream ${logoColor(job.company)}`}
                      >
                        {initials(job.company)}
                      </div>
                      <div className="min-w-0 flex-1 pr-8">
                        <h2 className="text-[1.05rem] font-extrabold leading-snug text-brown">
                          {job.title}
                        </h2>
                        <p className="truncate text-sm text-mocha">
                          {job.company}
                          {job.location ? ` · ${job.location}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        ...new Set([
                          WORK_MODE_LABELS[job.work_mode],
                          job.level ? JOB_LEVEL_LABELS[job.level] : null,
                          ...job.tags.slice(0, 2),
                          JOB_TYPE_LABELS[job.job_type],
                        ]),
                      ]
                        .filter(Boolean)
                        .map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-sand px-3 py-1 text-sm font-semibold text-brown"
                          >
                            {t}
                          </span>
                        ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="flex items-center gap-1.5 text-sm text-mocha">
                        <Clock size={16} aria-hidden />
                        {timeAgo(job.created_at)}
                      </span>
                      {job.salary && (
                        <StickerBadge tilt={-2}>[{job.salary}]</StickerBadge>
                      )}
                    </div>
                  </HardShadowCard>
                  <button
                    type="button"
                    aria-label={isSaved ? "Remover dos salvos" : "Salvar vaga"}
                    aria-pressed={isSaved}
                    onClick={() => toggleSaved(job.id)}
                    className="absolute top-2 right-2 flex size-11 items-center justify-center border-0 bg-transparent p-0 text-brown"
                  >
                    <BookmarkSimple
                      size={24}
                      weight={isSaved ? "fill" : "regular"}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
