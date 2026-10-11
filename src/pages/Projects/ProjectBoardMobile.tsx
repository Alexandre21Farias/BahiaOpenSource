import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CaretLeft,
  DotsThree,
  Plus,
  Question,
  Trash,
} from "@phosphor-icons/react";
import { HardShadowCard } from "../../components/mobile/HardShadowCard";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { StickerBadge } from "../../components/mobile/StickerBadge";
import {
  fetchMembers,
  PRIORITY_LABELS,
  type Project,
  type ProjectMember,
  type ProjectStatus,
  type Task,
} from "../../services/projects";

interface Props {
  project: Project;
  statuses: ProjectStatus[];
  tasks: Task[];
  userId: string;
  onMove: (taskId: string, statusId: string) => void;
  onAdd: (statusId: string, title: string) => Promise<void>;
  onAssign: (task: Task, assigneeId: string | null) => void;
  onDelete: (task: Task) => void;
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "")).toUpperCase();
}

function memberName(m?: ProjectMember) {
  return m?.profile?.full_name || m?.profile?.username || "Membro";
}

function Avatar({
  member,
  className = "size-10",
}: {
  member: ProjectMember;
  className?: string;
}) {
  const name = memberName(member);
  return (
    <span
      title={name}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-cream bg-sun text-xs font-bold text-brown ${className}`}
    >
      {member.profile?.avatar_url ? (
        <img
          src={member.profile.avatar_url}
          alt={name}
          className="size-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function ProjectBoardMobile({
  project,
  statuses,
  tasks,
  userId,
  onMove,
  onAdd,
  onAssign,
  onDelete,
}: Props) {
  const navigate = useNavigate();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activeId, setActiveId] = useState(statuses[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [openTask, setOpenTask] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers(project.id)
      .then(setMembers)
      .catch(() => undefined);
  }, [project.id]);

  const byUser = useMemo(
    () => new Map(members.map((m) => [m.user_id, m])),
    [members],
  );

  // Código estável por ordem de criação, ex.: DB-3 (iniciais do projeto)
  const codes = useMemo(() => {
    const prefix =
      project.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase() || "T";
    const sorted = [...tasks].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );
    return new Map(sorted.map((t, i) => [t.id, `${prefix}-${i + 1}`]));
  }, [tasks, project.name]);

  const active = statuses.find((s) => s.id === activeId) ?? statuses[0];
  const visible = tasks.filter((t) => t.status_id === active?.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value || !active) return;
    setTitle("");
    setAdding(false);
    await onAdd(active.id, value);
  }

  return (
    <div className="min-h-dvh bg-cream">
      <MobileHeader
        title={project.name}
        tone="sun"
        subtitle={project.description ?? undefined}
        leading={
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => navigate("/projects")}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-brown bg-cream p-0 text-brown"
          >
            <CaretLeft size={22} weight="bold" aria-hidden />
          </button>
        }
      >
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center -space-x-3">
            {members.slice(0, 3).map((m) => (
              <Avatar key={m.id} member={m} />
            ))}
            {members.length > 3 && (
              <span className="flex size-10 items-center justify-center rounded-full border-2 border-cream bg-cream text-xs font-bold text-brown">
                +{members.length - 3}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="flex min-h-12 items-center gap-2 rounded-full border-0 bg-brown px-5 font-bold text-cream"
          >
            <Plus size={18} weight="bold" aria-hidden /> Tarefa
          </button>
        </div>
      </MobileHeader>

      <div className="px-5 pt-5 pb-4">
        <div
          role="tablist"
          className="flex gap-1 rounded-full bg-sand p-1.5"
          aria-label="Status das tarefas"
        >
          {statuses.map((s) => {
            const count = tasks.filter((t) => t.status_id === s.id).length;
            const isActive = s.id === active?.id;
            return (
              <button
                key={s.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveId(s.id)}
                className={`min-h-11 flex-1 truncate rounded-full border-0 px-2 text-[0.9rem] font-bold ${
                  isActive ? "bg-sun text-brown" : "bg-transparent text-mocha"
                }`}
              >
                {s.name} · {count}
              </button>
            );
          })}
        </div>

        {adding && (
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input
              autoFocus
              value={title}
              maxLength={200}
              placeholder="Título da tarefa"
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-full"
            />
            <button
              type="submit"
              disabled={!title.trim()}
              className="min-h-11 rounded-full border-0 bg-brown px-5 font-bold text-cream disabled:opacity-50"
            >
              Criar
            </button>
          </form>
        )}

        {visible.length === 0 ? (
          <p className="py-10 text-center text-mocha">
            Nenhuma tarefa em “{active?.name}”.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-5 pl-0">
            {visible.map((task) => {
              const assignee = task.assignee_id
                ? byUser.get(task.assignee_id)
                : undefined;
              const unowned = !task.assignee_id;
              const expanded = openTask === task.id;
              return (
                <li key={task.id} className="list-none">
                  <HardShadowCard
                    tone={unowned ? "cream" : "surface"}
                    dashed={unowned}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-mocha">
                        {codes.get(task.id)}
                      </span>
                      {task.priority !== "none" && (
                        <StickerBadge tilt={2}>
                          {PRIORITY_LABELS[task.priority]}
                        </StickerBadge>
                      )}
                    </div>
                    <h2 className="mt-3 text-[1.1rem] font-extrabold leading-snug text-brown">
                      {task.title}
                    </h2>
                    <div className="mt-3 flex items-center justify-between">
                      {unowned ? (
                        <span className="flex items-center gap-2 text-sm text-mocha">
                          <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-mocha">
                            <Question size={14} aria-hidden />
                          </span>
                          Sem dono · pega aí!
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-sm font-semibold text-brown">
                          {assignee ? (
                            <Avatar member={assignee} className="size-8" />
                          ) : (
                            <span className="size-8 rounded-full bg-brown" />
                          )}
                          {assignee ? memberName(assignee) : "Alguém"}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label="Ações da tarefa"
                        aria-expanded={expanded}
                        onClick={() => setOpenTask(expanded ? null : task.id)}
                        className="flex size-11 items-center justify-center border-0 bg-transparent p-0 text-brown"
                      >
                        <DotsThree size={26} weight="bold" aria-hidden />
                      </button>
                    </div>

                    {expanded && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        <select
                          aria-label="Mover para"
                          value={task.status_id}
                          onChange={(e) => onMove(task.id, e.target.value)}
                          className="min-h-11 w-auto flex-1 rounded-full"
                        >
                          {statuses.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        {unowned ? (
                          <button
                            type="button"
                            onClick={() => onAssign(task, userId)}
                            className="min-h-11 rounded-full border-0 bg-sun px-4 font-bold text-brown"
                          >
                            Pegar
                          </button>
                        ) : task.assignee_id === userId ? (
                          <button
                            type="button"
                            onClick={() => onAssign(task, null)}
                            className="min-h-11 rounded-full border-2 border-brown bg-transparent px-4 font-bold text-brown"
                          >
                            Soltar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          aria-label={`Excluir ${task.title}`}
                          onClick={() => onDelete(task)}
                          className="flex size-11 items-center justify-center border-0 bg-transparent p-0 text-clay"
                        >
                          <Trash size={22} aria-hidden />
                        </button>
                      </div>
                    )}
                  </HardShadowCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
