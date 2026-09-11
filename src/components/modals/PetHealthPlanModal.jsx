import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  provider: "",
  plan_name: "",
  membership_number: "",
  limits_renewal_date: "",
  is_active: true,
  notes: "",
};

export default function PetHealthPlanModal({
  open,
  onClose,
  pet,
  planToEdit,
  currentUser,
  onSaved,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (planToEdit) {
      setForm({
        provider: planToEdit.provider || "",
        plan_name: planToEdit.plan_name || "",
        membership_number:
          planToEdit.membership_number || "",
        limits_renewal_date:
          planToEdit.limits_renewal_date || "",
        is_active:
          planToEdit.is_active !== false,
        notes: planToEdit.notes || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, planToEdit]);

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

    if (!form.provider.trim()) {
      alert("Informe a operadora do plano.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        pet_id: pet.id,
        provider: form.provider.trim(),
        plan_name:
          form.plan_name.trim() || null,
        membership_number:
          form.membership_number.trim() || null,
        limits_renewal_date:
          form.limits_renewal_date || null,
        is_active: form.is_active,
        notes:
          form.notes.trim() || null,
        updated_at:
          new Date().toISOString(),
      };

      let planId = planToEdit?.id || null;

      if (planToEdit) {
        const { error } = await supabase
          .from("pet_health_plans")
          .update(payload)
          .eq("id", planToEdit.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("pet_health_plans")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        planId = data.id;
      }

      const userId = await getCurrentUserId();

      await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Pets",
          action: planToEdit
            ? "updated"
            : "created",
          entity_type:
            "pet_health_plan",
          entity_id: planId,
          entity_name:
            form.provider.trim(),
          details: {
            message: planToEdit
              ? `Editou plano de saúde de ${pet.name}`
              : `Cadastrou plano de saúde de ${pet.name}`,
            pet_id: pet.id,
            pet_name: pet.name,
          },
        });

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar plano de saúde:",
        error
      );

      alert(
        "Não foi possível salvar o plano de saúde."
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
              {planToEdit
                ? "Editar plano de saúde"
                : "Novo plano de saúde"}
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
                Operadora *
              </label>

              <input
                value={form.provider}
                onChange={(e) =>
                  updateField(
                    "provider",
                    e.target.value
                  )
                }
                placeholder="Ex.: PetLove"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Nome do plano
              </label>

              <input
                value={form.plan_name}
                onChange={(e) =>
                  updateField(
                    "plan_name",
                    e.target.value
                  )
                }
                placeholder="Opcional"
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
                Número / matrícula
              </label>

              <input
                value={form.membership_number}
                onChange={(e) =>
                  updateField(
                    "membership_number",
                    e.target.value
                  )
                }
                placeholder="Opcional"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Renovação dos limites
              </label>

              <input
                type="date"
                value={form.limits_renewal_date}
                onChange={(e) =>
                  updateField(
                    "limits_renewal_date",
                    e.target.value
                  )
                }
                style={inputStyle}
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
              checked={form.is_active}
              onChange={(e) =>
                updateField(
                  "is_active",
                  e.target.checked
                )
              }
            />

            Plano ativo
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
              placeholder="Observações sobre cobertura, limites..."
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
                : "Salvar plano"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
