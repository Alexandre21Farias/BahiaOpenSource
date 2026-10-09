import React, { useState, useEffect, useRef } from "react";
import {} from "react-router-dom";
import { Icon } from "../../../components/ui/icon";
import {
  X,
  Image,
  VideoCamera,
  Code,
  Article,
  Globe,
  Smiley,
  TextAlignLeft,
  Tag,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  uploadPublicationImage,
  createPublication,
} from "../../../services/publications";
import { Publication } from "../types";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Publication) => void;
  defaultFocusPhoto?: boolean;
}

const CATEGORIES = [
  { id: "discussao", label: "Discussão" },
  { id: "projetos", label: "Projeto" },
  { id: "duvidas", label: "Dúvida" },
  { id: "artigo", label: "Artigo" },
  { id: "eventos", label: "Evento" },
];

export function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
  defaultFocusPhoto = false,
}: CreatePostModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("discussao");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Focus and scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (defaultFocusPhoto && fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    } else {
      document.body.style.overflow = "unset";
      // Reset state on close
      setTitle("");
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setErrorMsg(null);
      setPublishing(false);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, defaultFocusPhoto]);

  // Handle image selection & preview URL
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !publishing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, publishing, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("Você precisa estar autenticado para publicar.");
      return;
    }

    if (!title.trim() && !content.trim()) {
      setErrorMsg("Por favor, preencha o conteúdo da publicação.");
      return;
    }

    setPublishing(true);
    setErrorMsg(null);

    try {
      let imageUrl: string | undefined = undefined;
      if (imageFile) {
        imageUrl = await uploadPublicationImage(user.id, imageFile);
      }

      // If title is blank, generate a concise title from the first line or content
      const finalTitle = title.trim() || content.trim().slice(0, 70);

      const created = await createPublication({
        userId: user.id,
        title: finalTitle,
        content: content.trim() || finalTitle,
        category: category,
        imageUrl: imageUrl,
      });

      onPostCreated(created);
      onClose();
    } catch (err: any) {
      console.error("Erro ao publicar:", err);
      setErrorMsg("Falha ao criar publicação. Tente novamente.");
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Alexandre Farias";

  const userAvatar =
    user?.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=eebb48&color=3f1d12`;

  return (
    <div
      className="feed-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !publishing) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="feed-modal-window">
        {/* Header */}
        <div className="feed-modal-header">
          <div className="modal-header-user">
            <img
              src={userAvatar}
              alt={userDisplayName}
              className="modal-user-avatar"
            />
            <div className="modal-user-meta">
              <span className="modal-user-name">{userDisplayName}</span>
              <div className="modal-badges-row">
                <span className="modal-pill-badge">
                  <Icon icon={Globe} size={12} />
                  <span>Publicar para qualquer pessoa</span>
                </span>

                <select
                  className="modal-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={publishing}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={publishing}
            aria-label="Fechar"
          >
            <Icon icon={X} size="md" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="feed-modal-form">
          {errorMsg && (
            <div className="feed-modal-error">
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="modal-inputs-area">
            <input
              type="text"
              className="modal-title-input"
              placeholder="Título da publicação (opcional ou tema principal)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={publishing}
            />

            <textarea
              ref={textareaRef}
              className="modal-content-textarea"
              placeholder="No que você está pensando? Compartilhe uma ideia, dúvida ou projeto com a comunidade..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={publishing}
            />

            {/* Image Preview if selected */}
            {imagePreview && (
              <div className="modal-image-preview-container">
                <img
                  src={imagePreview}
                  alt="Pré-visualização do anexo"
                  className="modal-image-preview"
                />
                <button
                  type="button"
                  className="modal-image-remove-btn"
                  onClick={handleRemoveImage}
                  title="Remover imagem"
                  disabled={publishing}
                >
                  <Icon icon={X} size="sm" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Toolbar */}
          <div className="feed-modal-footer">
            <div className="modal-toolbar-actions">
              <label
                className={`modal-tool-btn ${imageFile ? "active" : ""}`}
                title="Anexar foto ou imagem"
              >
                <Icon icon={Image} size="md" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                  disabled={publishing}
                />
              </label>

              <button
                type="button"
                className="modal-tool-btn"
                title="Adicionar tag"
                onClick={() => {
                  if (!content.includes("#bahia")) {
                    setContent((prev) =>
                      prev
                        ? `${prev} #bahia #opensource`
                        : "#bahia #opensource",
                    );
                  }
                }}
              >
                <Icon icon={Tag} size="md" />
              </button>

              <button
                type="button"
                className="modal-tool-btn"
                title="Inserir emoji"
                onClick={() => {
                  setContent((prev) => `${prev} 🚀`);
                }}
              >
                <Icon icon={Smiley} size="md" />
              </button>
            </div>

            <div className="modal-footer-buttons">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClose}
                disabled={publishing}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={publishing || (!title.trim() && !content.trim())}
              >
                {publishing ? (
                  <>
                    <span className="spinner-sm" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Icon icon={PaperPlaneRight} size="sm" />
                    <span>Publicar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
