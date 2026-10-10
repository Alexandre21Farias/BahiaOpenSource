import React, { useEffect, useState } from "react";
import {
  Briefcase,
  FilePdf,
  GithubLogo,
  LinkedinLogo,
  Trash,
} from "@phosphor-icons/react";
import { Icon } from "../../components/ui/icon";
import { Input } from "../../components/ui/Input";
import {
  getResumeUrl,
  MAX_SKILLS,
  type CareerForm,
} from "../../services/career";
import {
  JOB_LEVEL_LABELS,
  WORK_MODE_LABELS,
  type JobLevel,
  type WorkMode,
} from "../../services/jobs";

/* ---------- Edição ---------- */

interface FieldsProps {
  value: CareerForm;
  onChange: (next: CareerForm) => void;
  disabled?: boolean;
  /** nome do PDF já salvo ou escolhido; null se não houver */
  resumeName: string | null;
  onPickResume: (file: File) => void;
  onRemoveResume: () => void;
}

export function ProfileCareerFields({
  value,
  onChange,
  disabled,
  resumeName,
  onPickResume,
  onRemoveResume,
}: FieldsProps) {
  const set = <K extends keyof CareerForm>(key: K, v: CareerForm[K]) =>
    onChange({ ...value, [key]: v });

  const toggleMode = (mode: WorkMode) =>
    set(
      "work_modes",
      value.work_modes.includes(mode)
        ? value.work_modes.filter((m) => m !== mode)
        : [...value.work_modes, mode],
    );

  return (
    <fieldset className="career-fields" disabled={disabled}>
      <legend>Carreira</legend>

      <label className="career-toggle">
        <input
          type="checkbox"
          checked={value.open_to_work}
          onChange={(e) => set("open_to_work", e.target.checked)}
        />
        <span>
          <strong>Aberto a oportunidades</strong>
          <small>
            Mostra um selo no seu perfil para quem procura talentos.
          </small>
        </span>
      </label>

      <Input
        label="Título profissional"
        icon={<Icon icon={Briefcase} />}
        placeholder="Desenvolvedora Full Stack"
        maxLength={100}
        value={value.headline}
        onChange={(e) => set("headline", e.target.value)}
      />

      <div className="career-row">
        <label className="career-select">
          Nível
          <select
            value={value.experience_level}
            onChange={(e) =>
              set("experience_level", e.target.value as JobLevel | "")
            }
          >
            <option value="">Não informar</option>
            {(Object.keys(JOB_LEVEL_LABELS) as JobLevel[]).map((k) => (
              <option key={k} value={k}>
                {JOB_LEVEL_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <div className="career-select">
          Modalidade desejada
          <div className="career-checks">
            {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((k) => (
              <label key={k}>
                <input
                  type="checkbox"
                  checked={value.work_modes.includes(k)}
                  onChange={() => toggleMode(k)}
                />
                {WORK_MODE_LABELS[k]}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="input-wrapper">
        <label className="input-label" htmlFor="career-skills">
          Tecnologias e habilidades (máx. {MAX_SKILLS}, separe por vírgula)
        </label>
        <textarea
          id="career-skills"
          rows={2}
          placeholder="React, Node.js, PostgreSQL, Docker"
          value={value.skills}
          onChange={(e) => set("skills", e.target.value)}
        />
      </div>

      <div className="career-row">
        <Input
          label="GitHub"
          icon={<Icon icon={GithubLogo} />}
          placeholder="usuario ou github.com/usuario"
          value={value.github}
          onChange={(e) => set("github", e.target.value)}
        />
        <Input
          label="LinkedIn"
          icon={<Icon icon={LinkedinLogo} />}
          placeholder="linkedin.com/in/usuario"
          value={value.linkedin}
          onChange={(e) => set("linkedin", e.target.value)}
        />
      </div>

      <div className="career-resume">
        <span className="input-label">Currículo (PDF, até 5 MB)</span>
        {resumeName ? (
          <div className="career-resume-file">
            <Icon icon={FilePdf} size="md" />
            <span>{resumeName}</span>
            <button
              type="button"
              className="career-icon-btn"
              aria-label="Remover currículo"
              onClick={onRemoveResume}
            >
              <Icon icon={Trash} size="sm" />
            </button>
          </div>
        ) : null}
        <label className="btn btn-outline btn-sm career-upload">
          {resumeName ? "Trocar PDF" : "Enviar PDF"}
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onPickResume(file);
            }}
          />
        </label>
        <label className="career-toggle">
          <input
            type="checkbox"
            checked={value.resume_public}
            onChange={(e) => set("resume_public", e.target.checked)}
          />
          <span>
            <strong>Permitir que membros logados baixem meu currículo</strong>
            <small>
              Desmarcado, só você acessa. Visitantes sem conta nunca veem o
              arquivo.
            </small>
          </span>
        </label>
      </div>
    </fieldset>
  );
}

/* ---------- Visualização ---------- */

export interface CareerProfile {
  experience_level: JobLevel | null;
  skills: string[];
  work_modes: string[];
  open_to_work: boolean;
  github_url: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
  resume_public: boolean;
}

export function hasCareerInfo(p: CareerProfile) {
  return Boolean(
    p.open_to_work ||
    p.experience_level ||
    p.skills.length ||
    p.work_modes.length ||
    p.github_url ||
    p.linkedin_url ||
    p.resume_path,
  );
}

export function ProfileCareerView({
  profile,
  isOwn,
  loggedIn,
}: {
  profile: CareerProfile;
  isOwn: boolean;
  loggedIn: boolean;
}) {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const canSeeResume =
    Boolean(profile.resume_path) &&
    (isOwn || (profile.resume_public && loggedIn));

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

  if (!hasCareerInfo(profile)) return null;

  const modes = profile.work_modes
    .map((m) => WORK_MODE_LABELS[m as WorkMode])
    .filter(Boolean);

  return (
    <section className="career-card" aria-label="Carreira">
      <h3>Carreira</h3>

      {profile.open_to_work && (
        <p className="career-open">
          <span aria-hidden="true" /> Aberto a oportunidades
        </p>
      )}

      <ul className="list-reset career-list">
        {profile.experience_level && (
          <li>Nível: {JOB_LEVEL_LABELS[profile.experience_level]}</li>
        )}
        {modes.length > 0 && <li>Prefere: {modes.join(", ")}</li>}
      </ul>

      {profile.skills.length > 0 && (
        <div className="career-skills">
          {profile.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      )}

      {(profile.github_url || profile.linkedin_url) && (
        <div className="career-links">
          {profile.github_url && (
            <a
              href={profile.github_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon icon={GithubLogo} size="sm" /> GitHub
            </a>
          )}
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon icon={LinkedinLogo} size="sm" /> LinkedIn
            </a>
          )}
        </div>
      )}

      {profile.resume_path &&
        (resumeUrl ? (
          <a
            className="btn btn-secondary btn-sm career-resume-link"
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon icon={FilePdf} size="sm" /> Ver currículo
          </a>
        ) : !canSeeResume && !isOwn ? (
          <p className="career-note">
            {profile.resume_public
              ? "Entre na sua conta para ver o currículo."
              : "Currículo disponível apenas para o próprio membro."}
          </p>
        ) : null)}
    </section>
  );
}
