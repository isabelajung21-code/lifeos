import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

function formatDate(value) {
  if (!value) return "";

  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "pt-BR"
  );
}

function priorityLabel(priority) {
  const labels = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };

  return labels[priority] || priority || "Média";
}

export default function ProjectTasksSection({
  project,
  userId,
  tasks,
  setTasks,
  milestones,
  updateProjectProgress,
  reloadData,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [form, setForm] = useState({
    title: "",
    due_date: "",
    priority: "media",
  });

  function openNew() {
    setEditingTask(null);

    setForm({
      title: "",
      due_date: "",
      priority: "media",
    });

    setFormOpen(true);
  }

  function openEdit(task) {
    setEditingTask(task);

    setForm({
      title: task.title || "",
      due_date: task.due_date || "",
      priority: task.priority || "media",
    });

    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingTask(null);

    setForm({
      title: "",
      due_date: "",
      priority: "media",
    });
  }

  async function save(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Informe o nome da tarefa.");
      return;
    }

    try {
      let savedTask;

      if (editingTask) {
        const { data, error } = await supabase
          .from("tasks")
          .update({
            title: form.title.trim(),
            due_date: form.due_date || null,
            priority: form.priority,
          })
          .eq("id", editingTask.id)
          .select()
          .single();

        if (error) throw error;

        savedTask = data;
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            owner_user_id: userId,
            title: form.title.trim(),
            due_date: form.due_date || null,
            priority: form.priority,
            status: "pendente",
            source_module: "projetos",
            source_id: project.id,
            category: "Projeto",
          })
          .select()
          .single();

        if (error) throw error;

        savedTask = data;
      }

      await supabase.from("activity_logs").insert({
        user_id: userId,
        module: "Projetos",
        action: editingTask ? "updated" : "created",
        entity_type: "task",
        entity_id: savedTask.id,
        entity_name: savedTask.title,
        details: {
          message: editingTask
            ? `Atualizou tarefa do projeto ${project.title}: ${savedTask.title}`
            : `Criou tarefa no projeto ${project.title}: ${savedTask.title}`,
        },
      });

      closeForm();

      await reloadData();
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      alert("Não foi possível salvar a tarefa.");
    }
  }

  async function toggle(task) {
    try {
      const newStatus =
        task.status === "concluida"
          ? "pendente"
          : "concluida";

      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
        })
        .eq("id", task.id)
        .select()
        .single();

      if (error) throw error;

      const nextTasks = tasks.map((item) =>
        item.id === task.id ? data : item
      );

      setTasks(nextTasks);

      await updateProjectProgress(
        nextTasks,
        milestones
      );
    } catch (error) {
      console.error("Erro ao alterar tarefa:", error);
    }
  }

  async function remove(task) {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
        })
        .eq("id", task.id);

      if (error) throw error;

      const nextTasks = tasks.filter(
        (item) => item.id !== task.id
      );

      setTasks(nextTasks);

      await updateProjectProgress(
        nextTasks,
        milestones
      );
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
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
            Tarefas
          </div>

          <div
            style={{
              color: COLORS.inkSoft,
              fontSize: 10,
              marginTop: 2,
            }}
          >
            {
              tasks.filter(
                (task) => task.status === "concluida"
              ).length
            }
            /{tasks.length} concluídas
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
            placeholder="Nome da tarefa"
            style={inputStyle}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 8,
            }}
          >
            <input
              type="date"
              value={form.due_date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  due_date: e.target.value,
                }))
              }
              style={inputStyle}
            />

            <select
              value={form.priority}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  priority: e.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

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
              {editingTask ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <EmptyState>
          Nenhuma tarefa cadastrada.
        </EmptyState>
      ) : (
        tasks.map((task) => {
          const completed =
            task.status === "concluida";

          return (
            <div
              key={task.id}
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
                  onClick={() => toggle(task)}
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
                    <Circle size={18} />
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
                    {task.title}
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 9,
                      color: COLORS.inkSoft,
                    }}
                  >
                    {priorityLabel(task.priority)}

                    {task.due_date &&
                      ` • ${formatDate(
                        task.due_date
                      )}`}
                  </div>
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
                  onClick={() => openEdit(task)}
                  style={actionButtonStyle}
                >
                  <Pencil size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => remove(task)}
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