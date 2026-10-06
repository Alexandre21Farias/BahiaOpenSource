import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../../components/ui/icon";
import {
  ThumbsUp,
  ChatCircle,
  ShareNetwork,
  Trash,
  DotsThree,
  Clock,
  Sparkle,
  Tag,
  Check,
} from "@phosphor-icons/react";
import confetti from "canvas-confetti";
import { useAuth } from "../../../contexts/AuthContext";
import { Publication, PublicationComment } from "../types";
import { PostComments } from "./PostComments";

interface PostCardProps {
  publication: Publication;
  index: number;
  comments: PublicationComment[];
  loadingComments: boolean;
  onDeletePublication: (id: string, e: React.MouseEvent) => void;
  onToggleComments: (id: string) => void;
  isCommentsOpen: boolean;
  onAddComment: (pubId: string, content: string) => Promise<void>;
  onDeleteComment: (pubId: string, commentId: string) => Promise<void>;
}

export function PostCard({
  publication,
  index,
  comments,
  loadingComments,
  onDeletePublication,
  onToggleComments,
  isCommentsOpen,
  onAddComment,
  onDeleteComment,
}: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const authorName =
    publication.profiles?.full_name ||
    publication.profiles?.username ||
    "Membro da Comunidade";

  const authorUsername = publication.profiles?.username;

  const authorAvatar =
    publication.profiles?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=eebb48&color=0f3b59`;

  const isOwner = user && user.id === publication.user_id;
  const commentsCount = publication.comments_count || comments.length || 0;

  const getRelativeTimeText = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffInMs = Math.abs(now.getTime() - past.getTime());
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) return `${diffInMinutes || 1} min atrás`;
    if (diffInHours < 24)
      return `${diffInHours} ${diffInHours === 1 ? "hora" : "horas"} atrás`;
    return `${diffInDays} ${diffInDays === 1 ? "dia" : "dias"} atrás`;
  };

  const handleLike = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (nextLiked) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { x, y },
        colors: ["#eebb48", "#c8dafb", "#a13a1e"],
        disableForReducedMotion: true,
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/feed#post-${publication.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="feed-card post-card" id={`post-${publication.id}`}>
      {/* Header: Author Info */}
      <div className="post-header">
        <div className="post-author-wrapper">
          <Link
            to={authorUsername ? `/${authorUsername}` : "#"}
            className="post-avatar-link"
          >
            <img
              src={authorAvatar}
              alt={authorName}
              className="post-author-avatar"
            />
          </Link>

          <div className="post-author-info">
            <div className="post-author-name-row">
              <Link
                to={authorUsername ? `/${authorUsername}` : "#"}
                className="post-author-name"
              >
                {authorName}
              </Link>
            </div>

            <p className="post-author-headline">
              {authorUsername
                ? `@${authorUsername}`
                : "Desenvolvedor OpenBahia"}
              {publication.category && ` · ${publication.category}`}
            </p>

            <span className="post-time-stamp">
              {getRelativeTimeText(publication.created_at)}
            </span>
          </div>
        </div>

        {/* Top-right menu / Owner delete */}
        <div className="post-top-actions">
          {isOwner && (
            <button
              type="button"
              className="post-action-icon-btn delete-btn"
              onClick={(e) => onDeletePublication(publication.id, e)}
              title="Excluir publicação"
            >
              <Icon icon={Trash} size="sm" />
            </button>
          )}
        </div>
      </div>

      {/* Post Body: Title & Content */}
      <div className="post-body">
        {publication.title && (
          <h3 className="post-title">{publication.title}</h3>
        )}
        <p className="post-content-text">{publication.content}</p>
      </div>

      {/* Post Attached Media */}
      {publication.image_url && (
        <div className="post-media-container">
          <img
            src={publication.image_url}
            alt="Anexo da publicação"
            className="post-media-image"
            loading="lazy"
          />
        </div>
      )}

      {/* Social Engagement Metrics Bar */}
      <div className="post-metrics-bar">
        <div className="post-metrics-reactions">
          <span className="reaction-pill">
            <Icon icon={Sparkle} size="sm" className="text-sun" />
            <span>{likesCount} curtidas</span>
          </span>
        </div>

        <div className="post-metrics-stats">
          <button
            type="button"
            className="metric-btn"
            onClick={() => onToggleComments(publication.id)}
          >
            {commentsCount} {commentsCount === 1 ? "comentário" : "comentários"}
          </button>
        </div>
      </div>

      {/* Action Buttons Row: Gostar, Comentar, Compartilhar */}
      <div className="post-actions-row">
        <button
          type="button"
          className={`post-action-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          <Icon icon={ThumbsUp} size="md" className={liked ? "fill-sun" : ""} />
          <span>{liked ? "Gostei" : "Gostar"}</span>
        </button>

        <button
          type="button"
          className={`post-action-btn ${isCommentsOpen ? "active" : ""}`}
          onClick={() => onToggleComments(publication.id)}
        >
          <Icon icon={ChatCircle} size="md" />
          <span>Comentar</span>
        </button>

        <button type="button" className="post-action-btn" onClick={handleShare}>
          {copied ? (
            <Icon icon={Check} size="md" className="text-success" />
          ) : (
            <Icon icon={ShareNetwork} size="md" />
          )}
          <span>{copied ? "Link copiado!" : "Compartilhar"}</span>
        </button>
      </div>

      {/* Expanded Comments Thread */}
      {isCommentsOpen && (
        <PostComments
          publicationId={publication.id}
          comments={comments}
          loading={loadingComments}
          onAddComment={(content) => onAddComment(publication.id, content)}
          onDeleteComment={(commentId) =>
            onDeleteComment(publication.id, commentId)
          }
        />
      )}
    </article>
  );
}
