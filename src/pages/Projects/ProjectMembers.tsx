import React, { useEffect, useState } from "react";
import { Trash, UserPlus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/icon";
import {
  addMemberByUsername,
  fetchMembers,
  MemberError,
  removeMember,
  ROLE_LABELS,
  updateMemberRole,
  type ProjectMember,
  type ProjectRole,
} from "../../services/projects";

type AssignableRole = Exclude<ProjectRole, "owner">;
const ASSIGNABLE: AssignableRole[] = ["admin", "member", "viewer"];

interface Props {
  projectId: string;
  ownerId: string;
  currentUserId: string;
}

export function ProjectMembers({ projectId, ownerId, currentUserId }: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<AssignableRole>("member");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchMembers(projectId)
      .then(setMembers)
      .catch(() => toast.error("Não foi possível carregar os participantes."))
      .finally(() => setLoading(false));
  }, [projectId]);

  const me = members.find((m) => m.user_id === currentUserId);
  const canManage =
    currentUserId === ownerId || me?.role === "owner" || me?.role === "admin";

  async function reload() {
    setMembers(await fetchMembers(projectId));
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setInviting(true);
    try {
      await addMemberByUsername({ projectId, username, role });
      setUsername("");
      await reload();
      toast.success("Participante adicionado!");
    } catch (err) {
      toast.error(
        err instanceof MemberError
          ? err.message
          : "Não foi possível adicionar o participante.",
      );
    } finally {
      setInviting(false);
    }
  }

  async function handleRole(member: ProjectMember, next: AssignableRole) {
    try {
      await updateMemberRole(member.id, next);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: next } : m)),
      );
    } catch {
      toast.error("Não foi possível alterar a função.");
    }
  }

  async function handleRemove(member: ProjectMember) {
    const name = member.profile?.username ?? "este participante";
    if (!window.confirm(`Remover @${name} do projeto?`)) return;
    try {
      await removeMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch {
      toast.error("Não foi possível remover o participante.");
    }
  }

  return (
    <section className="members-panel" aria-label="Participantes">
      <h2 className="members-title">Participantes ({members.length})</h2>

      {loading ? (
        <p className="projects-muted">Carregando…</p>
      ) : (
        <ul className="members-list">
          {members.map((member) => {
            const isOwner = member.role === "owner";
            const label =
              member.profile?.full_name ||
              member.profile?.username ||
              "Usuário";
            return (
              <li key={member.id} className="member-row">
                <span className="member-avatar" aria-hidden="true">
                  {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt="" />
                  ) : (
                    label.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="member-info">
                  <strong>{label}</strong>
                  {member.profile?.username && (
                    <small>@{member.profile.username}</small>
                  )}
                </span>
                {canManage && !isOwner ? (
                  <>
                    <select
                      aria-label={`Função de ${label}`}
                      value={member.role}
                      onChange={(e) =>
                        handleRole(member, e.target.value as AssignableRole)
                      }
                    >
                      {ASSIGNABLE.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="task-delete"
                      aria-label={`Remover ${label}`}
                      onClick={() => handleRemove(member)}
                    >
                      <Icon icon={Trash} size="sm" />
                    </button>
                  </>
                ) : (
                  <span className="member-role">
                    {ROLE_LABELS[member.role]}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canManage && (
        <form className="members-invite" onSubmit={handleInvite}>
          <input
            value={username}
            maxLength={40}
            placeholder="@username"
            aria-label="Username de quem será convidado"
            onChange={(e) => setUsername(e.target.value)}
          />
          <select
            aria-label="Função"
            value={role}
            onChange={(e) => setRole(e.target.value as AssignableRole)}
          >
            {ASSIGNABLE.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            size="sm"
            isLoading={inviting}
            disabled={!username.trim()}
          >
            <Icon icon={UserPlus} size="sm" />
            Convidar
          </Button>
        </form>
      )}
    </section>
  );
}
