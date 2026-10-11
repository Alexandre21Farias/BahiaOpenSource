import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Kanban, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Icon } from "../../components/ui/icon";
import { useAuth } from "../../contexts/AuthContext";
import {
  createProject,
  fetchProjects,
  type Project,
} from "../../services/projects";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ProjectsMobile } from "./ProjectsMobile";
import "./Projects.css";

export function Projects() {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchProjects()
      .then(setProjects)
      .catch(() => toast.error("Não foi possível carregar os projetos."))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  async function createFrom(projectName: string, projectDescription: string) {
    if (!user || !projectName.trim()) return false;
    setCreating(true);
    try {
      const project = await createProject({
        ownerId: user.id,
        name: projectName.trim(),
        description: projectDescription.trim(),
      });
      setProjects((prev) => [project, ...prev]);
      setName("");
      setDescription("");
      setShowForm(false);
      toast.success("Projeto criado!");
      return true;
    } catch {
      toast.error("Não foi possível criar o projeto.");
      return false;
    } finally {
      setCreating(false);
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    void createFrom(name, description);
  }

  if (isMobile && user) {
    return (
      <ProjectsMobile
        projects={projects}
        loading={loading}
        creating={creating}
        onCreate={createFrom}
      />
    );
  }

  if (!authLoading && !user) {
    return (
      <div className="projects-page">
        <div className="projects-empty">
          <Icon icon={Kanban} size="lg" />
          <h1>Projetos</h1>
          <p>Entre na sua conta para criar e acompanhar projetos.</p>
          <Link to="/login" className="btn btn-primary">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <header className="projects-header">
        <div>
          <h1>Projetos</h1>
          <p>Organize tarefas e acompanhe o andamento com a comunidade.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Icon icon={Plus} size="sm" />
          Novo projeto
        </Button>
      </header>

      {showForm && (
        <form className="projects-form" onSubmit={handleCreate}>
          <Input
            label="Nome do projeto"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <label className="input-label" htmlFor="project-desc">
            Descrição (opcional)
          </label>
          <textarea
            id="project-desc"
            className="projects-textarea"
            value={description}
            maxLength={500}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="projects-form-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={creating} disabled={!name.trim()}>
              Criar projeto
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="projects-muted">Carregando projetos…</p>
      ) : projects.length === 0 ? (
        <div className="projects-empty">
          <Icon icon={Kanban} size="lg" />
          <p>Você ainda não participa de nenhum projeto.</p>
        </div>
      ) : (
        <ul className="projects-grid">
          {projects.map((project) => (
            <li key={project.id}>
              <Link to={`/projects/${project.id}`} className="project-card">
                <h2>{project.name}</h2>
                {project.description && <p>{project.description}</p>}
                <span className="project-card-meta">
                  Criado em{" "}
                  {new Date(project.created_at).toLocaleDateString("pt-BR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
