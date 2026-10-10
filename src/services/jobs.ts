import { supabase } from "../lib/supabase";

export type WorkMode = "remote" | "hybrid" | "onsite";
export type JobType = "clt" | "pj" | "estagio" | "freelance" | "voluntario";
export type JobLevel = "estagio" | "junior" | "pleno" | "senior";

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  clt: "CLT",
  pj: "PJ",
  estagio: "Estágio",
  freelance: "Freelance",
  voluntario: "Voluntário",
};

export const JOB_LEVEL_LABELS: Record<JobLevel, string> = {
  estagio: "Estágio",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
};

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  work_mode: WorkMode;
  job_type: JobType;
  level: JobLevel | null;
  salary: string | null;
  tags: string[];
  apply_url: string | null;
  apply_email: string | null;
  is_open: boolean;
  expires_at: string;
  created_at: string;
}

export interface NewJob {
  title: string;
  company: string;
  description: string;
  location?: string;
  work_mode: WorkMode;
  job_type: JobType;
  level?: JobLevel;
  salary?: string;
  tags: string[];
  apply_url?: string;
  apply_email?: string;
}

/** Vagas abertas e não expiradas (a RLS também filtra para quem não é o autor). */
export async function fetchJobs(filters?: {
  workMode?: WorkMode;
  jobType?: JobType;
}) {
  let query = supabase
    .from("jobs")
    .select("*")
    .eq("is_open", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.workMode) query = query.eq("work_mode", filters.workMode);
  if (filters?.jobType) query = query.eq("job_type", filters.jobType);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Job[];
}

export async function fetchJob(id: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Job | null;
}

export async function createJob(userId: string, job: NewJob) {
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      user_id: userId,
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location || null,
      work_mode: job.work_mode,
      job_type: job.job_type,
      level: job.level || null,
      salary: job.salary || null,
      tags: job.tags,
      apply_url: job.apply_url || null,
      apply_email: job.apply_email || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Job;
}

export async function setJobOpen(id: string, isOpen: boolean) {
  const { error } = await supabase
    .from("jobs")
    .update({ is_open: isOpen })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteJob(id: string) {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

/** "react, node  typescript" -> ["react","node","typescript"] (máx. 10) */
export function parseTags(raw: string) {
  const seen = new Set<string>();
  for (const part of raw.split(/[,\s]+/)) {
    const tag = part.trim().toLowerCase().slice(0, 24);
    if (tag) seen.add(tag);
  }
  return [...seen].slice(0, 10);
}
