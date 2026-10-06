import React from "react";
import { Icon } from "@/components/ui/icon";
import { VideoCamera, Image, Article, Sparkle } from "@phosphor-icons/react";
import { useAuth } from "../../../contexts/AuthContext";

interface CreatePostTriggerProps {
  onOpenModal: (triggerType?: "photo" | "article" | "general") => void;
  userAvatarUrl?: string;
  userName?: string;
}

export function CreatePostTrigger({
  onOpenModal,
  userAvatarUrl,
  userName = "Você",
}: CreatePostTriggerProps) {
  const { user } = useAuth();

  const avatar =
    userAvatarUrl ||
    (user
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=eebb48&color=0f3b59`
      : "https://ui-avatars.com/api/?name=User&background=c8dafb&color=0f3b59");

  return (
    <div className="feed-card create-post-trigger-card">
      <div className="trigger-top-row">
        <img src={avatar} alt={userName} className="trigger-user-avatar" />
        <button
          type="button"
          className="trigger-input-button"
          onClick={() => onOpenModal("general")}
        >
          <span>Começar publicação...</span>
        </button>
      </div>

      <div className="trigger-actions-row">
        <button
          type="button"
          className="trigger-action-btn action-video"
          onClick={() => onOpenModal("general")}
        >
          <Icon
            icon={VideoCamera}
            size="md"
            className="action-icon video-icon"
          />
          <span>Vídeo</span>
        </button>

        <button
          type="button"
          className="trigger-action-btn action-photo"
          onClick={() => onOpenModal("photo")}
        >
          <Icon icon={Image} size="md" className="action-icon photo-icon" />
          <span>Foto</span>
        </button>

        <button
          type="button"
          className="trigger-action-btn action-article"
          onClick={() => onOpenModal("article")}
        >
          <Icon icon={Article} size="md" className="action-icon article-icon" />
          <span>Escrever artigo</span>
        </button>
      </div>
    </div>
  );
}
