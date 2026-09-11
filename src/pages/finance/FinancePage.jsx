import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CalendarClock,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
  CalendarDays,
} from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";
import TransactionModal from "../../components/modals/TransactionModal";
import AccountModal from "../../components/modals/AccountModal";
import CardModal from "../../components/modals/CardModal";
import CardInvoiceModal from "../../components/modals/CardInvoiceModal";
import PayInvoiceModal from "../../components/modals/PayInvoiceModal";
import { processFinanceRecurrences } from "../../services/financeRecurrences";
import BudgetModal from "../../components/modals/BudgetModal";
import SubscriptionModal from "../../components/modals/SubscriptionModal";
import GoalModal from "../../components/modals/GoalModal";
import GoalContributionModal from "../../components/modals/GoalContributionModal";
import GoalHistoryModal from "../../components/modals/GoalHistoryModal";
import InvestmentModal from "../../components/modals/InvestmentModal";
import InvestmentMovementModal from "../../components/modals/InvestmentMovementModal";
import InvestmentValueModal from "../../components/modals/InvestmentValueModal";
import InvestmentHistoryModal from "../../components/modals/InvestmentHistoryModal";



function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function getMonthRange(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const toISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
  };

  return {
    start: toISO(start),
    end: toISO(end),
  };
}

function addRecurrenceDate(date, frequency, intervalValue = 1) {
  const next = new Date(date);
  const interval = Math.max(Number(intervalValue || 1), 1);

  switch (frequency) {
    case "semanal":
      next.setDate(next.getDate() + 7 * interval);
      break;

    case "quinzenal":
      next.setDate(next.getDate() + 14 * interval);
      break;

    case "mensal":
      next.setMonth(next.getMonth() + interval);
      break;

    case "bimestral":
      next.setMonth(next.getMonth() + 2 * interval);
      break;

    case "trimestral":
      next.setMonth(next.getMonth() + 3 * interval);
      break;

    case "semestral":
      next.setMonth(next.getMonth() + 6 * interval);
      break;

    case "anual":
      next.setFullYear(next.getFullYear() + interval);
      break;

    case "personalizada":
      next.setMonth(next.getMonth() + interval);
      break;

    default:
      return null;
  }

  return next;
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "primary" }) {
  const toneMap = {
    primary: {
      bg: COLORS.primaryLight,
      color: COLORS.primaryDark,
    },
    success: {
      bg: COLORS.successLight,
      color: COLORS.success,
    },
    warning: {
      bg: COLORS.warningLight,
      color: COLORS.warning,
    },
    danger: {
      bg: COLORS.dangerLight,
      color: COLORS.danger,
    },
  };

  const currentTone = toneMap[tone] || toneMap.primary;


  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 15,
      }}
      
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              color: COLORS.inkSoft,
              marginBottom: 5,
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 21,
              fontWeight: 750,
              color: COLORS.ink,
            }}
          >
            {value}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: 9.5,
                color: COLORS.inkSoft,
                marginTop: 3,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: currentTone.bg,
            color: currentTone.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 15,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 13,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {Icon && <Icon size={17} color={COLORS.primaryDark} />}

          <h3
            style={{
              margin: 0,
              fontSize: 13,
              color: COLORS.ink,
            }}
          >
            {title}
          </h3>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

export default function FinancePage({ currentUser }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();

    return {
      year: now.getFullYear(),
      month: now.getMonth(),
    };
  });

  function changeMonth(offset) {
    setSelectedMonth((current) => {
      const date = new Date(
        current.year,
        current.month + offset,
        1
      );

      return {
        year: date.getFullYear(),
        month: date.getMonth(),
      };
    });
  }

  function goToCurrentMonth() {
    const now = new Date();

    setSelectedMonth({
      year: now.getFullYear(),
      month: now.getMonth(),
    });
  }

  const monthLabel = new Date(
    selectedMonth.year,
    selectedMonth.month,
    1
  ).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });


  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [paymentAllocations, setPaymentAllocations] = useState([]);
  const [recurrences, setRecurrences] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgetModalOpen, setBudgetModalOpen] =
    useState(false);
  const [editingBudget, setEditingBudget] =
    useState(null);
  const [financeUser, setFinanceUser] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  const [transactionModalOpen, setTransactionModalOpen] =
    useState(false);

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newTransactionType, setNewTransactionType] =
    useState("despesa");

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoiceCard, setSelectedInvoiceCard] = useState(null);
  const [payInvoiceOpen, setPayInvoiceOpen] = useState(false);

  const [invoiceOffset, setInvoiceOffset] = useState(0);
  const [subscriptionModalOpen, setSubscriptionModalOpen] =
    useState(false);

  const [editingSubscription, setEditingSubscription] =
    useState(null);

  const [goals, setGoals] = useState([]);

  const [goalModalOpen, setGoalModalOpen] =
    useState(false);

  const [editingGoal, setEditingGoal] =
    useState(null);

  const [
    goalContributionModalOpen,
    setGoalContributionModalOpen,
  ] = useState(false);

  const [
    selectedGoalForContribution,
    setSelectedGoalForContribution,
  ] = useState(null);

  const [
    goalHistoryModalOpen,
    setGoalHistoryModalOpen,
  ] = useState(false);

  const [
    selectedGoalForHistory,
    setSelectedGoalForHistory,
  ] = useState(null);

  const [investments, setInvestments] =
    useState([]);

  const [
    investmentModalOpen,
    setInvestmentModalOpen,
  ] = useState(false);

  const [
    editingInvestment,
    setEditingInvestment,
  ] = useState(null);

  const [
    investmentMovementModalOpen,
    setInvestmentMovementModalOpen,
  ] = useState(false);

  const [
    selectedInvestmentForMovement,
    setSelectedInvestmentForMovement,
  ] = useState(null);

  const [
    investmentMovementType,
    setInvestmentMovementType,
  ] = useState("aporte");

  const [
    investmentValueModalOpen,
    setInvestmentValueModalOpen,
  ] = useState(false);

  const [
    selectedInvestmentForValue,
    setSelectedInvestmentForValue,
  ] = useState(null);

  const [
    investmentHistoryModalOpen,
    setInvestmentHistoryModalOpen,
  ] = useState(false);

  const [
    selectedInvestmentForHistory,
    setSelectedInvestmentForHistory,
  ] = useState(null);

  async function toggleSubscriptionStatus(subscription) {
    const newStatus = !subscription.is_active;

    const actionText = newStatus
      ? "reativar"
      : "pausar";

    const confirmed = window.confirm(
      `Deseja ${actionText} a assinatura "${subscription.name}"?`
    );

    if (!confirmed) return;

    try {
      // 1. Atualiza a assinatura
      const { error: subscriptionError } =
        await supabase
          .from("finance_subscriptions")
          .update({
            is_active: newStatus,
          })
          .eq("id", subscription.id);

      if (subscriptionError) {
        throw subscriptionError;
      }

      // 2. Atualiza a recorrência vinculada
      if (subscription.recurrence_id) {
        const { error: recurrenceError } =
          await supabase
            .from("finance_recurrences")
            .update({
              is_active: newStatus,
            })
            .eq("id", subscription.recurrence_id);

        if (recurrenceError) {
          // Reverte a assinatura caso a recorrência falhe
          await supabase
            .from("finance_subscriptions")
            .update({
              is_active: subscription.is_active,
            })
            .eq("id", subscription.id);

          throw recurrenceError;
        }
      }

      // 3. Histórico
      await supabase
        .from("activity_logs")
        .insert({
          user_id: financeUser?.id || null,
          module: "Financeiro",
          action: newStatus
            ? "reactivated"
            : "paused",
          entity_type: "finance_subscription",
          entity_id: subscription.id,
          entity_name: subscription.name,
          details: {
            message: newStatus
              ? `Reativou assinatura: ${subscription.name}`
              : `Pausou assinatura: ${subscription.name}`,
            recurrence_id:
              subscription.recurrence_id || null,
          },
        });

      await loadFinance();
    } catch (error) {
      console.error(
        "Erro ao alterar status da assinatura:",
        error
      );

      alert(
        "Não foi possível alterar o status da assinatura."
      );
    }
  }

  async function deleteSubscription(subscription) {
    
    const deletedAt = new Date().toISOString();

    try {
      // 1. Move a assinatura para a Lixeira
      const { error: subscriptionError } =
        await supabase
          .from("finance_subscriptions")
          .update({
            is_active: false,
            deleted_at: deletedAt,
            deleted_by: financeUser?.id || null,
          })
          .eq("id", subscription.id);

      if (subscriptionError) {
        throw subscriptionError;
      }

      // 2. Move também a regra de recorrência
      if (subscription.recurrence_id) {
        const { error: recurrenceError } =
          await supabase
            .from("finance_recurrences")
            .update({
              is_active: false,
              next_run_date: null,
              deleted_at: deletedAt,
              deleted_by: financeUser?.id || null,
            })
            .eq("id", subscription.recurrence_id);

        if (recurrenceError) {
          // Reverte a assinatura se a recorrência falhar
          await supabase
            .from("finance_subscriptions")
            .update({
              is_active: subscription.is_active,
              deleted_at: null,
              deleted_by: null,
            })
            .eq("id", subscription.id);

          throw recurrenceError;
        }
      }

      await supabase
        .from("activity_logs")
        .insert({
          user_id: financeUser?.id || null,
          module: "Financeiro",
          action: "deleted",
          entity_type: "finance_subscription",
          entity_id: subscription.id,
          entity_name: subscription.name,
          details: {
            message:
              `Moveu assinatura para a Lixeira: ${subscription.name}`,
            recurrence_id:
              subscription.recurrence_id || null,
          },
        });

      await loadFinance();
    } catch (error) {
      console.error(
        "Erro ao excluir assinatura:",
        error
      );

      alert(
        "Não foi possível mover a assinatura para a Lixeira."
      );
    }
  }

  async function deleteGoal(goal) {
    const confirmed = window.confirm(
      `Mover a meta "${goal.title}" para a Lixeira?`
    );

    if (!confirmed) return;

    try {
      const deletedAt = new Date().toISOString();

      const { error } = await supabase
        .from("finance_goals")
        .update({
          deleted_at: deletedAt,
          deleted_by: financeUser?.id || null,
        })
        .eq("id", goal.id);

      if (error) {
        throw error;
      }

      await supabase
        .from("activity_logs")
        .insert({
          user_id: financeUser?.id || null,
          module: "Financeiro",
          action: "deleted",
          entity_type: "finance_goal",
          entity_id: goal.id,
          entity_name: goal.title,
          details: {
            message: `Moveu meta financeira para a Lixeira: ${goal.title}`,
            target_value: Number(
              goal.target_value || 0
            ),
            current_value: Number(
              goal.current_value || 0
            ),
          },
        });

      await loadFinance();
    } catch (error) {
      console.error(
        "Erro ao excluir meta financeira:",
        error
      );

      alert(
        "Não foi possível mover a meta para a Lixeira."
      );
    }
  }

  async function deleteInvestment(investment) {
    const confirmed = window.confirm(
      `Mover o investimento "${investment.name}" para a Lixeira?`
    );

    if (!confirmed) return;

    try {
      const deletedAt = new Date().toISOString();

      const { error } = await supabase
        .from("finance_investments")
        .update({
          deleted_at: deletedAt,
          deleted_by: financeUser?.id || null,
        })
        .eq("id", investment.id);

      if (error) {
        throw error;
      }

      await supabase
        .from("activity_logs")
        .insert({
          user_id: financeUser?.id || null,
          module: "Financeiro",
          action: "deleted",
          entity_type: "finance_investment",
          entity_id: investment.id,
          entity_name: investment.name,
          details: {
            message:
              `Moveu investimento para a Lixeira: ${investment.name}`,
            invested_value: Number(
              investment.invested_value || 0
            ),
            current_value: Number(
              investment.current_value || 0
            ),
          },
        });

      await loadFinance();
    } catch (error) {
      console.error(
        "Erro ao excluir investimento:",
        error
      );

      alert(
        "Não foi possível mover o investimento para a Lixeira."
      );
    }
  }


  useEffect(() => {
    async function initializeFinance() {
      try {
        await processFinanceRecurrences();
      } catch (error) {
        console.error(
          "Erro ao processar recorrências:",
          error
        );
      }

      await loadFinance();
    }

    initializeFinance();
  }, [currentUser]);

  async function loadFinance() {
    setLoading(true);
    const {
      data: financeUserData,
      error: financeUserError,
    } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("display_name", currentUser)
      .single();

    if (financeUserError) {
      console.error(
        "Erro ao carregar usuário do Financeiro:",
        financeUserError
      );
    } else {
      setFinanceUser(financeUserData);
    }
    const [
      transactionsResult,
      accountsResult,
      cardsResult,
      allocationsResult,
      recurrencesResult,
      budgetsResult,
      categoriesResult,
      subscriptionsResult,
      goalsResult,
      investmentsResult,
    ] = await Promise.all([
      supabase
        .from("finance_transactions")
        .select(`
          *,
          category:finance_categories(id, name),
          account:finance_accounts(id, name),
          card:finance_cards(id, name)
        `)
        .is("deleted_at", null)
        .order("transaction_date", {
          ascending: false,
        }),

      supabase
        .from("finance_accounts")
        .select("*")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("finance_cards")
        .select("*")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("finance_payment_allocations")
        .select(`
          id,
          payment_transaction_id,
          card_transaction_id,
          amount
        `)
        .is("deleted_at", null),

      supabase
        .from("finance_recurrences")
        .select("*")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("start_date", {
          ascending: true,
        }),

      supabase
        .from("finance_budgets")
        .select(`
          *,
          category:finance_categories(id, name)
        `)
        .is("deleted_at", null)
        .order("month_start", {
          ascending: false,
        }),

      supabase
        .from("finance_categories")
        .select("*")
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("finance_subscriptions")
        .select(`
          *,
          category:finance_categories(id, name),
          account:finance_accounts(id, name),
          card:finance_cards(id, name)
        `)
        .is("deleted_at", null)
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("finance_goals")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("finance_investments")
        .select("*")
        .is("deleted_at", null)
        .order("name", {
          ascending: true,
        }),

      
    ]);

    if (transactionsResult.error) {
      console.error(transactionsResult.error);
    }

    if (accountsResult.error) {
      console.error(accountsResult.error);
    }

    if (cardsResult.error) {
      console.error(cardsResult.error);
    }

    if (allocationsResult.error) {
      console.error(allocationsResult.error);
    }

    if (recurrencesResult.error) {
      console.error(
        "Erro ao carregar recorrências:",
        recurrencesResult.error
      );
    }

    if (budgetsResult.error) {
      console.error(
        "Erro ao carregar orçamentos:",
        budgetsResult.error
      );
    }

    if (categoriesResult.error) {
      console.error(
        "Erro ao carregar categorias financeiras:",
        categoriesResult.error
      );
    }

    if (subscriptionsResult.error) {
      console.error(
        "Erro ao carregar assinaturas:",
        subscriptionsResult.error
      );
    }

    if (goalsResult.error) {
      console.error(
        "Erro ao carregar metas financeiras:",
        goalsResult.error
      );
    }

    if (investmentsResult.error) {
      console.error(
        "Erro ao carregar investimentos:",
        investmentsResult.error
      );
    }

    setTransactions(
      transactionsResult.data || []
    );

    setAccounts(
      accountsResult.data || []
    );

    setCards(
      cardsResult.data || []
    );

    setPaymentAllocations(
      allocationsResult.data || []
    );

    setRecurrences(
      recurrencesResult.data || []
    );

    setBudgets(
      budgetsResult.data || []
    );

    setCategories(
      categoriesResult.data || []
    );

    setSubscriptions(
      subscriptionsResult.data || []
    );

    setGoals(
      goalsResult.data || []
    );

    setInvestments(
      investmentsResult.data || []
    );

    setLoading(false);
  }

  const selectedMonthTransactions = useMemo(() => {
    const range = getMonthRange(
      selectedMonth.year,
      selectedMonth.month
    );

    return transactions.filter(
      (item) =>
        item.transaction_date >= range.start &&
        item.transaction_date <= range.end
    );
  }, [
    transactions,
    selectedMonth.year,
    selectedMonth.month,
  ]);

  const projectedRecurrenceTransactions = useMemo(() => {
    const range = getMonthRange(
      selectedMonth.year,
      selectedMonth.month
    );

    const monthStart = new Date(`${range.start}T12:00:00`);
    const monthEnd = new Date(`${range.end}T12:00:00`);

    const projections = [];

    recurrences.forEach((recurrence) => {
      if (!recurrence.start_date) return;

      let occurrenceDate = new Date(
        `${recurrence.start_date}T12:00:00`
      );

      const recurrenceEnd = recurrence.end_date
        ? new Date(`${recurrence.end_date}T12:00:00`)
        : null;

      let safety = 0;

      while (
        occurrenceDate <= monthEnd &&
        safety < 1000
      ) {
        safety += 1;

        if (
          occurrenceDate >= monthStart &&
          occurrenceDate <= monthEnd &&
          (!recurrenceEnd ||
            occurrenceDate <= recurrenceEnd)
        ) {
          const occurrenceISO =
            `${occurrenceDate.getFullYear()}-${String(
              occurrenceDate.getMonth() + 1
            ).padStart(2, "0")}-${String(
              occurrenceDate.getDate()
            ).padStart(2, "0")}`;

          const alreadyExists = transactions.some(
            (transaction) =>
              transaction.recurrence_id === recurrence.id &&
              transaction.transaction_date === occurrenceISO
          );

          if (!alreadyExists) {
            projections.push({
              id: `projection-${recurrence.id}-${occurrenceISO}`,

              recurrence_id: recurrence.id,

              title: recurrence.title,
              type: recurrence.transaction_type,
              amount: Number(recurrence.amount || 0),

              category_id: recurrence.category_id || null,
              account_id: recurrence.account_id || null,
              card_id: recurrence.card_id || null,

              transaction_date: occurrenceISO,

              status: "previsto",

              is_recurring: true,
              is_projection: true,

              notes: recurrence.notes || "",

              source_module:
                recurrence.source_module || "financeiro",

              source_id:
                recurrence.source_id || null,

              category: null,

              account:
                accounts.find(
                  (account) =>
                    account.id === recurrence.account_id
                ) || null,

              card:
                cards.find(
                  (card) =>
                    card.id === recurrence.card_id
                ) || null,
            });
          }
        }

        if (
          recurrenceEnd &&
          occurrenceDate >= recurrenceEnd
        ) {
          break;
        }

        const nextDate = addRecurrenceDate(
          occurrenceDate,
          recurrence.frequency,
          recurrence.interval_value
        );

        if (!nextDate) break;

        occurrenceDate = nextDate;
      }
    });

    return projections;
  }, [
    recurrences,
    transactions,
    accounts,
    cards,
    selectedMonth.year,
    selectedMonth.month,
  ]);

  const monthTransactionsWithProjections = useMemo(() => {
    return [
      ...selectedMonthTransactions,
      ...projectedRecurrenceTransactions,
    ].sort((a, b) =>
      String(b.transaction_date).localeCompare(
        String(a.transaction_date)
      )
    );
  }, [
    selectedMonthTransactions,
    projectedRecurrenceTransactions,
  ]);

  // ======================================================
  // CONTROLE SEMANAL
  // ======================================================

  const weeklyFinanceData = useMemo(() => {
    const year = selectedMonth.year;
    const month = selectedMonth.month;

    const firstDay = new Date(year, month, 1, 12);
    const lastDay = new Date(year, month + 1, 0, 12);

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const activeTransactions =
      monthTransactionsWithProjections.filter(
        (transaction) =>
          transaction.status !== "cancelado"
      );

    // Saldo real atual de todas as contas
    const currentAccountsBalance = accounts.reduce(
      (sum, account) =>
        sum + getAccountBalance(account),
      0
    );

    const weeks = [];

    let cursor = new Date(firstDay);
    let weekNumber = 1;

    while (cursor <= lastDay) {
      const start = new Date(cursor);

      // Semana de segunda a domingo,
      // respeitando o início/fim do mês.
      const dayOfWeek = start.getDay();

      const daysUntilSunday =
        dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

      const end = new Date(start);
      end.setDate(
        Math.min(
          start.getDate() + daysUntilSunday,
          lastDay.getDate()
        )
      );

      const startISO = [
        start.getFullYear(),
        String(start.getMonth() + 1).padStart(2, "0"),
        String(start.getDate()).padStart(2, "0"),
      ].join("-");

      const endISO = [
        end.getFullYear(),
        String(end.getMonth() + 1).padStart(2, "0"),
        String(end.getDate()).padStart(2, "0"),
      ].join("-");

      const weekTransactions =
        activeTransactions
          .filter((transaction) => {
            const date =
              transaction.transaction_date;

            return (
              date >= startISO &&
              date <= endISO
            );
          })
          .sort((a, b) =>
            String(a.transaction_date).localeCompare(
              String(b.transaction_date)
            )
          );

      const revenues =
        weekTransactions
          .filter(
            (transaction) =>
              transaction.type === "receita"
          )
          .reduce(
            (sum, transaction) =>
              sum +
              Number(transaction.amount || 0),
            0
          );

      const expenses =
        weekTransactions
          .filter(
            (transaction) =>
              transaction.type === "despesa"
          )
          .reduce(
            (sum, transaction) =>
              sum +
              Number(transaction.amount || 0),
            0
          );

      const isCurrentWeek =
        today >= start &&
        today <= end;

      weeks.push({
        number: weekNumber,
        start,
        end,
        startISO,
        endISO,
        transactions: weekTransactions,
        revenues,
        expenses,
        movementBalance:
          revenues - expenses,
        isCurrentWeek,
      });

      cursor = new Date(end);
      cursor.setDate(cursor.getDate() + 1);

      weekNumber += 1;
    }

    /*
    * Para projetar o mês sem contar novamente valores
    * que já estão incorporados ao saldo atual:
    *
    * - semanas totalmente passadas não alteram o saldo;
    * - na semana atual, consideramos apenas movimentações
    *   ainda não realizadas a partir de hoje;
    * - semanas futuras entram normalmente.
    */

    let runningBalance =
      currentAccountsBalance;

    return weeks.map((week) => {
      const startingBalance =
        runningBalance;

      const projectedTransactions =
        week.transactions.filter(
          (transaction) => {
            const transactionDate =
              new Date(
                `${transaction.transaction_date}T12:00:00`
              );

            // Semana passada
            if (week.end < today) {
              return false;
            }

            // Não contar novamente movimentação já realizada
            if (
              transaction.type === "receita" &&
              transaction.status === "recebido"
            ) {
              return false;
            }

            if (
              transaction.type === "despesa" &&
              transaction.status === "pago"
            ) {
              return false;
            }

            // Na semana atual não projetar algo de dias anteriores
            if (
              week.isCurrentWeek &&
              transactionDate < today
            ) {
              return false;
            }

            return true;
          }
        );

      const projectedRevenue =
        projectedTransactions
          .filter(
            (transaction) =>
              transaction.type === "receita"
          )
          .reduce(
            (sum, transaction) =>
              sum +
              Number(transaction.amount || 0),
            0
          );

      const projectedExpenses =
        projectedTransactions
          .filter(
            (transaction) =>
              transaction.type === "despesa"
          )
          .reduce(
            (sum, transaction) =>
              sum +
              Number(transaction.amount || 0),
            0
          );

      const endingBalance =
        startingBalance +
        projectedRevenue -
        projectedExpenses;

      runningBalance =
        endingBalance;

      return {
        ...week,
        startingBalance,
        projectedRevenue,
        projectedExpenses,
        endingBalance,
      };
    });
  }, [
    selectedMonth.year,
    selectedMonth.month,
    monthTransactionsWithProjections,
    accounts,
    transactions,
  ]);

  
  const monthData = useMemo(() => {
    const start = new Date(
      selectedMonth.year,
      selectedMonth.month,
      1
    );

    const end = new Date(
      selectedMonth.year,
      selectedMonth.month + 1,
      0
    );

    const range = getMonthRange(
      selectedMonth.year,
      selectedMonth.month
    );

    const monthTransactions =
      monthTransactionsWithProjections.filter(
        (item) => item.status !== "cancelado"
      );

    const received = monthTransactions
      .filter(
        (item) =>
          item.type === "receita" &&
          item.status === "recebido"
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const paid = monthTransactions
      .filter(
        (item) =>
          item.type === "despesa" &&
          item.status === "pago"
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const expectedRevenue = monthTransactions
      .filter(
        (item) => item.type === "receita"
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const expectedExpenses = monthTransactions
      .filter(
        (item) => item.type === "despesa"
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    return {
      received,
      paid,
      expectedRevenue,
      expectedExpenses,
      realizedBalance:
        received - paid,
      projectedBalance:
        expectedRevenue -
        expectedExpenses,
    };
  }, [
    transactions,
    selectedMonth.year,
    selectedMonth.month,
  ]);

  const selectedMonthBudgets = useMemo(() => {
    const monthStart = `${selectedMonth.year}-${String(
      selectedMonth.month + 1
    ).padStart(2, "0")}-01`;

    return budgets.filter(
      (budget) =>
        budget.month_start === monthStart
    );
  }, [
    budgets,
    selectedMonth.year,
    selectedMonth.month,
  ]);

  const selectedBudgetMonthStart =
    `${selectedMonth.year}-${String(
      selectedMonth.month + 1
    ).padStart(2, "0")}-01`;

  const budgetData = useMemo(() => {
    return selectedMonthBudgets.map((budget) => {
      const categoryId = budget.category_id;

      const categoryExpenses =
        monthTransactionsWithProjections.filter(
          (transaction) =>
            transaction.type === "despesa" &&
            transaction.status !== "cancelado" &&
            transaction.category_id === categoryId
        );

      const spent = categoryExpenses.reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );

      const budgetValue =
        Number(budget.budget_value || 0);

      const remaining =
        budgetValue - spent;

      const percentage =
        budgetValue > 0
          ? (spent / budgetValue) * 100
          : 0;

      let status = "normal";

      if (percentage >= 100) {
        status = "exceeded";
      } else if (percentage >= 80) {
        status = "warning";
      }

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        status,
      };
    });
  }, [
    selectedMonthBudgets,
    monthTransactionsWithProjections,
  ]);

  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter(
      (subscription) =>
        subscription.is_active !== false
    );
  }, [subscriptions]);

  const subscriptionsMonthlyTotal = useMemo(() => {
    return activeSubscriptions.reduce(
      (sum, subscription) => {
        const amount =
          Number(subscription.amount || 0);

        switch (subscription.frequency) {
          case "semanal":
            return sum + amount * 4.33;

          case "quinzenal":
            return sum + amount * 2.165;

          case "mensal":
            return sum + amount;

          case "bimestral":
            return sum + amount / 2;

          case "trimestral":
            return sum + amount / 3;

          case "semestral":
            return sum + amount / 6;

          case "anual":
            return sum + amount / 12;

          default:
            return sum + amount;
        }
      },
      0
    );
  }, [activeSubscriptions]);

  const accountInitialBalance = accounts.reduce(
    (sum, account) => sum + Number(account.initial_balance || 0),
    0
    );

    const realizedMovementBalance = transactions
      .filter((item) => {
        if (item.status === "cancelado") return false;

        if (
          item.type === "receita" &&
          item.status === "recebido"
        ) {
          return true;
        }

        if (
          item.type === "despesa" &&
          item.status === "pago"
        ) {
          // Compra feita no cartão não sai
          // diretamente do saldo bancário.
          if (item.card_id) return false;

          return true;
        }

        return false;
      })
    .reduce((sum, item) => {
        if (item.type === "receita") {
        return sum + Number(item.amount || 0);
        }

        return sum - Number(item.amount || 0);
    }, 0);

    const currentBalance =
    accountInitialBalance + realizedMovementBalance;

  function openNewTransaction(type) {
    setEditingTransaction(null);
    setNewTransactionType(type);
    setTransactionModalOpen(true);
  }

  function openEditTransaction(transaction) {
    setEditingTransaction(transaction);
    setNewTransactionType(transaction.type);
    setTransactionModalOpen(true);
  }

  async function deleteProjectedRecurrence(transaction) {
    if (!transaction?.recurrence_id) return;

    const choice = window.prompt(
      "Como deseja excluir esta movimentação recorrente?\n\n" +
        "1 = Somente esta movimentação\n" +
        "2 = Esta e todas as próximas\n" +
        "3 = Toda a recorrência\n\n" +
        "Digite 1, 2 ou 3:"
    );

    if (
      choice !== "1" &&
      choice !== "2" &&
      choice !== "3"
    ) {
      return;
    }

    try {
      // =====================================
      // USUÁRIO
      // =====================================

      const {
        data: user,
        error: userError,
      } = await supabase
        .from("users")
        .select("id")
        .eq("display_name", currentUser)
        .single();

      if (userError) {
        throw userError;
      }

      // =====================================
      // BUSCA A REGRA DA RECORRÊNCIA
      // =====================================

      const {
        data: recurrence,
        error: recurrenceError,
      } = await supabase
        .from("finance_recurrences")
        .select("*")
        .eq(
          "id",
          transaction.recurrence_id
        )
        .single();

      if (recurrenceError) {
        throw recurrenceError;
      }

      // =====================================
      // 1. SOMENTE ESTA MOVIMENTAÇÃO
      // =====================================

      if (choice === "1") {
        // =====================================
        // PROJEÇÃO VIRTUAL
        //
        // Ainda não existe finance_transaction.
        // Criamos um marcador cancelado para
        // impedir que a projeção reapareça.
        // =====================================

        if (transaction.is_projection) {
          const {
            data: cancelledOccurrence,
            error: cancelError,
          } = await supabase
            .from("finance_transactions")
            .insert({
              type:
                recurrence.transaction_type,

              title:
                recurrence.title,

              description:
                null,

              amount:
                Number(
                  recurrence.amount || 0
                ),

              category_id:
                recurrence.category_id ||
                null,

              account_id:
                recurrence.account_id ||
                null,

              card_id:
                recurrence.card_id ||
                null,

              transaction_date:
                transaction.transaction_date,

              due_date:
                null,

              paid_date:
                null,

              status:
                "cancelado",

              notes:
                recurrence.notes || null,

              source_module:
                recurrence.source_module || "financeiro",

              source_id:
                null,

              created_by_user_id:
                user.id,

              recurrence_id:
                transaction.recurrence_id,

              is_recurring:
                true,
            })
            .select()
            .single();

          if (cancelError) {
            throw cancelError;
          }

          await supabase
            .from("activity_logs")
            .insert({
              user_id:
                user.id,

              module:
                recurrence.source_module === "casa"
                  ? "Casa"
                  : "Financeiro",

              action:
                "deleted",

              entity_type:
                "finance_transaction",

              entity_id:
                cancelledOccurrence.id,

              entity_name:
                transaction.title,

              details: {
                message:
                  `Cancelou somente a ocorrência de ${transaction.title} em ${transaction.transaction_date}`,
              },
            });
        }

        // =====================================
        // OCORRÊNCIA REAL
        //
        // Já existe finance_transaction.
        // Não mandamos para deleted_at porque,
        // se ela sumir do banco ativo, a projeção
        // seria criada novamente.
        //
        // Transformamos em cancelada.
        // =====================================

        else {
          const {
            error: cancelRealError,
          } = await supabase
            .from("finance_transactions")
            .update({
              status:
                "cancelado",

              paid_date:
                null,
            })
            .eq(
              "id",
              transaction.id
            );

          if (cancelRealError) {
            throw cancelRealError;
          }

          await supabase
            .from("activity_logs")
            .insert({
              user_id:
                user.id,

              module:
                "Financeiro",

              action:
                "deleted",

              entity_type:
                "finance_transaction",

              entity_id:
                transaction.id,

              entity_name:
                transaction.title,

              details: {
                message:
                  `Cancelou somente a ocorrência real de ${transaction.title} em ${transaction.transaction_date}`,
              },
            });
        }
      }

      // =====================================
      // 2. ESTA E TODAS AS PRÓXIMAS
      // =====================================

      if (choice === "2") {
        const selectedDate = new Date(
          `${transaction.transaction_date}T12:00:00`
        );

        selectedDate.setDate(
          selectedDate.getDate() - 1
        );

        const previousDate = [
          selectedDate.getFullYear(),

          String(
            selectedDate.getMonth() + 1
          ).padStart(2, "0"),

          String(
            selectedDate.getDate()
          ).padStart(2, "0"),
        ].join("-");

        // Se a próxima execução ainda estiver
        // dentro do período que continua válido,
        // preservamos.
        //
        // Caso esteja depois da nova data final,
        // ela deixa de ter próxima execução.

        const newNextRunDate =
          recurrence.next_run_date &&
          recurrence.next_run_date <=
            previousDate
            ? recurrence.next_run_date
            : null;

        const { error } =
          await supabase
            .from(
              "finance_recurrences"
            )
            .update({
              end_date:
                previousDate,

              next_run_date:
                newNextRunDate,

              // IMPORTANTE:
              // não colocar false aqui.
              //
              // A regra precisa continuar
              // carregada para mostrar
              // ocorrências anteriores ao corte.
              is_active:
                true,
            })
            .eq(
              "id",
              transaction.recurrence_id
            );

        if (error) {
          throw error;
        }

        await supabase
          .from("activity_logs")
          .insert({
            user_id:
              user.id,

            module:
              "Financeiro",

            action:
              "updated",

            entity_type:
              "finance_recurrence",

            entity_id:
              transaction.recurrence_id,

            entity_name:
              transaction.title,

            details: {
              message:
                `Encerrou a recorrência de ${transaction.title} a partir de ${transaction.transaction_date}`,
            },
          });
      }

      // =====================================
      // 3. TODA A RECORRÊNCIA
      // =====================================

      if (choice === "3") {
        const { error } =
          await supabase
            .from(
              "finance_recurrences"
            )
            .update({
              is_active:
                false,

              next_run_date:
                null,

              deleted_at:
                new Date().toISOString(),

              deleted_by:
                user.id,
            })
            .eq(
              "id",
              transaction.recurrence_id
            );

        if (error) {
          throw error;
        }

        // =====================================
        // CANCELA OCORRÊNCIAS REAIS
        // DESTA DATA EM DIANTE
        // =====================================

        const {
          error: cancelFutureTransactionsError,
        } = await supabase
          .from("finance_transactions")
          .update({
            status:
              "cancelado",

            paid_date:
              null,
          })
          .eq(
            "recurrence_id",
            transaction.recurrence_id
          )
          .gte(
            "transaction_date",
            transaction.transaction_date
          )
          .is(
            "deleted_at",
            null
          );

        if (cancelFutureTransactionsError) {
          throw cancelFutureTransactionsError;
        }

        await supabase
          .from("activity_logs")
          .insert({
            user_id:
              user.id,

            module:
              "Financeiro",

            action:
              "deleted",

            entity_type:
              "finance_recurrence",

            entity_id:
              transaction.recurrence_id,

            entity_name:
              transaction.title,

            details: {
              message:
                `Moveu a recorrência para a Lixeira: ${transaction.title}`,
            },
          });
      }

      await loadFinance();
    } catch (error) {
      console.error(
        "Erro ao excluir recorrência:",
        error
      );

      alert(
        "Não foi possível excluir a movimentação recorrente."
      );
    }
  }

  async function deleteTransaction(transaction) {
    try {
      const { data: user, error: userError } =
        await supabase
          .from("users")
          .select("id")
          .eq("display_name", currentUser)
          .single();

      if (userError) throw userError;

      // =====================================
      // VERIFICA SE ESTA MOVIMENTAÇÃO É
      // UM PAGAMENTO DE FATURA
      // =====================================

      const {
        data: paymentAllocations,
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
          transaction.id
        )
        .is("deleted_at", null);

      if (allocationsError) {
        throw allocationsError;
      }

      const isInvoicePayment =
        (paymentAllocations || []).length > 0;

      // =====================================
      // SE FOR PAGAMENTO DE FATURA:
      // DESFAZ AS ALOCAÇÕES
      // =====================================

      if (isInvoicePayment) {
        const allocationIds =
          paymentAllocations.map(
            (allocation) => allocation.id
          );

        const affectedTransactionIds = [
          ...new Set(
            paymentAllocations.map(
              (allocation) =>
                allocation.card_transaction_id
            )
          ),
        ];

        // Soft delete das alocações
        const {
          error: deleteAllocationsError,
        } = await supabase
          .from("finance_payment_allocations")
          .update({
            deleted_at:
              new Date().toISOString(),
            deleted_by: user.id,
          })
          .in("id", allocationIds);

        if (deleteAllocationsError) {
          throw deleteAllocationsError;
        }

        // =====================================
        // BUSCA ALOCAÇÕES QUE AINDA RESTARAM
        // NESSAS PARCELAS
        // =====================================

        const {
          data: remainingAllocations,
          error: remainingError,
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

        if (remainingError) {
          throw remainingError;
        }

        const paidByTransaction = {};

        (remainingAllocations || []).forEach(
          (allocation) => {
            const id =
              allocation.card_transaction_id;

            paidByTransaction[id] =
              Number(
                paidByTransaction[id] || 0
              ) +
              Number(allocation.amount || 0);
          }
        );

        // =====================================
        // BUSCA AS PARCELAS AFETADAS
        // =====================================

        const {
          data: affectedTransactions,
          error: affectedError,
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

        if (affectedError) {
          throw affectedError;
        }

        // =====================================
        // RECALCULA O STATUS DE CADA PARCELA
        // =====================================

        for (
          const item of affectedTransactions || []
        ) {
          const originalAmount =
            Number(item.amount || 0);

          const stillPaid =
            Number(
              paidByTransaction[item.id] || 0
            );

          const fullyPaid =
            stillPaid >=
            originalAmount - 0.001;

          const {
            error: updateItemError,
          } = await supabase
            .from("finance_transactions")
            .update({
              status: fullyPaid
                ? "pago"
                : "previsto",

              paid_date: fullyPaid
                ? item.paid_date
                : null,

              // A nova fonte da verdade é
              // finance_payment_allocations
              invoice_payment_id: null,
            })
            .eq("id", item.id);

          if (updateItemError) {
            throw updateItemError;
          }
        }
      }

      // =====================================
      // MOVE A MOVIMENTAÇÃO PARA A LIXEIRA
      // =====================================

      const { error: deleteError } =
        await supabase
          .from("finance_transactions")
          .update({
            deleted_at:
              new Date().toISOString(),
            deleted_by: user.id,
          })
          .eq("id", transaction.id);

      if (deleteError) {
        throw deleteError;
      }

      // =====================================
      // HISTÓRICO
      // =====================================

      await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          module: "Financeiro",
          action: "deleted",
          entity_type: "finance_transaction",
          entity_id: transaction.id,
          entity_name: transaction.title,
          details: {
            message: isInvoicePayment
              ? `Removeu pagamento de fatura e desfez ${paymentAllocations.length} alocação(ões): ${transaction.title}`
              : `Moveu movimentação para a Lixeira: ${transaction.title}`,
          },
        });

      await loadFinance();
    } catch (error) {
      console.error(
        "Erro ao excluir movimentação:",
        error
      );

      alert(
        "Não foi possível excluir a movimentação."
      );
    }
  }

  // Saldo atual real de todas as contas
  const currentTotalBalance = accounts.reduce(
    (sum, account) =>
      sum + getAccountBalance(account),
    0
  );

  // Apenas valores que ainda vão entrar/sair
  const futureExpectedRevenue =
    monthTransactionsWithProjections
      .filter(
        (transaction) =>
          transaction.status !== "cancelado" &&
          transaction.type === "receita" &&
          transaction.status !== "recebido"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );

  const futureExpectedExpenses =
    monthTransactionsWithProjections
      .filter(
        (transaction) =>
          transaction.status !== "cancelado" &&
          transaction.type === "despesa" &&
          transaction.status !== "pago"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );

  // Quanto realmente deverá restar nas contas
  const projectedAccountBalance =
    currentTotalBalance +
    futureExpectedRevenue -
    futureExpectedExpenses;

  const currentMonthLabel = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const totalInvested =
    investments.reduce(
      (sum, investment) =>
        sum +
        Number(
          investment.invested_value || 0
        ),
      0
    );

  const totalInvestmentCurrent =
    investments.reduce(
      (sum, investment) =>
        sum +
        Number(
          investment.current_value || 0
        ),
      0
    );

  const totalInvestmentResult =
    totalInvestmentCurrent -
    totalInvested;

  const totalInvestmentReturn =
    totalInvested > 0
      ? (
          (totalInvestmentResult /
            totalInvested) *
          100
        )
      : 0;

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          color: COLORS.inkSoft,
          fontSize: 12,
        }}
      >
        Carregando Financeiro...
      </div>
    );
  }

  function getAccountBalance(account) {
    const movements = transactions
        .filter(
        (item) =>
            item.account_id === account.id &&
            (
            (item.type === "receita" && item.status === "recebido") ||
            (item.type === "despesa" && item.status === "pago")
            ) &&
            item.status !== "cancelado"
        )
        .reduce((sum, item) => {
        if (item.type === "receita") {
            return sum + Number(item.amount || 0);
        }

        return sum - Number(item.amount || 0);
        }, 0);

    return Number(account.initial_balance || 0) + movements;
    }

    function getCardUsed(card) {
    return transactions
        .filter(
        (item) =>
            item.card_id === card.id &&
            item.type === "despesa" &&
            item.status !== "cancelado"
        )
        .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
        );
    }

    async function deleteAccount(account) {
        try {
            const { data: user, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("display_name", currentUser)
            .single();

            if (userError) throw userError;

            const { error } = await supabase
            .from("finance_accounts")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
                is_active: false,
            })
            .eq("id", account.id);

            if (error) throw error;

            await supabase
              .from("activity_logs")
              .insert({
                user_id: user.id,
                module: "Financeiro",
                action: "deleted",
                entity_type: "finance_account",
                entity_id: account.id,
                entity_name: account.name,
                details: {
                  message:
                    `Moveu conta para a Lixeira: ${account.name}`,
                },
              });

            await loadFinance();
        } catch (error) {
            console.error(error);
            alert("Não foi possível excluir a conta.");
        }
        }

    async function deleteCard(card) {
        try {
            const { data: user, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("display_name", currentUser)
            .single();

            if (userError) throw userError;

            const { error } = await supabase
            .from("finance_cards")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
                is_active: false,
            })
            .eq("id", card.id);

            if (error) throw error;

            await supabase
              .from("activity_logs")
              .insert({
                user_id: user.id,
                module: "Financeiro",
                action: "deleted",
                entity_type: "finance_card",
                entity_id: card.id,
                entity_name: card.name,
                details: {
                  message:
                    `Moveu cartão para a Lixeira: ${card.name}`,
                },
              });

            await loadFinance();
        } catch (error) {
            console.error(error);
            alert("Não foi possível excluir o cartão.");
        }
        }
    
    async function deleteBudget(budget) {
      const confirmed = window.confirm(
        `Deseja mover o orçamento de ${
          budget.category?.name || "esta categoria"
        } para a Lixeira?`
      );

      if (!confirmed) return;

      const {
        data: userData,
        error: userError,
      } = await supabase
        .from("users")
        .select("id")
        .eq("display_name", currentUser)
        .single();

      if (userError) {
        console.error(
          "Erro ao localizar usuário:",
          userError
        );
        alert("Não foi possível identificar o usuário.");
        return;
      }

      const { error } = await supabase
        .from("finance_budgets")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userData.id,
        })
        .eq("id", budget.id);

      if (error) {
        console.error(
          "Erro ao excluir orçamento:",
          error
        );
        alert("Erro ao excluir orçamento.");
        return;
      }

      await supabase
        .from("activity_logs")
        .insert({
          user_id: userData.id,
          module: "Financeiro",
          action: "deleted",
          entity_type: "finance_budget",
          entity_id: budget.id,
          entity_name:
            budget.category?.name || "Orçamento",
          details: {
            message:
              `Moveu orçamento para a Lixeira: ${
                budget.category?.name ||
                "categoria"
              }`,
            month_start: budget.month_start,
            budget_value: Number(
              budget.budget_value || 0
            ),
          },
        });

      await loadFinance();
    }

  function getDateOnly(value) {
    if (!value) return null;
    return new Date(`${value}T12:00:00`);
  }

  function getCardInvoicePeriod(card, referenceDate = new Date()) {
    const closingDay = Number(card.closing_day || 1);

    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();

    const currentClosing = new Date(year, month, closingDay, 12, 0, 0);

    let start;
    let end;

    if (referenceDate <= currentClosing) {
      end = currentClosing;
      start = new Date(year, month - 1, closingDay + 1, 12, 0, 0);
    } else {
      start = new Date(year, month, closingDay + 1, 12, 0, 0);
      end = new Date(year, month + 1, closingDay, 12, 0, 0);
    }

    return { start, end };
  }

  function getCardInvoice(
    card,
    offset = 0,
    baseDate = null
  ) {
    const referenceDate =
      baseDate ||
      new Date(
        selectedMonth.year,
        selectedMonth.month,
        15,
        12,
        0,
        0
      );

    const adjustedReferenceDate =
      new Date(referenceDate);

    adjustedReferenceDate.setMonth(
      adjustedReferenceDate.getMonth() + offset
    );

    const { start, end } =
      getCardInvoicePeriod(
        card,
        adjustedReferenceDate
      );

    const invoiceTransactions =
      transactions.filter((item) => {
        if (item.card_id !== card.id) {
          return false;
        }

        if (item.type !== "despesa") {
          return false;
        }

        if (item.status === "cancelado") {
          return false;
        }

        const date = getDateOnly(
          item.transaction_date
        );

        if (!date) return false;

        return (
          date >= start &&
          date <= end
        );
      });

    const transactionsWithPayment =
      invoiceTransactions.map((item) => {
        const paidAmount =
          getTransactionPaidAmount(
            item.id
          );

        const remainingAmount =
          getTransactionRemaining(item);

        return {
          ...item,
          paidAmount,
          remainingAmount,
        };
      });

    const total =
      transactionsWithPayment.reduce(
        (sum, item) =>
          sum +
          Number(item.amount || 0),
        0
      );

    const paidTotal =
      transactionsWithPayment.reduce(
        (sum, item) =>
          sum +
          Number(item.paidAmount || 0),
        0
      );

    const pendingTotal =
      transactionsWithPayment.reduce(
        (sum, item) =>
          sum +
          Number(
            item.remainingAmount || 0
          ),
        0
      );

    return {
      transactions:
        transactionsWithPayment,

      total:
        Math.round(total * 100) / 100,

      paidTotal:
        Math.round(
          paidTotal * 100
        ) / 100,

      pendingTotal:
        Math.round(
          pendingTotal * 100
        ) / 100,

      start,
      end,
    };
  }

  function getTransactionPaidAmount(transactionId) {
    return paymentAllocations
      .filter(
        (allocation) =>
          allocation.card_transaction_id ===
          transactionId
      )
      .reduce(
        (sum, allocation) =>
          sum +
          Number(allocation.amount || 0),
        0
      );
  }

  function getTransactionRemaining(item) {
    const amount =
      Number(item.amount || 0);

    const paid =
      getTransactionPaidAmount(item.id);

    return Math.max(
      Math.round(
        (amount - paid) * 100
      ) / 100,
      0
    );
  }

  function getInvoiceInfo(card, invoice, offset = 0) {
    if (!invoice) {
      return {
        label: "Fatura",
        status: "aberta",
        statusLabel: "Aberta",
        canPay: false,
      };
    }

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const closingDate = new Date(invoice.end);
    closingDate.setHours(12, 0, 0, 0);

    const monthReference = new Date(
      closingDate.getFullYear(),
      closingDate.getMonth() + 1,
      1
    );

    const monthLabel = monthReference
      .toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
      .replace(/^./, (letter) =>
        letter.toUpperCase()
      );

    const hasTransactions =
      invoice.transactions.length > 0;

    const isPaid =
      hasTransactions &&
      invoice.pendingTotal <= 0;

    const isPartial =
      hasTransactions &&
      invoice.paidTotal > 0 &&
      invoice.pendingTotal > 0;

    const isFuture = offset > 0;

    if (isPaid) {
      return {
        label: `Fatura ${monthLabel}`,
        status: "paga",
        statusLabel: "Paga",
        canPay: false,
      };
    }

    if (isFuture) {
      return {
        label: `Fatura ${monthLabel}`,
        status: isPartial
          ? "parcial"
          : "futura",
        statusLabel: isPartial
          ? "Parcial"
          : "Futura",
        canPay: false,
      };
    }

    if (isPartial) {
      return {
        label: `Fatura ${monthLabel}`,
        status: "parcial",
        statusLabel: "Parcial",
        canPay: true,
      };
    }

    if (today > closingDate) {
      return {
        label: `Fatura ${monthLabel}`,
        status: "fechada",
        statusLabel: "Fechada",
        canPay:
          invoice.pendingTotal > 0,
      };
    }

    return {
      label: `Fatura ${monthLabel}`,
      status: "aberta",
      statusLabel: "Aberta",
      canPay:
        invoice.pendingTotal > 0,
    };

  }

  function getCardSelectedInvoice(card) {
    return getCardInvoice(
      card,
      0,
      new Date(
        selectedMonth.year,
        selectedMonth.month,
        15,
        12,
        0,
        0
      )
    );
  }

  function getCardDueDate(
    card,
    offset = 0,
    baseDate = null
  ) {
    if (!card.due_day) return null;

    const referenceDate =
      baseDate ||
      new Date(
        selectedMonth.year,
        selectedMonth.month,
        15,
        12,
        0,
        0
      );

    const adjustedReferenceDate =
      new Date(referenceDate);

    adjustedReferenceDate.setMonth(
      adjustedReferenceDate.getMonth() +
        offset
    );

    const { end } =
      getCardInvoicePeriod(
        card,
        adjustedReferenceDate
      );

    let year = end.getFullYear();
    let month = end.getMonth();

    const dueDay =
      Number(card.due_day);

    if (
      dueDay <=
      Number(card.closing_day || 1)
    ) {
      month += 1;
    }

    const lastDay = new Date(
      year,
      month + 1,
      0
    ).getDate();

    return new Date(
      year,
      month,
      Math.min(
        dueDay,
        lastDay
      ),
      12,
      0,
      0
    );
  }

  function getCardLimitUsed(card) {
    return transactions
      .filter((item) => {
        if (item.card_id !== card.id) {
          return false;
        }

        if (item.type !== "despesa") {
          return false;
        }

        if (item.status === "cancelado") {
          return false;
        }

        return true;
      })
      .reduce(
        (sum, item) =>
          sum +
          getTransactionRemaining(item),
        0
      );
  }

  const selectedCardInvoice = selectedInvoiceCard
    ? getCardInvoice(
        selectedInvoiceCard,
        invoiceOffset
      )
    : null;

  const selectedInvoiceInfo =
    selectedInvoiceCard &&
    selectedCardInvoice
      ? getInvoiceInfo(
          selectedInvoiceCard,
          selectedCardInvoice,
          invoiceOffset
        )
      : null;

  const selectedCardUsed = selectedInvoiceCard
    ? getCardLimitUsed(selectedInvoiceCard)
    : 0;

  const selectedCardLimit = selectedInvoiceCard
    ? Number(selectedInvoiceCard.limit_value || 0)
    : 0;

  const selectedCardAvailable =
    selectedInvoiceCard &&
    selectedInvoiceCard.limit_value != null
      ? Math.max(
          selectedCardLimit - selectedCardUsed,
          0
        )
      : null;

  const selectedCardDueDate = selectedInvoiceCard
    ? getCardDueDate(
        selectedInvoiceCard,
        invoiceOffset
      )
    : null;

  function getGoalProgress(goal) {
    const target =
      Number(goal.target_value || 0);

    const current =
      Number(goal.current_value || 0);

    if (target <= 0) return 0;

    return Math.min(
      100,
      Math.max(
        0,
        (current / target) * 100
      )
    );
  }
  
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1500,
        margin: "0 auto",
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 23,
              color: COLORS.ink,
            }}
          >
            Financeiro
          </h1>

          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: COLORS.inkSoft,
            }}
          >
            Visão financeira compartilhada • {monthLabel}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => openNewTransaction("receita")}
            style={{
              border: `1px solid ${COLORS.success}`,
              background: COLORS.successLight,
              color: COLORS.success,
              borderRadius: 9,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 650,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Plus size={14} />
            Receita
          </button>

          <button
            onClick={() => openNewTransaction("despesa")}
            style={{
              border: "none",
              background: COLORS.primary,
              color: "#fff",
              borderRadius: 9,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 650,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Plus size={14} />
            Despesa
          </button>
        </div>
      </div>
      {/* Navegação de mês */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.ink,
              borderRadius: 8,
              padding: "7px 11px",
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            ←
          </button>

          <div
            style={{
              minWidth: 170,
              textAlign: "center",
              fontWeight: 700,
              color: COLORS.ink,
              textTransform: "capitalize",
              fontSize: 13,
            }}
          >
            {monthLabel}
          </div>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.ink,
              borderRadius: 8,
              padding: "7px 11px",
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            →
          </button>
        </div>

        <button
          type="button"
          onClick={goToCurrentMonth}
          style={{
            border: `1px solid ${COLORS.border}`,
            background: COLORS.primaryLight,
            color: COLORS.primaryDark,
            borderRadius: 8,
            padding: "7px 11px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 650,
          }}
        >
          Hoje
        </button>
      </div>
      {/* Resumo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <StatCard
          title="Saldo atual"
          value={money(currentBalance)}
          subtitle="Receitas recebidas − despesas pagas"
          icon={Banknote}
          tone={
            currentBalance >= 0
              ? "primary"
              : "danger"
          }
        />

        <StatCard
          title="Receitas do mês"
          value={money(monthData.received)}
          subtitle={`Previsto: ${money(
            monthData.expectedRevenue
          )}`}
          icon={ArrowUpCircle}
          tone="success"
        />

        <StatCard
          title="Despesas do mês"
          value={money(monthData.paid)}
          subtitle={`Previsto: ${money(
            monthData.expectedExpenses
          )}`}
          icon={ArrowDownCircle}
          tone="danger"
        />

        <StatCard
          title="Saldo projetado"
          value={money(projectedAccountBalance)}
          subtitle="Saldo atual + entradas futuras − saídas futuras"
          icon={CalendarClock}
          tone={
            monthData.projectedBalance >= 0
              ? "primary"
              : "warning"
          }
        />
      </div>

    {/* Controle semanal */}
    <div style={{ marginBottom: 14 }}>
      <SectionCard
        title="Controle semanal"
        icon={CalendarDays}
      >
        <div
          style={{
            fontSize: 10.5,
            color: COLORS.inkSoft,
            marginBottom: 12,
          }}
        >
          Veja quanto entra, quanto vence e qual será o
          saldo previsto ao final de cada semana.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {weeklyFinanceData.map((week) => {
            const negative =
              week.endingBalance < 0;

            const lowBalance =
              !negative &&
              week.endingBalance <
                week.projectedExpenses * 0.25;

            return (
              <div
                key={`${week.startISO}-${week.endISO}`}
                style={{
                  border: week.isCurrentWeek
                    ? `1.5px solid ${COLORS.primary}`
                    : `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: 12,
                  background: week.isCurrentWeek
                    ? COLORS.primaryLight
                    : COLORS.surface,
                }}
              >
                {/* Cabeçalho */}
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: COLORS.ink,
                      }}
                    >
                      Semana {week.number}
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 9.5,
                        color:
                          COLORS.inkSoft,
                      }}
                    >
                      {week.start.toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                        }
                      )}
                      {" a "}
                      {week.end.toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                        }
                      )}
                    </div>
                  </div>

                  {week.isCurrentWeek && (
                    <div
                      style={{
                        borderRadius: 999,
                        padding: "4px 7px",
                        background:
                          COLORS.primary,
                        color: "#fff",
                        fontSize: 8.5,
                        fontWeight: 700,
                      }}
                    >
                      SEMANA ATUAL
                    </div>
                  )}
                </div>

                {/* Resumo */}
                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: 7,
                  }}
                >
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: COLORS.bg,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8.5,
                        color:
                          COLORS.inkSoft,
                      }}
                    >
                      Saldo inicial
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 11,
                        fontWeight: 700,
                        color: COLORS.ink,
                      }}
                    >
                      {money(
                        week.startingBalance
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: COLORS.bg,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8.5,
                        color:
                          COLORS.inkSoft,
                      }}
                    >
                      Receitas previstas
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          COLORS.success,
                      }}
                    >
                      +{" "}
                      {money(
                        week.projectedRevenue
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: COLORS.bg,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8.5,
                        color:
                          COLORS.inkSoft,
                      }}
                    >
                      Contas a vencer
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          COLORS.danger,
                      }}
                    >
                      −{" "}
                      {money(
                        week.projectedExpenses
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: negative
                        ? COLORS.dangerLight
                        : lowBalance
                          ? COLORS.amberLight
                          : COLORS.primaryLight,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8.5,
                        color:
                          COLORS.inkSoft,
                      }}
                    >
                      Saldo previsto
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 12,
                        fontWeight: 800,
                        color: negative
                          ? COLORS.danger
                          : lowBalance
                            ? COLORS.amber
                            : COLORS.primaryDark,
                      }}
                    >
                      {money(
                        week.endingBalance
                      )}
                    </div>
                  </div>
                </div>

                {/* Contas da semana */}
                <div
                  style={{
                    marginTop: 11,
                    paddingTop: 9,
                    borderTop:
                      `1px solid ${COLORS.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: COLORS.inkSoft,
                      marginBottom: 6,
                      textTransform:
                        "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    Movimentações da semana
                  </div>

                  {week.transactions.length ===
                  0 ? (
                    <div
                      style={{
                        fontSize: 9.5,
                        color:
                          COLORS.inkSoft,
                        padding: "5px 0",
                      }}
                    >
                      Nenhuma movimentação.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: 5,
                      }}
                    >
                      {week.transactions.map(
                        (transaction) => {
                          const isRevenue =
                            transaction.type ===
                            "receita";

                          const realized =
                            transaction.status ===
                              "pago" ||
                            transaction.status ===
                              "recebido";

                          return (
                            <div
                              key={
                                transaction.id
                              }
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "42px minmax(0, 1fr) auto",
                                gap: 7,
                                alignItems:
                                  "center",
                                padding: "5px 0",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 9,
                                  color:
                                    COLORS.inkSoft,
                                }}
                              >
                                {new Date(
                                  `${transaction.transaction_date}T12:00:00`
                                ).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month:
                                      "2-digit",
                                  }
                                )}
                              </div>

                              <div
                                style={{
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color:
                                      COLORS.ink,
                                    whiteSpace:
                                      "nowrap",
                                    overflow:
                                      "hidden",
                                    textOverflow:
                                      "ellipsis",
                                  }}
                                >
                                  {
                                    transaction.title
                                  }
                                </div>

                                <div
                                  style={{
                                    marginTop: 1,
                                    fontSize: 8.5,
                                    color:
                                      COLORS.inkSoft,
                                  }}
                                >
                                  {realized
                                    ? isRevenue
                                      ? "Recebido"
                                      : "Pago"
                                    : transaction.is_projection
                                      ? "Projeção"
                                      : "Previsto"}
                                </div>
                              </div>

                              <div
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color:
                                    isRevenue
                                      ? COLORS.success
                                      : COLORS.danger,
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {isRevenue
                                  ? "+"
                                  : "−"}
                                {money(
                                  transaction.amount
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>

      {/* Orçamentos do mês */}
    <div style={{ marginBottom: 14 }}>
      <SectionCard
        title="Orçamentos do mês"
        icon={WalletCards}
        action={
          <button
            onClick={() => {
              setEditingBudget(null);
              setBudgetModalOpen(true);
            }}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.primaryDark,
              borderRadius: 8,
              padding: "6px 9px",
              cursor: "pointer",
              fontSize: 10.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Plus size={12} />
            Orçamento
          </button>
        }
      >
        {budgetData.length === 0 ? (
          <div
            style={{
              padding: "18px 4px",
              textAlign: "center",
              color: COLORS.inkSoft,
              fontSize: 11,
            }}
          >
            Nenhum orçamento cadastrado para este mês.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 10,
            }}
          >
            {budgetData.map((budget) => {
              const percentageForBar =
                Math.min(
                  Number(budget.percentage || 0),
                  100
                );

              const statusColor =
                budget.status === "exceeded"
                  ? COLORS.danger
                  : budget.status === "warning"
                    ? COLORS.warning
                    : COLORS.success;

              const statusBackground =
                budget.status === "exceeded"
                  ? COLORS.dangerLight
                  : budget.status === "warning"
                    ? COLORS.warningLight
                    : COLORS.successLight;

              const statusLabel =
                budget.status === "exceeded"
                  ? "Orçamento excedido"
                  : budget.status === "warning"
                    ? "Atenção"
                    : "Dentro do orçamento";

              return (
                <div
                  key={budget.id}
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 11,
                    padding: 12,
                    background: COLORS.surface,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: COLORS.ink,
                        }}
                      >
                        {budget.category?.name ||
                          "Categoria"}
                      </div>

                      <div
                        style={{
                          fontSize: 9.5,
                          color: COLORS.inkSoft,
                          marginTop: 3,
                        }}
                      >
                        Limite mensal{" "}
                        {money(budget.budget_value)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <div
                        style={{
                          background: statusBackground,
                          color: statusColor,
                          borderRadius: 999,
                          padding: "4px 7px",
                          fontSize: 8.5,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusLabel}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteBudget(budget)
                        }
                        title="Excluir orçamento"
                        style={{
                          width: 27,
                          height: 27,
                          border: "none",
                          borderRadius: 7,
                          background: COLORS.dangerLight,
                          color: COLORS.danger,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      height: 8,
                      borderRadius: 999,
                      background: COLORS.bg,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${percentageForBar}%`,
                        background: statusColor,
                        borderRadius: 999,
                        transition: "width 0.2s ease",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: COLORS.inkSoft,
                      }}
                    >
                      {money(budget.spent)} utilizados
                    </div>

                    <div
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: statusColor,
                      }}
                    >
                      {budget.percentage.toFixed(1)}%
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 9,
                      borderTop: `1px solid ${COLORS.border}`,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 8.5,
                          color: COLORS.inkSoft,
                        }}
                      >
                        Utilizado
                      </div>

                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          fontWeight: 700,
                          color: COLORS.ink,
                        }}
                      >
                        {money(budget.spent)}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 8.5,
                          color: COLORS.inkSoft,
                        }}
                      >
                        {budget.remaining >= 0
                          ? "Disponível"
                          : "Excedido"}
                      </div>

                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          fontWeight: 700,
                          color:
                            budget.remaining >= 0
                              ? COLORS.success
                              : COLORS.danger,
                        }}
                      >
                        {money(
                          Math.abs(
                            Number(
                              budget.remaining || 0
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {budget.notes && (
                    <div
                      style={{
                        marginTop: 9,
                        fontSize: 9,
                        color: COLORS.inkSoft,
                        lineHeight: 1.45,
                      }}
                    >
                      {budget.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>

{/* Contas + cartões */}
      <div
        style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
            alignItems: "start",
        }}
        >
        {/* CONTAS */}
        <SectionCard
            title="Contas"
            icon={Landmark}
            action={
            <button
                onClick={() => {
                setEditingAccount(null);
                setAccountModalOpen(true);
                }}
                style={{
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                color: COLORS.primaryDark,
                borderRadius: 8,
                padding: "6px 9px",
                cursor: "pointer",
                fontSize: 10.5,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
                }}
            >
                <Plus size={12} />
                Conta
            </button>
            }
        >
            {accounts.length === 0 ? (
            <div
                style={{
                fontSize: 11,
                color: COLORS.inkSoft,
                padding: "10px 0",
                }}
            >
                Nenhuma conta cadastrada ainda.
            </div>
            ) : (
            <div
                style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
                }}
            >
                {accounts.map((account) => {
                const balance = getAccountBalance(account);

                return (
                    <div
                    key={account.id}
                    style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 9,
                        padding: 10,
                    }}
                    >
                    <div
                        style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 10,
                        }}
                    >
                        <div>
                        <div
                            style={{
                            fontSize: 11.5,
                            fontWeight: 650,
                            color: COLORS.ink,
                            }}
                        >
                            {account.name}
                        </div>

                        <div
                            style={{
                            fontSize: 9.5,
                            color: COLORS.inkSoft,
                            marginTop: 2,
                            }}
                        >
                            {account.institution || "Sem instituição"}
                        </div>
                        </div>

                        <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                        >
                        <div
                            style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color:
                                balance >= 0
                                ? COLORS.primaryDark
                                : COLORS.danger,
                            marginRight: 3,
                            }}
                        >
                            {money(balance)}
                        </div>

                        <button
                            onClick={() => {
                            setEditingAccount(account);
                            setAccountModalOpen(true);
                            }}
                            title="Editar conta"
                            style={{
                            width: 26,
                            height: 26,
                            border: "none",
                            borderRadius: 7,
                            background: COLORS.bg,
                            color: COLORS.primaryDark,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            }}
                        >
                            <Pencil size={12} />
                        </button>

                        <button
                            onClick={() => deleteAccount(account)}
                            title="Excluir conta"
                            style={{
                            width: 26,
                            height: 26,
                            border: "none",
                            borderRadius: 7,
                            background: COLORS.dangerLight,
                            color: COLORS.danger,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            }}
                        >
                            <Trash2 size={12} />
                        </button>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
            )}
        </SectionCard>

        {/* CARTÕES */}
        <SectionCard
            title="Cartões"
            icon={CreditCard}
            action={
            <button
                onClick={() => {
                setEditingCard(null);
                setCardModalOpen(true);
                }}
                style={{
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                color: COLORS.primaryDark,
                borderRadius: 8,
                padding: "6px 9px",
                cursor: "pointer",
                fontSize: 10.5,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
                }}
            >
                <Plus size={12} />
                Cartão
            </button>
            }
        >
            {cards.length === 0 ? (
            <div
                style={{
                fontSize: 11,
                color: COLORS.inkSoft,
                padding: "10px 0",
                }}
            >
                Nenhum cartão cadastrado ainda.
            </div>
            ) : (
            <div
                style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
                }}
            >
                {cards.map((card) => {
                const invoice =
                  getCardSelectedInvoice(card);

                const used =
                  getCardLimitUsed(card);

                const limit =
                  Number(card.limit_value || 0);

                const available =
                  card.limit_value != null
                    ? Math.max(
                        limit - used,
                        0
                      )
                    : null;

                const dueDate =
                  getCardDueDate(
                    card,
                    0,
                    new Date(
                      selectedMonth.year,
                      selectedMonth.month,
                      15,
                      12,
                      0,
                      0
                    )
                  );

                return (
                    <div
                    key={card.id}
                    onClick={() => {
                      setSelectedInvoiceCard(card);
                      setInvoiceOffset(0);
                      setInvoiceModalOpen(true);
                    }}
                    style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 9,
                        padding: 10,
                        cursor: "pointer",
                    }}
                    >
                    <div
                        style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 10,
                        }}
                    >
                        <div>
                        <div
                            style={{
                            fontSize: 11.5,
                            fontWeight: 650,
                            color: COLORS.ink,
                            }}
                        >
                            {card.name}
                        </div>

                        <div
                            style={{
                            fontSize: 9.5,
                            color: COLORS.inkSoft,
                            marginTop: 2,
                            }}
                        >
                            {card.institution || "Sem instituição"}
                        </div>
                        </div>

                        <div
                        style={{
                            display: "flex",
                            gap: 4,
                        }}
                        >
                        <button
                            onClick={() => {
                              e.stopPropagation();
                            setEditingCard(card);
                            setCardModalOpen(true);
                            }}
                            title="Editar cartão"
                            style={{
                            width: 26,
                            height: 26,
                            border: "none",
                            borderRadius: 7,
                            background: COLORS.bg,
                            color: COLORS.primaryDark,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            }}
                        >
                            <Pencil size={12} />
                        </button>

                        <button
                            onClick={() => {
                              e.stopPropagation();
                              deleteCard(card);
                            }}
                            title="Excluir cartão"
                            style={{
                            width: 26,
                            height: 26,
                            border: "none",
                            borderRadius: 7,
                            background: COLORS.dangerLight,
                            color: COLORS.danger,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            }}
                        >
                            <Trash2 size={12} />
                        </button>
                        </div>
                    </div>

                    {card.limit_value != null && (
                        <div
                        style={{
                            marginTop: 8,
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 6,
                        }}
                        >
                        <div>
                            <div
                            style={{
                                fontSize: 8.5,
                                color: COLORS.inkSoft,
                            }}
                            >
                            Limite
                            </div>

                            <div
                            style={{
                                fontSize: 10.5,
                                fontWeight: 650,
                                color: COLORS.ink,
                            }}
                            >
                            {money(limit)}
                            </div>
                        </div>

                        <div>
                            <div
                            style={{
                                fontSize: 8.5,
                                color: COLORS.inkSoft,
                            }}
                            >
                            Utilizado
                            </div>

                            <div
                            style={{
                                fontSize: 10.5,
                                fontWeight: 650,
                                color: COLORS.danger,
                            }}
                            >
                            {money(used)}
                            </div>
                        </div>

                        <div>
                            <div
                            style={{
                                fontSize: 8.5,
                                color: COLORS.inkSoft,
                            }}
                            >
                            Disponível
                            </div>

                            <div
                            style={{
                                fontSize: 10.5,
                                fontWeight: 650,
                                color: COLORS.success,
                            }}
                            >
                            {money(available)}
                            </div>
                        </div>
                        </div>
                    )}

                    {(card.closing_day || card.due_day) && (
                        <div
                        style={{
                            fontSize: 9,
                            color: COLORS.inkSoft,
                            marginTop: 7,
                        }}
                        >
                        {card.closing_day
                            ? `Fecha dia ${card.closing_day}`
                            : ""}

                        {card.closing_day && card.due_day
                            ? " • "
                            : ""}

                        {card.due_day
                            ? `Vence dia ${card.due_day}`
                            : ""}

                        </div>
                    )}

                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 9,
                      borderTop: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 9,
                            color: COLORS.inkSoft,
                          }}
                        >
                          Fatura do mês
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: COLORS.ink,
                            marginTop: 1,
                          }}
                        >
                          {money(invoice.pendingTotal)}
                        </div>
                      </div>

                      {dueDate && (
                        <div
                          style={{
                            textAlign: "right",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 9,
                              color: COLORS.inkSoft,
                            }}
                          >
                            Vencimento
                          </div>

                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 650,
                              color: COLORS.primaryDark,
                              marginTop: 1,
                            }}
                          >
                            {dueDate.toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 8.5,
                        color: COLORS.inkSoft,
                        marginTop: 5,
                      }}
                    >
                      Ciclo de{" "}
                      {invoice.start.toLocaleDateString("pt-BR")} até{" "}
                      {invoice.end.toLocaleDateString("pt-BR")}
                    </div>
                  </div>  
                    </div>
                );
                })}
            </div>
            )}
        </SectionCard>
        </div>

    <div style={{ marginTop: 14, marginBottom: 14 }}>
      <SectionCard
        title="Assinaturas"
        subtitle="Serviços e cobranças recorrentes"
        action={
          <button
            type="button"
            onClick={() => {
              setEditingSubscription(null);
              setSubscriptionModalOpen(true);
            }}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "7px 10px",
              background: COLORS.primary,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Assinatura
          </button>
          
        }
      >
        {subscriptions.length === 0 ? (
          <div
            style={{
              padding: "22px 12px",
              textAlign: "center",
              color: COLORS.inkSoft,
              fontSize: 12,
            }}
          >
            Nenhuma assinatura cadastrada.
          </div>
        ) : (
          <>
            {/* RESUMO */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  background: COLORS.bg,
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: COLORS.inkSoft,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Custo mensal
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: COLORS.ink,
                  }}
                >
                  {money(
                    subscriptionsMonthlyTotal
                  )}
                </div>
              </div>

              <div
                style={{
                  background: COLORS.bg,
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: COLORS.inkSoft,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Ativas
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: COLORS.ink,
                  }}
                >
                  {activeSubscriptions.length}
                </div>
              </div>
            </div>

            {/* LISTA */}
            <div
              style={{
                display: "grid",
                gap: 7,
              }}
            >
              {subscriptions.map((subscription) => {
                const isActive =
                  subscription.is_active !== false;

                const frequencyLabels = {
                  semanal: "Semanal",
                  quinzenal: "Quinzenal",
                  mensal: "Mensal",
                  bimestral: "Bimestral",
                  trimestral: "Trimestral",
                  semestral: "Semestral",
                  anual: "Anual",
                  personalizada: "Personalizada",
                };

                const paymentSource =
                  subscription.card?.name ||
                  subscription.account?.name ||
                  "Não informado";

                return (
                  <div
                    key={subscription.id}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      opacity: isActive ? 1 : 0.6,
                    }}
                  >
                    {/* INFORMAÇÕES */}
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: COLORS.ink,
                          }}
                        >
                          {subscription.name}
                        </span>

                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: 999,
                            fontSize: 8,
                            fontWeight: 700,
                            background: isActive
                              ? COLORS.primaryLight
                              : COLORS.bg,
                            color: isActive
                              ? COLORS.primaryDark
                              : COLORS.inkSoft,
                          }}
                        >
                          {isActive
                            ? "Ativa"
                            : "Pausada"}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 9.5,
                          color: COLORS.inkSoft,
                        }}
                      >
                        {subscription.category?.name ||
                          "Sem categoria"}
                        {" • "}
                        {frequencyLabels[
                          subscription.frequency
                        ] || subscription.frequency}
                        {" • "}
                        {paymentSource}
                      </div>

                      {subscription.next_billing_date && (
                        <div
                          style={{
                            fontSize: 9,
                            color: COLORS.inkSoft,
                            marginTop: 3,
                          }}
                        >
                          Próxima cobrança:{" "}
                          {new Date(
                            `${subscription.next_billing_date}T12:00:00`
                          ).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>

                    {/* VALOR + AÇÕES */}
                    <div
                      style={{
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: COLORS.ink,
                        }}
                      >
                        {money(
                          Number(subscription.amount || 0)
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 8.5,
                          color: COLORS.inkSoft,
                          marginTop: 2,
                        }}
                      >
                        {frequencyLabels[
                          subscription.frequency
                        ] || subscription.frequency}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 5,
                          marginTop: 5,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleSubscriptionStatus(
                              subscription
                            )
                          }
                          title={
                            isActive
                              ? "Pausar assinatura"
                              : "Reativar assinatura"
                          }
                          style={{
                            height: 27,
                            border: "none",
                            borderRadius: 7,
                            padding: "0 8px",
                            background: isActive
                              ? COLORS.bg
                              : COLORS.primaryLight,
                            color: isActive
                              ? COLORS.inkSoft
                              : COLORS.primaryDark,
                            cursor: "pointer",
                            fontSize: 8.5,
                            fontWeight: 700,
                          }}
                        >
                          {isActive
                            ? "Pausar"
                            : "Reativar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubscription(
                              subscription
                            );
                            setSubscriptionModalOpen(true);
                          }}
                          title="Editar assinatura"
                          style={{
                            width: 27,
                            height: 27,
                            border: "none",
                            borderRadius: 7,
                            background: COLORS.bg,
                            color: COLORS.primaryDark,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Pencil size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteSubscription(subscription)
                          }
                          title="Excluir assinatura"
                          style={{
                            width: 27,
                            height: 27,
                            border: "none",
                            borderRadius: 7,
                            background: COLORS.dangerLight,
                            color: COLORS.danger,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={12} />
                        </button>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SectionCard>
    </div>


    {/* Metas + investimentos */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
        alignItems: "start",
        marginTop: 14,
        marginBottom: 14,
      }}
    >
      {/* METAS FINANCEIRAS */}
      <SectionCard
        title="Metas financeiras"
        subtitle="Acompanhe seus objetivos e o valor já acumulado."
        action={
          <button
            type="button"
            onClick={() => {
              setEditingGoal(null);
              setGoalModalOpen(true);
            }}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "7px 10px",
              background: COLORS.primaryLight,
              color: COLORS.primaryDark,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Nova meta
          </button>
        }
      >
        {goals.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: COLORS.inkSoft,
              padding: "8px 0",
            }}
          >
            Nenhuma meta financeira cadastrada.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 10,
            }}
          >
            {goals.map((goal) => {
              const target =
                Number(goal.target_value || 0);

              const current =
                Number(goal.current_value || 0);

              const progress =
                getGoalProgress(goal);

              const completed =
                progress >= 100 ||
                goal.status === "concluida";

              const overdue =
                !completed &&
                goal.target_date &&
                goal.target_date <
                  new Date()
                    .toISOString()
                    .slice(0, 10);

              return (
                <div
                  key={goal.id}
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 13,
                    background: COLORS.surface,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGoalForContribution(
                          goal
                        );
                        setGoalContributionModalOpen(
                          true
                        );
                      }}
                      title="Adicionar valor"
                      style={{
                        border: "none",
                        borderRadius: 7,
                        padding: "6px 8px",
                        background:
                          COLORS.primaryLight,
                        color:
                          COLORS.primaryDark,
                        fontSize: 10.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Valor
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGoalForHistory(
                          goal
                        );
                        setGoalHistoryModalOpen(
                          true
                        );
                      }}
                      title="Histórico de aportes"
                      style={{
                        border:
                          `1px solid ${COLORS.border}`,
                        borderRadius: 7,
                        padding: "6px 8px",
                        background:
                          COLORS.surface,
                        color: COLORS.inkSoft,
                        fontSize: 10.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Histórico
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingGoal(goal);
                        setGoalModalOpen(true);
                      }}
                      title="Editar meta"
                      style={{
                        width: 28,
                        height: 28,
                        border:
                          `1px solid ${COLORS.border}`,
                        borderRadius: 7,
                        background:
                          COLORS.surface,
                        color:
                          COLORS.primaryDark,
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Pencil size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteGoal(goal)
                      }
                      title="Excluir meta"
                      style={{
                        width: 28,
                        height: 28,
                        border: "none",
                        borderRadius: 7,
                        background:
                          COLORS.dangerLight,
                        color: COLORS.danger,
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 13,
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: COLORS.ink,
                      }}
                    >
                      {money(current)}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: COLORS.inkSoft,
                      }}
                    >
                      de {money(target)}
                    </div>
                  </div>

                  <div
                    style={{
                      height: 7,
                      borderRadius: 999,
                      background:
                        COLORS.primaryLight,
                      overflow: "hidden",
                      marginTop: 9,
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        background:
                          completed
                            ? COLORS.primaryDark
                            : COLORS.primary,
                        borderRadius: 999,
                        transition:
                          "width 0.2s ease",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      marginTop: 7,
                      fontSize: 10.5,
                      color: COLORS.inkSoft,
                    }}
                  >
                    <span>
                      {progress.toFixed(0)}%
                    </span>

                    <span>
                      Faltam{" "}
                      {money(
                        Math.max(
                          target - current,
                          0
                        )
                      )}
                    </span>
                  </div>

                  {goal.target_date && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 10.5,
                        color: overdue
                          ? COLORS.danger
                          : COLORS.inkSoft,
                      }}
                    >
                      Prazo:{" "}
                      {new Date(
                        `${goal.target_date}T12:00:00`
                      ).toLocaleDateString(
                        "pt-BR"
                      )}
                    </div>
                  )}

                  {goal.notes && (
                    <div
                      style={{
                        marginTop: 7,
                        fontSize: 10.5,
                        lineHeight: 1.45,
                        color:
                          COLORS.inkSoft,
                      }}
                    >
                      {goal.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* INVESTIMENTOS */}
      <SectionCard
        title="Investimentos"
        action={
          <button
            type="button"
            onClick={() => {
              setEditingInvestment(null);
              setInvestmentModalOpen(true);
            }}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "7px 10px",
              background:
                COLORS.primaryLight,
              color:
                COLORS.primaryDark,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Novo investimento
          </button>
        }
      >
        {investments.length === 0 ? (
          <div
            style={{
              color: COLORS.inkSoft,
              fontSize: 12,
              padding: "8px 0",
            }}
          >
            Nenhum investimento cadastrado.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  background:
                    COLORS.primaryLight,
                  borderRadius: 10,
                  padding: 11,
                }}
              >
                <div
                  style={{
                    color:
                      COLORS.inkSoft,
                    fontSize: 9.5,
                  }}
                >
                  Total aplicado
                </div>

                <div
                  style={{
                    marginTop: 3,
                    color:
                      COLORS.primaryDark,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {money(totalInvested)}
                </div>
              </div>

              <div
                style={{
                  background:
                    COLORS.bg,
                  borderRadius: 10,
                  padding: 11,
                }}
              >
                <div
                  style={{
                    color:
                      COLORS.inkSoft,
                    fontSize: 9.5,
                  }}
                >
                  Valor atual
                </div>

                <div
                  style={{
                    marginTop: 3,
                    color:
                      COLORS.ink,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {money(
                    totalInvestmentCurrent
                  )}
                </div>
              </div>

              <div
                style={{
                  background:
                    totalInvestmentResult >= 0
                      ? COLORS.primaryLight
                      : COLORS.dangerLight,
                  borderRadius: 10,
                  padding: 11,
                }}
              >
                <div
                  style={{
                    color:
                      COLORS.inkSoft,
                    fontSize: 9.5,
                  }}
                >
                  Rentabilidade
                </div>

                <div
                  style={{
                    marginTop: 3,
                    fontSize: 15,
                    fontWeight: 700,
                    color:
                      totalInvestmentResult >=
                      0
                        ? COLORS.primaryDark
                        : COLORS.danger,
                  }}
                >
                  {totalInvestmentReturn >= 0
                    ? "+"
                    : ""}
                  {totalInvestmentReturn.toFixed(
                    2
                  )}
                  %
                </div>

                <div
                  style={{
                    marginTop: 2,
                    color:
                      totalInvestmentResult >=
                      0
                        ? COLORS.primaryDark
                        : COLORS.danger,
                    fontSize: 9.5,
                  }}
                >
                  {totalInvestmentResult >= 0
                    ? "+"
                    : ""}
                  {money(
                    totalInvestmentResult
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 10,
              }}
            >
              {investments.map(
                (investment) => {
                  const invested =
                    Number(
                      investment.invested_value ||
                        0
                    );

                  const current =
                    Number(
                      investment.current_value ||
                        0
                    );

                  const result =
                    current - invested;

                  const returnPercentage =
                    invested > 0
                      ? (result /
                          invested) *
                        100
                      : 0;

                  return (
                    <div
                      key={investment.id}
                      style={{
                        border:
                          `1px solid ${COLORS.border}`,
                        borderRadius: 12,
                        padding: 13,
                        background:
                          COLORS.surface,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color:
                                COLORS.ink,
                            }}
                          >
                            {
                              investment.name
                            }
                          </div>

                          <div
                            style={{
                              marginTop: 3,
                              fontSize: 10,
                              color:
                                COLORS.inkSoft,
                            }}
                          >
                            {[
                              investment.type,
                              investment.institution,
                            ]
                              .filter(Boolean)
                              .join(" • ") ||
                              "Sem classificação"}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 6,
                            flexShrink: 0,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setEditingInvestment(
                                investment
                              );

                              setInvestmentModalOpen(
                                true
                              );
                            }}
                            title="Editar investimento"
                            style={{
                              width: 28,
                              height: 28,
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
                            <Pencil size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteInvestment(
                                investment
                              )
                            }
                            title="Excluir investimento"
                            style={{
                              width: 28,
                              height: 28,
                              border: "none",
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
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap: 8,
                          marginTop: 13,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 9.5,
                              color:
                                COLORS.inkSoft,
                            }}
                          >
                            Aplicado
                          </div>

                          <div
                            style={{
                              marginTop: 2,
                              fontSize: 12,
                              fontWeight: 600,
                              color:
                                COLORS.ink,
                            }}
                          >
                            {money(invested)}
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: 9.5,
                              color:
                                COLORS.inkSoft,
                            }}
                          >
                            Valor atual
                          </div>

                          <div
                            style={{
                              marginTop: 2,
                              fontSize: 12,
                              fontWeight: 700,
                              color:
                                COLORS.ink,
                            }}
                          >
                            {money(current)}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 11,
                          padding:
                            "8px 9px",
                          borderRadius: 8,
                          background:
                            result >= 0
                              ? COLORS.primaryLight
                              : COLORS.dangerLight,
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color:
                              COLORS.inkSoft,
                          }}
                        >
                          Resultado
                        </span>

                        <span
                          style={{
                            fontSize: 10.5,
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
                          {" • "}
                          {returnPercentage >= 0
                            ? "+"
                            : ""}
                          {returnPercentage.toFixed(
                            2
                          )}
                          %
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          marginTop: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvestmentForMovement(
                              investment
                            );

                            setInvestmentMovementType(
                              "aporte"
                            );

                            setInvestmentMovementModalOpen(
                              true
                            );
                          }}
                          style={{
                            border: "none",
                            borderRadius: 7,
                            padding:
                              "6px 9px",
                            background:
                              COLORS.primaryLight,
                            color:
                              COLORS.primaryDark,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor:
                              "pointer",
                          }}
                        >
                          + Aporte
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvestmentForMovement(
                              investment
                            );

                            setInvestmentMovementType(
                              "resgate"
                            );

                            setInvestmentMovementModalOpen(
                              true
                            );
                          }}
                          style={{
                            border:
                              `1px solid ${COLORS.border}`,
                            borderRadius: 7,
                            padding:
                              "6px 9px",
                            background:
                              COLORS.surface,
                            color:
                              COLORS.inkSoft,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor:
                              "pointer",
                          }}
                        >
                          − Resgate
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvestmentForValue(
                              investment
                            );

                            setInvestmentValueModalOpen(
                              true
                            );
                          }}
                          style={{
                            border:
                              `1px solid ${COLORS.border}`,
                            borderRadius: 7,
                            padding:
                              "6px 9px",
                            background:
                              COLORS.surface,
                            color:
                              COLORS.primaryDark,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor:
                              "pointer",
                          }}
                        >
                          Atualizar valor
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvestmentForHistory(
                              investment
                            );

                            setInvestmentHistoryModalOpen(
                              true
                            );
                          }}
                          style={{
                            border:
                              `1px solid ${COLORS.border}`,
                            borderRadius: 7,
                            padding:
                              "6px 9px",
                            background:
                              COLORS.surface,
                            color:
                              COLORS.inkSoft,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor:
                              "pointer",
                          }}
                        >
                          Histórico
                        </button>
                      </div>

                      {investment.reference_date && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 9.5,
                            color:
                              COLORS.inkSoft,
                          }}
                        >
                          Atualizado em{" "}
                          {formatDate(
                            investment.reference_date
                          )}
                        </div>
                      )}

                      {investment.notes && (
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 9.5,
                            color:
                              COLORS.inkSoft,
                          }}
                        >
                          {investment.notes}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </SectionCard>
    </div>


      {/* Movimentações */}
      <SectionCard
        title="Movimentações do mês"
        icon={WalletCards}
      >
        {monthTransactionsWithProjections.filter(
          (transaction) =>
            transaction.status !== "cancelado"
        ).length === 0 ? (
          <div
            style={{
              padding: "24px 5px",
              textAlign: "center",
              color: COLORS.inkSoft,
              fontSize: 11,
            }}
          >
            Nenhuma movimentação cadastrada.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {monthTransactionsWithProjections
              .filter(
                (transaction) =>
                  transaction.status !== "cancelado"
              )
              .slice(0, 15)
              .map((transaction) => {
              const isRevenue =
                transaction.type === "receita";

              return (
                <div
                  key={transaction.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "36px minmax(0, 1fr) auto auto",
                    gap: 9,
                    alignItems: "center",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10,
                    padding: "8px 9px",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isRevenue
                        ? COLORS.successLight
                        : COLORS.dangerLight,
                      color: isRevenue
                        ? COLORS.success
                        : COLORS.danger,
                    }}
                  >
                    {isRevenue ? (
                      <ArrowUpCircle size={16} />
                    ) : (
                      <ArrowDownCircle size={16} />
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 650,
                        color: COLORS.ink,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {transaction.title}
                    </div>

                    <div
                      style={{
                        fontSize: 9.5,
                        color: COLORS.inkSoft,
                        marginTop: 2,
                      }}
                    >
                      {formatDate(
                        transaction.transaction_date
                      )}

                      {transaction.is_projection
                        ? " • Recorrente • Projeção"
                        : ""}

                      {transaction.category?.name
                        ? ` • ${transaction.category.name}`
                        : ""}

                      {transaction.account?.name
                        ? ` • ${transaction.account.name}`
                        : transaction.card?.name
                          ? ` • ${transaction.card.name}`
                          : ""}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: isRevenue
                          ? COLORS.success
                          : COLORS.danger,
                      }}
                    >
                      {isRevenue ? "+" : "−"}{" "}
                      {money(transaction.amount)}
                    </div>

                    <div
                      style={{
                        fontSize: 9,
                        color: COLORS.inkSoft,
                        marginTop: 2,
                      }}
                    >
                      {transaction.status}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 3,
                    }}
                  >
                    
                      <>
                        <button
                          onClick={() =>
                            openEditTransaction(transaction)
                          }
                          title="Editar"
                          style={{
                            width: 28,
                            height: 28,
                            border: "none",
                            borderRadius: 7,
                            background: COLORS.bg,
                            color: COLORS.primaryDark,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          onClick={() => {
                            if (transaction.recurrence_id) {
                              deleteProjectedRecurrence(
                                transaction
                              );
                            } else {
                              deleteTransaction(
                                transaction
                              );
                            }
                          }}
                          title={
                            transaction.is_projection
                              ? "Excluir recorrência"
                              : "Excluir"
                          }
                          style={{
                            width: 28,
                            height: 28,
                            border: "none",
                            borderRadius: 7,
                            background: COLORS.dangerLight,
                            color: COLORS.danger,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <TransactionModal
        open={transactionModalOpen}
        currentUser={currentUser}
        transactionToEdit={editingTransaction}
        initialType={newTransactionType}
        onSaved={loadFinance}
        onClose={() => {
          setTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
      />

      <AccountModal
        open={accountModalOpen}
        currentUser={currentUser}
        accountToEdit={editingAccount}
        onSaved={loadFinance}
        onClose={() => {
            setAccountModalOpen(false);
            setEditingAccount(null);
        }}
        />

        <CardModal
        open={cardModalOpen}
        currentUser={currentUser}
        cardToEdit={editingCard}
        onSaved={loadFinance}
        onClose={() => {
            setCardModalOpen(false);
            setEditingCard(null);
        }}
        />

        <CardInvoiceModal
          open={invoiceModalOpen}
          onClose={() => {
            setInvoiceModalOpen(false);
            setSelectedInvoiceCard(null);
          }}
          card={selectedInvoiceCard}
          invoice={selectedCardInvoice}
          used={selectedCardUsed}
          available={selectedCardAvailable}
          dueDate={selectedCardDueDate}
          onPayInvoice={() => {
            setPayInvoiceOpen(true);
          }}
          invoiceOffset={invoiceOffset}
          onPreviousInvoice={() => {
            setInvoiceOffset((prev) => prev - 1);
          }}

          onNextInvoice={() => {
            setInvoiceOffset((prev) => prev + 1);
          }}

          onCurrentInvoice={() => {
            setInvoiceOffset(0);
          }}
          invoiceInfo={selectedInvoiceInfo}
        />

        <PayInvoiceModal
          open={payInvoiceOpen}
          onClose={() => {
            setPayInvoiceOpen(false);
          }}
          card={selectedInvoiceCard}
          invoice={selectedCardInvoice}
          currentUser={currentUser}
          onSaved={async () => {
            await loadFinance();
            setPayInvoiceOpen(false);
          }}
        />

        <BudgetModal
          open={budgetModalOpen}
          onClose={() => {
            setBudgetModalOpen(false);
            setEditingBudget(null);
          }}
          onSaved={loadFinance}
          user={financeUser}
          budget={editingBudget}
          categories={categories}
          monthStart={selectedBudgetMonthStart}
        />

        <SubscriptionModal
          open={subscriptionModalOpen}
          onClose={() => {
            setSubscriptionModalOpen(false);
            setEditingSubscription(null);
          }}
          onSaved={loadFinance}
          user={financeUser}
          subscription={editingSubscription}
          categories={categories}
          accounts={accounts}
          cards={cards}
        />

        <GoalModal
          open={goalModalOpen}
          onClose={() => {
            setGoalModalOpen(false);
            setEditingGoal(null);
          }}
          onSaved={loadFinance}
          user={financeUser}
          goal={editingGoal}
        />

        <GoalContributionModal
          open={goalContributionModalOpen}
          onClose={() => {
            setGoalContributionModalOpen(false);
            setSelectedGoalForContribution(null);
          }}
          onSaved={loadFinance}
          user={financeUser}
          goal={selectedGoalForContribution}
        />

        <GoalHistoryModal
          open={goalHistoryModalOpen}
          onClose={() => {
            setGoalHistoryModalOpen(false);
            setSelectedGoalForHistory(null);
          }}
          onSaved={loadFinance}
          user={financeUser}
          goal={selectedGoalForHistory}
        />

        <InvestmentModal
          open={investmentModalOpen}
          onClose={() => {
            setInvestmentModalOpen(false);
            setEditingInvestment(null);
          }}
          onSaved={loadFinance}
          user={financeUser}
          investment={editingInvestment}
        />

        <InvestmentMovementModal
          open={investmentMovementModalOpen}
          onClose={() => {
            setInvestmentMovementModalOpen(
              false
            );

            setSelectedInvestmentForMovement(
              null
            );
          }}
          onSaved={loadFinance}
          user={financeUser}
          investment={
            selectedInvestmentForMovement
          }
          movementType={
            investmentMovementType
          }
        />

        <InvestmentValueModal
          open={investmentValueModalOpen}
          onClose={() => {
            setInvestmentValueModalOpen(
              false
            );

            setSelectedInvestmentForValue(
              null
            );
          }}
          onSaved={loadFinance}
          user={financeUser}
          investment={
            selectedInvestmentForValue
          }
        />

        <InvestmentHistoryModal
          open={investmentHistoryModalOpen}
          onClose={() => {
            setInvestmentHistoryModalOpen(
              false
            );

            setSelectedInvestmentForHistory(
              null
            );
          }}
          onSaved={loadFinance}
          user={financeUser}
          investment={
            selectedInvestmentForHistory
          }
        />

    </div>
  );
}