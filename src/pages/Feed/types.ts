import { Publication, PublicationComment } from "../../services/publications";

export type { Publication, PublicationComment };

export interface UserProfileSummary {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio?: string | null;
  location?: string | null;
}
