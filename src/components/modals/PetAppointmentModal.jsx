import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  appointment_type: "Consulta",
  appointment_date: "",
  veterinarian: "",
  clinic: "",
  reason: "",
  diagnosis: "",
  notes: "",
  cost: "",
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

export default function PetAppointmentModal({
  open,
  onClose,
  pet,
  appointmentToEdit,
  currentUser,
  onSaved,
}) {
  const [form, setForm] =
    useState(initialForm);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    if (appointmentToEdit) {
      setForm({
        appointment_type:
          appointmentToEdit.appointment_type ||
          "Consulta",
        appointment_date:
          appointmentToEdit.appointment_date ||
          "",
        veterinarian:
          appointmentToEdit.veterinarian || "",
        clinic:
          appointmentToEdit.clinic || "",
        reason:
          appointmentToEdit.reason || "",
        diagnosis:
          appointmentToEdit.diagnosis || "",
        notes:
          appointmentToEdit.notes || "",
        cost:
          appointmentToEdit.cost != null
            ? String(appointmentToEdit.cost)
            : "",
      });
    } else {
      setForm({
        ...initialForm,
        appointment_date: getTodayLocal(),
      });
    }
  }, [open, appointmentToEdit]);

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

    if (!form.appointment_date) {
      alert("Informe a data do atendimento.");
      return;
    }

    try {
      setSaving(true);

      const numericCost =
        form.cost === ""
          ? null
          : Number(
              String(form.cost).replace(
                ",",
                "."
              )
            );

      if (
        numericCost != null &&
        (Number.isNaN(numericCost) ||
          numericCost < 0)
      ) {
        alert("Informe um custo válido.");
        return;
      }

      const payload = {
        pet_id: pet.id,
        appointment_type:
          form.appointment_type || null,
        appointment_date:
          form.appointment_date,
        veterinarian:
          form.veterinarian.trim() || null,
        clinic:
          form.clinic.trim() || null,
        reason:
          form.reason.trim() || null,
        diagnosis:
          form.diagnosis.trim() || null,
        notes:
          form.notes.trim() || null,
        cost: numericCost,
      };

      let appointmentId =
        appointmentToEdit?.id || null;

      if (appointmentToEdit) {
        const { error } = await supabase
          .from("pet_appointments")
          .update(payload)
          .eq(
            "id",
            appointmentToEdit.id
          );

        if (error) throw error;
      } else {
        const { data, error } =
          await supabase
            .from("pet_appointments")
            .insert(payload)
            .select("id")
            .single();

        if (error) throw error;

        appointmentId = data.id;
      }

      const userId =
        await getCurrentUserId();

      await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Pets",
          action: appointmentToEdit
            ? "updated"
            : "created",
          entity_type:
            "pet_appointment",
          entity_id: appointmentId,
          entity_name:
            `${form.appointment_type} - ${pet.name}`,
          details: {
            message: appointmentToEdit
              ? `Editou atendimento de ${pet.name}`
              : `Cadastrou atendimento de ${pet.name}`,
            pet_id: pet.id,
            pet_name: pet.name,
            appointment_type:
              form.appointment_type,
          },
        });

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar atendimento:",
        error
      );

      alert(
        "Não foi possível salvar o atendimento."
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
          maxWidth: 700,
          maxHeight: "90vh",
          overflowY: "auto",
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
              {appointmentToEdit
                ? "Editar atendimento"
                : "Novo atendimento"}
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
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>
                Tipo
              </label>

              <select
                value={
                  form.appointment_type
                }
                onChange={(e) =>
                  updateField(
                    "appointment_type",
                    e.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="Consulta">
                  Consulta
                </option>
                <option value="Retorno">
                  Retorno
                </option>
                <option value="Exame">
                  Exame
                </option>
                <option value="Vacinação">
                  Vacinação
                </option>
                <option value="Procedimento">
                  Procedimento
                </option>
                <option value="Cirurgia">
                  Cirurgia
                </option>
                <option value="Emergência">
                  Emergência
                </option>
                <option value="Outro">
                  Outro
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Data *
              </label>

              <input
                type="date"
                value={
                  form.appointment_date
                }
                onChange={(e) =>
                  updateField(
                    "appointment_date",
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
                Veterinário(a)
              </label>

              <input
                value={form.veterinarian}
                onChange={(e) =>
                  updateField(
                    "veterinarian",
                    e.target.value
                  )
                }
                placeholder="Nome do veterinário"
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
                placeholder="Nome da clínica"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginBottom: 14,
            }}
          >
            <label style={labelStyle}>
              Motivo
            </label>

            <textarea
              rows={2}
              value={form.reason}
              onChange={(e) =>
                updateField(
                  "reason",
                  e.target.value
                )
              }
              placeholder="Ex.: Consulta de rotina"
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              marginBottom: 14,
            }}
          >
            <label style={labelStyle}>
              Diagnóstico / Resultado
            </label>

            <textarea
              rows={2}
              value={form.diagnosis}
              onChange={(e) =>
                updateField(
                  "diagnosis",
                  e.target.value
                )
              }
              placeholder="Diagnóstico ou resultado do atendimento"
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 2fr) minmax(150px, 1fr)",
              gap: 12,
            }}
          >
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
                placeholder="Medicamentos prescritos, orientações..."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Custo (R$)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) =>
                  updateField(
                    "cost",
                    e.target.value
                  )
                }
                placeholder="0,00"
                style={inputStyle}
              />
            </div>
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
                : "Salvar atendimento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}