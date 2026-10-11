import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchPublications,
  deletePublication,
  fetchComments,
  addComment,
  deleteComment,
} from "../../services/publications";
import { Publication, PublicationComment } from "./types";
import { useIsMobile } from "../../hooks/useIsMobile";
import { FeedMobile } from "./FeedMobile";
import { FeedDesktop } from "./FeedDesktop";
import { useRecentJobs } from "./useRecentJobs";
import { CreatePostModal } from "./components";
import "./Feed.css";

/** Posts por página no scroll infinito do desktop. */
const PAGE_SIZE = 10;

export function Feed() {
  const { user } = useAuth();
  const recentJobs = useRecentJobs();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  // Descarta respostas de buscas antigas (troca de categoria no meio do carregamento).
  const requestId = useRef(0);
  const [activeCategory, setActiveCategory] = useState("all");

  // Modal State (replaces inline form that pushed content down!)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultFocusPhoto, setDefaultFocusPhoto] = useState(false);

  // Comments State
  const [expandedComments, setExpandedComments] = useState<{
    [pubId: string]: boolean;
  }>({});
  const [commentsMap, setCommentsMap] = useState<{
    [pubId: string]: PublicationComment[];
  }>({});
  const [loadingComments, setLoadingComments] = useState<{
    [pubId: string]: boolean;
  }>({});

  // No celular traz tudo de uma vez; no desktop, paginado (scroll infinito).
  const loadPosts = useCallback(
    async (cat: string) => {
      const id = ++requestId.current;
      setLoading(true);
      setLoadingMore(false);
      try {
        const data = await fetchPublications(
          cat,
          isMobile ? undefined : { from: 0, to: PAGE_SIZE - 1 },
        );
        if (id !== requestId.current) return;
        setPublications(data);
        setHasMore(!isMobile && data.length === PAGE_SIZE);
      } catch (err) {
        console.error("Erro ao carregar publicações do feed:", err);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [isMobile],
  );

  useEffect(() => {
    loadPosts(activeCategory);
  }, [activeCategory, loadPosts]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      // Posts criados/excluídos aqui deslocam o servidor na mesma medida,
      // então o tamanho da lista local é o offset certo.
      const from = publications.length;
      const data = await fetchPublications(activeCategory, {
        from,
        to: from + PAGE_SIZE - 1,
      });
      if (id !== requestId.current) return;
      setPublications((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...data.filter((p) => !seen.has(p.id))];
      });
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error("Erro ao carregar mais publicações:", err);
      setHasMore(false);
    } finally {
      if (id === requestId.current) setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, publications.length, activeCategory]);

  // Open modal if URL has ?action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsModalOpen(true);
      // Clean query parameter from URL so it doesn't re-trigger on refresh
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Trigger modal handler
  const handleOpenModal = (triggerType?: "photo" | "article" | "general") => {
    setDefaultFocusPhoto(triggerType === "photo");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDefaultFocusPhoto(false);
  };

  const handlePostCreated = (newPost: Publication) => {
    setPublications((prev) => [newPost, ...prev]);
  };

  const handleDeletePublication = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Deseja realmente excluir esta publicação?")) return;
    try {
      await deletePublication(id);
      setPublications((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Erro ao excluir publicação:", err);
      toast.error("Não foi possível excluir a publicação.");
    }
  };

  // Comments handlers
  const handleToggleComments = async (publicationId: string) => {
    const isCurrentlyOpen = !!expandedComments[publicationId];

    setExpandedComments((prev) => ({
      ...prev,
      [publicationId]: !isCurrentlyOpen,
    }));

    // If opening and not loaded yet, fetch from supabase
    if (!isCurrentlyOpen && !commentsMap[publicationId]) {
      setLoadingComments((prev) => ({ ...prev, [publicationId]: true }));
      try {
        const comments = await fetchComments(publicationId);
        setCommentsMap((prev) => ({ ...prev, [publicationId]: comments }));
      } catch (err) {
        console.error("Erro ao carregar comentários:", err);
      } finally {
        setLoadingComments((prev) => ({ ...prev, [publicationId]: false }));
      }
    }
  };

  const handleAddComment = async (publicationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const newComment = await addComment({
        publicationId,
        userId: user.id,
        content: content.trim(),
      });

      setCommentsMap((prev) => ({
        ...prev,
        [publicationId]: [...(prev[publicationId] || []), newComment],
      }));

      setPublications((prev) =>
        prev.map((pub) =>
          pub.id === publicationId
            ? { ...pub, comments_count: (pub.comments_count || 0) + 1 }
            : pub,
        ),
      );
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
      throw err;
    }
  };

  const handleDeleteComment = async (
    publicationId: string,
    commentId: string,
  ) => {
    try {
      await deleteComment(commentId);
      setCommentsMap((prev) => ({
        ...prev,
        [publicationId]: (prev[publicationId] || []).filter(
          (c) => c.id !== commentId,
        ),
      }));

      setPublications((prev) =>
        prev.map((pub) =>
          pub.id === publicationId
            ? {
                ...pub,
                comments_count: Math.max(0, (pub.comments_count || 1) - 1),
              }
            : pub,
        ),
      );
    } catch (err) {
      console.error("Erro ao excluir comentário:", err);
    }
  };

  const userDisplayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Você";

  const userAvatarUrl = user?.user_metadata?.avatar_url;

  if (isMobile) {
    return (
      <>
        <FeedMobile
          publications={publications}
          loading={loading}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onOpenModal={() => handleOpenModal("general")}
          userName={userDisplayName}
          userAvatarUrl={userAvatarUrl}
          commentsMap={commentsMap}
          loadingComments={loadingComments}
          expandedComments={expandedComments}
          onToggleComments={handleToggleComments}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onDeletePublication={handleDeletePublication}
        />
        <CreatePostModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onPostCreated={handlePostCreated}
          defaultFocusPhoto={defaultFocusPhoto}
        />
      </>
    );
  }

  return (
    <>
      <FeedDesktop
        publications={publications}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onOpenModal={() => handleOpenModal("general")}
        userName={userDisplayName}
        jobs={recentJobs}
        commentsMap={commentsMap}
        loadingComments={loadingComments}
        expandedComments={expandedComments}
        onToggleComments={handleToggleComments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onDeletePublication={handleDeletePublication}
      />
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPostCreated={handlePostCreated}
        defaultFocusPhoto={defaultFocusPhoto}
      />
    </>
  );
}
