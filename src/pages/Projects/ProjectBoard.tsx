import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash, Users } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/icon";
import { useAuth } from "../../contexts/AuthContext";
import {
  createTask,
  deleteProject,
  deleteTask,
  fetchProject,
  fetchStatuses,
  fetchTasks,
  PRIORITY_LABELS,
  updateTask,
  type Project,
  type ProjectStatus,
  type Task,
  type TaskPriority,
} from "../../services/projects";
import { ProjectMembers } from "./ProjectMembers";
import "./Projects.css";

export function ProjectBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);

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

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, Task[]>();
    statuses.forEach((s) => map.set(s.id, []));
    tasks.forEach((t) => map.get(t.status_id)?.push(t));
    return map;
  }, [statuses, tasks]);

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

  return (
    <div className="projects-page projects-page-wide">
      <header className="projects-header">
        <div>
          <Link to="/projects" className="projects-back">
            <Icon icon={ArrowLeft} size="sm" /> Projetos
          </Link>
          <h1>{project.name}</h1>
          {project.description && <p>{project.description}</p>}
        </div>
        <div className="projects-header-actions">
          <Button variant="outline" onClick={() => setShowMembers((v) => !v)}>
            <Icon icon={Users} size="sm" />
            Participantes
          </Button>
          {isOwner && (
            <Button variant="destructive" onClick={handleDeleteProject}>
              <Icon icon={Trash} size="sm" />
              Excluir projeto
            </Button>
          )}
        </div>
      </header>

      {showMembers && user && (
        <ProjectMembers
          projectId={project.id}
          ownerId={project.owner_id}
          currentUserId={user.id}
        />
      )}

      <div className="board">
        {statuses.map((status) => {
          const columnTasks = tasksByStatus.get(status.id) ?? [];
          return (
            <section
              key={status.id}
              className={`board-column ${overStatus === status.id ? "is-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStatus(status.id);
              }}
              onDragLeave={() => setOverStatus(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOverStatus(null);
                if (draggingId) moveTask(draggingId, status.id);
                setDraggingId(null);
              }}
            >
              <h2 className="board-column-title">
                <span
                  className="board-dot"
                  style={{ background: status.color }}
                />
                {status.name}
                <span className="board-count">{columnTasks.length}</span>
              </h2>

              <ul className="board-tasks">
                {columnTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`task-card ${draggingId === task.id ? "is-dragging" : ""}`}
                    draggable
                    onDragStart={() => setDraggingId(task.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverStatus(null);
                    }}
                  >
                    <p className="task-title">{task.title}</p>
                    <div className="task-controls">
                      <select
                        aria-label="Mover para"
                        value={task.status_id}
                        onChange={(e) => moveTask(task.id, e.target.value)}
                      >
                        {statuses.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Prioridade"
                        className={`priority priority-${task.priority}`}
                        value={task.priority}
                        onChange={(e) =>
                          handlePriority(task, e.target.value as TaskPriority)
                        }
                      >
                        {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map(
                          (p) => (
                            <option key={p} value={p}>
                              {PRIORITY_LABELS[p]}
                            </option>
                          ),
                        )}
                      </select>
                      <button
                        type="button"
                        className="task-delete"
                        aria-label={`Excluir ${task.title}`}
                        onClick={() => handleDeleteTask(task)}
                      >
                        <Icon icon={Trash} size="sm" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <AddTask onAdd={(title) => handleAddTask(status.id, title)} />
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AddTask({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setTitle("");
    await onAdd(value);
  }

  if (!open) {
    return (
      <button type="button" className="board-add" onClick={() => setOpen(true)}>
        <Icon icon={Plus} size="sm" /> Adicionar tarefa
      </button>
    );
  }

  return (
    <form className="board-add-form" onSubmit={submit}>
      <input
        autoFocus
        value={title}
        maxLength={200}
        placeholder="Título da tarefa"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <Button type="submit" size="sm" disabled={!title.trim()}>
        Adicionar
      </Button>
    </form>
  );
}
