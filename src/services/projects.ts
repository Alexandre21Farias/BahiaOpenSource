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
    Pick<Task, "title" | "description" | "priority" | "status_id" | "due_date">
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
