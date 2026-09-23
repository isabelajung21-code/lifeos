import { useState } from "react";
import {
  CheckCircle2,
  Flag,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

function formatDate(value) {
  if (!value) return "Sem prazo";

  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "pt-BR"
  );
}

export default function ProjectMilestonesSection({
  project,
  userId,
  tasks,
  milestones,
  setMilestones,
  updateProjectProgress,
  reloadData,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  function openNew() {
    setEditingMilestone(null);

    setForm({
      title: "",
      description: "",
      due_date: "",
    });

    setFormOpen(true);
  }

  function openEdit(milestone) {
    setEditingMilestone(milestone);

    setForm({
      title: milestone.title || "",
      description: milestone.description || "",
      due_date: milestone.due_date || "",
    });

    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingMilestone(null);

    setForm({
      title: "",
      description: "",
      due_date: "",
    });
  }

  async function save(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Informe o nome do marco.");
      return;
    }

    try {
      let savedMilestone;

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date || null,
        updated_at: new Date().toISOString(),
      };

      if (editingMilestone) {
        const { data, error } = await supabase
          .from("project_milestones")
          .update(payload)
          .eq("id", editingMilestone.id)
          .select()
          .single();

        if (error) throw error;

        savedMilestone = data;
      } else {
        const { data, error } = await supabase
          .from("project_milestones")
          .insert({
            project_id: project.id,
            ...payload,
            status: "pendente",
          })
          .select()
          .single();

        if (error) throw error;

        savedMilestone = data;
      }

      await supabase.from("activity_logs").insert({
        user_id: userId,
        module: "Projetos",
        action: editingMilestone ? "updated" : "created",
        entity_type: "project_milestone",
        entity_id: savedMilestone.id,
        entity_name: savedMilestone.title,
        details: {
          message: editingMilestone
            ? `Atualizou marco do projeto ${project.title}: ${savedMilestone.title}`
            : `Criou marco no projeto ${project.title}: ${savedMilestone.title}`,
        },
      });

      closeForm();
      await reloadData();
    } catch (error) {
      console.error("Erro ao salvar marco:", error);
      alert("Não foi possível salvar o marco.");
    }
  }

  async function toggle(milestone) {
    try {
      const completed =
        milestone.status !== "concluido";

      const { data, error } = await supabase
        .from("project_milestones")
        .update({
          status: completed
            ? "concluido"
            : "pendente",
          completed_at: completed
            ? new Date().toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", milestone.id)
        .select()
        .single();

      if (error) throw error;

      const nextMilestones = milestones.map((item) =>
        item.id === milestone.id ? data : item
      );

      setMilestones(nextMilestones);

      await updateProjectProgress(
        tasks,
        nextMilestones
      );
    } catch (error) {
      console.error("Erro ao alterar marco:", error);
    }
  }

  async function remove(milestone) {
    try {
      const { error } = await supabase
        .from("project_milestones")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
        })
        .eq("id", milestone.id);

      if (error) throw error;

      const nextMilestones = milestones.filter(
        (item) => item.id !== milestone.id
      );

      setMilestones(nextMilestones);

      await updateProjectProgress(
        tasks,
        nextMilestones
      );
    } catch (error) {
      console.error("Erro ao excluir marco:", error);
    }
  }

  return (
    <section style={sectionStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              color: COLORS.ink,
              fontSize: 15,
            }}
          >
            Marcos
          </div>

          <div
            style={{
              color: COLORS.inkSoft,
              fontSize: 10,
              marginTop: 2,
            }}
          >
            {
              milestones.filter(
                (item) =>
                  item.status === "concluido"
              ).length
            }
            /{milestones.length} concluídos
          </div>
        </div>

        <button
          type="button"
          onClick={openNew}
          style={{
            ...actionButtonStyle,
            background: COLORS.primaryLight,
            color: COLORS.primaryDark,
          }}
        >
          <Plus size={16} />
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={save}
          style={{
            padding: 12,
            borderRadius: 10,
            background: COLORS.bg,
            marginBottom: 12,
          }}
        >
          <input
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder="Nome do marco"
            style={inputStyle}
          />

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Descrição"
            rows={2}
            style={{
              ...inputStyle,
              marginTop: 8,
              resize: "vertical",
            }}
          />

          <input
            type="date"
            value={form.due_date}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                due_date: e.target.value,
              }))
            }
            style={{
              ...inputStyle,
              marginTop: 8,
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 7,
              marginTop: 9,
            }}
          >
            <button
              type="button"
              onClick={closeForm}
              style={secondaryButtonStyle}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={primaryButtonStyle}
            >
              {editingMilestone
                ? "Salvar"
                : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      {milestones.length === 0 ? (
        <EmptyState>
          Nenhum marco cadastrado.
        </EmptyState>
      ) : (
        milestones.map((milestone) => {
          const completed =
            milestone.status === "concluido";

          return (
            <div
              key={milestone.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 9,
                  minWidth: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(milestone)}
                  style={{
                    border: 0,
                    background: "transparent",
                    padding: 0,
                    marginTop: 1,
                    cursor: "pointer",
                    color: completed
                      ? COLORS.primary
                      : COLORS.inkSoft,
                  }}
                >
                  {completed ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Flag size={18} />
                  )}
                </button>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: completed
                        ? COLORS.inkSoft
                        : COLORS.ink,
                      textDecoration: completed
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {milestone.title}
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 9,
                      color: COLORS.inkSoft,
                    }}
                  >
                    {formatDate(
                      milestone.due_date
                    )}
                  </div>

                  {milestone.description && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 10,
                        color: COLORS.inkSoft,
                        lineHeight: 1.4,
                      }}
                    >
                      {milestone.description}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    openEdit(milestone)
                  }
                  style={actionButtonStyle}
                >
                  <Pencil size={13} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    remove(milestone)
                  }
                  style={{
                    ...actionButtonStyle,
                    color: COLORS.danger,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div
      style={{
        padding: "18px 4px",
        textAlign: "center",
        color: COLORS.inkSoft,
        fontSize: 11,
      }}
    >
      {children}
    </div>
  );
}

const sectionStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: 16,
};

const actionButtonStyle = {
  width: 30,
  height: 30,
  display: "grid",
  placeItems: "center",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: COLORS.surface,
  color: COLORS.inkSoft,
  cursor: "pointer",
  padding: 0,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 9px",
  background: COLORS.surface,
  color: COLORS.ink,
  fontSize: 11,
  outline: "none",
};

const primaryButtonStyle = {
  border: 0,
  borderRadius: 8,
  padding: "7px 11px",
  background: COLORS.primary,
  color: "#fff",
  fontSize: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "7px 11px",
  background: COLORS.surface,
  color: COLORS.inkSoft,
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
};