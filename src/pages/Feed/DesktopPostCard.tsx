import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  ChatCircle,
  Check,
  Heart,
  ShareNetwork,
  Trash,
} from "@phosphor-icons/react";
import confetti from "canvas-confetti";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { StickerBadge } from "../../components/shared/StickerBadge";
import { useAuth } from "../../contexts/AuthContext";
import { PostComments } from "./components";
import {
  CATEGORY_LABELS,
  initialsOf,
  relativeTime,
  splitCode,
} from "./postFormat";
import type { Publication, PublicationComment } from "./types";

interface DesktopPostCardProps {
  publication: Publication;
  comments: PublicationComment[];
  loadingComments: boolean;
  isCommentsOpen: boolean;
  onToggleComments: (id: string) => void;
  onAddComment: (pubId: string, content: string) => Promise<void>;
  onDeleteComment: (pubId: string, commentId: string) => Promise<void>;
  onDeletePublication: (id: string, e: MouseEvent) => void;
  resolvedComment?: PublicationComment;
  onResolve: (pubId: string, commentId: string | null) => void;
}

const ACTION =
  "flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-bold text-brown transition-colors hover:text-clay";

/** Post do fórum no desktop: card com sombra dura, autor, texto/código, ações. */
export function DesktopPostCard({
  publication,
  comments,
  loadingComments,
  isCommentsOpen,
  onToggleComments,
  onAddComment,
  onDeleteComment,
  onDeletePublication,
  resolvedComment,
  onResolve,
}: DesktopPostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const author = publication.profiles;
  const authorName = author?.full_name || author?.username || "Membro";
  const profilePath = author?.username ? `/${author.username}` : undefined;
  const commentsCount = publication.comments_count || comments.length || 0;
  const categoryLabel = CATEGORY_LABELS[publication.category];
  const isAuthor = user?.id === publication.user_id;
  const isResolved = Boolean(publication.resolved_comment_id);
  const helperName =
    resolvedComment?.profiles?.full_name ||
    resolvedComment?.profiles?.username ||
    "Membro";

  const handleLike = (e: MouseEvent<HTMLButtonElement>) => {
    const next = !liked;
    setLiked(next);
    if (next) {
      const rect = e.currentTarget.getBoundingClientRect();
      confetti({
        particleCount: 35,
        spread: 60,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ["#eebb48", "#fefaf0", "#a13a1e"],
        disableForReducedMotion: true,
      });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/feed#post-${publication.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sem permissão de área de transferência: o botão apenas não confirma
    }
  };

  const avatar = (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brown bg-sky text-sm font-bold text-brown">
      {author?.avatar_url ? (
        <img
          src={author.avatar_url}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        initialsOf(authorName)
      )}
    </span>
  );

  return (
    <HardShadowCard
      as="article"
      id={`post-${publication.id}`}
      className="scroll-mt-24 p-5"
    >
      <header className="flex items-center gap-3">
        {profilePath ? <Link to={profilePath}>{avatar}</Link> : avatar}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[0.95rem] font-bold text-brown">
            {authorName}
          </p>
          <p className="truncate text-xs text-text-muted">
            {author?.username ? `@${author.username} · ` : ""}
            {relativeTime(publication.created_at)}
          </p>
        </div>
        {categoryLabel && (
          <StickerBadge tilt={2} className="text-[0.7rem]">
            {categoryLabel}
          </StickerBadge>
        )}
        {isResolved && (
          <StickerBadge tone="success" tilt={-2} className="text-[0.7rem]">
            ✓ Resolvida
          </StickerBadge>
        )}
        {isAuthor && (
          <button
            type="button"
            aria-label="Excluir publicação"
            onClick={(e) => onDeletePublication(publication.id, e)}
            className="rounded-full border-0 bg-transparent p-1.5 text-text-muted hover:bg-sand hover:text-clay"
          >
            <Trash size={18} aria-hidden />
          </button>
        )}
      </header>

      {publication.title && (
        <h2 className="mt-4 font-display text-[1.35rem] leading-tight text-brown">
          {publication.title}
        </h2>
      )}

      <div className="mt-2 space-y-3 text-[0.95rem] leading-relaxed text-text-mid">
        {splitCode(publication.content).map((part, i) =>
          part.code ? (
            <pre
              key={i}
              className="overflow-x-auto rounded-xl bg-brown p-4 font-mono text-[0.8rem] leading-relaxed text-cream"
            >
              <code>{part.text.replace(/\n$/, "")}</code>
            </pre>
          ) : (
            <p key={i} className="whitespace-pre-wrap">
              {part.text.trim()}
            </p>
          ),
        )}
      </div>

      {publication.image_url && (
        <img
          src={publication.image_url}
          alt="Anexo da publicação"
          loading="lazy"
          className="mt-4 max-h-[420px] w-full rounded-xl border-2 border-brown object-cover"
        />
      )}

      <footer className="mt-4 flex items-center gap-5 border-t border-border pt-3">
        <button
          type="button"
          aria-pressed={liked}
          onClick={handleLike}
          className={`${ACTION} ${liked ? "text-clay" : ""}`}
        >
          <Heart size={18} weight={liked ? "fill" : "regular"} aria-hidden />
          {liked ? "Curtiu" : "Curtir"}
        </button>
        <button
          type="button"
          aria-expanded={isCommentsOpen}
          onClick={() => onToggleComments(publication.id)}
          className={ACTION}
        >
          <ChatCircle size={18} aria-hidden />
          {commentsCount} {commentsCount === 1 ? "resposta" : "respostas"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className={`${ACTION} ml-auto`}
        >
          {copied ? (
            <Check size={18} className="text-success" aria-hidden />
          ) : (
            <ShareNetwork size={18} aria-hidden />
          )}
          {copied ? "Link copiado!" : "Compartilhar"}
        </button>
      </footer>

      {isResolved && resolvedComment && (
        <section aria-label="Resposta que ajudou" className="mt-4">
          <p className="mb-2 text-[0.7rem] font-extrabold tracking-wider text-success uppercase">
            Resposta que ajudou
          </p>
          <div className="flex gap-3 rounded-xl border-2 border-success bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))] p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-brown bg-sky text-[0.65rem] font-bold text-brown">
              {initialsOf(helperName)}
            </span>
            <div className="min-w-0 text-sm">
              <p className="m-0 font-bold text-brown">
                {helperName}
                <span className="font-normal text-text-muted">
                  {" "}
                  · {relativeTime(resolvedComment.created_at)}
                </span>
              </p>
              <p className="m-0 mt-0.5 whitespace-pre-wrap text-text-mid">
                {resolvedComment.content}
              </p>
            </div>
          </div>
        </section>
      )}

      {isCommentsOpen && (
        <PostComments
          publicationId={publication.id}
          comments={comments}
          loading={loadingComments}
          onAddComment={(content) => onAddComment(publication.id, content)}
          onDeleteComment={(commentId) =>
            onDeleteComment(publication.id, commentId)
          }
          // Só quem perguntou marca a resposta que resolveu a dúvida.
          resolvedCommentId={publication.resolved_comment_id}
          onMarkResolved={
            isAuthor && publication.category === "duvidas"
              ? (commentId) => onResolve(publication.id, commentId)
              : undefined
          }
        />
      )}
    </HardShadowCard>
  );
}
