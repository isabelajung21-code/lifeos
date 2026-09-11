import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  weight: "",
  measured_at: "",
  notes: "",
};

function getTodayLocal() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function PetWeightModal({
  open,
  onClose,
  pet,
  weightToEdit,
  currentUser,
  onSaved,
}) {
  const [form, setForm] =
    useState(initialForm);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    if (weightToEdit) {
      setForm({
        weight:
          weightToEdit.weight != null
            ? String(weightToEdit.weight)
            : "",
        measured_at:
          weightToEdit.measured_at || "",
        notes:
          weightToEdit.notes || "",
      });
    } else {
      setForm({
        ...initialForm,
        measured_at: getTodayLocal(),
      });
    }
  }, [open, weightToEdit]);

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

  async function updateCurrentPetWeight() {
    const {
      data: latestWeight,
      error: latestError,
    } = await supabase
      .from("pet_weights")
      .select("weight, measured_at")
      .eq("pet_id", pet.id)
      .is("deleted_at", null)
      .order("measured_at", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      throw latestError;
    }

    const { error: petError } =
      await supabase
        .from("pets")
        .update({
          current_weight:
            latestWeight?.weight ?? null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", pet.id);

    if (petError) {
      throw petError;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const numericWeight =
      Number(
        String(form.weight)
          .replace(",", ".")
      );

    if (
      !numericWeight ||
      numericWeight <= 0
    ) {
      alert("Informe um peso válido.");
      return;
    }

    if (!form.measured_at) {
      alert("Informe a data da pesagem.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        pet_id: pet.id,
        weight: numericWeight,
        measured_at: form.measured_at,
        notes:
          form.notes.trim() || null,
      };

      let weightId =
        weightToEdit?.id || null;

      if (weightToEdit) {
        const { error } = await supabase
          .from("pet_weights")
          .update(payload)
          .eq("id", weightToEdit.id);

        if (error) throw error;
      } else {
        const { data, error } =
          await supabase
            .from("pet_weights")
            .insert(payload)
            .select("id")
            .single();

        if (error) throw error;

        weightId = data.id;
      }

      await updateCurrentPetWeight();

      const userId =
        await getCurrentUserId();

      await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Pets",
          action: weightToEdit
            ? "updated"
            : "created",
          entity_type: "pet_weight",
          entity_id: weightId,
          entity_name:
            `Peso de ${pet.name}`,
          details: {
            message: weightToEdit
              ? `Editou peso de ${pet.name}: ${numericWeight} kg`
              : `Registrou peso de ${pet.name}: ${numericWeight} kg`,
            pet_id: pet.id,
            pet_name: pet.name,
            weight: numericWeight,
          },
        });

      await onSaved?.();

      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar peso:",
        error
      );

      alert(
        "Não foi possível salvar o peso."
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
        background:
          "rgba(20, 30, 40, 0.35)",
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
          maxWidth: 520,
          background: COLORS.surface,
          borderRadius: 18,
          border:
            `1px solid ${COLORS.border}`,
          boxShadow:
            "0 20px 55px rgba(20,30,40,0.18)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom:
              `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent:
              "space-between",
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
              {weightToEdit
                ? "Editar peso"
                : "Registrar peso"}
            </h2>

            <div
              style={{
                marginTop: 4,
                color: COLORS.inkSoft,
                fontSize: 12,
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
              background:
                "transparent",
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>
                Peso (kg) *
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.weight}
                onChange={(e) =>
                  updateField(
                    "weight",
                    e.target.value
                  )
                }
                placeholder="Ex.: 16,50"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Data *
              </label>

              <input
                type="date"
                value={
                  form.measured_at
                }
                onChange={(e) =>
                  updateField(
                    "measured_at",
                    e.target.value
                  )
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Observações
            </label>

            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                updateField(
                  "notes",
                  e.target.value
                )
              }
              placeholder="Ex.: Pesagem na consulta veterinária"
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
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                border:
                  `1px solid ${COLORS.border}`,
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
                background:
                  COLORS.primary,
                color: "#fff",
                borderRadius: 10,
                padding: "9px 15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {saving
                ? "Salvando..."
                : "Salvar peso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}