import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";

const COLORS = {
  ink: "#1F2937",
  inkSoft: "#6B7280",
  primary: "#4F8EF7",
  primaryDark: "#2F6FDB",
  primaryLight: "#EAF2FF",
  border: "#DDE6F2",
  surface: "#FFFFFF",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
  background: "#fff",
  color: COLORS.ink,
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: COLORS.ink,
  marginBottom: 6,
};

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function HouseTaskModal({
  open,
  onClose,
  onSaved,
  user,
  task = null,
  users = [],
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");
  const [priority, setPriority] = useState("media");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState("semanal");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setResponsibleUserId(task.responsible_user_id || "");
      setPriority(task.priority || "media");
      setDueDate(task.due_date || "");
      setIsRecurring(Boolean(task.is_recurring));
      setRecurrenceFrequency(
        task.recurrence_frequency || "semanal"
      );
      setRecurrenceInterval(
        Number(task.recurrence_interval || 1)
      );
      setNotes(task.notes || "");
    } else {
      setTitle("");
      setDescription("");
      setResponsibleUserId("");
      setPriority("media");
      setDueDate("");
      setIsRecurring(false);
      setRecurrenceFrequency("semanal");
      setRecurrenceInterval(1);
      setNotes("");
    }
  }, [open, task]);

  if (!open) return null;

  async function handleSave() {
    if (!title.trim()) {
      alert("Informe o nome da tarefa.");
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      // -----------------------------
      // 1. Salvar tarefa universal
      // -----------------------------
      const taskPayload = {
        owner_user_id: responsibleUserId || null,
        title: title.trim(),
        description: description.trim() || null,
        source_module: "casa",
        category: "Tarefa doméstica",
        priority,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        notes: notes.trim() || null,
        updated_at: now,
      };

      let savedTask = null;

      if (task?.id) {
        const { data, error } = await supabase
          .from("tasks")
          .update(taskPayload)
          .eq("id", task.id)
          .select()
          .single();

        if (error) throw error;

        savedTask = data;
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            ...taskPayload,
            status: "pendente",
          })
          .select()
          .single();

        if (error) throw error;

        savedTask = data;
      }

      // -----------------------------
      // 2. Tratar recorrência
      // -----------------------------

      // Primeiro localizamos a recorrência
      // existente dessa tarefa, se houver.
      const {
        data: existingRecurrences,
        error: recurrenceLoadError,
      } = await supabase
        .from("task_recurrences")
        .select("*")
        .eq("task_id", savedTask.id);

      if (recurrenceLoadError) {
        throw recurrenceLoadError;
      }

      const existingRecurrence =
        existingRecurrences?.[0] || null;

      if (isRecurring) {
        let frequency = recurrenceFrequency;
        let intervalValue =
          Number(recurrenceInterval || 1);

        // Quinzenal no sistema universal =
        // semanal com intervalo de 2 semanas.
        if (recurrenceFrequency === "quinzenal") {
          frequency = "semanal";
          intervalValue = 2;
        }

        const recurrencePayload = {
          task_id: savedTask.id,
          frequency,
          interval_value: intervalValue,
          start_date:
            dueDate ||
            existingRecurrence?.start_date ||
            new Date().toISOString().slice(0, 10),
          next_run_date: dueDate || null,
          is_active: true,
          updated_at: now,
        };

        if (existingRecurrence?.id) {
          const { error } = await supabase
            .from("task_recurrences")
            .update(recurrencePayload)
            .eq("id", existingRecurrence.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("task_recurrences")
            .insert(recurrencePayload);

          if (error) throw error;
        }
      } else if (existingRecurrences?.length) {
        // Se deixou de ser recorrente,
        // desativamos todas as recorrências
        // associadas à tarefa.
        const { error } = await supabase
          .from("task_recurrences")
          .update({
            is_active: false,
            next_run_date: null,
            updated_at: now,
          })
          .eq("task_id", savedTask.id);

        if (error) throw error;
      }

      // -----------------------------
      // 3. Histórico de atividade
      // -----------------------------
      const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: user?.id || null,
          module: "Casa",
          action: task?.id ? "updated" : "created",
          entity_type: "task",
          entity_id: savedTask.id,
          entity_name: savedTask.title,
          details: {
            message: task?.id
              ? `Editou a tarefa doméstica: ${savedTask.title}`
              : `Criou a tarefa doméstica: ${savedTask.title}`,
          },
        });

      if (logError) {
        console.error(
          "Erro ao registrar atividade:",
          logError
        );
      }

      onSaved?.(savedTask);
      onClose?.();
    } catch (error) {
      console.error(
        "Erro ao salvar tarefa doméstica:",
        error
      );

      alert(
        `Não foi possível salvar a tarefa: ${
          error?.message || "erro desconhecido"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 18,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: COLORS.ink,
              }}
            >
              {task ? "Editar tarefa doméstica" : "Nova tarefa doméstica"}
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 12,
                color: COLORS.inkSoft,
              }}
            >
              Organize as tarefas compartilhadas da casa.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: COLORS.inkSoft,
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Field label="Tarefa">
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Limpar a cozinha"
            />
          </Field>

          <Field label="Descrição">
            <textarea
              style={{
                ...inputStyle,
                minHeight: 76,
                resize: "vertical",
              }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa..."
            />
          </Field>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <Field label="Responsável">
              <select
                style={inputStyle}
                value={responsibleUserId}
                onChange={(e) =>
                  setResponsibleUserId(e.target.value)
                }
              >
                <option value="">Sem responsável</option>

                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name
                        ? item.name.charAt(0).toUpperCase() + item.name.slice(1)
                        : ""}
                    </option>
                ))}
              </select>
            </Field>

            <Field label="Prioridade">
              <select
                style={inputStyle}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </Field>
          </div>

          <Field label="Prazo">
            <input
              type="date"
              style={inputStyle}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>

          <div
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: 14,
              background: "#FAFCFF",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) =>
                  setIsRecurring(e.target.checked)
                }
              />

              Tarefa recorrente
            </label>

            {isRecurring && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                  marginTop: 14,
                }}
              >
                <Field label="Frequência">
                  <select
                    style={inputStyle}
                    value={recurrenceFrequency}
                    onChange={(e) =>
                      setRecurrenceFrequency(e.target.value)
                    }
                  >
                    <option value="diaria">Diária</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                    <option value="personalizada">
                      Personalizada
                    </option>
                  </select>
                </Field>

                <Field label="Intervalo">
                  <input
                    type="number"
                    min="1"
                    style={inputStyle}
                    value={recurrenceInterval}
                    onChange={(e) =>
                      setRecurrenceInterval(e.target.value)
                    }
                  />
                </Field>
              </div>
            )}
          </div>

          <Field label="Observações">
            <textarea
              style={{
                ...inputStyle,
                minHeight: 70,
                resize: "vertical",
              }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </Field>
        </div>

        <div
          style={{
            borderTop: `1px solid ${COLORS.border}`,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: "#fff",
              color: COLORS.ink,
              borderRadius: 10,
              padding: "9px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              border: 0,
              background: COLORS.primary,
              color: "#fff",
              borderRadius: 10,
              padding: "9px 18px",
              fontWeight: 800,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Salvando..." : "Salvar tarefa"}
          </button>
        </div>
      </div>
    </div>
  );
}