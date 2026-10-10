import { supabase } from "../lib/supabase";
import type { JobLevel, WorkMode } from "./jobs";

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const MAX_SKILLS = 20;

export interface CareerForm {
  headline: string;
  experience_level: JobLevel | "";
  /** separadas por vírgula ou quebra de linha */
  skills: string;
  work_modes: WorkMode[];
  open_to_work: boolean;
  github: string;
  linkedin: string;
  resume_public: boolean;
}

export const EMPTY_CAREER: CareerForm = {
  headline: "",
  experience_level: "",
  skills: "",
  work_modes: [],
  open_to_work: false,
  github: "",
  linkedin: "",
  resume_public: false,
};

/** "React, Node.js\nPostgreSQL" -> ["React","Node.js","PostgreSQL"] (sem repetidos, máx. 20) */
export function parseSkills(raw: string) {
  const seen = new Map<string, string>();
  for (const part of raw.split(/[,\n]+/)) {
    const skill = part.trim().slice(0, 30);
    if (skill && !seen.has(skill.toLowerCase()))
      seen.set(skill.toLowerCase(), skill);
  }
  return [...seen.values()].slice(0, MAX_SKILLS);
}

/** Aceita "usuario", "@usuario", "github.com/usuario" ou a URL completa. */
export function normalizeGithub(input: string) {
  const value = input.trim();
  if (!value) return null;
  const match = value.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?@?([A-Za-z0-9-]{1,39})\/?$/i,
  );
  return match ? `https://github.com/${match[1]}` : undefined;
}

/** Aceita "linkedin.com/in/fulano" ou a URL completa. */
export function normalizeLinkedin(input: string) {
  const value = input.trim();
  if (!value) return null;
  const match = value.match(
    /^(?:https?:\/\/)?((?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|company)\/[^\s?#]{1,100})/i,
  );
  return match ? `https://${match[1].replace(/\/+$/, "")}` : undefined;
}

/** Envia o PDF para a pasta do usuário (substitui o anterior). Retorna o caminho. */
export async function uploadResume(userId: string, file: File) {
  const path = `${userId}/curriculo.pdf`;
  const { error } = await supabase.storage.from("resumes").upload(path, file, {
    upsert: true,
    contentType: "application/pdf",
  });
  if (error) throw error;
  return path;
}

export async function removeResume(path: string) {
  const { error } = await supabase.storage.from("resumes").remove([path]);
  if (error) throw error;
}

/** Link temporário (10 min). Só funciona para o dono ou se o currículo for público. */
export async function getResumeUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}
