import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { COLORS } from "../../constants/theme";

function inputStyle() {
  return {
    width: "100%",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 9,
    padding: "9px 10px",
    fontSize: 11,
    color: COLORS.ink,
    background: COLORS.surface,
    outline: "none",
    boxSizing: "border-box",
  };
}

function labelStyle() {
  return {
    display: "block",
    fontSize: 9.5,
    color: COLORS.inkSoft,
    marginBottom: 4,
  };
}

export default function CompleteMaintenanceModal({
  open,
  onClose,
  onConfirm,
  maintenance = null,
}) {
  const [form, setForm] = useState({
    completed_date: "",
    actual_cost: "",
    provider: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    setForm({
      completed_date: today,
      actual_cost:
        maintenance?.actual_cost ?? "",
      provider:
        maintenance?.provider || "",
      notes: "",
    });
  }, [open, maintenance]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.completed_date) {
      alert(
        "Informe a data em que a manutenção foi realizada."
      );
      return;
    }

    try {
      setSaving(true);

      await onConfirm?.({
        completed_date:
          form.completed_date,
        actual_cost:
          form.actual_cost !== ""
            ? Number(form.actual_cost)
            : null,
        provider:
          form.provider.trim() || null,
        notes:
          form.notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(20, 30, 40, 0.35)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: COLORS.surface,
          borderRadius: 16,
          border:
            `1px solid ${COLORS.border}`,
          boxShadow:
            "0 18px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
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
            <div
              style={{
                fontSize: 14,
                color: COLORS.ink,
              }}
            >
              Concluir manutenção
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 9.5,
                color:
                  COLORS.inkSoft,
              }}
            >
              {maintenance?.title ||
                "Manutenção"}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              border: "none",
              borderRadius: 8,
              background: COLORS.bg,
              color:
                COLORS.inkSoft,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
            }}
          >
            <X size={15} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 11,
            }}
          >
            <div>
              <label
                style={labelStyle()}
              >
                Data realizada *
              </label>

              <input
                type="date"
                value={
                  form.completed_date
                }
                onChange={(event) =>
                  updateField(
                    "completed_date",
                    event.target.value
                  )
                }
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Custo real
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.actual_cost
                }
                onChange={(event) =>
                  updateField(
                    "actual_cost",
                    event.target.value
                  )
                }
                placeholder="0,00"
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Prestador / empresa
              </label>

              <input
                value={form.provider}
                onChange={(event) =>
                  updateField(
                    "provider",
                    event.target.value
                  )
                }
                placeholder="Opcional"
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Observações da execução
              </label>

              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value
                  )
                }
                placeholder="Ex.: filtro trocado, peça substituída..."
                style={{
                  ...inputStyle(),
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              gap: 8,
              marginTop: 16,
              paddingTop: 12,
              borderTop:
                `1px solid ${COLORS.border}`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                border:
                  `1px solid ${COLORS.border}`,
                borderRadius: 9,
                padding: "8px 13px",
                background:
                  COLORS.surface,
                color:
                  COLORS.inkSoft,
                cursor: "pointer",
                fontSize: 10.5,
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                border: "none",
                borderRadius: 9,
                padding: "8px 14px",
                background:
                  COLORS.success,
                color: "#fff",
                cursor: saving
                  ? "default"
                  : "pointer",
                fontSize: 10.5,
                opacity: saving
                  ? 0.65
                  : 1,
              }}
            >
              {saving
                ? "Concluindo..."
                : "Concluir manutenção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}