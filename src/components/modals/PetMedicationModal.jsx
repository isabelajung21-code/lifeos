import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  medication_name: "",
  dosage: "",
  frequency: "",
  start_date: "",
  end_date: "",
  is_continuous: false,
  notes: "",
};

export default function PetMedicationModal({
  open,
  onClose,
  pet,
  medicationToEdit,
  currentUser,
  onSaved,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (medicationToEdit) {
      setForm({
        medication_name:
          medicationToEdit.medication_name || "",
        dosage:
          medicationToEdit.dosage || "",
        frequency:
          medicationToEdit.frequency || "",
        start_date:
          medicationToEdit.start_date || "",
        end_date:
          medicationToEdit.end_date || "",
        is_continuous:
          !!medicationToEdit.is_continuous,
        notes:
          medicationToEdit.notes || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, medicationToEdit]);

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

    if (!form.medication_name.trim()) {
      alert("Informe o nome do medicamento.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        pet_id: pet.id,
        medication_name:
          form.medication_name.trim(),
        dosage:
          form.dosage.trim() || null,
        frequency:
          form.frequency.trim() || null,
        start_date:
          form.start_date || null,
        end_date:
          form.is_continuous
            ? null
            : form.end_date || null,
        is_continuous:
          form.is_continuous,
        notes:
          form.notes.trim() || null,
      };

      let medicationId =
        medicationToEdit?.id || null;

      if (medicationToEdit) {
        const { error } = await supabase
          .from("pet_medications")
          .update(payload)
          .eq("id", medicationToEdit.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("pet_medications")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        medicationId = data.id;
      }

      const userId =
        await getCurrentUserId();

      await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Pets",
          action: medicationToEdit
            ? "updated"
            : "created",
          entity_type:
            "pet_medication",
          entity_id: medicationId,
          entity_name:
            form.medication_name.trim(),
          details: {
            message: medicationToEdit
              ? `Editou medicamento de ${pet.name}: ${form.medication_name.trim()}`
              : `Cadastrou medicamento de ${pet.name}: ${form.medication_name.trim()}`,
            pet_id: pet.id,
            pet_name: pet.name,
          },
        });

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar medicamento:",
        error
      );

      alert(
        "Não foi possível salvar o medicamento."
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
          maxWidth: 620,
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
              {medicationToEdit
                ? "Editar medicamento"
                : "Novo medicamento"}
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
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              marginBottom: 14,
            }}
          >
            <label style={labelStyle}>
              Medicamento *
            </label>

            <input
              value={form.medication_name}
              onChange={(e) =>
                updateField(
                  "medication_name",
                  e.target.value
                )
              }
              placeholder="Ex.: Prednisona"
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
                Dose
              </label>

              <input
                value={form.dosage}
                onChange={(e) =>
                  updateField(
                    "dosage",
                    e.target.value
                  )
                }
                placeholder="Ex.: 1 comprimido"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Frequência
              </label>

              <input
                value={form.frequency}
                onChange={(e) =>
                  updateField(
                    "frequency",
                    e.target.value
                  )
                }
                placeholder="Ex.: 1x ao dia"
                style={inputStyle}
              />
            </div>
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
                Início
              </label>

              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  updateField(
                    "start_date",
                    e.target.value
                  )
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Término
              </label>

              <input
                type="date"
                value={form.end_date}
                disabled={form.is_continuous}
                onChange={(e) =>
                  updateField(
                    "end_date",
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  opacity:
                    form.is_continuous
                      ? 0.5
                      : 1,
                }}
              />
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              marginBottom: 14,
              fontSize: 12,
              color: COLORS.ink,
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={form.is_continuous}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  is_continuous:
                    e.target.checked,
                  end_date: e.target.checked
                    ? ""
                    : current.end_date,
                }))
              }
            />

            Uso contínuo
          </label>

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
              placeholder="Orientações, cuidados..."
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
                : "Salvar medicamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}