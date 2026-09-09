import { useEffect, useState } from "react";
import {
  Check,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(
    `${value}T12:00:00`
  ).toLocaleDateString("pt-BR");
}

export default function InvestmentHistoryModal({
  open,
  onClose,
  onSaved,
  user,
  investment,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] =
    useState(null);

    const [editAmount, setEditAmount] =
    useState("");

    const [editDate, setEditDate] =
    useState("");

    const [editNotes, setEditNotes] =
    useState("");

    const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open || !investment) return;

    loadHistory();
  }, [open, investment]);

  async function loadHistory() {
    if (!investment) return;

    setLoading(true);

    try {
      const [
        movementsResult,
        snapshotsResult,
      ] = await Promise.all([
        supabase
          .from(
            "finance_investment_movements"
          )
          .select("*")
          .eq(
            "investment_id",
            investment.id
          )
          .is("deleted_at", null)
          .order("movement_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from(
            "finance_investment_snapshots"
          )
          .select("*")
          .eq(
            "investment_id",
            investment.id
          )
          .is("deleted_at", null)
          .order("reference_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (movementsResult.error) {
        throw movementsResult.error;
      }

      if (snapshotsResult.error) {
        throw snapshotsResult.error;
      }

      const movements = (
        movementsResult.data || []
      ).map((item) => ({
        ...item,
        historyType:
          item.movement_type,
        historyDate:
          item.movement_date,
        historyValue:
          Number(item.amount || 0),
      }));

      const snapshots = (
        snapshotsResult.data || []
      ).map((item) => ({
        ...item,
        historyType:
          "atualizacao_valor",
        historyDate:
          item.reference_date,
        historyValue:
          Number(
            item.current_value || 0
          ),
      }));

      const combined = [
        ...movements,
        ...snapshots,
      ].sort((a, b) => {
        const dateComparison =
          String(
            b.historyDate || ""
          ).localeCompare(
            String(
              a.historyDate || ""
            )
          );

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return String(
          b.created_at || ""
        ).localeCompare(
          String(
            a.created_at || ""
          )
        );
      });

      setItems(combined);
    } catch (error) {
      console.error(
        "Erro ao carregar histórico do investimento:",
        error
      );

      alert(
        "Não foi possível carregar o histórico do investimento."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open || !investment) {
    return null;
  }

  const invested = Number(
    investment.invested_value || 0
  );

  const current = Number(
    investment.current_value || 0
  );

  const result =
    current - invested;

  const returnPercentage =
    invested > 0
      ? (result / invested) * 100
      : 0;


  function startEdit(item) {
    setEditingId(item.id);

    if (item.historyType === "atualizacao_valor") {
        setEditAmount(
        String(item.current_value ?? "")
        );

        setEditDate(
        item.reference_date || ""
        );
    } else {
        setEditAmount(
        String(item.amount ?? "")
        );

        setEditDate(
        item.movement_date || ""
        );
    }

    setEditNotes(item.notes || "");
    }

    function cancelEdit() {
        setEditingId(null);
        setEditAmount("");
        setEditDate("");
        setEditNotes("");
    }

    async function deleteMovement(item) {
        const label =
            item.historyType === "aporte"
            ? "aporte"
            : "resgate";

        const confirmed =
            window.confirm(
            `Excluir este ${label} de ${money(
                item.amount
            )}?`
            );

        if (!confirmed) return;

        const amount = Number(
            item.amount || 0
        );

        const currentInvested =
            Number(
            investment.invested_value || 0
            );

        /*
        * Excluir aporte retira capital.
        * Excluir resgate devolve capital.
        */
        const newInvestedValue =
            item.historyType === "aporte"
            ? currentInvested - amount
            : currentInvested + amount;

        if (newInvestedValue < 0) {
            alert(
            "Não é possível excluir este aporte porque o capital aplicado ficaria negativo."
            );
            return;
        }

        setSaving(true);

        const deletedAt =
            new Date().toISOString();

        try {
            /*
            * 1. Soft delete da movimentação
            */
            const { error: movementError } =
            await supabase
                .from(
                "finance_investment_movements"
                )
                .update({
                deleted_at: deletedAt,
                deleted_by:
                    user?.id || null,
                })
                .eq("id", item.id);

            if (movementError) {
            throw movementError;
            }

            /*
            * 2. Ajusta o investimento.
            */
            const { error: investmentError } =
            await supabase
                .from("finance_investments")
                .update({
                invested_value:
                    newInvestedValue,
                updated_at:
                    new Date().toISOString(),
                })
                .eq("id", investment.id);

            if (investmentError) {
            /*
            * rollback
            */
            await supabase
                .from(
                "finance_investment_movements"
                )
                .update({
                deleted_at: null,
                deleted_by: null,
                })
                .eq("id", item.id);

            throw investmentError;
            }

            await supabase
            .from("activity_logs")
            .insert({
                user_id:
                user?.id || null,
                module: "Financeiro",
                action: "deleted",
                entity_type:
                "finance_investment_movement",
                entity_id: item.id,
                entity_name:
                investment.name,
                details: {
                message:
                    `Excluiu ${label} de ${investment.name}`,
                investment_id:
                    investment.id,
                movement_type:
                    item.historyType,
                amount,
                previous_invested_value:
                    currentInvested,
                new_invested_value:
                    newInvestedValue,
                },
            });

            investment.invested_value =
            newInvestedValue;

            await loadHistory();
            await onSaved?.();
        } catch (error) {
            console.error(
            "Erro ao excluir movimentação do investimento:",
            error
            );

            alert(
            "Não foi possível excluir a movimentação."
            );
        } finally {
            setSaving(false);
        }
        }

    async function saveMovementEdit(item) {
        const newAmount = Number(
            String(editAmount).replace(",", ".")
        );

        if (
            !newAmount ||
            newAmount <= 0
        ) {
            alert(
            "Informe um valor maior que zero."
            );
            return;
        }

        if (!editDate) {
            alert("Informe a data.");
            return;
        }

        const oldAmount = Number(
            item.amount || 0
        );

        const currentInvested = Number(
            investment.invested_value || 0
        );

        let newInvestedValue =
            currentInvested;

        if (
            item.historyType === "aporte"
        ) {
            newInvestedValue =
            currentInvested +
            (newAmount - oldAmount);
        }

        if (
            item.historyType === "resgate"
        ) {
            newInvestedValue =
            currentInvested -
            (newAmount - oldAmount);
        }

        if (newInvestedValue < 0) {
            alert(
            "Essa alteração faria o capital aplicado ficar negativo."
            );
            return;
        }

        setSaving(true);

        try {
            /*
            * 1. Atualiza a movimentação
            */
            const { error: movementError } =
            await supabase
                .from(
                "finance_investment_movements"
                )
                .update({
                amount: newAmount,
                movement_date: editDate,
                notes:
                    editNotes.trim() || null,
                updated_at:
                    new Date().toISOString(),
                })
                .eq("id", item.id);

            if (movementError) {
            throw movementError;
            }

            /*
            * 2. Atualiza apenas pela diferença,
            * preservando o capital-base existente.
            */
            const { error: investmentError } =
            await supabase
                .from("finance_investments")
                .update({
                invested_value:
                    newInvestedValue,
                updated_at:
                    new Date().toISOString(),
                })
                .eq("id", investment.id);

            if (investmentError) {
            /*
            * rollback da movimentação
            */
            await supabase
                .from(
                "finance_investment_movements"
                )
                .update({
                amount: oldAmount,
                movement_date:
                    item.movement_date,
                notes: item.notes || null,
                })
                .eq("id", item.id);

            throw investmentError;
            }

            await supabase
            .from("activity_logs")
            .insert({
                user_id:
                user?.id || null,
                module: "Financeiro",
                action: "updated",
                entity_type:
                "finance_investment_movement",
                entity_id: item.id,
                entity_name:
                investment.name,
                details: {
                message:
                    `Editou ${item.historyType} de ${investment.name}`,
                investment_id:
                    investment.id,
                movement_type:
                    item.historyType,
                old_amount:
                    oldAmount,
                new_amount:
                    newAmount,
                previous_invested_value:
                    currentInvested,
                new_invested_value:
                    newInvestedValue,
                },
            });

            /*
            * Atualizamos também o objeto que
            * está sendo usado pelo modal.
            */
            investment.invested_value =
            newInvestedValue;

            cancelEdit();

            await loadHistory();
            await onSaved?.();
        } catch (error) {
            console.error(
            "Erro ao editar movimentação do investimento:",
            error
            );

            alert(
            "Não foi possível editar a movimentação."
            );
        } finally {
            setSaving(false);
        }
        }

    async function syncInvestmentCurrentValue() {
        const { data, error } = await supabase
            .from("finance_investment_snapshots")
            .select("*")
            .eq("investment_id", investment.id)
            .is("deleted_at", null)
            .order("reference_date", {
            ascending: false,
            })
            .order("created_at", {
            ascending: false,
            })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        /*
        * Se ainda existe snapshot, ele passa
        * a ser o valor atual do investimento.
        */
        if (data) {
            const newCurrentValue = Number(
            data.current_value || 0
            );

            const { error: investmentError } =
            await supabase
                .from("finance_investments")
                .update({
                current_value: newCurrentValue,
                reference_date:
                    data.reference_date,
                updated_at:
                    new Date().toISOString(),
                })
                .eq("id", investment.id);

            if (investmentError) {
            throw investmentError;
            }

            investment.current_value =
            newCurrentValue;

            investment.reference_date =
            data.reference_date;

            return;
        }

        /*
        * Se não sobrou nenhum snapshot,
        * não vamos inventar um valor.
        *
        * Mantemos o current_value existente,
        * mas retiramos a data de atualização.
        */
        const { error: investmentError } =
            await supabase
            .from("finance_investments")
            .update({
                reference_date: null,
                updated_at:
                new Date().toISOString(),
            })
            .eq("id", investment.id);

        if (investmentError) {
            throw investmentError;
        }

        investment.reference_date = null;
        }

    async function saveSnapshotEdit(item) {
        const newValue = Number(
            String(editAmount).replace(",", ".")
        );

        if (
            Number.isNaN(newValue) ||
            newValue < 0
        ) {
            alert(
            "Informe um valor válido."
            );
            return;
        }

        if (!editDate) {
            alert("Informe a data.");
            return;
        }

        const oldValue = Number(
            item.current_value || 0
        );

        const oldDate =
            item.reference_date;

        const oldNotes =
            item.notes || null;

        setSaving(true);

        try {
            const { error: snapshotError } =
            await supabase
                .from(
                "finance_investment_snapshots"
                )
                .update({
                current_value: newValue,
                reference_date: editDate,
                notes:
                    editNotes.trim() || null,
                updated_at:
                    new Date().toISOString(),
                })
                .eq("id", item.id);

            if (snapshotError) {
            /*
            * O índice do banco impede dois
            * snapshots ativos no mesmo dia.
            */
            if (
                snapshotError.code === "23505"
            ) {
                alert(
                "Já existe uma atualização de valor para essa data."
                );

                return;
            }

            throw snapshotError;
            }

            try {
            await syncInvestmentCurrentValue();
            } catch (syncError) {
            /*
            * Rollback do snapshot.
            */
            await supabase
                .from(
                "finance_investment_snapshots"
                )
                .update({
                current_value: oldValue,
                reference_date: oldDate,
                notes: oldNotes,
                updated_at:
                    new Date().toISOString(),
                })
                .eq("id", item.id);

            throw syncError;
            }

            await supabase
            .from("activity_logs")
            .insert({
                user_id:
                user?.id || null,
                module: "Financeiro",
                action: "updated",
                entity_type:
                "finance_investment_snapshot",
                entity_id: item.id,
                entity_name:
                investment.name,
                details: {
                message:
                    `Editou atualização de valor de ${investment.name}`,
                investment_id:
                    investment.id,
                old_value: oldValue,
                new_value: newValue,
                old_reference_date:
                    oldDate,
                new_reference_date:
                    editDate,
                },
            });

            cancelEdit();

            await loadHistory();
            await onSaved?.();
        } catch (error) {
            console.error(
            "Erro ao editar atualização de valor:",
            error
            );

            alert(
            "Não foi possível editar a atualização de valor."
            );
        } finally {
            setSaving(false);
        }
        }

    async function deleteSnapshot(item) {
        const confirmed =
            window.confirm(
            `Excluir a atualização de ${formatDate(
                item.reference_date
            )} no valor de ${money(
                item.current_value
            )}?`
            );

        if (!confirmed) return;

        const deletedAt =
            new Date().toISOString();

        setSaving(true);

        try {
            const { error: snapshotError } =
            await supabase
                .from(
                "finance_investment_snapshots"
                )
                .update({
                deleted_at: deletedAt,
                deleted_by:
                    user?.id || null,
                })
                .eq("id", item.id);

            if (snapshotError) {
            throw snapshotError;
            }

            try {
            await syncInvestmentCurrentValue();
            } catch (syncError) {
            /*
            * Se a sincronização falhar,
            * restaura o snapshot.
            */
            await supabase
                .from(
                "finance_investment_snapshots"
                )
                .update({
                deleted_at: null,
                deleted_by: null,
                })
                .eq("id", item.id);

            throw syncError;
            }

            await supabase
            .from("activity_logs")
            .insert({
                user_id:
                user?.id || null,
                module: "Financeiro",
                action: "deleted",
                entity_type:
                "finance_investment_snapshot",
                entity_id: item.id,
                entity_name:
                investment.name,
                details: {
                message:
                    `Excluiu atualização de valor de ${investment.name}`,
                investment_id:
                    investment.id,
                current_value:
                    Number(
                    item.current_value || 0
                    ),
                reference_date:
                    item.reference_date,
                },
            });

            await loadHistory();
            await onSaved?.();
        } catch (error) {
            console.error(
            "Erro ao excluir atualização de valor:",
            error
            );

            alert(
            "Não foi possível excluir a atualização de valor."
            );
        } finally {
            setSaving(false);
        }
        }

    function getItemInfo(item) {
        if (
            item.historyType === "aporte" &&
            item.notes === "Saldo inicial"
        ) {
            return {
            label: "Saldo inicial",
            value: `+${money(item.historyValue)}`,
            color: COLORS.primaryDark,
            background: COLORS.primaryLight,
            };
        }

        if (item.historyType === "aporte") {
            return {
            label: "Aporte",
            value: `+${money(item.historyValue)}`,
            color: COLORS.primaryDark,
            background: COLORS.primaryLight,
            };
        }

        if (item.historyType === "resgate") {
            return {
            label: "Resgate",
            value: `-${money(item.historyValue)}`,
            color:
                COLORS.warning ||
                COLORS.inkSoft,
            background:
                COLORS.warningLight ||
                COLORS.bg,
            };
        }

        if (
          item.historyType === "atualizacao_valor" &&
          item.notes === "Valor inicial"
        ) {
          return {
            label: "Valor inicial",
            value: money(item.historyValue),
            color: COLORS.ink,
            background: COLORS.bg,
          };
        }

        return {
            label: "Atualização de valor",
            value: money(item.historyValue),
            color: COLORS.ink,
            background: COLORS.bg,
        };
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
          maxWidth: 620,
          maxHeight: "85vh",
          background:
            COLORS.surface,
          borderRadius: 16,
          border:
            `1px solid ${COLORS.border}`,
          boxShadow:
            "0 20px 60px rgba(15, 23, 42, 0.18)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
              Histórico do investimento
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

        <div
          style={{
            overflowY: "auto",
            padding: 17,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                padding: 10,
                borderRadius: 9,
                background:
                  COLORS.primaryLight,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color:
                    COLORS.inkSoft,
                }}
              >
                Aplicado
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    COLORS.primaryDark,
                }}
              >
                {money(invested)}
              </div>
            </div>

            <div
              style={{
                padding: 10,
                borderRadius: 9,
                background: COLORS.bg,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color:
                    COLORS.inkSoft,
                }}
              >
                Valor atual
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.ink,
                }}
              >
                {money(current)}
              </div>
            </div>

            <div
              style={{
                padding: 10,
                borderRadius: 9,
                background:
                  result >= 0
                    ? COLORS.primaryLight
                    : COLORS.dangerLight,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color:
                    COLORS.inkSoft,
                }}
              >
                Resultado
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 12,
                  fontWeight: 700,
                  color:
                    result >= 0
                      ? COLORS.primaryDark
                      : COLORS.danger,
                }}
              >
                {result >= 0
                  ? "+"
                  : ""}
                {money(result)}
              </div>

              <div
                style={{
                  marginTop: 2,
                  fontSize: 9,
                  color:
                    result >= 0
                      ? COLORS.primaryDark
                      : COLORS.danger,
                }}
              >
                {returnPercentage >= 0
                  ? "+"
                  : ""}
                {returnPercentage.toFixed(
                  2
                )}
                %
              </div>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color:
                  COLORS.inkSoft,
                fontSize: 11,
              }}
            >
              Carregando histórico...
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color:
                  COLORS.inkSoft,
                fontSize: 11,
                border:
                  `1px dashed ${COLORS.border}`,
                borderRadius: 10,
              }}
            >
              Nenhuma movimentação
              registrada.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 8,
              }}
            >
              {items.map((item) => {
                const info =
                  getItemInfo(item);

                return (
                  <div
                    key={`${item.historyType}-${item.id}`}
                    style={{
                      border:
                        `1px solid ${COLORS.border}`,
                      borderRadius: 10,
                      padding: 11,
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 12,
                      alignItems:
                        "center",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 7,
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding:
                              "3px 7px",
                            borderRadius:
                              999,
                            background:
                              info.background,
                            color:
                              info.color,
                            fontSize: 9,
                            fontWeight:
                              600,
                          }}
                        >
                          {info.label}
                        </span>

                        <span
                          style={{
                            fontSize:
                              9.5,
                            color:
                              COLORS.inkSoft,
                          }}
                        >
                          {formatDate(
                            item.historyDate
                          )}
                        </span>
                      </div>

                      {item.notes &&
                        item.notes !== "Saldo inicial" &&
                        item.notes !== "Valor inicial" && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize:
                              9.5,
                            color:
                              COLORS.inkSoft,
                            lineHeight:
                              1.4,
                          }}
                        >
                          {item.notes}
                        </div>
                      )}
                    </div>

                    {editingId === item.id ? (
                        <div
                            style={{
                            width: "100%",
                            display: "grid",
                            gridTemplateColumns:
                                "minmax(100px, 1fr) minmax(120px, 1fr)",
                            gap: 7,
                            marginTop: 8,
                            }}
                        >
                            <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editAmount}
                            onChange={(event) =>
                                setEditAmount(
                                event.target.value
                                )
                            }
                            style={smallInputStyle}
                            />

                            <input
                            type="date"
                            value={editDate}
                            onChange={(event) =>
                                setEditDate(
                                event.target.value
                                )
                            }
                            style={smallInputStyle}
                            />

                            <input
                            type="text"
                            value={editNotes}
                            placeholder="Observações"
                            onChange={(event) =>
                                setEditNotes(
                                event.target.value
                                )
                            }
                            style={{
                                ...smallInputStyle,
                                gridColumn: "1 / -1",
                            }}
                            />

                            <div
                            style={{
                                gridColumn: "1 / -1",
                                display: "flex",
                                justifyContent:
                                "flex-end",
                                gap: 6,
                            }}
                            >
                            <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={saving}
                                style={miniButtonStyle}
                            >
                                <X size={12} />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (
                                        item.historyType ===
                                        "atualizacao_valor"
                                    ) {
                                        saveSnapshotEdit(item);
                                    } else {
                                        saveMovementEdit(item);
                                    }
                                    }}
                                disabled={saving}
                                style={{
                                ...miniButtonStyle,
                                color:
                                    COLORS.primaryDark,
                                background:
                                    COLORS.primaryLight,
                                }}
                            >
                                <Check size={12} />
                            </button>
                            </div>
                        </div>
                        ) : (
                        <div
                            style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            flexShrink: 0,
                            }}
                        >
                            <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: info.color,
                                whiteSpace: "nowrap",
                            }}
                            >
                            {info.value}
                            </div>

                            {(
                              (
                                item.historyType === "atualizacao_valor" &&
                                item.notes !== "Valor inicial"
                              ) ||
                              (
                                (
                                  item.historyType === "aporte" ||
                                  item.historyType === "resgate"
                                ) &&
                                item.notes !== "Saldo inicial"
                              )
                            ) && (
                            <>
                                <button
                                type="button"
                                title="Editar movimentação"
                                onClick={() =>
                                    startEdit(item)
                                }
                                style={miniButtonStyle}
                                >
                                <Pencil size={11} />
                                </button>

                                <button
                                type="button"
                                title="Excluir movimentação"
                                onClick={() => {
                                    if (
                                        item.historyType ===
                                        "atualizacao_valor"
                                    ) {
                                        deleteSnapshot(item);
                                    } else {
                                        deleteMovement(item);
                                    }
                                    }}
                                style={{
                                    ...miniButtonStyle,
                                    background:
                                    COLORS.dangerLight,
                                    color:
                                    COLORS.danger,
                                    border: "none",
                                }}
                                >
                                <Trash2 size={11} />
                                </button>
                            </>
                            )}
                        </div>
                        )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* COLE AQUI ↓ */

const smallInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 7,
  padding: "7px 8px",
  background: COLORS.surface,
  color: COLORS.ink,
  fontSize: 10,
  outline: "none",
};

const miniButtonStyle = {
  width: 25,
  height: 25,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  background: COLORS.surface,
  color: COLORS.inkSoft,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  padding: 0,
};