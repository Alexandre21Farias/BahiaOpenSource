import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "@phosphor-icons/react";
import { HardShadowCard } from "../../components/shared/HardShadowCard";
import { StickerBadge } from "../../components/shared/StickerBadge";
import { fetchOpenTaskCounts, type Project } from "../../services/projects";

interface Props {
  projects: Project[];
  loading: boolean;
  creating: boolean;
  onCreate: (name: string, description: string) => Promise<boolean>;
}

const FIELD =
  "w-full rounded-xl border border-border-strong bg-cream px-4 py-3 text-brown focus:shadow-none";

/** Lista de projetos no desktop: cards com tarefas abertas e criação rápida. */
export function ProjectsDesktop({
  projects,
  loading,
  creating,
  onCreate,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openTasks, setOpenTasks] = useState<Map<string, number>>(new Map());

  // "+ Criar projeto" do Início chega como ?action=new.
  useEffect(() => {
    if (searchParams.get("action") !== "new") return;
    setShowForm(true);
    searchParams.delete("action");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let active = true;
    fetchOpenTaskCounts(projects.map((p) => p.id))
      .then((counts) => active && setOpenTasks(counts))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [projects]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (await onCreate(name, description)) {
      setName("");
      setDescription("");
      setShowForm(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <section className="bg-brown pb-10 text-cream">
        <div className="mx-auto flex max-w-[1290px] flex-wrap items-end justify-between gap-6 px-6 pt-8">
          <div>
            <h1 className="font-display text-[3.2rem] leading-none text-cream [text-shadow:3px_3px_0_var(--sun)]">
              Projetos
            </h1>
            <p className="mt-3 text-[1.05rem] text-cream/90">
              Organize tarefas e acompanhe o andamento com a comunidade.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-full border-0 bg-sun px-6 py-3 font-bold text-brown"
          >
            <Plus size={18} weight="bold" aria-hidden />
            Novo projeto
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-[1290px] space-y-8 px-6 py-8">
        {showForm && (
          <HardShadowCard
            as="form"
            onSubmit={submit}
            className="max-w-[640px] space-y-4 p-6"
          >
            <h2 className="font-display text-[1.5rem] text-brown">
              Novo projeto
            </h2>
            <label className="block text-sm font-bold text-brown">
              Nome do projeto
              <input
                autoFocus
                required
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                className={`${FIELD} mt-1`}
              />
            </label>
            <label className="block text-sm font-bold text-brown">
              Descrição (opcional)
              <textarea
                value={description}
                maxLength={500}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
                className={`${FIELD} mt-1`}
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border-[1.5px] border-brown bg-surface px-6 py-2.5 font-bold text-brown"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim() || creating}
                className="rounded-full border-0 bg-sun px-6 py-2.5 font-bold text-brown disabled:opacity-50"
              >
                {creating ? "Criando…" : "Criar projeto"}
              </button>
            </div>
          </HardShadowCard>
        )}

        {loading ? (
          <p className="text-text-mid">Carregando projetos…</p>
        ) : projects.length === 0 ? (
          <HardShadowCard className="p-10 text-center">
            <p className="text-text-mid">
              Você ainda não participa de nenhum projeto.
            </p>
          </HardShadowCard>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-6 pl-0 min-[800px]:grid-cols-2 min-[1150px]:grid-cols-3">
            {projects.map((project) => {
              const open = openTasks.get(project.id) ?? 0;
              return (
                <li key={project.id}>
                  <HardShadowCard
                    as={Link}
                    to={`/projects/${project.id}`}
                    className="h-full p-6"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-[1.2rem] font-bold text-brown">
                        {project.name}
                      </span>
                      <StickerBadge tilt={3} className="shrink-0 text-xs">
                        {open} {open === 1 ? "aberta" : "abertas"}
                      </StickerBadge>
                    </span>
                    {project.description && (
                      <span className="mt-2 line-clamp-3 block text-text-mid">
                        {project.description}
                      </span>
                    )}
                    <span className="mt-4 block text-sm text-text-muted">
                      Criado em{" "}
                      {new Date(project.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </HardShadowCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
