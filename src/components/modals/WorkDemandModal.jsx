import { useEffect, useState } from "react";
import { BriefcaseBusiness, Save, X } from "lucide-react";

import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  status: "pendente",
  priority: "media",
  start_date: "",
  due_date: "",
  notes: "",
};

async function findUserId(currentUser) {
  let result = await supabase
    .from("users")
    .select("id")
    .eq("display_name", currentUser)
    .maybeSingle();

  if (!result.data && !result.error) {
    result = await supabase
      .from("users")
      .select("id")
      .eq("name", currentUser)
      .maybeSingle();
  }

  if (result.error) throw result.error;

  if (!result.data?.id) {
    throw new Error("Usuário não encontrado.");
  }

  return result.data.id;
}

export default function WorkDemandModal({
  open,
  currentUser,
  demand = null,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (demand) {
      setForm({
        title: demand.title || "",
        description: demand.description || "",
        category: demand.category || "",
        status: demand.status || "pendente",
        priority: demand.priority || "media",
        start_date: demand.start_date || "",
        due_date: demand.due_date || "",
        notes: demand.notes || "",
      });
    } else {
      setForm(emptyForm);
    }

    setError("");
  }, [open, demand]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Informe o título da demanda.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const userId = await findUserId(currentUser);

      const payload = {
        owner_user_id: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        status: form.status,
        priority: form.priority,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (demand?.id) {
        result = await supabase
          .from("work_demands")
          .update(payload)
          .eq("id", demand.id);
      } else {
        result = await supabase
          .from("work_demands")
          .insert(payload);
      }

      if (result.error) throw result.error;

      await supabase.from("activity_logs").insert({
        user_id: userId,
        module: "Trabalho",
        action: demand?.id
          ? "editou demanda"
          : "criou demanda",
        entity_type: "work_demand",
        entity_id: demand?.id || null,
        entity_name: payload.title,
      });

      if (onSaved) {
        await onSaved();
      }

      onClose();
    } catch (saveError) {
      setError(
        saveError.message ||
          "Não foi possível salvar a demanda."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(31, 49, 61, 0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: 18,
          boxShadow: "0 20px 55px rgba(37, 49, 61, 0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BriefcaseBusiness
              size={18}
              color={COLORS.primaryDark}
            />

            <h2
              style={{
                margin: 0,
                color: COLORS.ink,
                fontSize: 16,
              }}
            >
              {demand ? "Editar demanda" : "Nova demanda"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Fechar"
            style={iconButtonStyle}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: COLORS.dangerLight,
              color: COLORS.danger,
              borderRadius: 9,
              padding: "9px 10px",
              marginBottom: 12,
              fontSize: 11,
            }}
          >
            {error}
          </div>
        )}

        <div className="modal-form-grid">
          <Field label="Título" full>
            <input
              value={form.title}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
              placeholder="Ex.: Preparar relatório mensal"
              autoFocus
              style={fieldStyle}
            />
          </Field>

          <Field label="Categoria">
            <input
              value={form.category}
              onChange={(event) =>
                updateField("category", event.target.value)
              }
              placeholder="Ex.: P&D"
              style={fieldStyle}
            />
          </Field>

          <Field label="Prioridade">
            <select
              value={form.priority}
              onChange={(event) =>
                updateField("priority", event.target.value)
              }
              style={fieldStyle}
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value)
              }
              style={fieldStyle}
            >
              <option value="pendente">Pendente</option>
              <option value="em_andamento">
                Em andamento
              </option>
              <option value="aguardando">Aguardando</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </Field>

          <Field label="Data de início">
            <input
              type="date"
              value={form.start_date}
              onChange={(event) =>
                updateField("start_date", event.target.value)
              }
              style={fieldStyle}
            />
          </Field>

          <Field label="Prazo">
            <input
              type="date"
              value={form.due_date}
              onChange={(event) =>
                updateField("due_date", event.target.value)
              }
              style={fieldStyle}
            />
          </Field>

          <Field label="Descrição" full>
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Detalhes da demanda"
              rows={3}
              style={{
                ...fieldStyle,
                resize: "vertical",
              }}
            />
          </Field>

          <Field label="Observações" full>
            <textarea
              value={form.notes}
              onChange={(event) =>
                updateField("notes", event.target.value)
              }
              placeholder="Informações adicionais"
              rows={3}
              style={{
                ...fieldStyle,
                resize: "vertical",
              }}
            />
          </Field>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={secondaryButtonStyle}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...primaryButtonStyle,
              opacity: saving ? 0.65 : 1,
            }}
          >
            <Save size={15} />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, full = false }) {
  return (
    <label
      style={{
        display: "grid",
        gap: 5,
        gridColumn: full ? "1 / -1" : "auto",
        color: COLORS.inkSoft,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}
      {children}
    </label>
  );
}

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 9,
  background: COLORS.surface,
  color: COLORS.ink,
  padding: "9px 10px",
  outline: "none",
  fontSize: 12,
};

const iconButtonStyle = {
  width: 30,
  height: 30,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: COLORS.surface,
  color: COLORS.inkSoft,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const primaryButtonStyle = {
  border: 0,
  borderRadius: 9,
  background: COLORS.primary,
  color: "#fff",
  padding: "8px 11px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 9,
  background: COLORS.surface,
  color: COLORS.ink,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};