import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CaretRight, Plus } from "@phosphor-icons/react";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import type { Project } from "../../services/projects";

interface Props {
  projects: Project[];
  loading: boolean;
  creating: boolean;
  onCreate: (name: string, description: string) => Promise<boolean>;
}

export function ProjectsMobile({
  projects,
  loading,
  creating,
  onCreate,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (await onCreate(name, description)) {
      setName("");
      setDescription("");
      setShowForm(false);
    }
  }

  return (
    <div className="min-h-dvh bg-cream">
      <MobileHeader
        title="Projetos"
        subtitle="Organize tarefas e acompanhe o andamento com a comunidade."
        action={
          <button
            type="button"
            aria-label="Novo projeto"
            aria-expanded={showForm}
            onClick={() => setShowForm((v) => !v)}
            className="flex size-12 shrink-0 items-center justify-center rounded-full border-0 bg-sun p-0 text-brown"
          >
            <Plus size={24} weight="bold" aria-hidden />
          </button>
        }
      />

      <div className="px-5 pt-5 pb-4">
        {showForm && (
          <form
            onSubmit={submit}
            className="mb-5 flex flex-col gap-3 rounded-[1.25rem] border-2 border-brown bg-surface p-4"
          >
            <input
              autoFocus
              value={name}
              maxLength={80}
              placeholder="Nome do projeto"
              aria-label="Nome do projeto"
              onChange={(e) => setName(e.target.value)}
              className="rounded-full"
            />
            <textarea
              value={description}
              maxLength={500}
              rows={3}
              placeholder="Descrição (opcional)"
              aria-label="Descrição"
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-2xl"
            />
            <button
              type="submit"
              disabled={!name.trim() || creating}
              className="min-h-12 rounded-full border-0 bg-brown font-bold text-cream disabled:opacity-50"
            >
              {creating ? "Criando…" : "Criar projeto"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="py-10 text-center text-mocha">Carregando projetos…</p>
        ) : projects.length === 0 ? (
          <p className="py-10 text-center text-mocha">
            Você ainda não participa de nenhum projeto.
          </p>
        ) : (
          <ul className="flex flex-col gap-5 pl-0">
            {projects.map((p) => (
              <li key={p.id} className="list-none">
                <HardShadowCard
                  as={Link}
                  to={`/projects/${p.id}`}
                  className="flex items-center gap-3 no-underline! hover:text-brown!"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.1rem] font-extrabold text-brown">
                      {p.name}
                    </span>
                    {p.description && (
                      <span className="mt-1 line-clamp-2 block text-sm text-mocha">
                        {p.description}
                      </span>
                    )}
                    <span className="mt-2 block text-xs text-mocha">
                      Criado em{" "}
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </span>
                  <CaretRight size={20} className="text-brown" aria-hidden />
                </HardShadowCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
