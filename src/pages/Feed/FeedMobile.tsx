import React, { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChatCircle,
  Check,
  Heart,
  Plus,
  ShareNetwork,
  Trash,
} from "@phosphor-icons/react";
import confetti from "canvas-confetti";
import { Chip, ChipRow } from "../../components/shared/Chip";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { SearchField } from "../../components/mobile/SearchField";
import { StickerBadge } from "../../components/shared/StickerBadge";
import { useAuth } from "../../contexts/AuthContext";
import { PostComments } from "./components";
import type { Publication, PublicationComment } from "./types";

const CHIPS = [
  { id: "all", label: "Tudo" },
  { id: "duvidas", label: "Dúvidas" },
  { id: "projetos", label: "Mostre seu projeto" },
  { id: "discussao", label: "Discussão" },
];

const CATEGORY_LABELS: Record<string, string> = {
  duvidas: "Dúvida",
  projetos: "Projeto",
  discussao: "Discussão",
  artigo: "Artigo",
  eventos: "Evento",
};

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "")).toUpperCase();
}

function relativeTime(iso: string) {
  const min = Math.max(1, Math.floor((Date.now() - +new Date(iso)) / 60000));
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Quebra o texto em trechos comuns e blocos de código (```). */
function splitCode(content: string) {
  return content
    .split(/```(?:\w+)?\n?/)
    .map((text, i) => ({ text, code: i % 2 === 1 }))
    .filter((s) => s.text.trim().length > 0);
}

export interface FeedMobileProps {
  publications: Publication[];
  loading: boolean;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onOpenModal: () => void;
  userName: string;
  userAvatarUrl?: string;
  commentsMap: Record<string, PublicationComment[]>;
  loadingComments: Record<string, boolean>;
  expandedComments: Record<string, boolean>;
  onToggleComments: (id: string) => void;
  onAddComment: (pubId: string, content: string) => Promise<void>;
  onDeleteComment: (pubId: string, commentId: string) => Promise<void>;
  onDeletePublication: (id: string, e: React.MouseEvent) => void;
}

function MobilePost({
  pub,
  ...p
}: { pub: Publication } & Omit<
  FeedMobileProps,
  "publications" | "loading" | "activeCategory" | "onCategoryChange"
>) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [copied, setCopied] = useState(false);

  const name = pub.profiles?.full_name || pub.profiles?.username || "Membro";
  const username = pub.profiles?.username;
  const commentsCount =
    pub.comments_count || p.commentsMap[pub.id]?.length || 0;
  const isOpen = !!p.expandedComments[pub.id];

  const like = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => (next ? n + 1 : Math.max(0, n - 1)));
    if (next) {
      const r = e.currentTarget.getBoundingClientRect();
      confetti({
        particleCount: 30,
        spread: 60,
        origin: {
          x: (r.left + r.width / 2) / window.innerWidth,
          y: (r.top + r.height / 2) / window.innerHeight,
        },
        colors: ["#eebb48", "#fefaf0", "#a13a1e"],
        disableForReducedMotion: true,
      });
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/feed#post-${pub.id}`;
    try {
      if (navigator.share) await navigator.share({ title: pub.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* compartilhamento cancelado */
    }
  };

  const action =
    "flex min-h-11 items-center gap-1.5 border-0 bg-transparent p-0 text-[0.95rem] font-bold text-brown";

  return (
    <article id={`post-${pub.id}`} className="border-b border-border px-5 py-5">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky font-bold text-navy"
        >
          {pub.profiles?.avatar_url ? (
            <img
              src={pub.profiles.avatar_url}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            initials(name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            to={username ? `/${username}` : "#"}
            className="block truncate font-extrabold text-brown no-underline! hover:text-brown!"
          >
            {name}
          </Link>
          <p className="truncate text-sm text-mocha">
            {username ? `@${username} · ` : ""}
            {relativeTime(pub.created_at)}
          </p>
        </div>
        {CATEGORY_LABELS[pub.category] && (
          <StickerBadge tilt={3}>{CATEGORY_LABELS[pub.category]}</StickerBadge>
        )}
      </div>

      <h2 className="mt-4 text-[1.05rem] font-extrabold leading-snug text-brown">
        {pub.title}
      </h2>
      <div className="mt-2 text-[1rem] leading-relaxed text-brown">
        {splitCode(pub.content).map((seg, i) => (
          <Fragment key={i}>
            {seg.code ? (
              <pre className="my-3 overflow-x-auto rounded-xl bg-brown p-4 font-mono text-[0.85rem] leading-relaxed text-cream">
                <code>{seg.text.replace(/\n$/, "")}</code>
              </pre>
            ) : (
              <p className="whitespace-pre-wrap text-brown">{seg.text}</p>
            )}
          </Fragment>
        ))}
      </div>
      {pub.image_url && (
        <img
          src={pub.image_url}
          alt=""
          loading="lazy"
          className="mt-3 max-h-80 w-full rounded-xl border-2 border-brown object-cover"
        />
      )}

      <div className="mt-3 flex items-center gap-5">
        <button
          type="button"
          aria-pressed={liked}
          aria-label="Curtir"
          onClick={like}
          className={action}
        >
          <Heart size={22} weight={liked ? "fill" : "regular"} aria-hidden />
          {likes}
        </button>
        <button
          type="button"
          aria-label="Comentários"
          aria-expanded={isOpen}
          onClick={() => p.onToggleComments(pub.id)}
          className={action}
        >
          <ChatCircle size={22} aria-hidden />
          {commentsCount}
        </button>
        <span className="flex-1" />
        {user?.id === pub.user_id && (
          <button
            type="button"
            aria-label="Excluir publicação"
            onClick={(e) => p.onDeletePublication(pub.id, e)}
            className={action}
          >
            <Trash size={22} aria-hidden />
          </button>
        )}
        <button
          type="button"
          aria-label="Compartilhar"
          onClick={share}
          className={action}
        >
          {copied ? (
            <Check size={22} aria-hidden />
          ) : (
            <ShareNetwork size={22} aria-hidden />
          )}
        </button>
      </div>

      {isOpen && (
        <PostComments
          publicationId={pub.id}
          comments={p.commentsMap[pub.id] || []}
          loading={!!p.loadingComments[pub.id]}
          onAddComment={(content) => p.onAddComment(pub.id, content)}
          onDeleteComment={(id) => p.onDeleteComment(pub.id, id)}
        />
      )}
    </article>
  );
}

export function FeedMobile(props: FeedMobileProps) {
  const [search, setSearch] = useState("");
  const { publications, userName, userAvatarUrl } = props;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return publications;
    return publications.filter((pub) =>
      [
        pub.title,
        pub.content,
        pub.profiles?.full_name ?? "",
        pub.profiles?.username ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [publications, search]);

  return (
    <div className="min-h-dvh bg-cream">
      <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <h1 className="font-display text-[2.4rem] leading-none text-brown [text-shadow:2px_2px_0_var(--sun)]">
          Fórum
        </h1>
        <SearchField
          className="mt-5"
          value={search}
          onChange={setSearch}
          placeholder="Buscar discussões, pessoas, tags"
        />
        <div className="mt-4">
          <ChipRow>
            {CHIPS.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                active={props.activeCategory === c.id}
                onClick={() => props.onCategoryChange(c.id)}
              />
            ))}
          </ChipRow>
        </div>

        <HardShadowCard
          as="button"
          type="button"
          onClick={props.onOpenModal}
          className="mt-5 flex w-full items-center gap-3 text-left"
        >
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sun text-sm font-bold text-brown"
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              initials(userName)
            )}
          </span>
          <span className="flex-1 text-[1rem] text-mocha">
            No que você está trabalhando?
          </span>
          <span
            aria-hidden
            className="flex size-11 items-center justify-center rounded-full bg-brown text-cream"
          >
            <Plus size={22} weight="bold" />
          </span>
        </HardShadowCard>
      </div>

      <div className="mt-5 border-t border-border">
        {props.loading ? (
          <p className="py-10 text-center text-mocha">
            Carregando publicações…
          </p>
        ) : visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-mocha">
            {search
              ? "Nada encontrado para essa busca."
              : "Ainda não há publicações aqui. Que tal começar uma?"}
          </p>
        ) : (
          visible.map((pub) => <MobilePost key={pub.id} pub={pub} {...props} />)
        )}
      </div>
    </div>
  );
}
