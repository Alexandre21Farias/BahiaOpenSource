import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  createJob,
  JOB_LEVEL_LABELS,
  JOB_TYPE_LABELS,
  parseTags,
  WORK_MODE_LABELS,
  type Job,
  type JobLevel,
  type JobType,
  type WorkMode,
} from "../../services/jobs";

interface Props {
  userId: string;
  onCreated: (job: Job) => void;
  onCancel: () => void;
}

export function JobForm({ userId, onCreated, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("remote");
  const [jobType, setJobType] = useState<JobType>("clt");
  const [level, setLevel] = useState<JobLevel | "">("");
  const [salary, setSalary] = useState("");
  const [tags, setTags] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = applyUrl.trim();
    const email = applyEmail.trim();
    if (!url && !email) {
      toast.error("Informe um link ou um e-mail para candidatura.");
      return;
    }
    if (url && !/^https?:\/\//i.test(url)) {
      toast.error(
        "O link de candidatura precisa começar com http:// ou https://",
      );
      return;
    }

    setSaving(true);
    try {
      const job = await createJob(userId, {
        title: title.trim(),
        company: company.trim(),
        description: description.trim(),
        location: location.trim(),
        work_mode: workMode,
        job_type: jobType,
        level: level || undefined,
        salary: salary.trim(),
        tags: parseTags(tags),
        apply_url: url,
        apply_email: email,
      });
      toast.success("Vaga publicada!");
      onCreated(job);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(
        message.includes("limite de 5 vagas")
          ? "Você já tem 5 vagas abertas. Feche uma para publicar outra."
          : "Não foi possível publicar a vaga.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <Input
        label="Título da vaga"
        value={title}
        minLength={3}
        maxLength={120}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />
      <Input
        label="Empresa"
        value={company}
        maxLength={80}
        onChange={(e) => setCompany(e.target.value)}
        required
      />

      <label className="input-label" htmlFor="job-desc">
        Descrição
      </label>
      <textarea
        id="job-desc"
        className="jobs-textarea"
        rows={7}
        minLength={10}
        maxLength={5000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <div className="job-form-row">
        <label>
          Modalidade
          <select
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value as WorkMode)}
          >
            {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((k) => (
              <option key={k} value={k}>
                {WORK_MODE_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value as JobType)}
          >
            {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((k) => (
              <option key={k} value={k}>
                {JOB_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nível
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as JobLevel | "")}
          >
            <option value="">Qualquer</option>
            {(Object.keys(JOB_LEVEL_LABELS) as JobLevel[]).map((k) => (
              <option key={k} value={k}>
                {JOB_LEVEL_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Input
        label="Local (opcional)"
        value={location}
        maxLength={80}
        placeholder="Salvador, BA"
        onChange={(e) => setLocation(e.target.value)}
      />
      <Input
        label="Salário (opcional)"
        value={salary}
        maxLength={60}
        placeholder="R$ 5.000 – R$ 7.000"
        onChange={(e) => setSalary(e.target.value)}
      />
      <Input
        label="Tecnologias (separe por vírgula)"
        value={tags}
        placeholder="react, node, typescript"
        onChange={(e) => setTags(e.target.value)}
      />
      <Input
        label="Link para candidatura"
        type="url"
        value={applyUrl}
        maxLength={500}
        placeholder="https://empresa.com/vagas/123"
        onChange={(e) => setApplyUrl(e.target.value)}
      />
      <Input
        label="ou e-mail para candidatura"
        type="email"
        value={applyEmail}
        maxLength={120}
        placeholder="rh@empresa.com"
        onChange={(e) => setApplyEmail(e.target.value)}
      />

      <div className="jobs-form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={saving}>
          Publicar vaga
        </Button>
      </div>
    </form>
  );
}
