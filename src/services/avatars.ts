import { supabase } from "../lib/supabase";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file);
  if (error) throw error;

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
