import { useEffect, useState } from "react";
import {
  X,
  Pencil,
  Trash2,
} from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function GoalHistoryModal({
  open,
  onClose,
  onSaved,
  user,
  goal,
}) {
  const [contributions, setContributions] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [editingContribution, setEditingContribution] =
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
    if (!open || !goal) return;

    loadContributions();
  }, [open, goal]);

  if (!open || !goal) return null;

  async function loadContributions() {
    setLoading(true);

    try {
      const { data, error } =
        await supabase
          .from("finance_goal_contributions")
          .select("*")
          .eq("goal_id", goal.id)
          .is("deleted_at", null)
          .order("contribution_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          });

      if (error) throw error;

      setContributions(data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar aportes:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(contribution) {
    setEditingContribution(contribution);

    setEditAmount(
      String(contribution.amount || "")
    );

    setEditDate(
      contribution.contribution_date || ""
    );

    setEditNotes(
      contribution.notes || ""
    );
  }

  function cancelEdit() {
    setEditingContribution(null);
    setEditAmount("");
    setEditDate("");
    setEditNotes("");
  }

  async function saveEdit() {
    if (!editingContribution) return;

    const newAmount = Number(
      String(editAmount).replace(",", ".")
    );

    if (!newAmount || newAmount <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    if (!editDate) {
      alert("Informe a data do aporte.");
      return;
    }

    setSaving(true);

    try {
      const oldAmount = Number(
        editingContribution.amount || 0
      );

      /*
       * Não recalculamos a meta somando somente
       * os aportes porque ela pode ter sido
       * criada com um valor inicial.
       *
       * Aplicamos apenas a diferença.
       */
      const difference =
        newAmount - oldAmount;

      const currentGoalValue =
        Number(goal.current_value || 0);

      const newGoalValue =
        Math.max(
          0,
          currentGoalValue + difference
        );

      const targetValue =
        Number(goal.target_value || 0);

      const newStatus =
        newGoalValue >= targetValue
          ? "concluida"
          : "ativa";

      // 1. Atualiza o aporte
      const { error: contributionError } =
        await supabase
          .from("finance_goal_contributions")
          .update({
            amount: newAmount,
            contribution_date: editDate,
            notes:
              editNotes.trim() || null,
          })
          .eq(
            "id",
            editingContribution.id
          );

      if (contributionError) {
        throw contributionError;
      }

      // 2. Atualiza a meta pela diferença
      const { error: goalError } =
        await supabase
          .from("finance_goals")
          .update({
            current_value: newGoalValue,
            status: newStatus,
          })
          .eq("id", goal.id);

      if (goalError) {
        // Reverte o aporte
        await supabase
          .from("finance_goal_contributions")
          .update({
            amount: oldAmount,
            contribution_date:
              editingContribution
                .contribution_date,
            notes:
              editingContribution.notes ||
              null,
          })
          .eq(
            "id",
            editingContribution.id
          );

        throw goalError;
      }

      await supabase
        .from("activity_logs")
        .insert({
          user_id: user?.id || null,
          module: "Financeiro",
          action: "updated",
          entity_type:
            "finance_goal_contribution",
          entity_id:
            editingContribution.id,
          entity_name: goal.title,
          details: {
            message:
              `Alterou aporte da meta ${goal.title}`,
            old_amount: oldAmount,
            new_amount: newAmount,
            difference,
            goal_id: goal.id,
          },
        });

      /*
       * Atualiza o próprio objeto da meta
       * utilizado pelo modal enquanto ele
       * permanece aberto.
       */
      goal.current_value =
        newGoalValue;

      goal.status =
        newStatus;

      cancelEdit();

      await loadContributions();
      await onSaved?.();
    } catch (error) {
      console.error(
        "Erro ao editar aporte:",
        error
      );

      alert(
        "Não foi possível editar o aporte."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteContribution(
    contribution
  ) {
    const confirmed = window.confirm(
      `Excluir o aporte de ${money(
        Number(contribution.amount || 0)
      )}?`
    );

    if (!confirmed) return;

    try {
      const amount =
        Number(contribution.amount || 0);

      const currentGoalValue =
        Number(goal.current_value || 0);

      const newGoalValue =
        Math.max(
          0,
          currentGoalValue - amount
        );

      const targetValue =
        Number(goal.target_value || 0);

      const newStatus =
        newGoalValue >= targetValue
          ? "concluida"
          : "ativa";

      const deletedAt =
        new Date().toISOString();

      // 1. Soft delete do aporte
      const {
        error: contributionError,
      } = await supabase
        .from("finance_goal_contributions")
        .update({
          deleted_at: deletedAt,
          deleted_by:
            user?.id || null,
        })
        .eq("id", contribution.id);

      if (contributionError) {
        throw contributionError;
      }

      // 2. Reduz o valor da meta
      const { error: goalError } =
        await supabase
          .from("finance_goals")
          .update({
            current_value: newGoalValue,
            status: newStatus,
          })
          .eq("id", goal.id);

      if (goalError) {
        // Reverte o soft delete
        await supabase
          .from("finance_goal_contributions")
          .update({
            deleted_at: null,
            deleted_by: null,
          })
          .eq("id", contribution.id);

        throw goalError;
      }

      await supabase
        .from("activity_logs")
        .insert({
          user_id: user?.id || null,
          module: "Financeiro",
          action: "deleted",
          entity_type:
            "finance_goal_contribution",
          entity_id: contribution.id,
          entity_name: goal.title,
          details: {
            message:
              `Excluiu aporte da meta ${goal.title}`,
            amount,
            goal_id: goal.id,
            new_goal_value:
              newGoalValue,
          },
        });

      goal.current_value =
        newGoalValue;

      goal.status =
        newStatus;

      await loadContributions();
      await onSaved?.();
    } catch (error) {
      console.error(
        "Erro ao excluir aporte:",
        error
      );

      alert(
        "Não foi possível excluir o aporte."
      );
    }
  }

  function money(value) {
    return Number(value || 0)
      .toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
  }

  const targetValue =
    Number(goal.target_value || 0);

  const currentValue =
    Number(goal.current_value || 0);

  const percentage =
    targetValue > 0
      ? Math.min(
          100,
          (currentValue / targetValue) *
            100
        )
      : 0;

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 9px",
    borderRadius: 8,
    border:
      `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.ink,
    fontSize: 12,
    outline: "none",
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
        zIndex: 9999,
        padding: 18,
      }}
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "85vh",
          overflow: "auto",
          background: COLORS.surface,
          borderRadius: 16,
          border:
            `1px solid ${COLORS.border}`,
          boxShadow:
            "0 20px 50px rgba(15,23,42,0.16)",
        }}
      >
        {/* CABEÇALHO */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom:
              `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent:
              "space-between",
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
              {goal.title}
            </div>

            <div
              style={{
                fontSize: 11.5,
                color: COLORS.inkSoft,
                marginTop: 3,
              }}
            >
              Histórico de aportes
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

        <div
          style={{
            padding: 18,
          }}
        >
          {/* RESUMO */}
          <div
            style={{
              background:
                COLORS.primaryLight,
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    color:
                      COLORS.inkSoft,
                  }}
                >
                  Valor atual
                </div>

                <div
                  style={{
                    marginTop: 2,
                    fontSize: 17,
                    fontWeight: 700,
                    color:
                      COLORS.primaryDark,
                  }}
                >
                  {money(currentValue)}
                </div>
              </div>

              <div
                style={{
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    color:
                      COLORS.inkSoft,
                  }}
                >
                  Objetivo
                </div>

                <div
                  style={{
                    marginTop: 2,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {money(targetValue)}
                </div>
              </div>
            </div>

            <div
              style={{
                height: 7,
                borderRadius: 999,
                background:
                  COLORS.surface,
                overflow: "hidden",
                marginTop: 12,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width:
                    `${percentage}%`,
                  background:
                    COLORS.primary,
                  borderRadius: 999,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 10.5,
                color:
                  COLORS.inkSoft,
              }}
            >
              {percentage.toFixed(1)}%
              concluído
            </div>
          </div>

          {/* HISTÓRICO */}
          {loading ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                fontSize: 12,
                color:
                  COLORS.inkSoft,
              }}
            >
              Carregando aportes...
            </div>
          ) : contributions.length ===
            0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                fontSize: 12,
                color:
                  COLORS.inkSoft,
              }}
            >
              Nenhum aporte registrado.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 8,
              }}
            >
              {contributions.map(
                (contribution) => {
                  const editing =
                    editingContribution?.id ===
                    contribution.id;

                  return (
                    <div
                      key={
                        contribution.id
                      }
                      style={{
                        border:
                          `1px solid ${COLORS.border}`,
                        borderRadius: 10,
                        padding: 11,
                      }}
                    >
                      {editing ? (
                        <div
                          style={{
                            display: "grid",
                            gap: 9,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "1fr 1fr",
                              gap: 8,
                            }}
                          >
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={
                                editAmount
                              }
                              onChange={(
                                e
                              ) =>
                                setEditAmount(
                                  e.target
                                    .value
                                )
                              }
                              style={
                                inputStyle
                              }
                            />

                            <input
                              type="date"
                              value={
                                editDate
                              }
                              onChange={(
                                e
                              ) =>
                                setEditDate(
                                  e.target
                                    .value
                                )
                              }
                              style={
                                inputStyle
                              }
                            />
                          </div>

                          <input
                            value={
                              editNotes
                            }
                            onChange={(e) =>
                              setEditNotes(
                                e.target
                                  .value
                              )
                            }
                            placeholder="Observação"
                            style={
                              inputStyle
                            }
                          />

                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "flex-end",
                              gap: 7,
                            }}
                          >
                            <button
                              type="button"
                              onClick={
                                cancelEdit
                              }
                              disabled={
                                saving
                              }
                              style={{
                                padding:
                                  "6px 9px",
                                borderRadius: 7,
                                border:
                                  `1px solid ${COLORS.border}`,
                                background:
                                  COLORS.surface,
                                color:
                                  COLORS.inkSoft,
                                cursor:
                                  "pointer",
                              }}
                            >
                              Cancelar
                            </button>

                            <button
                              type="button"
                              onClick={
                                saveEdit
                              }
                              disabled={
                                saving
                              }
                              style={{
                                padding:
                                  "6px 9px",
                                borderRadius: 7,
                                border:
                                  "none",
                                background:
                                  COLORS.primary,
                                color: "#fff",
                                fontWeight: 600,
                                cursor:
                                  "pointer",
                              }}
                            >
                              {saving
                                ? "Salvando..."
                                : "Salvar"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            gap: 12,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color:
                                  COLORS.primaryDark,
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              +{" "}
                              {money(
                                contribution.amount
                              )}
                            </div>

                            <div
                              style={{
                                marginTop: 3,
                                color:
                                  COLORS.inkSoft,
                                fontSize: 10.5,
                              }}
                            >
                              {new Date(
                                `${contribution.contribution_date}T12:00:00`
                              ).toLocaleDateString(
                                "pt-BR"
                              )}
                            </div>

                            {contribution.notes && (
                              <div
                                style={{
                                  marginTop: 4,
                                  color:
                                    COLORS.inkSoft,
                                  fontSize:
                                    10.5,
                                }}
                              >
                                {
                                  contribution.notes
                                }
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                startEdit(
                                  contribution
                                )
                              }
                              title="Editar aporte"
                              style={{
                                width: 29,
                                height: 29,
                                border:
                                  `1px solid ${COLORS.border}`,
                                borderRadius: 7,
                                background:
                                  COLORS.surface,
                                color:
                                  COLORS.primaryDark,
                                cursor:
                                  "pointer",
                                display: "grid",
                                placeItems:
                                  "center",
                              }}
                            >
                              <Pencil
                                size={12}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteContribution(
                                  contribution
                                )
                              }
                              title="Excluir aporte"
                              style={{
                                width: 29,
                                height: 29,
                                border:
                                  "none",
                                borderRadius: 7,
                                background:
                                  COLORS.dangerLight,
                                color:
                                  COLORS.danger,
                                cursor:
                                  "pointer",
                                display: "grid",
                                placeItems:
                                  "center",
                              }}
                            >
                              <Trash2
                                size={12}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}