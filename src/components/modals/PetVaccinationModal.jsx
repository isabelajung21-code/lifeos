import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  vaccine_name: "",
  applied_at: "",
  next_due_date: "",
  veterinarian: "",
  clinic: "",
  notes: "",
};

export default function PetVaccinationModal({
  open,
  onClose,
  pet,
  vaccinationToEdit,
  currentUser,
  onSaved,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (vaccinationToEdit) {
      setForm({
        vaccine_name:
          vaccinationToEdit.vaccine_name || "",
        applied_at:
          vaccinationToEdit.applied_at || "",
        next_due_date:
          vaccinationToEdit.next_due_date || "",
        veterinarian:
          vaccinationToEdit.veterinarian || "",
        clinic:
          vaccinationToEdit.clinic || "",
        notes:
          vaccinationToEdit.notes || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, vaccinationToEdit]);

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

    if (!form.vaccine_name.trim()) {
      alert("Informe o nome da vacina.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        pet_id: pet.id,
        vaccine_name: form.vaccine_name.trim(),
        applied_at: form.applied_at || null,
        next_due_date:
          form.next_due_date || null,
        veterinarian:
          form.veterinarian.trim() || null,
        clinic: form.clinic.trim() || null,
        notes: form.notes.trim() || null,
      };

      let vaccinationId =
        vaccinationToEdit?.id || null;

      if (vaccinationToEdit) {
        const { error } = await supabase
          .from("pet_vaccinations")
          .update(payload)
          .eq("id", vaccinationToEdit.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("pet_vaccinations")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        vaccinationId = data.id;
      }

      const userId = await getCurrentUserId();

      await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Pets",
          action: vaccinationToEdit
            ? "updated"
            : "created",
          entity_type: "pet_vaccination",
          entity_id: vaccinationId,
          entity_name: form.vaccine_name.trim(),
          details: {
            message: vaccinationToEdit
              ? `Editou vacina de ${pet.name}: ${form.vaccine_name.trim()}`
              : `Cadastrou vacina de ${pet.name}: ${form.vaccine_name.trim()}`,
            pet_id: pet.id,
            pet_name: pet.name,
          },
        });

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar vacina:",
        error
      );

      alert(
        "Não foi possível salvar a vacina."
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
              {vaccinationToEdit
                ? "Editar vacina"
                : "Nova vacina"}
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
              Vacina *
            </label>

            <input
              value={form.vaccine_name}
              onChange={(e) =>
                updateField(
                  "vaccine_name",
                  e.target.value
                )
              }
              placeholder="Ex.: Raiva"
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
                Próxima dose
              </label>

              <input
                type="date"
                value={form.next_due_date}
                onChange={(e) =>
                  updateField(
                    "next_due_date",
                    e.target.value
                  )
                }
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
                Veterinário
              </label>

              <input
                value={form.veterinarian}
                onChange={(e) =>
                  updateField(
                    "veterinarian",
                    e.target.value
                  )
                }
                placeholder="Opcional"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Clínica
              </label>

              <input
                value={form.clinic}
                onChange={(e) =>
                  updateField(
                    "clinic",
                    e.target.value
                  )
                }
                placeholder="Opcional"
                style={inputStyle}
              />
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
              placeholder="Observações adicionais..."
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
                : "Salvar vacina"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}