import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  title: "",
  date: "",
  category: "",
  repeats_yearly: false,
  notes: "",
};

export default function ImportantDateModal({
  open,
  onClose,
  currentUser,
  onSaved,
  dateToEdit = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");

    if (dateToEdit) {
      setForm({
        title: dateToEdit.title || "",
        date: dateToEdit.date_value || "",
        category: dateToEdit.category || "",
        repeats_yearly: dateToEdit.repeats_yearly || false,
        notes: dateToEdit.notes || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, dateToEdit]);

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
      setError("Informe o título.");
      return;
    }

    if (!form.date) {
      setError("Informe a data.");
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

    const payload = {
      owner_user_id: user.id,
      title: form.title.trim(),
      date_value: form.date,
      category: form.category.trim() || null,
      repeats_yearly: form.repeats_yearly,
      notes: form.notes.trim() || null,
    };

    let savedDate;
    let saveError;

    if (dateToEdit) {
      const result = await supabase
        .from("important_dates")
        .update(payload)
        .eq("id", dateToEdit.id)
        .select()
        .single();

      savedDate = result.data;
      saveError = result.error;
    } else {
      const result = await supabase
        .from("important_dates")
        .insert(payload)
        .select()
        .single();

      savedDate = result.data;
      saveError = result.error;
    }

    if (saveError) {
      console.error(saveError);
      setError("Não foi possível salvar a data.");
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      module: "inicio",
      action: dateToEdit ? "editou" : "criou",
      entity_type: "important_date",
      entity_id: savedDate.id,
      entity_name: savedDate.title,
    });

    setSaving(false);

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
        zIndex: 100,
        background: "rgba(25, 38, 52, 0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: COLORS.surface,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 20px 60px rgba(30,50,70,.16)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
              {dateToEdit ? "Editar data" : "Nova data importante"}
            </h2>

            <div
              style={{
                color: COLORS.inkSoft,
                fontSize: 12,
                marginTop: 3,
              }}
            >
              Aniversários, comemorações e outros lembretes.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              color: COLORS.inkSoft,
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
              placeholder="Ex.: Aniversário da mãe"
              style={inputStyle}
            />
          </div>

          <div className="modal-form-grid">
            <div>
              <label style={labelStyle}>Data *</label>

              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Categoria</label>

              <input
                value={form.category}
                onChange={(e) =>
                  updateField("category", e.target.value)
                }
                placeholder="Ex.: Aniversário"
                style={inputStyle}
              />
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              fontSize: 13,
              color: COLORS.ink,
            }}
          >
            <input
              type="checkbox"
              checked={form.repeats_yearly}
              onChange={(e) =>
                updateField("repeats_yearly", e.target.checked)
              }
            />

            Repetir todos os anos
          </label>

          <div style={{ marginTop: 15 }}>
            <label style={labelStyle}>Observações</label>

            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Informações adicionais..."
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
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
              marginTop: 20,
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
                color: "#fff",
                borderRadius: 9,
                padding: "10px 18px",
                fontWeight: 700,
              }}
            >
              {saving
                ? "Salvando..."
                : dateToEdit
                  ? "Salvar alterações"
                  : "Salvar data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}