import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  title: "",
  description: "",
  event_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  all_day: false,
  type: "compromisso",
};

export default function EventModal({
  open,
  onClose,
  currentUser,
  onSaved,
  eventToEdit = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");

    if (eventToEdit) {
      setForm({
        title: eventToEdit.title || "",
        description: eventToEdit.description || "",
        event_date: eventToEdit.event_date || "",
        end_date: eventToEdit.end_date || eventToEdit.event_date || "",
        start_time: eventToEdit.start_time || "",
        end_time: eventToEdit.end_time || "",
        all_day: eventToEdit.all_day || false,
        type: eventToEdit.type || "compromisso",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, eventToEdit]);

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
      setError("Informe o título do evento.");
      return;
    }

    if (!form.event_date) {
      setError("Informe a data do evento.");
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
      description: form.description.trim() || null,
      source_module: "geral",
      event_date: form.event_date,
      end_date: form.end_date || form.event_date,
      start_time: form.all_day ? null : form.start_time || null,
      end_time: form.all_day ? null : form.end_time || null,
      all_day: form.all_day,
      type: form.type,
    };

    let savedEvent;
    let saveError;

    if (eventToEdit) {
      const result = await supabase
        .from("calendar_events")
        .update(payload)
        .eq("id", eventToEdit.id)
        .select()
        .single();

      savedEvent = result.data;
      saveError = result.error;
    } else {
      const result = await supabase
        .from("calendar_events")
        .insert(payload)
        .select()
        .single();

      savedEvent = result.data;
      saveError = result.error;
    }

    if (saveError) {
      console.error(saveError);
      setError("Não foi possível salvar o evento.");
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      module: "inicio",
      action: eventToEdit ? "editou" : "criou",
      entity_type: "calendar_event",
      entity_id: savedEvent.id,
      entity_name: savedEvent.title,
    });

    setSaving(false);

    if (onSaved) await onSaved();

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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 580,
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
              {eventToEdit ? "Editar evento" : "Novo evento"}
            </h2>

            <div
              style={{
                fontSize: 12,
                color: COLORS.inkSoft,
                marginTop: 3,
              }}
            >
              Adicione compromissos ao seu calendário.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              color: COLORS.inkSoft,
              cursor: "pointer",
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
              placeholder="Ex.: Consulta veterinária"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <label style={labelStyle}>Data *</label>

              <input
                type="date"
                value={form.event_date}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    event_date: e.target.value,
                    end_date: prev.end_date || e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>

            <div>
                <label style={labelStyle}>Data final</label>
                <input
                    type="date"
                    value={form.end_date}
                    min={form.event_date || undefined}
                    onChange={(e) =>
                    setForm((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                    }))
                    }
                    style={inputStyle}
                />
                </div>

            <div>
              <label style={labelStyle}>Tipo</label>

              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                style={inputStyle}
              >
                <option value="compromisso">Compromisso</option>
                <option value="reuniao">Reunião</option>
                <option value="consulta">Consulta</option>
                <option value="prazo">Prazo</option>
                <option value="pessoal">Pessoal</option>
                <option value="outro">Outro</option>
              </select>
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
              checked={form.all_day}
              onChange={(e) =>
                updateField("all_day", e.target.checked)
              }
            />

            Evento de dia inteiro
          </label>

          {!form.all_day && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 15,
              }}
            >
              <div>
                <label style={labelStyle}>Horário inicial</label>

                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    updateField("start_time", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Horário final</label>

                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    updateField("end_time", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: 15 }}>
            <label style={labelStyle}>Descrição</label>

            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              placeholder="Observações sobre o evento..."
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
                : eventToEdit
                  ? "Salvar alterações"
                  : "Salvar evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}