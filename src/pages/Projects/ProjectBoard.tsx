import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  createTask,
  deleteProject,
  deleteTask,
  fetchProject,
  fetchStatuses,
  fetchTasks,
  updateTask,
  type Project,
  type ProjectStatus,
  type Task,
  type TaskPriority,
} from "../../services/projects";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ProjectBoardMobile } from "./ProjectBoardMobile";
import { ProjectBoardDesktop } from "./ProjectBoardDesktop";
import "./Projects.css";

export function ProjectBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !projectId) return;
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetchProject(projectId),
      fetchStatuses(projectId),
      fetchTasks(projectId),
    ])
      .then(([p, s, t]) => {
        setProject(p);
        setStatuses(s);
        setTasks(t);
      })
      .catch(() => toast.error("Não foi possível carregar o projeto."))
      .finally(() => setLoading(false));
  }, [projectId, user, authLoading]);

  async function moveTask(taskId: string, statusId: string) {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status_id === statusId) return;

    // Atualização otimista; desfaz se o banco recusar
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status_id: statusId } : t)),
    );
    try {
      await updateTask(taskId, { status_id: statusId });
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status_id: current.status_id } : t,
        ),
      );
      toast.error("Não foi possível mover a tarefa.");
    }
  }

  async function handleAddTask(statusId: string, title: string) {
    if (!projectId) return;
    try {
      const task = await createTask({ projectId, statusId, title });
      setTasks((prev) => [...prev, task]);
    } catch {
      toast.error("Não foi possível criar a tarefa.");
    }
  }

  async function handlePriority(task: Task, priority: TaskPriority) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, priority } : t)),
    );
    try {
      await updateTask(task.id, { priority });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      toast.error("Não foi possível alterar a prioridade.");
    }
  }

  async function handleAssign(task: Task, assigneeId: string | null) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, assignee_id: assigneeId } : t,
      ),
    );
    try {
      await updateTask(task.id, { assignee_id: assigneeId });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      toast.error("Não foi possível alterar o responsável.");
    }
  }

  /** Edição do desktop (título, etiquetas, boa 1ª tarefa, PR). Lança em erro. */
  async function handleUpdate(
    task: Task,
    patch: Parameters<typeof updateTask>[1],
  ) {
    const saved = await updateTask(task.id, patch);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? saved : t)));
  }

  async function handleDeleteTask(task: Task) {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch {
      toast.error("Não foi possível excluir a tarefa.");
    }
  }

  async function handleDeleteProject() {
    if (!project) return;
    if (
      !window.confirm(
        `Excluir o projeto "${project.name}" e todas as suas tarefas?`,
      )
    )
      return;
    try {
      await deleteProject(project.id);
      toast.success("Projeto excluído.");
      navigate("/projects");
    } catch {
      toast.error("Apenas o dono pode excluir o projeto.");
    }
  }

  if (!authLoading && !user) {
    return (
      <div className="projects-page">
        <div className="projects-empty">
          <p>Entre na sua conta para ver este projeto.</p>
          <Link to="/login" className="btn btn-primary">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="projects-page">
        <p className="projects-muted">Carregando…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="projects-page">
        <div className="projects-empty">
          <p>Projeto não encontrado ou você não tem acesso a ele.</p>
          <Link to="/projects" className="btn btn-secondary">
            Voltar aos projetos
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === project.owner_id;

  if (isMobile && user) {
    return (
      <ProjectBoardMobile
        project={project}
        statuses={statuses}
        tasks={tasks}
        userId={user.id}
        onMove={moveTask}
        onAdd={handleAddTask}
        onAssign={handleAssign}
        onDelete={handleDeleteTask}
      />
    );
  }

  if (!user) return null;

  return (
    <ProjectBoardDesktop
      project={project}
      statuses={statuses}
      tasks={tasks}
      userId={user.id}
      isOwner={isOwner}
      onMove={moveTask}
      onAdd={handleAddTask}
      onPriority={handlePriority}
      onAssign={handleAssign}
      onUpdate={handleUpdate}
      onDelete={handleDeleteTask}
      onDeleteProject={handleDeleteProject}
    />
  );
}
