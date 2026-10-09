import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../../components/ui/icon";
import { PaperPlaneRight, Trash } from "@phosphor-icons/react";
import { useAuth } from "../../../contexts/AuthContext";
import { PublicationComment } from "../types";

interface PostCommentsProps {
  publicationId: string;
  comments: PublicationComment[];
  loading: boolean;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export function PostComments({
  publicationId,
  comments,
  loading,
  onAddComment,
  onDeleteComment,
}: PostCommentsProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || submitting || !user) return;

    setSubmitting(true);
    try {
      await onAddComment(commentText.trim());
      setCommentText("");
    } catch (err) {
      console.error("Erro ao enviar comentário:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffInMs = Math.abs(now.getTime() - past.getTime());
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) return `${diffInMinutes || 1} min`;
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${diffInDays}d`;
  };

  return (
    <div className="post-comments-container">
      {/* Input to add a new comment */}
      {user ? (
        <form onSubmit={handleSubmit} className="comment-form-row">
          <img
            src={
              user.user_metadata?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email?.split("@")[0] || "User")}&background=eebb48&color=3f1d12`
            }
            alt="Seu avatar"
            className="comment-user-avatar"
          />
          <div className="comment-input-wrapper">
            <input
              type="text"
              placeholder="Adicionar um comentário..."
              className="comment-input-field"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={submitting}
            />
            <button
              type="submit"
              className="comment-submit-btn"
              disabled={!commentText.trim() || submitting}
              title="Publicar comentário"
            >
              {submitting ? (
                <span className="spinner-xs" />
              ) : (
                <Icon icon={PaperPlaneRight} size="sm" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <p className="comment-login-hint">
          <Link to="/login">Faça login</Link> para participar da conversa.
        </p>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="comments-loading-state">
          <span className="spinner-sm" />
          <span>Carregando respostas...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="comments-empty-state">
          Nenhum comentário ainda. Seja o primeiro a responder!
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comm) => {
            const authorName =
              comm.profiles?.username || comm.profiles?.full_name || "Membro";
            const isOwner = user && user.id === comm.user_id;
            const avatarUrl =
              comm.profiles?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=eebb48&color=3f1d12`;

            return (
              <div key={comm.id} className="comment-item">
                <img
                  src={avatarUrl}
                  alt={authorName}
                  className="comment-item-avatar"
                />
                <div className="comment-bubble">
                  <div className="comment-bubble-header">
                    <Link
                      to={
                        comm.profiles?.username
                          ? `/${comm.profiles.username}`
                          : "#"
                      }
                      className="comment-author-name"
                    >
                      {authorName}
                    </Link>
                    <div className="comment-bubble-meta">
                      <span className="comment-time">
                        {getRelativeTime(comm.created_at)}
                      </span>
                      {isOwner && (
                        <button
                          type="button"
                          className="comment-delete-btn"
                          onClick={() => onDeleteComment(comm.id)}
                          title="Excluir comentário"
                        >
                          <Icon icon={Trash} size="sm" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="comment-content-text">{comm.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
