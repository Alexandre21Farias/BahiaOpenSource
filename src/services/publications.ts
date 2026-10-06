import { supabase } from "../lib/supabase";

export interface Publication {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
  comments_count?: number;
}

export interface PublicationComment {
  id: string;
  publication_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

/**
 * Busca todas as publicações com suporte a join de perfil do autor e contagem de comentários.
 */
export async function fetchPublications(
  categoryFilter?: string,
): Promise<Publication[]> {
  let query = supabase
    .from("publications")
    .select(
      `
      *,
      profiles!user_id (
        id,
        full_name,
        username,
        avatar_url
      ),
      publication_comments (id)
    `,
    )
    .order("created_at", { ascending: false });

  if (categoryFilter && categoryFilter !== "all") {
    query = query.eq("category", categoryFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar publicações:", error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    ...item,
    comments_count: item.publication_comments
      ? item.publication_comments.length
      : 0,
  }));
}

/**
 * Busca publicações de um usuário específico.
 */
export async function fetchUserPublications(
  userId: string,
): Promise<Publication[]> {
  const { data, error } = await supabase
    .from("publications")
    .select(
      `
      *,
      profiles!user_id (
        id,
        full_name,
        username,
        avatar_url
      ),
      publication_comments (id)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar publicações do usuário:", error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    ...item,
    comments_count: item.publication_comments
      ? item.publication_comments.length
      : 0,
  }));
}

/**
 * Cria uma nova publicação.
 */
export async function createPublication(params: {
  userId: string;
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
}): Promise<Publication> {
  const { data, error } = await supabase
    .from("publications")
    .insert([
      {
        user_id: params.userId,
        title: params.title,
        content: params.content,
        category: params.category || "discussao",
        image_url: params.imageUrl,
      },
    ])
    .select(
      `
      *,
      profiles!user_id (
        id,
        full_name,
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    console.error("Erro ao criar publicação:", error);
    throw error;
  }

  return { ...data, comments_count: 0 };
}

/**
 * Deleta uma publicação (somente se o usuário for o dono via RLS).
 */
export async function deletePublication(id: string): Promise<void> {
  const { error } = await supabase.from("publications").delete().eq("id", id);
  if (error) {
    console.error("Erro ao deletar publicação:", error);
    throw error;
  }
}

/**
 * Busca os comentários de uma publicação específica.
 */
export async function fetchComments(
  publicationId: string,
): Promise<PublicationComment[]> {
  const { data, error } = await supabase
    .from("publication_comments")
    .select(
      `
      *,
      profiles!user_id (
        id,
        full_name,
        username,
        avatar_url
      )
    `,
    )
    .eq("publication_id", publicationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar comentários:", error);
    throw error;
  }

  return data || [];
}

/**
 * Adiciona um comentário em uma publicação.
 */
export async function addComment(params: {
  publicationId: string;
  userId: string;
  content: string;
}): Promise<PublicationComment> {
  const { data, error } = await supabase
    .from("publication_comments")
    .insert([
      {
        publication_id: params.publicationId,
        user_id: params.userId,
        content: params.content,
      },
    ])
    .select(
      `
      *,
      profiles!user_id (
        id,
        full_name,
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    console.error("Erro ao adicionar comentário:", error);
    throw error;
  }

  return data;
}

/**
 * Deleta um comentário.
 */
export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase
    .from("publication_comments")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Erro ao deletar comentário:", error);
    throw error;
  }
}

/**
 * Faz o upload de uma imagem para a publicação.
 */
export async function uploadPublicationImage(
  userId: string,
  file: File,
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}_${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("publications")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Erro ao fazer upload da imagem:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from("publications").getPublicUrl(filePath);
  return data.publicUrl;
}
