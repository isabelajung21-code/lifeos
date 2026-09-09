import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function TrashPage({ currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrash();
  }, [currentUser]);

  async function loadTrash() {
    setLoading(true);

    try {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("display_name", currentUser)
        .single();

      if (userError) throw userError;

      const [
        tasksResult,
        notesResult,
        datesResult,
        eventsResult,
        accountsResult,
        cardsResult,
        transactionsResult,
        recurrencesResult,
        budgetsResult,
        subscriptionsResult,
        goalsResult,
        investmentsResult,
      ] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("owner_user_id", user.id)
          .not("deleted_at", "is", null),

        supabase
          .from("quick_notes")
          .select("*")
          .eq("owner_user_id", user.id)
          .not("deleted_at", "is", null),

        supabase
          .from("important_dates")
          .select("*")
          .eq("owner_user_id", user.id)
          .not("deleted_at", "is", null),

        supabase
          .from("calendar_events")
          .select("*")
          .eq("owner_user_id", user.id)
          .not("deleted_at", "is", null),

        supabase
          .from("finance_accounts")
          .select("*")
          .not("deleted_at", "is", null),

        supabase
          .from("finance_cards")
          .select("*")
          .not("deleted_at", "is", null),

        supabase
          .from("finance_transactions")
          .select("*")
          .not("deleted_at", "is", null),

        supabase
          .from("finance_recurrences")
          .select("*")
          .not("deleted_at", "is", null),

        supabase
          .from("finance_budgets")
          .select(`
            *,
            category:finance_categories(id, name)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("finance_subscriptions")
          .select(`
            *,
            category:finance_categories(id, name),
            account:finance_accounts(id, name),
            card:finance_cards(id, name)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("finance_goals")
          .select("*")
          .not("deleted_at", "is", null),

        supabase
          .from("finance_investments")
          .select("*")
          .not("deleted_at", "is", null),

        ]);

      const tasks = (tasksResult.data || []).map((item) => ({
        ...item,
        type: "task",
        title: item.title,
        module: item.source_module || "Geral",
      }));

      const notes = (notesResult.data || []).map((item) => ({
        ...item,
        type: "note",
        title: item.content,
        module: "Início",
      }));

      const dates = (datesResult.data || []).map((item) => ({
        ...item,
        type: "important_date",
        title: item.title,
        module: "Início",
      }));

      const events = (eventsResult.data || []).map((item) => ({
        ...item,
        type: "calendar_event",
        title: item.title,
        module: "Início",
      }));

      const accounts = (accountsResult.data || []).map((item) => ({
        ...item,
        type: "finance_account",
        title: item.name,
        module: "Financeiro",
      }));

      const cards = (cardsResult.data || []).map((item) => ({
        ...item,
        type: "finance_card",
        title: item.name,
        module: "Financeiro",
      }));

      const transactions = (transactionsResult.data || []).map(
        (item) => ({
          ...item,
          type: "finance_transaction",
          title: item.title,
          module: "Financeiro",
        })
      );

      const subscriptionRecurrenceIds = new Set(
        (subscriptionsResult.data || [])
          .map((subscription) => subscription.recurrence_id)
          .filter(Boolean)
      );

      const recurrences = (recurrencesResult.data || [])
        .filter(
          (item) =>
            !subscriptionRecurrenceIds.has(item.id)
        )
        .map((item) => ({
          ...item,
          type: "finance_recurrence",
          title: item.title,
          module: "Financeiro",
        }));

      const budgets = (budgetsResult.data || []).map(
        (item) => ({
          ...item,
          type: "finance_budget",
          title:
            item.category?.name
              ? `Orçamento — ${item.category.name}`
              : "Orçamento financeiro",
          module: "Financeiro",
        })
      );

      const subscriptions = (
        subscriptionsResult.data || []
      ).map((item) => ({
        ...item,
        type: "finance_subscription",
        title: item.name,
        module: "Financeiro",
      }));

      const goals = (
        goalsResult.data || []
      ).map((item) => ({
        ...item,
        type: "finance_goal",
        title: item.title,
        module: "Financeiro",
      }));

      const investments = (
        investmentsResult.data || []
      ).map((item) => ({
        ...item,
        type: "finance_investment",
        title: item.name,
        module: "Financeiro",
      }));

      const all = [
        ...tasks,
        ...notes,
        ...dates,
        ...events,
        ...accounts,
        ...cards,
        ...transactions,
        ...recurrences,
        ...budgets,
        ...subscriptions,
        ...goals,
        ...investments,
      ].sort(
        (a, b) =>
          new Date(b.deleted_at) - new Date(a.deleted_at)
      );

      setItems(all);
    } catch (error) {
      console.error("Erro ao carregar lixeira:", error);
    } finally {
      setLoading(false);
    }
  }

  function getTableByType(type) {
    const tables = {
      task: "tasks",
      note: "quick_notes",
      important_date: "important_dates",
      calendar_event: "calendar_events",

      finance_account: "finance_accounts",
      finance_card: "finance_cards",
      finance_transaction: "finance_transactions",
      finance_recurrence: "finance_recurrences",
      finance_budget: "finance_budgets",
      finance_subscription: "finance_subscriptions",
      finance_goal: "finance_goals",
      finance_investment: "finance_investments",
    };

    return tables[type];
  }

  function getTypeLabel(type) {
    const labels = {
      task: "Tarefa",
      note: "Anotação",
      important_date: "Data importante",
      calendar_event: "Evento",

      finance_account: "Conta",
      finance_card: "Cartão",
      finance_transaction: "Movimentação financeira",
      finance_recurrence: "Recorrência financeira",
      finance_budget: "Orçamento financeiro",
      finance_subscription: "Assinatura",
      finance_goal: "Meta financeira",
      finance_investment: "Investimento",
    };

    return labels[type] || "Item";
  }

  async function restoreItem(item) {
    try {
      const table = getTableByType(item.type);

      if (!table) {
        throw new Error("Tipo de item não reconhecido.");
      }

      // =====================================
      // DESCOBRE O USUÁRIO ATUAL
      // =====================================

      const { data: user, error: userError } =
        await supabase
          .from("users")
          .select("id")
          .eq("display_name", currentUser)
          .single();

      if (userError) throw userError;

      // =====================================
      // RESTAURA O ITEM PRINCIPAL
      // =====================================
      if (item.type === "finance_budget") {
        const { data: existingBudget, error: checkError } =
          await supabase
            .from("finance_budgets")
            .select("id")
            .eq("category_id", item.category_id)
            .eq("month_start", item.month_start)
            .is("deleted_at", null)
            .maybeSingle();

        if (checkError) {
          console.error(
            "Erro ao verificar orçamento existente:",
            checkError
          );

          alert(
            "Não foi possível verificar se este orçamento pode ser restaurado."
          );

          return;
        }

        if (existingBudget) {
          alert(
            "Não é possível restaurar este orçamento porque já existe outro orçamento para esta categoria neste mesmo mês."
          );

          return;
        }
      }

      if (item.type === "finance_subscription") {
        const today = new Date()
          .toISOString()
          .slice(0, 10);

        /*
        * Primeiro restaura a recorrência vinculada.
        */
        if (item.recurrence_id) {
          const {
            data: recurrence,
            error: recurrenceCheckError,
          } = await supabase
            .from("finance_recurrences")
            .select("*")
            .eq("id", item.recurrence_id)
            .maybeSingle();

          if (recurrenceCheckError) {
            throw recurrenceCheckError;
          }

          if (recurrence) {
            let nextRunDate =
              recurrence.next_run_date ||
              item.next_billing_date ||
              item.start_date ||
              today;

            if (nextRunDate < today) {
              nextRunDate = today;
            }

            const { error: recurrenceRestoreError } =
              await supabase
                .from("finance_recurrences")
                .update({
                  deleted_at: null,
                  deleted_by: null,
                  is_active: true,
                  next_run_date: nextRunDate,
                })
                .eq("id", item.recurrence_id);

            if (recurrenceRestoreError) {
              throw recurrenceRestoreError;
            }
          }
        }
      }

      const restoreData = {
        deleted_at: null,
        deleted_by: null,
      };

      if (item.type === "finance_subscription") {
        restoreData.is_active = true;

        const today = new Date()
          .toISOString()
          .slice(0, 10);

        let nextBillingDate =
          item.next_billing_date ||
          item.start_date ||
          today;

        if (nextBillingDate < today) {
          nextBillingDate = today;
        }

        restoreData.next_billing_date =
          nextBillingDate;
      }

      // Contas e cartões foram desativados
      // quando enviados para a Lixeira.
      if (
        item.type === "finance_account" ||
        item.type === "finance_card"
      ) {
        restoreData.is_active = true;
      }

      // =====================================
      // RESTAURA RECORRÊNCIA FINANCEIRA
      // =====================================

      if (item.type === "finance_recurrence") {
        restoreData.is_active = true;

        const today =
          new Date()
            .toISOString()
            .slice(0, 10);

        let nextRunDate =
          item.next_run_date ||
          item.start_date ||
          today;

        // Se a data armazenada ficou no passado,
        // usamos hoje como ponto de retomada.
        //
        // O processador de recorrências poderá
        // continuar a série sem recriar registros
        // que já existam.
        if (nextRunDate < today) {
          nextRunDate = today;
        }

        restoreData.next_run_date =
          nextRunDate;
      }

      const { error: restoreError } =
        await supabase
          .from(table)
          .update(restoreData)
          .eq("id", item.id);

      if (restoreError) {
        throw restoreError;
      }

      // =====================================
      // SE FOR MOVIMENTAÇÃO FINANCEIRA,
      // VERIFICA SE ERA PAGAMENTO DE FATURA
      // =====================================

      if (item.type === "finance_transaction") {
        const {
          data: deletedAllocations,
          error: allocationsError,
        } = await supabase
          .from("finance_payment_allocations")
          .select(`
            id,
            card_transaction_id,
            amount
          `)
          .eq(
            "payment_transaction_id",
            item.id
          )
          .not("deleted_at", "is", null);

        if (allocationsError) {
          throw allocationsError;
        }

        const isInvoicePayment =
          (deletedAllocations || []).length > 0;

        // =====================================
        // RESTAURA AS ALOCAÇÕES DO PAGAMENTO
        // =====================================

        if (isInvoicePayment) {
          const allocationIds =
            deletedAllocations.map(
              (allocation) => allocation.id
            );

          const affectedTransactionIds = [
            ...new Set(
              deletedAllocations.map(
                (allocation) =>
                  allocation.card_transaction_id
              )
            ),
          ];

          const {
            error: restoreAllocationsError,
          } = await supabase
            .from("finance_payment_allocations")
            .update({
              deleted_at: null,
              deleted_by: null,
            })
            .in("id", allocationIds);

          if (restoreAllocationsError) {
            throw restoreAllocationsError;
          }

          // =====================================
          // BUSCA TODAS AS ALOCAÇÕES ATIVAS
          // DAS PARCELAS AFETADAS
          // =====================================

          const {
            data: activeAllocations,
            error: activeAllocationsError,
          } = await supabase
            .from("finance_payment_allocations")
            .select(`
              card_transaction_id,
              amount
            `)
            .in(
              "card_transaction_id",
              affectedTransactionIds
            )
            .is("deleted_at", null);

          if (activeAllocationsError) {
            throw activeAllocationsError;
          }

          const paidByTransaction = {};

          (activeAllocations || []).forEach(
            (allocation) => {
              const transactionId =
                allocation.card_transaction_id;

              paidByTransaction[transactionId] =
                Number(
                  paidByTransaction[transactionId] || 0
                ) +
                Number(allocation.amount || 0);
            }
          );

          // =====================================
          // BUSCA AS PARCELAS AFETADAS
          // =====================================

          const {
            data: affectedTransactions,
            error: affectedTransactionsError,
          } = await supabase
            .from("finance_transactions")
            .select(`
              id,
              amount,
              status,
              paid_date
            `)
            .in(
              "id",
              affectedTransactionIds
            );

          if (affectedTransactionsError) {
            throw affectedTransactionsError;
          }

          // =====================================
          // RECALCULA STATUS DAS PARCELAS
          // =====================================

          for (
            const transaction of
            affectedTransactions || []
          ) {
            const originalAmount =
              Number(transaction.amount || 0);

            const totalPaid =
              Number(
                paidByTransaction[
                  transaction.id
                ] || 0
              );

            const fullyPaid =
              totalPaid >=
              originalAmount - 0.001;

            const {
              error: updateTransactionError,
            } = await supabase
              .from("finance_transactions")
              .update({
                status: fullyPaid
                  ? "pago"
                  : "previsto",

                paid_date: fullyPaid
                  ? item.paid_date ||
                    item.transaction_date
                  : null,

                // Mantemos a nova tabela de
                // alocações como fonte da verdade.
                invoice_payment_id: null,
              })
              .eq(
                "id",
                transaction.id
              );

            if (updateTransactionError) {
              throw updateTransactionError;
            }
          }

          // =====================================
          // HISTÓRICO
          // =====================================

          await supabase
            .from("activity_logs")
            .insert({
              user_id: user.id,
              module: "Financeiro",
              action: "restored",
              entity_type: "finance_transaction",
              entity_id: item.id,
              entity_name: item.title,
              details: {
                message: `Restaurou pagamento de fatura e ${deletedAllocations.length} alocação(ões): ${item.title}`,
              },
            });
        } else {
          // Movimentação financeira comum
          await supabase
            .from("activity_logs")
            .insert({
              user_id: user.id,
              module: "Financeiro",
              action: "restored",
              entity_type: "finance_transaction",
              entity_id: item.id,
              entity_name: item.title,
              details: {
                message: `Restaurou movimentação financeira: ${item.title}`,
              },
            });
        }
      }

      if (item.type === "finance_recurrence") {
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            module: "Financeiro",
            action: "restored",
            entity_type:
              "finance_recurrence",
            entity_id:
              item.id,
            entity_name:
              item.title,
            details: {
              message:
                `Restaurou recorrência financeira: ${item.title}`,
            },
          });
      }

      if (item.type === "finance_budget") {
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            module: "Financeiro",
            action: "restored",
            entity_type: "finance_budget",
            entity_id: item.id,
            entity_name:
              item.category?.name ||
              "Orçamento",
            details: {
              message:
                `Restaurou orçamento financeiro: ${
                  item.category?.name ||
                  "categoria"
                }`,
              month_start: item.month_start,
              budget_value: Number(
                item.budget_value || 0
              ),
            },
          });
      }

      if (item.type === "finance_subscription") {
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            module: "Financeiro",
            action: "restored",
            entity_type: "finance_subscription",
            entity_id: item.id,
            entity_name: item.name || item.title,
            details: {
              message:
                `Restaurou assinatura: ${
                  item.name || item.title
                }`,
              recurrence_id:
                item.recurrence_id || null,
            },
          });
      }

      if (item.type === "finance_goal") {
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            module: "Financeiro",
            action: "restored",
            entity_type: "finance_goal",
            entity_id: item.id,
            entity_name: item.title,
            details: {
              message:
                `Restaurou meta financeira: ${item.title}`,
              target_value: Number(
                item.target_value || 0
              ),
              current_value: Number(
                item.current_value || 0
              ),
            },
          });
      }

      if (item.type === "finance_investment") {
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            module: "Financeiro",
            action: "restored",
            entity_type:
              "finance_investment",
            entity_id: item.id,
            entity_name: item.name || item.title,
            details: {
              message:
                `Restaurou investimento: ${
                  item.name || item.title
                }`,
              invested_value: Number(
                item.invested_value || 0
              ),
              current_value: Number(
                item.current_value || 0
              ),
            },
          });
      }

      await loadTrash();
    } catch (error) {
      console.error(
        "Erro ao restaurar item:",
        error
      );

      alert(
        "Não foi possível restaurar o item."
      );
    }
  }

  async function deleteForever(item) {
    const confirmed = window.confirm(
      `Excluir definitivamente "${item.title}"? Essa ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      const table = getTableByType(item.type);

      if (!table) {
        throw new Error("Tipo de item não reconhecido.");
      }

      // =====================================
      // DESCOBRE O USUÁRIO ATUAL
      // =====================================

      const { data: user, error: userError } =
        await supabase
          .from("users")
          .select("id")
          .eq("display_name", currentUser)
          .single();

      if (userError) throw userError;

      if (item.type === "finance_subscription") {
        const subscriptionName =
          item.name || item.title;

        const recurrenceId =
          item.recurrence_id || null;

        /*
        * Primeiro apaga a assinatura.
        *
        * Fazemos nessa ordem porque ela possui
        * a FK recurrence_id.
        */
        const { error: deleteSubscriptionError } =
          await supabase
            .from("finance_subscriptions")
            .delete()
            .eq("id", item.id);

        if (deleteSubscriptionError) {
          throw deleteSubscriptionError;
        }

        /*
        * Depois apaga a regra.
        *
        * Isso NÃO apaga as movimentações históricas.
        * Elas continuam vinculadas ao recurrence_id
        * conforme as regras atuais do banco.
        */
        if (recurrenceId) {
          const { error: deleteRecurrenceError } =
            await supabase
              .from("finance_recurrences")
              .delete()
              .eq("id", recurrenceId);

          if (deleteRecurrenceError) {
            throw deleteRecurrenceError;
          }
        }

        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            module: "Financeiro",
            action: "deleted_forever",
            entity_type: "finance_subscription",
            entity_id: null,
            entity_name: subscriptionName,
            details: {
              message:
                `Excluiu definitivamente assinatura: ${subscriptionName}`,
              recurrence_id: recurrenceId,
            },
          });

        await loadTrash();

        return;
      }

      // =====================================
      // SE FOR MOVIMENTAÇÃO FINANCEIRA,
      // VERIFICA SE ERA PAGAMENTO DE FATURA
      // =====================================

      if (item.type === "finance_transaction") {
        const {
          data: allocations,
          error: allocationsError,
        } = await supabase
          .from("finance_payment_allocations")
          .select(`
            id,
            card_transaction_id,
            amount
          `)
          .eq(
            "payment_transaction_id",
            item.id
          );

        if (allocationsError) {
          throw allocationsError;
        }

        const affectedTransactionIds = [
          ...new Set(
            (allocations || []).map(
              (allocation) =>
                allocation.card_transaction_id
            )
          ),
        ];

        // =====================================
        // EXCLUI DEFINITIVAMENTE O PAGAMENTO
        //
        // As allocations vinculadas a ele
        // serão removidas por ON DELETE CASCADE.
        // =====================================

        const { error: deleteError } =
          await supabase
            .from("finance_transactions")
            .delete()
            .eq("id", item.id);

        if (deleteError) {
          throw deleteError;
        }

        // =====================================
        // SE ERA PAGAMENTO DE FATURA,
        // RECALCULA AS PARCELAS AFETADAS
        // =====================================

        if (affectedTransactionIds.length > 0) {
          const {
            data: remainingAllocations,
            error: remainingAllocationsError,
          } = await supabase
            .from("finance_payment_allocations")
            .select(`
              card_transaction_id,
              amount
            `)
            .in(
              "card_transaction_id",
              affectedTransactionIds
            )
            .is("deleted_at", null);

          if (remainingAllocationsError) {
            throw remainingAllocationsError;
          }

          const paidByTransaction = {};

          (remainingAllocations || []).forEach(
            (allocation) => {
              const transactionId =
                allocation.card_transaction_id;

              paidByTransaction[transactionId] =
                Number(
                  paidByTransaction[
                    transactionId
                  ] || 0
                ) +
                Number(allocation.amount || 0);
            }
          );

          // =====================================
          // BUSCA AS COMPRAS/PARCELAS
          // =====================================

          const {
            data: affectedTransactions,
            error: affectedTransactionsError,
          } = await supabase
            .from("finance_transactions")
            .select(`
              id,
              amount,
              status,
              paid_date
            `)
            .in(
              "id",
              affectedTransactionIds
            );

          if (affectedTransactionsError) {
            throw affectedTransactionsError;
          }

          // =====================================
          // ATUALIZA STATUS
          // =====================================

          for (
            const transaction of
            affectedTransactions || []
          ) {
            const amount =
              Number(transaction.amount || 0);

            const totalPaid =
              Number(
                paidByTransaction[
                  transaction.id
                ] || 0
              );

            const fullyPaid =
              totalPaid >= amount - 0.001;

            const { error: updateError } =
              await supabase
                .from("finance_transactions")
                .update({
                  status: fullyPaid
                    ? "pago"
                    : "previsto",

                  paid_date: fullyPaid
                    ? transaction.paid_date
                    : null,

                  invoice_payment_id: null,
                })
                .eq(
                  "id",
                  transaction.id
                );

            if (updateError) {
              throw updateError;
            }
          }
        }

        // =====================================
        // HISTÓRICO
        // =====================================

        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            module: "Financeiro",
            action: "deleted_forever",
            entity_type:
              "finance_transaction",
            entity_id: null,
            entity_name: item.title,
            details: {
              message:
                affectedTransactionIds.length > 0
                  ? `Excluiu definitivamente pagamento de fatura: ${item.title}`
                  : `Excluiu definitivamente movimentação financeira: ${item.title}`,
            },
          });

        await loadTrash();

        return;
      }

      // =====================================
      // DEMAIS TIPOS DE ITEM
      // =====================================

      const { error: deleteError } =
        await supabase
          .from(table)
          .delete()
          .eq("id", item.id);

      if (deleteError) {
        throw deleteError;
      }

      await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          module: item.module || "Geral",
          action: "deleted_forever",
          entity_type: item.type,
          entity_id: null,
          entity_name: item.title,
          details: {
            message:
              `Excluiu definitivamente: ${item.title}`,
          },
        });

      await loadTrash();
    } catch (error) {
      console.error(
        "Erro ao excluir definitivamente:",
        error
      );

      alert(
        "Não foi possível excluir definitivamente."
      );
    }
  }

  function daysRemaining(deletedAt) {
    const deletedDate = new Date(deletedAt);
    const limitDate = new Date(deletedDate);

    limitDate.setDate(limitDate.getDate() + 30);

    const diff = limitDate - new Date();

    return Math.max(
      0,
      Math.ceil(diff / (1000 * 60 * 60 * 24))
    );
  }

  if (loading) {
    return (
      <div style={{ color: COLORS.inkSoft }}>
        Carregando lixeira...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            color: COLORS.ink,
            fontSize: 26,
          }}
        >
          Lixeira
        </h1>

        <p
          style={{
            color: COLORS.inkSoft,
            marginTop: 6,
            fontSize: 13,
          }}
        >
          Os itens permanecem aqui por até 30 dias antes da exclusão
          definitiva.
        </p>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: 24,
            color: COLORS.inkSoft,
            fontSize: 13,
          }}
        >
          A lixeira está vazia.
        </div>
      ) : (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "15px 18px",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: COLORS.ink,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    color: COLORS.inkSoft,
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  {item.module || "Geral"} • excluído em{" "}
                  {new Date(
                    item.deleted_at
                  ).toLocaleDateString("pt-BR")}
                  {" • "}
                  {daysRemaining(item.deleted_at)} dias restantes
                </div>

                <div
                  style={{
                    marginTop: 4,
                    display: "inline-block",
                    fontSize: 10,
                    fontWeight: 600,
                    color: COLORS.primaryDark,
                    background: COLORS.primaryLight,
                    padding: "2px 7px",
                    borderRadius: 999,
                  }}
                >
                  {getTypeLabel(item.type)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 7,
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => restoreItem(item)}
                  title="Restaurar"
                  style={{
                    width: 34,
                    height: 34,
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    background: COLORS.surface,
                    color: COLORS.primaryDark,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={16} />
                </button>

                <button
                  onClick={() => deleteForever(item)}
                  title="Excluir definitivamente"
                  style={{
                    width: 34,
                    height: 34,
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    background: COLORS.surface,
                    color: COLORS.danger,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}