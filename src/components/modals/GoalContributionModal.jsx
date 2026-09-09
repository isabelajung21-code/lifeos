import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function GoalContributionModal({
  open,
  onClose,
  onSaved,
  user,
  goal,
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setAmount("");
    setNotes("");
    setDate(
      new Date().toISOString().slice(0, 10)
    );
  }, [open, goal]);

  if (!open || !goal) return null;

  async function handleSave(event) {
    event.preventDefault();

    const parsedAmount = Number(
      String(amount).replace(",", ".")
    );

    if (!parsedAmount || parsedAmount <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    if (!date) {
      alert("Informe a data do aporte.");
      return;
    }

    setSaving(true);

    try {
      const currentValue =
        Number(goal.current_value || 0);

      const targetValue =
        Number(goal.target_value || 0);

      const newValue =
        currentValue + parsedAmount;

      const newStatus =
        newValue >= targetValue
          ? "concluida"
          : "ativa";

      // 1. Registra o aporte
      const {
        data: contribution,
        error: contributionError,
      } = await supabase
        .from("finance_goal_contributions")
        .insert({
          goal_id: goal.id,
          amount: parsedAmount,
          contribution_date: date,
          notes: notes.trim() || null,
          created_by_user_id:
            user?.id || null,
        })
        .select()
        .single();

      if (contributionError) {
        throw contributionError;
      }

      // 2. Atualiza o valor acumulado da meta
      const { error: goalError } =
        await supabase
          .from("finance_goals")
          .update({
            current_value: newValue,
            status: newStatus,
          })
          .eq("id", goal.id);

      if (goalError) {
        // Evita deixar aporte órfão
        await supabase
          .from("finance_goal_contributions")
          .delete()
          .eq("id", contribution.id);

        throw goalError;
      }

      // 3. Histórico geral
      await supabase
        .from("activity_logs")
        .insert({
          user_id: user?.id || null,
          module: "Financeiro",
          action: "created",
          entity_type:
            "finance_goal_contribution",
          entity_id: contribution.id,
          entity_name: goal.title,
          details: {
            message:
              `Adicionou valor à meta ${goal.title}`,
            goal_id: goal.id,
            amount: parsedAmount,
            previous_value: currentValue,
            new_value: newValue,
          },
        });

      await onSaved?.();
      onClose?.();
    } catch (error) {
      console.error(
        "Erro ao adicionar valor à meta:",
        error
      );

      alert(
        "Não foi possível adicionar o valor à meta."
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
          maxWidth: 460,
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
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              Adicionar valor
            </div>

            <div
              style={{
                fontSize: 11.5,
                color: COLORS.inkSoft,
                marginTop: 3,
              }}
            >
              {goal.title}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border:
                `1px solid ${COLORS.border}`,
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
              Valor do aporte
            </label>

            <input
              type="number"
              step="0.01"
              min="0.01"
              style={inputStyle}
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="0,00"
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>
              Data
            </label>

            <input
              type="date"
              style={inputStyle}
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
            />
          </div>

          <div>
            <label style={labelStyle}>
              Observação
            </label>

            <textarea
              style={{
                ...inputStyle,
                minHeight: 80,
                resize: "vertical",
              }}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Opcional"
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: "9px 14px",
                borderRadius: 9,
                border:
                  `1px solid ${COLORS.border}`,
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
                : "Adicionar valor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}