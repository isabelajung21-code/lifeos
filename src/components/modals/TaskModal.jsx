import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  title: "",
  description: "",
  source_module: "geral",
  category: "",
  priority: "media",
  status: "pendente",
  due_date: "",
  due_time: "",
  is_recurring: false,
  recurrence_frequency: "semanal",
};

export default function TaskModal({
  open,
  onClose,
  currentUser,
  onSaved,
  taskToEdit = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");

    if (taskToEdit) {
      setForm({
        title: taskToEdit.title || "",
        description: taskToEdit.description || "",
        source_module: taskToEdit.source_module || "geral",
        category: taskToEdit.category || "",
        priority: taskToEdit.priority || "media",
        status: taskToEdit.status || "pendente",
        due_date: taskToEdit.due_date || "",
        due_time: taskToEdit.due_time || "",
        is_recurring: taskToEdit.is_recurring || false,
       recurrence_frequency: "semanal",
      });
    } else {
     setForm(initialForm);
    }
  }, [open, taskToEdit]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("Informe o título da tarefa.");
      return;
    }

    setSaving(true);
    setError("");

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("display_name", currentUser)
      .single();

    if (userError || !user) {
      console.error(userError);
      setError("Não foi possível identificar o usuário.");
      setSaving(false);
      return;
    }

    const taskPayload = {
      owner_user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      source_module: form.source_module,
      category: form.category.trim() || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      is_recurring: form.is_recurring,
    };

    let task;
    let taskError;

    if (taskToEdit) {
      const result = await supabase
        .from("tasks")
        .update(taskPayload)
        .eq("id", taskToEdit.id)
        .select()
        .single();

      task = result.data;
      taskError = result.error;
    } else {
      const result = await supabase
        .from("tasks")
        .insert(taskPayload)
        .select()
        .single();

      task = result.data;
      taskError = result.error;
    }

    if (taskError) {
      console.error(taskError);
      setError("Não foi possível salvar a tarefa.");
      setSaving(false);
      return;
    }

    if (form.is_recurring && !taskToEdit) {
      const { error: recurrenceError } = await supabase
        .from("task_recurrences")
        .insert({
          task_id: task.id,
          frequency: form.recurrence_frequency,
          interval_value: 1,
          start_date:
            form.due_date ||
            new Date().toISOString().slice(0, 10),
          next_run_date:
            form.due_date ||
            new Date().toISOString().slice(0, 10),
          is_active: true,
        });

      if (recurrenceError) {
        console.error(recurrenceError);
      }
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      module: form.source_module,
      action: taskToEdit ? "editou" : "criou",
      entity_type: "task",
      entity_id: task.id,
      entity_name: task.title,
      details: {
        priority: task.priority,
        due_date: task.due_date,
      },
    });

    setSaving(false);
    setForm(initialForm);

    if (onSaved) {
      await onSaved();
    }

    onClose();
  }

  const inputStyle = {
    width: "100%",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 9,
    padding: "10px 11px",
    background: COLORS.surface,
    color: COLORS.ink,
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    color: COLORS.inkSoft,
    fontSize: 12,
    fontWeight: 600,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(25, 38, 52, 0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 650,
          maxHeight: "90vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 20px 60px rgba(30, 50, 70, 0.16)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                color: COLORS.ink,
              }}
            >
              {taskToEdit ? "Editar tarefa" : "Nova tarefa"}
            </h2>

            <div
              style={{
                color: COLORS.inkSoft,
                fontSize: 12,
                marginTop: 3,
              }}
            >
              Adicione uma tarefa ao seu lifeOS.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              color: COLORS.inkSoft,
              padding: 5,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>Título *</label>

            <input
              autoFocus
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Ex.: Enviar relatório"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>Descrição</label>

            <textarea
              value={form.description}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              placeholder="Detalhes da tarefa..."
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          <div className="modal-form-grid">
            <div>
              <label style={labelStyle}>Área</label>

              <select
                value={form.source_module}
                onChange={(e) =>
                  updateField("source_module", e.target.value)
                }
                style={inputStyle}
              >
                <option value="geral">Geral</option>
                <option value="trabalho">Trabalho</option>
                <option value="projetos">Projetos</option>
                <option value="casa">Casa</option>
                <option value="conteudo">Conteúdo</option>
                <option value="estudos">Estudos</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Categoria</label>

              <input
                value={form.category}
                onChange={(e) =>
                  updateField("category", e.target.value)
                }
                placeholder="Ex.: Administrativo"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Prioridade</label>

              <select
                value={form.priority}
                onChange={(e) =>
                  updateField("priority", e.target.value)
                }
                style={inputStyle}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Status</label>

              <select
                value={form.status}
                onChange={(e) =>
                  updateField("status", e.target.value)
                }
                style={inputStyle}
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="aguardando">Aguardando</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Prazo</label>

              <input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  updateField("due_date", e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Horário</label>

              <input
                type="time"
                value={form.due_time}
                onChange={(e) =>
                  updateField("due_time", e.target.value)
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 17,
              padding: 14,
              borderRadius: 10,
              background: COLORS.bg,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                color: COLORS.ink,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={form.is_recurring}
                onChange={(e) =>
                  updateField("is_recurring", e.target.checked)
                }
              />

              Tarefa recorrente
            </label>

            {form.is_recurring && (
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Repetir</label>

                <select
                  value={form.recurrence_frequency}
                  onChange={(e) =>
                    updateField(
                      "recurrence_frequency",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="diaria">Diariamente</option>
                  <option value="semanal">Semanalmente</option>
                  <option value="quinzenal">Quinzenalmente</option>
                  <option value="mensal">Mensalmente</option>
                  <option value="anual">Anualmente</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: 15,
                padding: 11,
                borderRadius: 9,
                background: COLORS.dangerLight,
                color: COLORS.danger,
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 9,
              marginTop: 22,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                color: COLORS.ink,
                borderRadius: 9,
                padding: "10px 16px",
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                border: 0,
                background: COLORS.primaryDark,
                color: "#FFFFFF",
                borderRadius: 9,
                padding: "10px 18px",
                fontWeight: 700,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Salvando..." : "Salvar tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}