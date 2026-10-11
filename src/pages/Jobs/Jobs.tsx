import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/icon";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchJobs,
  JOB_LEVEL_LABELS,
  JOB_TYPE_LABELS,
  SOURCE_LABELS,
  WORK_MODE_LABELS,
  type Job,
  type JobType,
  type WorkMode,
} from "../../services/jobs";
import { useIsMobile } from "../../hooks/useIsMobile";
import { JobForm } from "./JobForm";
import { JobsMobile } from "./JobsMobile";
import { timeAgo } from "./timeAgo";
import "./Jobs.css";

function JobsDesktop() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode | "">("");
  const [jobType, setJobType] = useState<JobType | "">("");

  useEffect(() => {
    setLoading(true);
    fetchJobs({
      workMode: workMode || undefined,
      jobType: jobType || undefined,
    })
      .then(setJobs)
      .catch(() => toast.error("Não foi possível carregar as vagas."))
      .finally(() => setLoading(false));
  }, [workMode, jobType]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.title, j.company, j.location ?? "", ...j.tags]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [jobs, search]);

  return (
    <div className="jobs-page">
      <header className="jobs-header">
        <div>
          <h1>Vagas</h1>
          <p>Oportunidades compartilhadas pela comunidade Bahia Open Source.</p>
        </div>
        {user ? (
          <Button onClick={() => setShowForm((v) => !v)}>
            <Icon icon={Plus} size="sm" />
            Publicar vaga
          </Button>
        ) : (
          <Link to="/login" className="btn btn-secondary">
            Entre para publicar
          </Link>
        )}
      </header>

      {showForm && user && (
        <JobForm
          userId={user.id}
          onCancel={() => setShowForm(false)}
          onCreated={(job) => {
            setJobs((prev) => [job, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      <div className="jobs-filters">
        <label className="jobs-search">
          <Icon icon={MagnifyingGlass} size="sm" />
          <input
            value={search}
            placeholder="Buscar por cargo, empresa ou tecnologia"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Modalidade"
          value={workMode}
          onChange={(e) => setWorkMode(e.target.value as WorkMode | "")}
        >
          <option value="">Toda modalidade</option>
          {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((k) => (
            <option key={k} value={k}>
              {WORK_MODE_LABELS[k]}
            </option>
          ))}
        </select>
        <select
          aria-label="Tipo de contrato"
          value={jobType}
          onChange={(e) => setJobType(e.target.value as JobType | "")}
        >
          <option value="">Todo tipo</option>
          {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((k) => (
            <option key={k} value={k}>
              {JOB_TYPE_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="jobs-muted">Carregando vagas…</p>
      ) : visible.length === 0 ? (
        <div className="jobs-empty">
          <Icon icon={Briefcase} size="lg" />
          <p>
            {jobs.length === 0
              ? "Ainda não há vagas abertas. Que tal ser a primeira pessoa a publicar?"
              : "Nenhuma vaga encontrada para essa busca."}
          </p>
        </div>
      ) : (
        <ul className="jobs-list">
          {visible.map((job) => (
            <li key={job.id}>
              <Link to={`/vagas/${job.id}`} className="job-card">
                <div className="job-card-top">
                  <h2>{job.title}</h2>
                  <span className="job-card-date">
                    {timeAgo(job.created_at)}
                  </span>
                </div>
                <p className="job-card-company">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                  {job.source ? ` · via ${SOURCE_LABELS[job.source]}` : ""}
                </p>
                <div className="job-badges">
                  <span className="job-badge">
                    {WORK_MODE_LABELS[job.work_mode]}
                  </span>
                  <span className="job-badge">
                    {JOB_TYPE_LABELS[job.job_type]}
                  </span>
                  {job.level && (
                    <span className="job-badge">
                      {JOB_LEVEL_LABELS[job.level]}
                    </span>
                  )}
                  {job.salary && (
                    <span className="job-badge job-badge-salary">
                      {job.salary}
                    </span>
                  )}
                </div>
                {job.tags.length > 0 && (
                  <div className="job-tags">
                    {job.tags.map((t) => (
                      <span key={t}>#{t}</span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Jobs() {
  return useIsMobile() ? <JobsMobile /> : <JobsDesktop />;
}
