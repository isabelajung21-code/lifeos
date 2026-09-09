import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function InvestmentModal({
  open,
  onClose,
  onSaved,
  user,
  investment = null,
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [institution, setInstitution] =
    useState("");

  const [investedValue, setInvestedValue] =
    useState("");

  const [currentValue, setCurrentValue] =
    useState("");

  const [referenceDate, setReferenceDate] =
    useState("");

  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (investment) {
      setName(investment.name || "");
      setType(investment.type || "");
      setInstitution(
        investment.institution || ""
      );

      setInvestedValue(
        investment.invested_value ??
          ""
      );

      setCurrentValue(
        investment.current_value ??
          ""
      );

      setReferenceDate(
        investment.reference_date ||
          new Date()
            .toISOString()
            .slice(0, 10)
      );

      setNotes(investment.notes || "");
    } else {
      setName("");
      setType("");
      setInstitution("");
      setInvestedValue("");
      setCurrentValue("");

      setReferenceDate(
        new Date()
          .toISOString()
          .slice(0, 10)
      );

      setNotes("");
    }
  }, [open, investment]);

  if (!open) return null;

  function parseMoneyValue(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    return Number(
      String(value)
        .replace(/\./g, "")
        .replace(",", ".")
    );
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Informe o nome do investimento.");
      return;
    }

    const parsedInvestedValue =
      parseMoneyValue(investedValue);

    const parsedCurrentValue =
      parseMoneyValue(currentValue);

    if (
      Number.isNaN(parsedInvestedValue) ||
      parsedInvestedValue < 0
    ) {
      alert("Informe um valor aplicado válido.");
      return;
    }

    if (
      Number.isNaN(parsedCurrentValue) ||
      parsedCurrentValue < 0
    ) {
      alert("Informe um valor atual válido.");
      return;
    }

    if (!referenceDate) {
      alert("Informe a data de referência.");
      return;
    }

    setSaving(true);

    let createdInvestmentId = null;
    let createdMovementId = null;
    let createdSnapshotId = null;

    try {
      /*
      * =====================================================
      * EDIÇÃO
      * =====================================================
      *
      * Depois que o investimento existe,
      * o valor aplicado e o valor atual NÃO devem ser
      * alterados por este modal.
      *
      * Eles são controlados por:
      * - Aporte
      * - Resgate
      * - Atualizar valor
      */
      if (investment?.id) {
        const editPayload = {
          name: name.trim(),
          type: type.trim() || null,
          institution:
            institution.trim() || null,
          notes: notes.trim() || null,
        };

        const { data, error } =
          await supabase
            .from("finance_investments")
            .update(editPayload)
            .eq("id", investment.id)
            .select()
            .single();

        if (error) throw error;

        await supabase
          .from("activity_logs")
          .insert({
            user_id: user?.id || null,
            module: "Financeiro",
            action: "updated",
            entity_type:
              "finance_investment",
            entity_id: data.id,
            entity_name: data.name,
            details: {
              message:
                `Atualizou investimento: ${data.name}`,
            },
          });

        await onSaved?.();
        onClose?.();
        return;
      }

      /*
      * =====================================================
      * NOVO INVESTIMENTO
      * =====================================================
      */

      const payload = {
        name: name.trim(),
        type: type.trim() || null,
        institution:
          institution.trim() || null,
        invested_value:
          parsedInvestedValue,
        current_value:
          parsedCurrentValue,
        reference_date:
          referenceDate,
        notes: notes.trim() || null,
        created_by_user_id:
          user?.id || null,
      };

      /*
      * 1. Cria o investimento
      */
      const {
        data: savedInvestment,
        error: investmentError,
      } = await supabase
        .from("finance_investments")
        .insert(payload)
        .select()
        .single();

      if (investmentError) {
        throw investmentError;
      }

      createdInvestmentId =
        savedInvestment.id;

      /*
      * 2. Cria o aporte inicial
      *
      * Só cria se houver valor aplicado > 0.
      */
      if (parsedInvestedValue > 0) {
        const {
          data: movement,
          error: movementError,
        } = await supabase
          .from(
            "finance_investment_movements"
          )
          .insert({
            investment_id:
              savedInvestment.id,
            movement_type: "aporte",
            amount:
              parsedInvestedValue,
            movement_date:
              referenceDate,
            notes: "Saldo inicial",
            created_by_user_id:
              user?.id || null,
          })
          .select()
          .single();

        if (movementError) {
          throw movementError;
        }

        createdMovementId =
          movement.id;
      }

      /*
      * 3. Cria o snapshot inicial
      *
      * O snapshot é criado mesmo se o valor
      * atual for zero, porque R$ 0 também pode
      * ser um valor válido.
      */
      const {
        data: snapshot,
        error: snapshotError,
      } = await supabase
        .from(
          "finance_investment_snapshots"
        )
        .insert({
          investment_id:
            savedInvestment.id,
          current_value:
            parsedCurrentValue,
          reference_date:
            referenceDate,
          notes: "Valor inicial",
          created_by_user_id:
            user?.id || null,
        })
        .select()
        .single();

      if (snapshotError) {
        throw snapshotError;
      }

      createdSnapshotId =
        snapshot.id;

      /*
      * 4. Histórico geral
      */
      await supabase
        .from("activity_logs")
        .insert({
          user_id: user?.id || null,
          module: "Financeiro",
          action: "created",
          entity_type:
            "finance_investment",
          entity_id:
            savedInvestment.id,
          entity_name:
            savedInvestment.name,
          details: {
            message:
              `Criou investimento: ${savedInvestment.name}`,
            invested_value:
              parsedInvestedValue,
            current_value:
              parsedCurrentValue,
            initial_movement_id:
              createdMovementId,
            initial_snapshot_id:
              createdSnapshotId,
          },
        });

      await onSaved?.();
      onClose?.();
    } catch (error) {
      console.error(
        "Erro ao salvar investimento:",
        error
      );

      /*
      * =====================================================
      * ROLLBACK DA CRIAÇÃO
      * =====================================================
      *
      * Se alguma etapa da criação falhar,
      * removemos os registros criados.
      *
      * Como movements e snapshots possuem
      * FK para investment, apagamos primeiro
      * os filhos e depois o investimento.
      */

      if (!investment?.id) {
        try {
          if (createdSnapshotId) {
            await supabase
              .from(
                "finance_investment_snapshots"
              )
              .delete()
              .eq(
                "id",
                createdSnapshotId
              );
          }

          if (createdMovementId) {
            await supabase
              .from(
                "finance_investment_movements"
              )
              .delete()
              .eq(
                "id",
                createdMovementId
              );
          }

          if (createdInvestmentId) {
            await supabase
              .from(
                "finance_investments"
              )
              .delete()
              .eq(
                "id",
                createdInvestmentId
              );
          }
        } catch (rollbackError) {
          console.error(
            "Erro no rollback do investimento:",
            rollbackError
          );
        }
      }

      alert(
        investment?.id
          ? "Não foi possível atualizar o investimento."
          : "Não foi possível criar o investimento."
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    border:
      `1px solid ${COLORS.border}`,
    borderRadius: 9,
    padding: "9px 10px",
    background: COLORS.surface,
    color: COLORS.ink,
    fontSize: 12,
    outline: "none",
  };

  const labelStyle = {
    display: "grid",
    gap: 5,
    fontSize: 10.5,
    color: COLORS.inkSoft,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(15, 23, 42, 0.38)",
        display: "grid",
        placeItems: "center",
        padding: 18,
        zIndex: 9999,
      }}
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <form
        onSubmit={handleSave}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "88vh",
          overflowY: "auto",
          background: COLORS.surface,
          border:
            `1px solid ${COLORS.border}`,
          borderRadius: 16,
          boxShadow:
            "0 20px 50px rgba(15,23,42,0.16)",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom:
              `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                color: COLORS.ink,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {investment
                ? "Editar investimento"
                : "Novo investimento"}
            </div>

            <div
              style={{
                marginTop: 3,
                color:
                  COLORS.inkSoft,
                fontSize: 10.5,
              }}
            >
              Registre o valor aplicado e
              o valor atual.
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
              background:
                COLORS.surface,
              color: COLORS.inkSoft,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            padding: 18,
            display: "grid",
            gap: 13,
          }}
        >
          <label style={labelStyle}>
            Nome do investimento *
            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Ex.: Reserva CDB"
              style={fieldStyle}
            />
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <label style={labelStyle}>
              Tipo
              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value
                  )
                }
                style={fieldStyle}
              >
                <option value="">
                  Selecione
                </option>

                <option value="CDB">
                  CDB
                </option>

                <option value="Tesouro Direto">
                  Tesouro Direto
                </option>

                <option value="LCI/LCA">
                  LCI / LCA
                </option>

                <option value="Fundo">
                  Fundo
                </option>

                <option value="Ações">
                  Ações
                </option>

                <option value="ETF">
                  ETF
                </option>

                <option value="FII">
                  Fundo imobiliário
                </option>

                <option value="Previdência">
                  Previdência
                </option>

                <option value="Cripto">
                  Criptomoeda
                </option>

                <option value="Poupança">
                  Poupança
                </option>

                <option value="Outro">
                  Outro
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              Instituição
              <input
                value={institution}
                onChange={(e) =>
                  setInstitution(
                    e.target.value
                  )
                }
                placeholder="Ex.: BTG, Nubank..."
                style={fieldStyle}
              />
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <label style={labelStyle}>
              Valor aplicado
              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  investedValue
                }
                disabled={Boolean(investment)}
                onChange={(e) =>
                  setInvestedValue(
                    e.target.value
                  )
                }
                placeholder="0,00"
                style={{
                  ...fieldStyle,
                  opacity: investment ? 0.65 : 1,
                  cursor: investment
                    ? "not-allowed"
                    : "text",
                  background: investment
                    ? COLORS.bg
                    : COLORS.surface,
                }}
              />
            </label>

            <label style={labelStyle}>
              Valor atual
              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  currentValue
                }
                onChange={(e) =>
                  setCurrentValue(
                    e.target.value
                  )
                }
                placeholder="0,00"
                style={fieldStyle}
              />
            </label>
          </div>

          <label style={labelStyle}>
            Data de referência
            <input
              type="date"
              value={referenceDate}
              onChange={(e) =>
                setReferenceDate(
                  e.target.value
                )
              }
              disabled={Boolean(investment)}
              style={{
                ...fieldStyle,
                opacity: investment ? 0.65 : 1,
                cursor: investment
                  ? "not-allowed"
                  : "text",
                background: investment
                  ? COLORS.bg
                  : COLORS.surface,
              }}
            />
          </label>

          <label style={labelStyle}>
            Observações
            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              rows={3}
              placeholder="Informações adicionais..."
              style={{
                ...fieldStyle,
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
              paddingTop: 4,
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
                color:
                  COLORS.inkSoft,
                borderRadius: 8,
                padding:
                  "8px 12px",
                fontSize: 11,
                cursor: "pointer",
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
                padding:
                  "8px 13px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {saving
                ? "Salvando..."
                : investment
                  ? "Salvar alterações"
                  : "Adicionar investimento"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}