import { supabase } from "../lib/supabase";

export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";
export type StatusCategory =
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_archived: boolean;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectStatus {
  id: string;
  project_id: string;
  name: string;
  color: string;
  category: StatusCategory;
  position: number;
}

export interface Task {
  id: string;
  project_id: string;
  status_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "Sem prioridade",
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

/** Lista os projetos que o usuário enxerga (RLS: dono ou participante). */
export async function fetchProjects(includeArchived = false) {
  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) query = query.eq("is_archived", false);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function fetchProject(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Project | null;
}

/**
 * Cria o projeto. O trigger `on_project_created` no banco já adiciona o
 * dono como participante e cria os status padrão.
 */
export async function createProject(params: {
  ownerId: string;
  name: string;
  description?: string;
}) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: params.ownerId,
      name: params.name,
      description: params.description || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Project;
}

export async function archiveProject(id: string) {
  const { error } = await supabase
    .from("projects")
    .update({ is_archived: true })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchStatuses(projectId: string) {
  const { data, error } = await supabase
    .from("project_statuses")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProjectStatus[];
}

export async function fetchTasks(projectId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(params: {
  projectId: string;
  statusId: string;
  title: string;
  priority?: TaskPriority;
}) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: params.projectId,
      status_id: params.statusId,
      title: params.title,
      priority: params.priority ?? "none",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  id: string,
  patch: Partial<
    Pick<
      Task,
      | "title"
      | "description"
      | "priority"
      | "status_id"
      | "due_date"
      | "assignee_id"
    >
  >,
) {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

export const ROLE_LABELS: Record<ProjectRole, string> = {
  owner: "Dono",
  admin: "Admin",
  member: "Membro",
  viewer: "Leitor",
};

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  profile: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

/** Participantes do projeto com os dados públicos do perfil. */
export async function fetchMembers(projectId: string) {
  const { data, error } = await supabase
    .from("project_participants")
    .select("id, project_id, user_id, role")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [] as ProjectMember[];

  // project_participants referencia auth.users, então os perfis vêm numa segunda consulta
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in(
      "id",
      rows.map((r) => r.user_id),
    );
  if (profilesError) throw profilesError;

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = byId.get(r.user_id);
    return {
      ...r,
      profile: p
        ? {
            username: p.username,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
          }
        : null,
    };
  }) as ProjectMember[];
}

export class MemberError extends Error {}

/** Convida por username (sem "@"). A pessoa entra direto no projeto. */
export async function addMemberByUsername(params: {
  projectId: string;
  username: string;
  role: Exclude<ProjectRole, "owner">;
}) {
  const username = params.username.trim().replace(/^@/, "");

  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username.replace(/[\\%_]/g, "\\$&"))
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;
  if (!profile) throw new MemberError(`Usuário @${username} não encontrado.`);

  const { error } = await supabase.from("project_participants").insert({
    project_id: params.projectId,
    user_id: profile.id,
    role: params.role,
  });
  if (error) {
    if (error.code === "23505")
      throw new MemberError(`@${username} já participa deste projeto.`);
    throw error;
  }
}

export async function updateMemberRole(
  id: string,
  role: Exclude<ProjectRole, "owner">,
) {
  const { error } = await supabase
    .from("project_participants")
    .update({ role })
    .eq("id", id);
  if (error) throw error;
}

export async function removeMember(id: string) {
  const { error } = await supabase
    .from("project_participants")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** Contadores do perfil: projetos que participa e tarefas concluídas atribuídas a ela. */
export async function fetchProfileCounts(userId: string) {
  const [projects, done] = await Promise.all([
    supabase
      .from("project_participants")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("tasks")
      .select("id, project_statuses!inner(category)", {
        count: "exact",
        head: true,
      })
      .eq("assignee_id", userId)
      .eq("project_statuses.category", "completed"),
  ]);
  return {
    projects: projects.count ?? 0,
    tasksDone: done.count ?? 0,
  };
}
