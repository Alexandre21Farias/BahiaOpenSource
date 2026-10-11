import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Kanban } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Icon } from "../../components/ui/icon";
import { useAuth } from "../../contexts/AuthContext";
import {
  createProject,
  fetchProjects,
  type Project,
} from "../../services/projects";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ProjectsDesktop } from "./ProjectsDesktop";
import { ProjectsMobile } from "./ProjectsMobile";
import "./Projects.css";

export function Projects() {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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
      toast.success("Projeto criado!");
      return true;
    } catch {
      toast.error("Não foi possível criar o projeto.");
      return false;
    } finally {
      setCreating(false);
    }
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
    <ProjectsDesktop
      projects={projects}
      loading={loading}
      creating={creating}
      onCreate={createFrom}
    />
  );
}
