import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function GoalModal({
  open,
  onClose,
  onSaved,
  user,
  goal = null,
}) {
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (goal) {
      setTitle(goal.title || "");
      setTargetValue(
        goal.target_value != null
          ? String(goal.target_value)
          : ""
      );
      setCurrentValue(
        goal.current_value != null
          ? String(goal.current_value)
          : ""
      );
      setTargetDate(goal.target_date || "");
      setNotes(goal.notes || "");
    } else {
      setTitle("");
      setTargetValue("");
      setCurrentValue("0");
      setTargetDate("");
      setNotes("");
    }
  }, [open, goal]);

  if (!open) return null;

  async function handleSave(event) {
    event.preventDefault();

    const parsedTarget = Number(
      String(targetValue).replace(",", ".")
    );

    const parsedCurrent = Number(
      String(currentValue || 0).replace(",", ".")
    );

    if (!title.trim()) {
      alert("Informe o nome da meta.");
      return;
    }

    if (!parsedTarget || parsedTarget <= 0) {
      alert("Informe um valor-alvo válido.");
      return;
    }

    if (
      Number.isNaN(parsedCurrent) ||
      parsedCurrent < 0
    ) {
      alert("Informe um valor atual válido.");
      return;
    }

    setSaving(true);

    try {
      const status =
        parsedCurrent >= parsedTarget
          ? "concluida"
          : "ativa";

      const payload = {
        title: title.trim(),
        target_value: parsedTarget,
        current_value: parsedCurrent,
        target_date: targetDate || null,
        status,
        notes: notes.trim() || null,
      };

      let savedGoal;

      if (goal) {
        const { data, error } = await supabase
          .from("finance_goals")
          .update(payload)
          .eq("id", goal.id)
          .select()
          .single();

        if (error) throw error;

        savedGoal = data;

        await supabase
          .from("activity_logs")
          .insert({
            user_id: user?.id || null,
            module: "Financeiro",
            action: "updated",
            entity_type: "finance_goal",
            entity_id: goal.id,
            entity_name: title.trim(),
            details: {
              message: `Alterou meta financeira: ${title.trim()}`,
              target_value: parsedTarget,
              current_value: parsedCurrent,
            },
          });
      } else {
        const { data, error } = await supabase
          .from("finance_goals")
          .insert({
            ...payload,
            created_by_user_id: user?.id || null,
          })
          .select()
          .single();

        if (error) throw error;

        savedGoal = data;

        await supabase
          .from("activity_logs")
          .insert({
            user_id: user?.id || null,
            module: "Financeiro",
            action: "created",
            entity_type: "finance_goal",
            entity_id: savedGoal.id,
            entity_name: title.trim(),
            details: {
              message: `Criou meta financeira: ${title.trim()}`,
              target_value: parsedTarget,
              current_value: parsedCurrent,
            },
          });
      }

      await onSaved?.();
      onClose?.();
    } catch (error) {
      console.error(
        "Erro ao salvar meta financeira:",
        error
      );

      alert(
        "Não foi possível salvar a meta financeira."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 11px",
    borderRadius: 9,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.ink,
    fontSize: 13,
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11.5,
    fontWeight: 600,
    color: COLORS.inkSoft,
    marginBottom: 5,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.38)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: 18,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: COLORS.surface,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          boxShadow:
            "0 20px 50px rgba(15,23,42,0.16)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {goal
                ? "Editar meta financeira"
                : "Nova meta financeira"}
            </div>

            <div
              style={{
                fontSize: 11.5,
                color: COLORS.inkSoft,
                marginTop: 3,
              }}
            >
              Defina o objetivo e acompanhe seu progresso.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.inkSoft,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          style={{
            padding: 18,
            display: "grid",
            gap: 14,
          }}
        >
          <div>
            <label style={labelStyle}>
              Nome da meta
            </label>

            <input
              style={inputStyle}
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Ex.: Reserva de emergência"
              autoFocus
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <label style={labelStyle}>
                Valor-alvo
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                style={inputStyle}
                value={targetValue}
                onChange={(e) =>
                  setTargetValue(e.target.value)
                }
                placeholder="0,00"
              />
            </div>

            <div>
              <label style={labelStyle}>
                Valor já acumulado
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                style={inputStyle}
                value={currentValue}
                onChange={(e) =>
                  setCurrentValue(e.target.value)
                }
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Prazo
            </label>

            <input
              type="date"
              style={inputStyle}
              value={targetDate}
              onChange={(e) =>
                setTargetDate(e.target.value)
              }
            />
          </div>

          <div>
            <label style={labelStyle}>
              Observações
            </label>

            <textarea
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 88,
              }}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Informações adicionais..."
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: "9px 14px",
                borderRadius: 9,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                color: COLORS.inkSoft,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "9px 15px",
                borderRadius: 9,
                border: "none",
                background: COLORS.primary,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {saving
                ? "Salvando..."
                : goal
                ? "Salvar alterações"
                : "Criar meta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}