import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Plus,
  MessageSquare,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Image as ImageIcon,
  Paperclip,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchPublications,
  createPublication,
  deletePublication,
  fetchComments,
  addComment,
  deleteComment,
  Publication,
  PublicationComment,
  uploadPublicationImage,
} from "../../services/publications";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import "./Feed.css";

export function Feed() {
  const { user } = useAuth();
  const location = useLocation();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("discussao");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expanded post for viewing details/comments
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<{
    [key: string]: PublicationComment[];
  }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {},
  );
  const [loadingComments, setLoadingComments] = useState<{
    [key: string]: boolean;
  }>({});
  const [submittingComment, setSubmittingComment] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    loadPublications();
    // Check if URL has ?action=new
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "new") {
      setShowCreateForm(true);
    }
  }, [location.search]);

  const loadPublications = async () => {
    setLoading(true);
    try {
      const data = await fetchPublications("all");
      setPublications(data);
    } catch (err) {
      console.error("Erro ao carregar fórum:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMsg("Preencha o título e o conteúdo da publicação.");
      return;
    }

    setPublishing(true);
    setErrorMsg(null);

    try {
      let imageUrl = undefined;
      if (imageFile) {
        imageUrl = await uploadPublicationImage(user.id, imageFile);
      }

      const created = await createPublication({
        userId: user.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        imageUrl: imageUrl,
      });

      setPublications((prev) => [created, ...prev]);
      setNewTitle("");
      setNewContent("");
      setImageFile(null);
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("Erro ao publicar:", err);
      setErrorMsg("Falha ao criar publicação. Tente novamente.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeletePublication = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Deseja realmente excluir esta publicação?")) return;
    try {
      await deletePublication(id);
      setPublications((prev) => prev.filter((p) => p.id !== id));
      if (expandedPostId === id) setExpandedPostId(null);
    } catch (err) {
      console.error("Erro ao excluir publicação:", err);
      alert("Não foi possível excluir a publicação.");
    }
  };

  const togglePostDetails = async (publicationId: string) => {
    if (expandedPostId === publicationId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(publicationId);

    if (!commentsMap[publicationId]) {
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

  const handleAddComment = async (publicationId: string) => {
    const content = commentInputs[publicationId];
    if (!user || !content || !content.trim()) return;

    setSubmittingComment((prev) => ({ ...prev, [publicationId]: true }));
    try {
      const newComm = await addComment({
        publicationId,
        userId: user.id,
        content: content.trim(),
      });

      setCommentsMap((prev) => ({
        ...prev,
        [publicationId]: [...(prev[publicationId] || []), newComm],
      }));

      setPublications((prev) =>
        prev.map((pub) =>
          pub.id === publicationId
            ? { ...pub, comments_count: (pub.comments_count || 0) + 1 }
            : pub,
        ),
      );

      setCommentInputs((prev) => ({ ...prev, [publicationId]: "" }));
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
      alert("Erro ao adicionar comentário.");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [publicationId]: false }));
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

  // Helper for relative time text like "ativo há 2 horas"
  const getRelativeTimeText = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffInMs = Math.abs(now.getTime() - past.getTime());
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) return `ativo há ${diffInMinutes || 1} min`;
    if (diffInHours < 24)
      return `ativo há ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`;
    return `ativo há ${diffInDays} ${diffInDays === 1 ? "dia" : "dias"}`;
  };

  return (
    <div className="forum-container">
      {/* Header Fórum + Criar publicação (curso.dev style) */}
      <div className="forum-header-row">
        <h1 className="forum-title-heading">Fórum</h1>
        {user && (
          <button
            className="btn-create-post"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus size={18} />
            <span>Criar publicação</span>
          </button>
        )}
      </div>

      {/* Creation Form Box */}
      {showCreateForm && (
        <div
          className="glass reveal"
          style={{
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid var(--border-glow)",
          }}
        >
          <h2
            style={{
              fontSize: "1.2rem",
              marginTop: 0,
              marginBottom: "1rem",
              color: "var(--text-bright)",
            }}
          >
            Nova publicação no Fórum
          </h2>

          {errorMsg && (
            <div
              style={{
                color: "var(--red-star)",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreatePublication}>
            <div style={{ marginBottom: "1rem" }}>
              <Input
                label="Título"
                placeholder="Ex: A partir de agora, você pode compartilhar projetos na comunidade..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={publishing}
              />
            </div>

            <div style={{ marginBottom: "1.2rem" }}>
              <label
                className="input-label"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.82rem",
                  color: "var(--text-mid)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-display)",
                }}
              >
                Conteúdo
              </label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Escreva detalhes da sua dúvida, ideia ou projeto..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                disabled={publishing}
                style={{ resize: "vertical", marginBottom: "0.5rem" }}
              />

              {/* Image Upload Input */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginTop: "0.5rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    color: "var(--supernova-cyan)",
                    fontSize: "0.9rem",
                  }}
                >
                  <ImageIcon size={18} />
                  <span>Anexar Imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                    disabled={publishing}
                  />
                </label>
                {imageFile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                      color: "var(--text-bright)",
                    }}
                  >
                    <Paperclip size={14} />
                    <span>{imageFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--red-star)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
                disabled={publishing}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={publishing}>
                <Send size={16} style={{ marginRight: "0.4rem" }} />
                Publicar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Numbered Forum List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div className="spinner"></div>
        </div>
      ) : publications.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-mid)",
          }}
        >
          Nenhuma publicação encontrada no fórum ainda.
        </div>
      ) : (
        <div className="forum-list">
          {publications.map((pub, index) => {
            const isExpanded = expandedPostId === pub.id;
            const authorName =
              pub.profiles?.username ||
              pub.profiles?.full_name?.split(" ")[0] ||
              "membro";
            const coinsCount = (index + 1) * 3 + (pub.comments_count || 0) * 2;
            const commentsCount = pub.comments_count || 0;
            const relativeTime = getRelativeTimeText(pub.created_at);
            const isOwner = user && user.id === pub.user_id;

            return (
              <div
                key={pub.id}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div className="forum-item">
                  <span className="forum-number">{index + 1}.</span>
                  <div className="forum-item-content">
                    <span
                      className="forum-item-title"
                      onClick={() => togglePostDetails(pub.id)}
                    >
                      {pub.title}
                    </span>

                    {/* Metadata line: 8 coins · 5 comentários · autor · ativo há 2 horas */}
                    <div className="forum-item-meta">
                      <span>{coinsCount} coins</span>
                      <span className="forum-meta-dot">·</span>
                      <span>
                        {commentsCount}{" "}
                        {commentsCount === 1 ? "comentário" : "comentários"}
                      </span>
                      <span className="forum-meta-dot">·</span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <img
                          src={
                            pub.profiles?.avatar_url ||
                            `https://ui-avatars.com/api/?name=${authorName}&background=random`
                          }
                          alt={authorName}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                        <Link
                          to={
                            pub.profiles?.username
                              ? `/${pub.profiles.username}`
                              : "#"
                          }
                          style={{
                            color: "var(--supernova-cyan)",
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          {authorName}
                        </Link>
                      </div>
                      <span className="forum-meta-dot">·</span>
                      <span>{relativeTime}</span>

                      {isOwner && (
                        <>
                          <span className="forum-meta-dot">·</span>
                          <button
                            onClick={(e) => handleDeletePublication(pub.id, e)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--red-star)",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              padding: 0,
                            }}
                            title="Deletar postagem"
                          >
                            excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details & Comments */}
                {isExpanded && (
                  <div
                    className="glass"
                    style={{
                      marginLeft: "2.4rem",
                      marginBottom: "1rem",
                      padding: "1.2rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-glow)",
                    }}
                  >
                    <p
                      style={{
                        color: "var(--text-bright)",
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap",
                        marginBottom: "1.2rem",
                        fontSize: "0.95rem",
                      }}
                    >
                      {pub.content}
                    </p>

                    {pub.image_url && (
                      <div style={{ marginBottom: "1.2rem" }}>
                        <img
                          src={pub.image_url}
                          alt="Anexo da publicação"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "400px",
                            borderRadius: "var(--radius-md)",
                            objectFit: "contain",
                            border: "1px solid var(--border-subtle)",
                          }}
                        />
                      </div>
                    )}

                    {/* Comments section */}
                    <div
                      style={{
                        borderTop: "1px solid var(--border-subtle)",
                        paddingTop: "1rem",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-mid)",
                          marginBottom: "0.8rem",
                          textTransform: "uppercase",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        Comentários ({commentsCount})
                      </h4>

                      {loadingComments[pub.id] ? (
                        <div style={{ padding: "0.5rem 0" }}>
                          <div
                            className="spinner"
                            style={{ width: "20px", height: "20px" }}
                          ></div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.6rem",
                            marginBottom: "1rem",
                          }}
                        >
                          {(commentsMap[pub.id] || []).length === 0 ? (
                            <p
                              style={{
                                color: "var(--text-mid)",
                                fontSize: "0.85rem",
                                fontStyle: "italic",
                              }}
                            >
                              Nenhum comentário ainda. Seja o primeiro a
                              responder!
                            </p>
                          ) : (
                            commentsMap[pub.id].map((comm) => {
                              const isCommOwner =
                                user && user.id === comm.user_id;
                              const commAuthor =
                                comm.profiles?.username ||
                                comm.profiles?.full_name ||
                                "membro";

                              return (
                                <div
                                  key={comm.id}
                                  style={{
                                    background: "rgba(0, 0, 0, 0.2)",
                                    padding: "0.6rem 0.8rem",
                                    borderRadius: "6px",
                                    border: "1px solid var(--border-subtle)",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: "0.3rem",
                                      fontSize: "0.82rem",
                                    }}
                                  >
                                    <Link
                                      to={
                                        comm.profiles?.username
                                          ? `/${comm.profiles.username}`
                                          : "#"
                                      }
                                      style={{
                                        color: "var(--cyan)",
                                        fontWeight: 600,
                                        textDecoration: "none",
                                      }}
                                    >
                                      {commAuthor}
                                    </Link>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      <span>
                                        {getRelativeTimeText(comm.created_at)}
                                      </span>
                                      {isCommOwner && (
                                        <button
                                          onClick={() =>
                                            handleDeleteComment(pub.id, comm.id)
                                          }
                                          style={{
                                            background: "none",
                                            border: "none",
                                            color: "var(--red-star)",
                                            cursor: "pointer",
                                            padding: 0,
                                          }}
                                          title="Deletar comentário"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "0.9rem",
                                      color: "var(--text-bright)",
                                    }}
                                  >
                                    {comm.content}
                                  </p>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Add comment input */}
                      {user && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Escreva sua resposta..."
                            value={commentInputs[pub.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [pub.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddComment(pub.id);
                            }}
                            style={{ height: "38px", fontSize: "0.85rem" }}
                          />
                          <Button
                            onClick={() => handleAddComment(pub.id)}
                            isLoading={submittingComment[pub.id]}
                            style={{
                              height: "38px",
                              padding: "0 0.9rem",
                              fontSize: "0.85rem",
                            }}
                          >
                            <Send size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
