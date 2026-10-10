import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  EnvelopeSimple,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/icon";
import { useAuth } from "../../contexts/AuthContext";
import {
  deleteJob,
  fetchJob,
  JOB_LEVEL_LABELS,
  JOB_TYPE_LABELS,
  setJobOpen,
  WORK_MODE_LABELS,
  type Job,
} from "../../services/jobs";
import { timeAgo } from "./timeAgo";
import "./Jobs.css";

export function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    fetchJob(jobId)
      .then(setJob)
      .catch(() => toast.error("Não foi possível carregar a vaga."))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="jobs-page">
        <p className="jobs-muted">Carregando…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="jobs-page">
        <div className="jobs-empty">
          <p>Vaga não encontrada, encerrada ou expirada.</p>
          <Link to="/vagas" className="btn btn-secondary">
            Ver outras vagas
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === job.user_id;
  const expired = new Date(job.expires_at).getTime() <= Date.now();
  const closed = !job.is_open || expired;

  async function toggleOpen() {
    if (!job) return;
    try {
      await setJobOpen(job.id, !job.is_open);
      setJob({ ...job, is_open: !job.is_open });
      toast.success(job.is_open ? "Vaga encerrada." : "Vaga reaberta.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(
        message.includes("limite de 5 vagas")
          ? "Você já tem 5 vagas abertas. Feche uma antes de reabrir esta."
          : "Não foi possível atualizar a vaga.",
      );
    }
  }

  async function handleDelete() {
    if (!job || !window.confirm("Excluir esta vaga definitivamente?")) return;
    try {
      await deleteJob(job.id);
      toast.success("Vaga excluída.");
      navigate("/vagas");
    } catch {
      toast.error("Não foi possível excluir a vaga.");
    }
  }

  return (
    <div className="jobs-page">
      <Link to="/vagas" className="jobs-back">
        <Icon icon={ArrowLeft} size="sm" /> Vagas
      </Link>

      <article className="job-detail">
        {closed && (
          <p className="job-closed">
            {expired ? "Esta vaga expirou." : "Esta vaga foi encerrada."}
          </p>
        )}
        <h1>{job.title}</h1>
        <p className="job-card-company">
          {job.company}
          {job.location ? ` · ${job.location}` : ""} · publicada{" "}
          {timeAgo(job.created_at)}
        </p>

        <div className="job-badges">
          <span className="job-badge">{WORK_MODE_LABELS[job.work_mode]}</span>
          <span className="job-badge">{JOB_TYPE_LABELS[job.job_type]}</span>
          {job.level && (
            <span className="job-badge">{JOB_LEVEL_LABELS[job.level]}</span>
          )}
          {job.salary && (
            <span className="job-badge job-badge-salary">{job.salary}</span>
          )}
        </div>

        {job.tags.length > 0 && (
          <div className="job-tags">
            {job.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        )}

        <div className="job-description">{job.description}</div>

        {!closed && (
          <div className="job-apply">
            {job.apply_url && (
              <a
                className="btn btn-primary"
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
              >
                <Icon icon={ArrowSquareOut} size="sm" /> Candidatar-se
              </a>
            )}
            {job.apply_email && (
              <a
                className="btn btn-secondary"
                href={`mailto:${job.apply_email}?subject=${encodeURIComponent(`Candidatura: ${job.title}`)}`}
              >
                <Icon icon={EnvelopeSimple} size="sm" /> {job.apply_email}
              </a>
            )}
          </div>
        )}

        {isOwner && (
          <div className="job-owner-actions">
            <Button variant="outline" onClick={toggleOpen} disabled={expired}>
              {job.is_open ? "Encerrar vaga" : "Reabrir vaga"}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        )}

        <p className="job-disclaimer">
          A comunidade não verifica as vagas. Desconfie de pedidos de pagamento
          ou de dados sensíveis antes de uma contratação.
        </p>
      </article>
    </div>
  );
}
