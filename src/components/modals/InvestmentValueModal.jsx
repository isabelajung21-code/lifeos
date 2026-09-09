import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function InvestmentValueModal({
  open,
  onClose,
  onSaved,
  user,
  investment,
}) {
  const [currentValue, setCurrentValue] = useState("");
  const [referenceDate, setReferenceDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !investment) return;

    setCurrentValue(
      investment.current_value ?? ""
    );

    setReferenceDate(
      new Date().toISOString().slice(0, 10)
    );

    setNotes("");
  }, [open, investment]);

  if (!open || !investment) return null;

  async function handleSubmit(event) {
    event.preventDefault();

    const numericValue = Number(
      String(currentValue).replace(",", ".")
    );

    if (
      Number.isNaN(numericValue) ||
      numericValue < 0
    ) {
      alert("Informe um valor atual válido.");
      return;
    }

    if (!referenceDate) {
      alert("Informe a data de referência.");
      return;
    }

    setSaving(true);

    let snapshot = null;

    try {
      /*
       * Primeiro verificamos se já existe uma
       * atualização ativa deste investimento
       * nesta mesma data.
       */
      const {
        data: existingSnapshot,
        error: existingError,
      } = await supabase
        .from("finance_investment_snapshots")
        .select("*")
        .eq("investment_id", investment.id)
        .eq("reference_date", referenceDate)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      /*
       * Se já existir atualização nesse dia,
       * atualizamos o registro em vez de criar
       * uma duplicata.
       */
      if (existingSnapshot) {
        const {
          data,
          error: snapshotError,
        } = await supabase
          .from("finance_investment_snapshots")
          .update({
            current_value: numericValue,
            notes: notes.trim() || null,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", existingSnapshot.id)
          .select()
          .single();

        if (snapshotError) {
          throw snapshotError;
        }

        snapshot = data;
      } else {
        const {
          data,
          error: snapshotError,
        } = await supabase
          .from("finance_investment_snapshots")
          .insert({
            investment_id: investment.id,
            current_value: numericValue,
            reference_date: referenceDate,
            notes: notes.trim() || null,
            created_by_user_id:
              user?.id || null,
          })
          .select()
          .single();

        if (snapshotError) {
          throw snapshotError;
        }

        snapshot = data;
      }

      /*
       * Atualiza o resumo do investimento.
       */
      const {
        error: investmentError,
      } = await supabase
        .from("finance_investments")
        .update({
          current_value: numericValue,
          reference_date: referenceDate,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", investment.id);

      if (investmentError) {
        throw investmentError;
      }

      await supabase
        .from("activity_logs")
        .insert({
          user_id: user?.id || null,
          module: "Financeiro",
          action: "investment_value_updated",
          entity_type:
            "finance_investment_snapshot",
          entity_id: snapshot.id,
          entity_name: investment.name,
          details: {
            message:
              `Atualizou o valor do investimento ${investment.name}`,
            investment_id:
              investment.id,
            previous_value: Number(
              investment.current_value || 0
            ),
            current_value:
              numericValue,
            reference_date:
              referenceDate,
          },
        });

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error(
        "Erro ao atualizar valor do investimento:",
        error
      );

      alert(
        "Não foi possível atualizar o valor do investimento."
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
        background:
          "rgba(15, 23, 42, 0.45)",
        zIndex: 1000,
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
          border:
            `1px solid ${COLORS.border}`,
          boxShadow:
            "0 20px 60px rgba(15, 23, 42, 0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
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
              Atualizar valor
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
              Valor atual registrado
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
                investment.current_value || 0
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
            Novo valor atual *

            <input
              type="number"
              min="0"
              step="0.01"
              value={currentValue}
              onChange={(event) =>
                setCurrentValue(
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
            Data de referência *

            <input
              type="date"
              value={referenceDate}
              onChange={(event) =>
                setReferenceDate(
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
              justifyContent:
                "flex-end",
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
                background:
                  COLORS.surface,
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
                background:
                  COLORS.primary,
                color: "#fff",
                borderRadius: 8,
                padding: "8px 13px",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                fontSize: 11,
                fontWeight: 600,
                opacity: saving
                  ? 0.65
                  : 1,
              }}
            >
              {saving
                ? "Salvando..."
                : "Atualizar valor"}
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
  border:
    `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "9px 10px",
  background: COLORS.surface,
  color: COLORS.ink,
  fontSize: 12,
  outline: "none",
};