import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import {
  Sparkle,
  ChatCircle,
  Compass,
  Code,
  Question,
} from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchPublications,
  deletePublication,
  fetchComments,
  addComment,
  deleteComment,
} from "../../services/publications";
import { Publication, PublicationComment } from "./types";
import {
  FeedProfileSidebar,
  CreatePostTrigger,
  CreatePostModal,
  PostCard,
  FeedRightSidebar,
} from "./components";
import "./Feed.css";

const CATEGORIES = [
  { id: "all", label: "Tudo", icon: Compass },
  { id: "discussao", label: "Discussão", icon: ChatCircle },
  { id: "projetos", label: "Projetos", icon: Code },
  { id: "duvidas", label: "Dúvidas", icon: Question },
];

export function Feed() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch publications
  const loadPosts = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const data = await fetchPublications(cat);
      setPublications(data);
    } catch (err) {
      console.error("Erro ao carregar publicações do feed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(activeCategory);
  }, [activeCategory, loadPosts]);

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
      alert("Não foi possível excluir a publicação.");
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

  // Count publications of logged in user
  const userPubsCount = user
    ? publications.filter((p) => p.user_id === user.id).length
    : 0;

  const userDisplayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Você";

  const userAvatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="feed-page-wrapper">
      <div className="feed-layout-container">
        {/* Left Column: User Profile Card */}
        <FeedProfileSidebar publicationsCount={userPubsCount} />

        {/* Center Column: Feed Stream */}
        <main className="feed-center-column">
          {/* Top Post Creator Trigger (Popup opener) */}
          <CreatePostTrigger
            onOpenModal={handleOpenModal}
            userAvatarUrl={userAvatarUrl}
            userName={userDisplayName}
          />

          {/* Feed Category Filter Chips */}
          <div className="feed-category-filter-row">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-chip ${isActive ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <Icon size="sm" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Posts Feed List */}
          {loading ? (
            <div className="feed-loading-state">
              <div className="spinner-feed" />
              <p>Carregando publicações da comunidade...</p>
            </div>
          ) : publications.length === 0 ? (
            <div className="feed-card feed-empty-state">
              <Icon
                icon={Sparkle}
                size="lg"
                weight="duotone"
                className="text-sun mb-3"
              />
              <h3>Nenhuma publicação encontrada</h3>
              <p>
                {activeCategory === "all"
                  ? "Seja o primeiro a compartilhar um projeto, dúvida ou novidade com a comunidade!"
                  : `Nenhuma publicação na categoria "${activeCategory}". Que tal criar uma?`}
              </p>
              <button
                type="button"
                className="feed-btn-primary mt-4"
                onClick={() => handleOpenModal("general")}
              >
                Começar publicação
              </button>
            </div>
          ) : (
            <div className="feed-posts-list">
              {publications.map((pub, index) => (
                <PostCard
                  key={pub.id}
                  publication={pub}
                  index={index}
                  comments={commentsMap[pub.id] || []}
                  loadingComments={!!loadingComments[pub.id]}
                  onDeletePublication={handleDeletePublication}
                  onToggleComments={handleToggleComments}
                  isCommentsOpen={!!expandedComments[pub.id]}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </main>

        {/* Right Column: Trending News & Topics */}
        <FeedRightSidebar />
      </div>

      {/* Floating Create Post Modal (Doesn't push page content down!) */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPostCreated={handlePostCreated}
        defaultFocusPhoto={defaultFocusPhoto}
      />
    </div>
  );
}
