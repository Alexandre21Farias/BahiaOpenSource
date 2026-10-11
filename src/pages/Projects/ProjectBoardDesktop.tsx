import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  CaretLeft,
  GitPullRequest,
  PencilSimple,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { Chip } from "../../components/shared/Chip";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { StickerBadge } from "../../components/shared/StickerBadge";
import {
  fetchMembers,
  PR_STATE_LABELS,
  PRIORITY_LABELS,
  type PrState,
  type Project,
  type ProjectMember,
  type ProjectStatus,
  type Task,
  type TaskPriority,
} from "../../services/projects";
import { initialsOf } from "../Feed/postFormat";
import { ProjectMembers } from "./ProjectMembers";

type Filter = "all" | "mine" | "unassigned" | "good";

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
  onUpdate: (task: Task, patch: TaskPatch) => Promise<void>;
}

type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "labels"
    | "good_first_task"
    | "pr_url"
    | "pr_state"
  >
>;

const PR_URL = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/[0-9]+$/;

const PR_TONES: Record<PrState, string> = {
  draft: "bg-sand text-brown",
  open: "bg-sky text-navy",
  merged:
    "bg-[color-mix(in_srgb,var(--success)_18%,var(--surface))] text-success",
  closed: "bg-sand text-text-muted line-through",
};

/** Etiqueta → cor do adesivo (Bug em argila, Docs em céu, o resto em sol). */
function labelTone(label: string): "sun" | "clay" | "sky" {
  const l = label.toLowerCase();
  if (l === "bug") return "clay";
  if (l === "docs" || l === "doc") return "sky";
  return "sun";
}

function prNumber(url: string) {
  return url.match(/\/pull\/(\d+)/)?.[1] ?? "";
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
  onUpdate,
}: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [expandedDone, setExpandedDone] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Task | null>(null);
  const [showCanceled, setShowCanceled] = useState(false);

  const doneStatusIds = useMemo(
    () =>
      new Set(
        statuses
          .filter(
            (s) => s.category === "completed" || s.category === "canceled",
          )
          .map((s) => s.id),
      ),
    [statuses],
  );
  const goodFirstOpen = tasks.filter(
    (t) => t.good_first_task && !doneStatusIds.has(t.status_id),
  ).length;
  const canceledIds = new Set(
    statuses.filter((s) => s.category === "canceled").map((s) => s.id),
  );
  const canceledCount = tasks.filter((t) =>
    canceledIds.has(t.status_id),
  ).length;
  // Cancelado fica escondido por padrão: o quadro mostra as 4 colunas de trabalho.
  const columns = statuses.filter(
    (s) => showCanceled || s.category !== "canceled",
  );

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
      if (filter === "good" && !t.good_first_task) continue;
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
          <Chip
            label={`Boa 1ª tarefa · ${goodFirstOpen}`}
            active={filter === "good"}
            onClick={() => setFilter(filter === "good" ? "all" : "good")}
            className={filter === "good" ? "" : "border-success! text-success!"}
          />
          <span className="ml-auto flex items-center gap-4 text-sm text-text-muted">
            {canceledCount > 0 && (
              <button
                type="button"
                onClick={() => setShowCanceled((v) => !v)}
                className="border-0 bg-transparent p-0 font-bold text-text-mid underline"
              >
                {showCanceled
                  ? "Esconder canceladas"
                  : `Ver canceladas (${canceledCount})`}
              </button>
            )}
            Arraste os cards entre as colunas
          </span>
        </div>

        <div className="mt-6 overflow-x-auto pb-4">
          <div
            className="grid gap-x-[44px]"
            style={{
              gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(260px, 1fr))`,
            }}
          >
            {columns.map((status) => {
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
                            {!done &&
                              (task.labels.length > 0 ||
                                task.good_first_task ||
                                task.priority !== "none") && (
                                <div className="mb-2 flex flex-wrap gap-2">
                                  {task.labels.map((l) => (
                                    <StickerBadge
                                      key={l}
                                      tone={labelTone(l)}
                                      tilt={-3}
                                      className="text-xs"
                                    >
                                      {l}
                                    </StickerBadge>
                                  ))}
                                  {task.good_first_task && (
                                    <StickerBadge
                                      tone="success"
                                      tilt={-2}
                                      className="text-xs"
                                    >
                                      Boa 1ª tarefa
                                    </StickerBadge>
                                  )}
                                  {task.priority !== "none" && (
                                    <StickerBadge
                                      tone={
                                        task.priority === "high" ||
                                        task.priority === "urgent"
                                          ? "clay"
                                          : "sun"
                                      }
                                      tilt={2}
                                      className="text-xs"
                                    >
                                      {PRIORITY_LABELS[task.priority]}
                                    </StickerBadge>
                                  )}
                                </div>
                              )}
                            <button
                              type="button"
                              onClick={() => setEditing(task)}
                              className={`block w-full border-0 bg-transparent p-0 text-left text-[1.05rem] leading-snug font-bold ${
                                done
                                  ? "text-text-muted line-through"
                                  : "text-brown"
                              }`}
                            >
                              {task.title}
                            </button>
                            {task.pr_url && task.pr_state && (
                              <a
                                href={task.pr_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold no-underline! ${PR_TONES[task.pr_state]}`}
                              >
                                <GitPullRequest size={14} aria-hidden />
                                PR #{prNumber(task.pr_url)} ·{" "}
                                {PR_STATE_LABELS[task.pr_state]}
                              </a>
                            )}
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
                                aria-label={`Editar ${task.title}`}
                                onClick={() => setEditing(task)}
                                className="rounded-full border-0 bg-transparent p-1 text-text-muted hover:text-brown"
                              >
                                <PencilSimple size={16} aria-hidden />
                              </button>
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

        {editing && (
          <TaskEditor
            task={editing}
            onClose={() => setEditing(null)}
            onSave={async (patch) => {
              await onUpdate(editing, patch);
              setEditing(null);
            }}
          />
        )}

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

const FIELD =
  "mt-1 w-full rounded-xl border border-border-strong bg-cream px-3 py-2 text-brown focus:shadow-none";

/** Editor da tarefa: título, descrição, etiquetas, boa 1ª tarefa e PR. */
function TaskEditor({
  task,
  onClose,
  onSave,
}: {
  task: Task;
  onClose: () => void;
  onSave: (patch: TaskPatch) => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [labels, setLabels] = useState(task.labels.join(", "));
  const [goodFirst, setGoodFirst] = useState(task.good_first_task);
  const [prUrl, setPrUrl] = useState(task.pr_url ?? "");
  const [prState, setPrState] = useState<PrState>(task.pr_state ?? "open");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const url = prUrl.trim();
    if (url && !PR_URL.test(url)) {
      setError(
        "Use o link do PR no GitHub: https://github.com/dono/repo/pull/123",
      );
      return;
    }
    const cleanLabels = [
      ...new Set(
        labels
          .split(",")
          .map((l) => l.trim().slice(0, 24))
          .filter(Boolean),
      ),
    ].slice(0, 6);
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim() || task.title,
        description: description.trim() || null,
        labels: cleanLabels,
        good_first_task: goodFirst,
        pr_url: url || null,
        pr_state: url ? prState : null,
      });
    } catch {
      setError("Não foi possível salvar a tarefa.");
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editar tarefa"
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-brown/50 p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <HardShadowCard
        as="form"
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-[560px] space-y-4 overflow-y-auto p-6"
      >
        <h2 className="font-display text-[1.5rem] text-brown">Editar tarefa</h2>
        {error && (
          <p
            role="alert"
            className="m-0 rounded-lg bg-sand px-3 py-2 text-sm font-bold text-clay"
          >
            {error}
          </p>
        )}
        <label className="block text-sm font-bold text-brown">
          Título
          <input
            autoFocus
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-bold text-brown">
          Descrição (opcional)
          <textarea
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-bold text-brown">
          Etiquetas (separadas por vírgula, até 6)
          <input
            value={labels}
            placeholder="Front, Git, React"
            onChange={(e) => setLabels(e.target.value)}
            className={FIELD}
          />
          <span className="mt-1 block text-xs font-normal text-text-muted">
            Use as tecnologias da tarefa: elas aparecem como sugestão em vagas
            que pedem a mesma tecnologia.
          </span>
        </label>
        <label className="flex items-center gap-3 text-sm font-bold text-brown">
          <input
            type="checkbox"
            checked={goodFirst}
            onChange={(e) => setGoodFirst(e.target.checked)}
            className="size-5 accent-[var(--success)]"
          />
          Boa primeira tarefa (qualquer pessoa da comunidade pode pegar)
        </label>
        <div className="grid grid-cols-[1fr_160px] gap-3">
          <label className="block text-sm font-bold text-brown">
            Link do PR
            <input
              type="url"
              value={prUrl}
              placeholder="https://github.com/dono/repo/pull/42"
              onChange={(e) => setPrUrl(e.target.value)}
              className={FIELD}
            />
          </label>
          <label className="block text-sm font-bold text-brown">
            Estado
            <select
              value={prState}
              disabled={!prUrl.trim()}
              onChange={(e) => setPrState(e.target.value as PrState)}
              className={`${FIELD} cursor-pointer opacity-100 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {(Object.keys(PR_STATE_LABELS) as PrState[]).map((s) => (
                <option key={s} value={s}>
                  {PR_STATE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-[1.5px] border-brown bg-surface px-6 py-2.5 font-bold text-brown"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full border-0 bg-sun px-6 py-2.5 font-bold text-brown disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </HardShadowCard>
    </div>
  );
}
