import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const MONTHS = [
  { value: "", label: "Sem lembrete anual" },
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const initialForm = {
  medication_name: "",
  applied_at: "",
  recurrence_month: "",
  notes: "",
};

export default function PetDewormingModal({
  open,
  onClose,
  pet,
  dewormingToEdit,
  currentUser,
  onSaved,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (dewormingToEdit) {
      setForm({
        medication_name:
          dewormingToEdit.medication_name || "",
        applied_at:
          dewormingToEdit.applied_at || "",
        recurrence_month:
          dewormingToEdit.recurrence_month
            ? String(dewormingToEdit.recurrence_month)
            : "",
        notes: dewormingToEdit.notes || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, dewormingToEdit]);

  if (!open || !pet) return null;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function getCurrentUserId() {
    if (!currentUser) return null;

    const { data } = await supabase
      .from("users")
      .select("id")
      .ilike("name", currentUser)
      .maybeSingle();

    return data?.id || null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.medication_name.trim() &&
      !form.recurrence_month
    ) {
      alert(
        "Informe o vermífugo ou o mês do lembrete."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        pet_id: pet.id,
        medication_name:
          form.medication_name.trim() || null,
        applied_at: form.applied_at || null,
        recurrence_month: form.recurrence_month
          ? Number(form.recurrence_month)
          : null,
        notes: form.notes.trim() || null,
      };

      let dewormingId =
        dewormingToEdit?.id || null;

      if (dewormingToEdit) {
        const { error } = await supabase
          .from("pet_deworming")
          .update(payload)
          .eq("id", dewormingToEdit.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("pet_deworming")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        dewormingId = data.id;
      }

      const userId = await getCurrentUserId();

      await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Pets",
          action: dewormingToEdit
            ? "updated"
            : "created",
          entity_type: "pet_deworming",
          entity_id: dewormingId,
          entity_name:
            form.medication_name.trim() ||
            "Lembrete de vermífugo",
          details: {
            message: dewormingToEdit
              ? `Editou vermífugo de ${pet.name}`
              : `Cadastrou vermífugo de ${pet.name}`,
            pet_id: pet.id,
            pet_name: pet.name,
          },
        });

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar vermífugo:",
        error
      );

      alert(
        "Não foi possível salvar o vermífugo."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: "10px 11px",
    fontSize: 13,
    outline: "none",
    background: "#fff",
    color: COLORS.ink,
  };

  const labelStyle = {
    display: "block",
    marginBottom: 5,
    color: COLORS.inkSoft,
    fontSize: 11,
    fontWeight: 700,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 30, 40, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 18,
          border: `1px solid ${COLORS.border}`,
          boxShadow:
            "0 20px 55px rgba(20,30,40,0.18)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
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
              {dewormingToEdit
                ? "Editar vermífugo"
                : "Novo vermífugo"}
            </h2>

            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: COLORS.inkSoft,
              }}
            >
              {pet.name}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
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

        <form
          onSubmit={handleSubmit}
          style={{ padding: 20 }}
        >
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Vermífugo
            </label>

            <input
              value={form.medication_name}
              onChange={(e) =>
                updateField(
                  "medication_name",
                  e.target.value
                )
              }
              placeholder="Ex.: Drontal"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>
                Data da aplicação
              </label>

              <input
                type="date"
                value={form.applied_at}
                onChange={(e) =>
                  updateField(
                    "applied_at",
                    e.target.value
                  )
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Lembrete anual
              </label>

              <select
                value={form.recurrence_month}
                onChange={(e) =>
                  updateField(
                    "recurrence_month",
                    e.target.value
                  )
                }
                style={inputStyle}
              >
                {MONTHS.map((month) => (
                  <option
                    key={month.value}
                    value={month.value}
                  >
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Observações
            </label>

            <textarea
              value={form.notes}
              onChange={(e) =>
                updateField(
                  "notes",
                  e.target.value
                )
              }
              rows={3}
              placeholder="Observações..."
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "flex-end",
              gap: 9,
              flexWrap: "wrap",
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
                padding: "9px 14px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                border: 0,
                background: COLORS.primary,
                color: "#fff",
                borderRadius: 10,
                padding: "9px 15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {saving
                ? "Salvando..."
                : "Salvar vermífugo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}