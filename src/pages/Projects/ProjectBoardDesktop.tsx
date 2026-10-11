import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CaretLeft, Plus, Trash } from "@phosphor-icons/react";
import { Chip } from "../../components/shared/Chip";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { StickerBadge } from "../../components/shared/StickerBadge";
import {
  fetchMembers,
  PRIORITY_LABELS,
  type Project,
  type ProjectMember,
  type ProjectStatus,
  type Task,
  type TaskPriority,
} from "../../services/projects";
import { initialsOf } from "../Feed/postFormat";
import { ProjectMembers } from "./ProjectMembers";

type Filter = "all" | "mine" | "unassigned";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "mine", label: "Minhas" },
  { id: "unassigned", label: "Sem responsável" },
];

const DONE_VISIBLE = 4;
const AVATAR_TONES = ["bg-sky", "bg-surface", "bg-clay text-cream"];

interface Props {
  project: Project;
  statuses: ProjectStatus[];
  tasks: Task[];
  userId: string;
  isOwner: boolean;
  onMove: (taskId: string, statusId: string) => Promise<void>;
  onAdd: (statusId: string, title: string) => Promise<void>;
  onPriority: (task: Task, priority: TaskPriority) => Promise<void>;
  onAssign: (task: Task, assigneeId: string | null) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
  onDeleteProject: () => Promise<void>;
}

function Avatar({
  member,
  tone,
  className,
}: {
  member: ProjectMember | undefined;
  tone: string;
  className: string;
}) {
  const name = member?.profile?.full_name || member?.profile?.username || "?";
  return (
    <span
      title={name}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brown font-bold text-brown ${tone} ${className}`}
    >
      {member?.profile?.avatar_url ? (
        <img
          src={member.profile.avatar_url}
          alt={name}
          className="size-full object-cover"
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

/** Quadro de tarefas no desktop: colunas por status, arrastar e soltar. */
export function ProjectBoardDesktop({
  project,
  statuses,
  tasks,
  userId,
  isOwner,
  onMove,
  onAdd,
  onPriority,
  onAssign,
  onDelete,
  onDeleteProject,
}: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [expandedDone, setExpandedDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    fetchMembers(project.id)
      .then((list) => active && setMembers(list))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [project.id, showMembers]);

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.user_id, m])),
    [members],
  );

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, Task[]>();
    statuses.forEach((s) => map.set(s.id, []));
    for (const t of tasks) {
      if (filter === "mine" && t.assignee_id !== userId) continue;
      if (filter === "unassigned" && t.assignee_id) continue;
      map.get(t.status_id)?.push(t);
    }
    return map;
  }, [statuses, tasks, filter, userId]);

  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;

  return (
    <div className="min-h-screen bg-cream">
      <section className="border-b-2 border-brown bg-sun">
        <div className="mx-auto max-w-[1440px] px-6 pt-6 pb-8">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-[0.95rem] font-bold text-brown! no-underline! hover:text-brown!"
          >
            <CaretLeft size={14} weight="bold" aria-hidden /> Todos os projetos
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0 max-w-[640px]">
              <h1 className="font-display text-[3.2rem] leading-none text-cream [text-shadow:3px_3px_0_var(--brown)]">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-3 text-[1.05rem] text-brown">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {members.length > 0 && (
                <div className="flex pl-3" aria-label="Participantes">
                  {shown.map((m, i) => (
                    <Avatar
                      key={m.id}
                      member={m}
                      tone={AVATAR_TONES[i % AVATAR_TONES.length]}
                      className="-ml-3 size-11 text-sm"
                    />
                  ))}
                  {extra > 0 && (
                    <span className="-ml-3 flex size-11 items-center justify-center rounded-full border-2 border-brown bg-brown text-sm font-bold text-cream">
                      +{extra}
                    </span>
                  )}
                </div>
              )}
              <button
                type="button"
                aria-expanded={showMembers}
                onClick={() => setShowMembers((v) => !v)}
                className="rounded-full border-2 border-brown bg-surface px-6 py-3 font-bold text-brown"
              >
                Membros
              </button>
              <button
                type="button"
                onClick={() => setAddingIn(statuses[0]?.id ?? null)}
                className="rounded-full border-0 bg-brown px-6 py-3 font-bold text-cream shadow-[0_4px_0_var(--cream)]"
              >
                + Nova tarefa
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-6 py-8">
        {showMembers && (
          <div className="mb-8">
            <ProjectMembers
              projectId={project.id}
              ownerId={project.owner_id}
              currentUserId={userId}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              active={filter === f.id}
              onClick={() => setFilter(f.id)}
            />
          ))}
          <span className="ml-auto text-sm text-text-muted">
            Arraste os cards entre as colunas
          </span>
        </div>

        <div className="mt-6 overflow-x-auto pb-4">
          <div
            className="grid gap-x-[44px]"
            style={{
              gridTemplateColumns: `repeat(${Math.max(statuses.length, 1)}, minmax(260px, 1fr))`,
            }}
          >
            {statuses.map((status) => {
              const done = status.category === "completed";
              const all = tasksByStatus.get(status.id) ?? [];
              const expanded = expandedDone.has(status.id);
              const visible =
                done && !expanded ? all.slice(0, DONE_VISIBLE) : all;
              const hidden = all.length - visible.length;
              return (
                <section
                  key={status.id}
                  aria-label={status.name}
                  className={`self-start rounded-3xl p-5 ${
                    done ? "bg-sand" : "bg-bg-soft"
                  } ${overStatus === status.id ? "outline-2 outline-dashed outline-brown" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverStatus(status.id);
                  }}
                  onDragLeave={() => setOverStatus(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setOverStatus(null);
                    if (draggingId) void onMove(draggingId, status.id);
                    setDraggingId(null);
                  }}
                >
                  <h2 className="mb-4 flex items-center justify-between font-display text-[1.4rem] text-brown">
                    {status.name}
                    <span
                      className={`flex size-8 items-center justify-center rounded-full font-sans text-sm font-bold text-cream ${
                        done ? "bg-success" : "bg-brown"
                      }`}
                    >
                      {all.length}
                    </span>
                  </h2>

                  <ul className="m-0 flex list-none flex-col gap-4 pl-0">
                    {visible.map((task) => {
                      const assignee = task.assignee_id
                        ? memberById.get(task.assignee_id)
                        : undefined;
                      const mine = task.assignee_id === userId;
                      return (
                        <li
                          key={task.id}
                          draggable
                          onDragStart={() => setDraggingId(task.id)}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setOverStatus(null);
                          }}
                          className={draggingId === task.id ? "opacity-40" : ""}
                        >
                          <HardShadowCard
                            // Focável: mostra os controles também pelo teclado.
                            tabIndex={0}
                            tone={mine && !done ? "cream" : "surface"}
                            className={`group cursor-grab p-4 ${
                              done ? "border-border-strong shadow-none" : ""
                            }`}
                          >
                            {task.priority !== "none" && !done && (
                              <StickerBadge
                                tone={
                                  task.priority === "high" ||
                                  task.priority === "urgent"
                                    ? "clay"
                                    : "sun"
                                }
                                tilt={-3}
                                className="mb-2 text-xs"
                              >
                                {PRIORITY_LABELS[task.priority]}
                              </StickerBadge>
                            )}
                            <p
                              className={`m-0 text-[1.05rem] leading-snug font-bold ${
                                done
                                  ? "text-text-muted line-through"
                                  : "text-brown"
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                              {task.assignee_id ? (
                                <Avatar
                                  member={assignee}
                                  tone="bg-sky"
                                  className="size-7 text-[0.65rem]"
                                />
                              ) : (
                                <span>Sem responsável</span>
                              )}
                            </div>

                            <div className="mt-3 hidden flex-wrap items-center gap-2 border-t border-border pt-3 text-xs group-focus-within:flex group-hover:flex">
                              <select
                                aria-label="Mover para"
                                value={task.status_id}
                                onChange={(e) =>
                                  void onMove(task.id, e.target.value)
                                }
                                className="min-h-0 w-auto cursor-pointer rounded-lg bg-surface py-1 pr-6 pl-2 text-xs opacity-100"
                              >
                                {statuses.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                aria-label="Prioridade"
                                value={task.priority}
                                onChange={(e) =>
                                  void onPriority(
                                    task,
                                    e.target.value as TaskPriority,
                                  )
                                }
                                className="min-h-0 w-auto cursor-pointer rounded-lg bg-surface py-1 pr-6 pl-2 text-xs opacity-100"
                              >
                                {(
                                  Object.keys(PRIORITY_LABELS) as TaskPriority[]
                                ).map((p) => (
                                  <option key={p} value={p}>
                                    {PRIORITY_LABELS[p]}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  void onAssign(task, mine ? null : userId)
                                }
                                className="rounded-full border border-brown bg-surface px-3 py-1 font-bold text-brown"
                              >
                                {mine ? "Soltar" : "Pegar"}
                              </button>
                              <button
                                type="button"
                                aria-label={`Excluir ${task.title}`}
                                onClick={() => void onDelete(task)}
                                className="ml-auto rounded-full border-0 bg-transparent p-1 text-text-muted hover:text-clay"
                              >
                                <Trash size={16} aria-hidden />
                              </button>
                            </div>
                          </HardShadowCard>
                        </li>
                      );
                    })}
                  </ul>

                  {hidden > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDone((prev) => new Set(prev).add(status.id))
                      }
                      className="mt-4 w-full border-0 bg-transparent py-2 font-bold text-text-mid"
                    >
                      Ver mais {hidden}
                    </button>
                  )}

                  <AddTask
                    open={addingIn === status.id}
                    onOpen={() => setAddingIn(status.id)}
                    onClose={() => setAddingIn(null)}
                    onAdd={(title) => onAdd(status.id, title)}
                  />
                </section>
              );
            })}
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => void onDeleteProject()}
            className="mt-6 border-0 bg-transparent p-0 text-sm font-bold text-clay underline"
          >
            Excluir projeto
          </button>
        )}
      </div>
    </div>
  );
}

function AddTask({
  open,
  onOpen,
  onClose,
  onAdd,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAdd: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setTitle("");
    await onAdd(value);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 flex w-full items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border-strong bg-transparent py-3 font-bold text-text-mid hover:border-brown hover:text-brown"
      >
        <Plus size={14} weight="bold" aria-hidden /> Adicionar tarefa
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-2">
      <input
        autoFocus
        value={title}
        maxLength={200}
        placeholder="Título da tarefa"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-brown focus:shadow-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border-0 bg-transparent px-3 py-1.5 text-sm font-bold text-text-mid"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full border-0 bg-sun px-4 py-1.5 text-sm font-bold text-brown disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
    </form>
  );
}
