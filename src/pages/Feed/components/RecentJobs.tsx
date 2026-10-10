import { Link } from "react-router-dom";
import { Briefcase } from "@phosphor-icons/react";
import { Icon } from "../../../components/ui/icon";
import { WORK_MODE_LABELS, type Job } from "../../../services/jobs";
import { timeAgo } from "../../Jobs/timeAgo";

interface Props {
  jobs: Job[] | null;
  /** "inline" aparece acima das publicações só em telas sem a barra lateral */
  variant?: "sidebar" | "inline";
}

export function RecentJobs({ jobs, variant = "sidebar" }: Props) {
  if (jobs === null) return null;

  return (
    <section
      className={`feed-card recent-jobs-card ${variant === "inline" ? "recent-jobs-inline" : ""}`}
      aria-label="Vagas recentes"
    >
      <div className="recent-jobs-header">
        <h3 className="recent-jobs-title">
          <Icon icon={Briefcase} size="md" className="text-sun" />
          Vagas recentes
        </h3>
        <Link to="/vagas" className="recent-jobs-all">
          Ver todas
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="recent-jobs-empty">
          Ainda não há vagas. <Link to="/vagas">Publique a primeira</Link> e
          ajude a comunidade a crescer.
        </p>
      ) : (
        <ul className="recent-jobs-list">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link to={`/vagas/${job.id}`} className="recent-job">
                <span className="recent-job-title">{job.title}</span>
                <span className="recent-job-meta">
                  {job.company} · {WORK_MODE_LABELS[job.work_mode]} ·{" "}
                  {timeAgo(job.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
