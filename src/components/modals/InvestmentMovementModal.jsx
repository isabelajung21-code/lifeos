import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function InvestmentMovementModal({
  open,
  onClose,
  onSaved,
  user,
  investment,
  movementType = "aporte",
}) {
  const [amount, setAmount] = useState("");
  const [movementDate, setMovementDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const today = new Date().toISOString().slice(0, 10);

    setAmount("");
    setMovementDate(today);
    setNotes("");
  }, [open, investment, movementType]);

  if (!open || !investment) return null;

  const isWithdrawal = movementType === "resgate";

  async function handleSubmit(event) {
    event.preventDefault();

    const numericAmount = Number(
      String(amount).replace(",", ".")
    );

    if (!numericAmount || numericAmount <= 0) {
      alert("Informe um valor maior que zero.");
      return;
    }

    const oldInvestedValue = Number(
      investment.invested_value || 0
    );

    if (
      isWithdrawal &&
      numericAmount > oldInvestedValue
    ) {
      alert(
        "O valor do resgate não pode ser maior que o capital aplicado."
      );
      return;
    }

    const newInvestedValue = isWithdrawal
      ? oldInvestedValue - numericAmount
      : oldInvestedValue + numericAmount;

    setSaving(true);

    let insertedMovement = null;

    try {
      // 1. Registra o aporte/resgate
      const {
        data,
        error: movementError,
      } = await supabase
        .from("finance_investment_movements")
        .insert({
          investment_id: investment.id,
          movement_type: movementType,
          amount: numericAmount,
          movement_date: movementDate,
          notes: notes.trim() || null,
          created_by_user_id: user?.id || null,
        })
        .select()
        .single();

      if (movementError) {
        throw movementError;
      }

      insertedMovement = data;

      // 2. Atualiza o total aplicado no investimento
      const { error: investmentError } =
        await supabase
          .from("finance_investments")
          .update({
            invested_value: newInvestedValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", investment.id);

      if (investmentError) {
        // rollback do movimento caso o investimento
        // não consiga ser atualizado
        await supabase
          .from("finance_investment_movements")
          .delete()
          .eq("id", insertedMovement.id);

        throw investmentError;
      }

      // 3. Histórico geral
      await supabase
        .from("activity_logs")
        .insert({
          user_id: user?.id || null,
          module: "Financeiro",
          action: isWithdrawal
            ? "investment_withdrawal"
            : "investment_contribution",
          entity_type:
            "finance_investment_movement",
          entity_id: insertedMovement.id,
          entity_name: investment.name,
          details: {
            message: isWithdrawal
              ? `Registrou resgate de ${numericAmount} em ${investment.name}`
              : `Registrou aporte de ${numericAmount} em ${investment.name}`,
            investment_id: investment.id,
            movement_type: movementType,
            amount: numericAmount,
            previous_invested_value:
              oldInvestedValue,
            new_invested_value:
              newInvestedValue,
          },
        });

      await onSaved?.();

      onClose();
    } catch (error) {
      console.error(
        "Erro ao registrar movimentação do investimento:",
        error
      );

      alert(
        "Não foi possível registrar a movimentação."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: COLORS.surface,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          boxShadow:
            "0 20px 60px rgba(15, 23, 42, 0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "15px 17px",
            borderBottom:
              `1px solid ${COLORS.border}`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {isWithdrawal
                ? "Registrar resgate"
                : "Registrar aporte"}
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 10.5,
                color: COLORS.inkSoft,
              }}
            >
              {investment.name}
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
          onSubmit={handleSubmit}
          style={{
            padding: 17,
            display: "grid",
            gap: 14,
          }}
        >
          <div
            style={{
              padding: 11,
              borderRadius: 10,
              background: COLORS.bg,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                color: COLORS.inkSoft,
              }}
            >
              Capital aplicado atualmente
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 15,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {Number(
                investment.invested_value || 0
              ).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </div>

          <label
            style={{
              display: "grid",
              gap: 5,
              fontSize: 10.5,
              color: COLORS.inkSoft,
            }}
          >
            Valor *

            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              required
              style={inputStyle}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 5,
              fontSize: 10.5,
              color: COLORS.inkSoft,
            }}
          >
            Data *

            <input
              type="date"
              value={movementDate}
              onChange={(event) =>
                setMovementDate(
                  event.target.value
                )
              }
              required
              style={inputStyle}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 5,
              fontSize: 10.5,
              color: COLORS.inkSoft,
            }}
          >
            Observações

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 3,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                border:
                  `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                color: COLORS.inkSoft,
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                border: "none",
                background: isWithdrawal
                  ? COLORS.warning
                  : COLORS.primary,
                color: "#fff",
                borderRadius: 8,
                padding: "8px 13px",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                fontSize: 11,
                fontWeight: 600,
                opacity: saving ? 0.65 : 1,
              }}
            >
              {saving
                ? "Salvando..."
                : isWithdrawal
                ? "Registrar resgate"
                : "Registrar aporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "9px 10px",
  background: COLORS.surface,
  color: COLORS.ink,
  fontSize: 12,
  outline: "none",
};