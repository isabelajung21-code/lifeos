import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function BudgetModal({
  open,
  onClose,
  onSaved,
  user,
  budget = null,
  categories = [],
  monthStart,
}) {
  const [categoryId, setCategoryId] = useState("");
  const [budgetValue, setBudgetValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (budget) {
      setCategoryId(budget.category_id || "");
      setBudgetValue(
        budget.budget_value != null
          ? String(budget.budget_value)
          : ""
      );
      setNotes(budget.notes || "");
    } else {
      setCategoryId("");
      setBudgetValue("");
      setNotes("");
    }
  }, [open, budget]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!categoryId) {
      alert("Selecione uma categoria.");
      return;
    }

    const parsedValue = Number(
      String(budgetValue).replace(",", ".")
    );

    if (!parsedValue || parsedValue <= 0) {
      alert("Informe um valor de orçamento válido.");
      return;
    }

    if (!monthStart) {
      alert("Não foi possível identificar o mês.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        category_id: categoryId,
        month_start: monthStart,
        budget_value: parsedValue,
        notes: notes.trim() || null,
      };

      let savedBudget;

      if (budget?.id) {
        const { data, error } = await supabase
          .from("finance_budgets")
          .update(payload)
          .eq("id", budget.id)
          .select()
          .single();

        if (error) throw error;

        savedBudget = data;
      } else {
        const { data, error } = await supabase
          .from("finance_budgets")
          .insert({
            ...payload,
            created_by_user_id: user?.id || null,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            alert(
              "Já existe um orçamento para esta categoria neste mês."
            );
            return;
          }

          throw error;
        }

        savedBudget = data;
      }

      await supabase
        .from("activity_logs")
        .insert({
          user_id: user?.id || null,
          module: "Financeiro",
          action: budget?.id
            ? "updated"
            : "created",
          entity_type: "finance_budget",
          entity_id: savedBudget.id,
          entity_name:
            categories.find(
              (category) =>
                category.id === categoryId
            )?.name || "Orçamento",
          details: {
            message: budget?.id
              ? "Atualizou um orçamento mensal."
              : "Criou um orçamento mensal.",
            month_start: monthStart,
            budget_value: parsedValue,
          },
        });

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar orçamento:",
        error
      );

      alert(
        `Erro ao salvar orçamento: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  const availableCategories = categories.filter(
    (category) =>
      category.type === "despesa" ||
      category.transaction_type === "despesa" ||
      (!category.type &&
        !category.transaction_type)
  );

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15, 23, 42, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 470,
          background: COLORS.surface,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          padding: 18,
          boxShadow:
            "0 18px 50px rgba(15, 23, 42, 0.16)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 750,
                color: COLORS.ink,
              }}
            >
              {budget
                ? "Editar orçamento"
                : "Novo orçamento"}
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 10,
                color: COLORS.inkSoft,
              }}
            >
              Defina o limite mensal da categoria.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              border: "none",
              borderRadius: 8,
              background: COLORS.bg,
              color: COLORS.inkSoft,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <label
          style={{
            display: "block",
            fontSize: 10,
            color: COLORS.inkSoft,
            marginBottom: 5,
          }}
        >
          Categoria
        </label>

        <select
          value={categoryId}
          onChange={(e) =>
            setCategoryId(e.target.value)
          }
          disabled={Boolean(budget)}
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 9,
            padding: "9px 10px",
            background: COLORS.surface,
            color: COLORS.ink,
            fontSize: 11,
            outline: "none",
          }}
        >
          <option value="">
            Selecione...
          </option>

          {availableCategories.map(
            (category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            )
          )}
        </select>

        <label
          style={{
            display: "block",
            fontSize: 10,
            color: COLORS.inkSoft,
            marginTop: 14,
            marginBottom: 5,
          }}
        >
          Limite mensal
        </label>

        <input
          type="number"
          min="0.01"
          step="0.01"
          value={budgetValue}
          onChange={(e) =>
            setBudgetValue(e.target.value)
          }
          placeholder="0,00"
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 9,
            padding: "9px 10px",
            background: COLORS.surface,
            color: COLORS.ink,
            fontSize: 11,
            outline: "none",
          }}
        />

        <label
          style={{
            display: "block",
            fontSize: 10,
            color: COLORS.inkSoft,
            marginTop: 14,
            marginBottom: 5,
          }}
        >
          Observações
        </label>

        <textarea
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          rows={3}
          placeholder="Opcional"
          style={{
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 9,
            padding: "9px 10px",
            background: COLORS.surface,
            color: COLORS.ink,
            fontSize: 11,
            outline: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.inkSoft,
              borderRadius: 9,
              padding: "8px 13px",
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
              background: COLORS.primary,
              color: "#fff",
              borderRadius: 9,
              padding: "8px 14px",
              cursor: saving
                ? "wait"
                : "pointer",
              fontSize: 10.5,
              fontWeight: 700,
            }}
          >
            {saving
              ? "Salvando..."
              : budget
                ? "Salvar alterações"
                : "Criar orçamento"}
          </button>
        </div>
      </form>
    </div>
  );
}