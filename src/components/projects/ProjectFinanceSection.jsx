import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";
import TransactionModal from "../modals/TransactionModal";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "pt-BR"
  );
}

function statusLabel(status) {
  const labels = {
    previsto: "Previsto",
    pendente: "Pendente",
    pago: "Pago",
    recebido: "Recebido",
    cancelado: "Cancelado",
  };

  return labels[status] || status || "—";
}

export default function ProjectFinanceSection({
  project,
  currentUser,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [transactionModalOpen, setTransactionModalOpen] =
    useState(false);

  const [transactionToEdit, setTransactionToEdit] =
    useState(null);

  useEffect(() => {
    if (!project?.id) return;

    loadTransactions();
  }, [project?.id]);

  async function loadTransactions() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("finance_transactions")
        .select("*")
        .eq("source_module", "projetos")
        .eq("source_id", project.id)
        .eq("type", "despesa")
        .is("deleted_at", null)
        .order("transaction_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar financeiro do projeto:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const financialSummary = useMemo(() => {
    const budget = Number(project?.budget_value || 0);

    const paid = transactions
      .filter((item) => item.status === "pago")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const committed = transactions
      .filter(
        (item) =>
          item.status !== "pago" &&
          item.status !== "cancelado"
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const total = paid + committed;

    const available = budget - total;

    const percentage =
      budget > 0
        ? Math.round((total / budget) * 100)
        : 0;

    return {
      budget,
      paid,
      committed,
      total,
      available,
      percentage,
    };
  }, [transactions, project?.budget_value]);

  function openNewExpense() {
    setTransactionToEdit(null);
    setTransactionModalOpen(true);
  }

  function openEditExpense(transaction) {
    setTransactionToEdit(transaction);
    setTransactionModalOpen(true);
  }

  async function deleteExpense(transaction) {
    
    try {
        const { data: user, error: userError } =
        await supabase
            .from("users")
            .select("id")
            .eq("display_name", currentUser)
            .single();

        if (userError) throw userError;

        const { error } = await supabase
        .from("finance_transactions")
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
        })
        .eq("id", transaction.id);

        if (error) throw error;

        await supabase
        .from("activity_logs")
        .insert({
            user_id: user.id,
            module: "Projetos",
            action: "deleted",
            entity_type: "finance_transaction",
            entity_id: transaction.id,
            entity_name: transaction.title,
            details: {
            message: `Excluiu despesa do projeto ${project.title}: ${transaction.title}`,
            },
        });

        await loadTransactions();
    } catch (error) {
        console.error(
        "Erro ao excluir despesa do projeto:",
        error
        );

        alert(
        "Não foi possível excluir a despesa."
        );
    }
    }

  function closeTransactionModal() {
    setTransactionModalOpen(false);
    setTransactionToEdit(null);
  }

  async function handleSaved() {
    await loadTransactions();
  }

  return (
    <>
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: 16,
        }}
      >
        {/* CABEÇALHO */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                color: COLORS.ink,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <DollarSign size={15} />
              Financeiro do projeto
            </div>

            <div
              style={{
                color: COLORS.inkSoft,
                fontSize: 10,
                marginTop: 3,
              }}
            >
              Orçamento e despesas vinculadas ao projeto
            </div>
          </div>

          <button
            type="button"
            onClick={openNewExpense}
            style={{
              border: 0,
              borderRadius: 9,
              background: COLORS.primary,
              color: "#fff",
              padding: "8px 11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            <Plus size={14} />
            Nova despesa
          </button>
        </div>

        {/* RESUMO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <SummaryCard
            label="Orçamento"
            value={formatMoney(
              financialSummary.budget
            )}
          />

          <SummaryCard
            label="Gasto realizado"
            value={formatMoney(
              financialSummary.paid
            )}
          />

          <SummaryCard
            label="Comprometido"
            value={formatMoney(
              financialSummary.committed
            )}
          />

          <SummaryCard
            label="Disponível"
            value={formatMoney(
              financialSummary.available
            )}
            danger={
              financialSummary.available < 0
            }
          />
        </div>

        {/* USO DO ORÇAMENTO */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 13,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
              color: COLORS.inkSoft,
              fontSize: 10,
            }}
          >
            <span>Orçamento utilizado</span>

            <strong
              style={{
                color:
                  financialSummary.percentage > 100
                    ? COLORS.danger
                    : COLORS.ink,
              }}
            >
              {financialSummary.percentage}%
            </strong>
          </div>

          <div
            style={{
              height: 7,
              background: COLORS.primaryLight,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(
                  financialSummary.percentage,
                  100
                )}%`,
                height: "100%",
                background:
                  financialSummary.percentage > 100
                    ? COLORS.danger
                    : COLORS.primary,
                borderRadius: 999,
                transition: "width .2s ease",
              }}
            />
          </div>

          {financialSummary.percentage > 100 && (
            <div
              style={{
                color: COLORS.danger,
                fontSize: 9,
                marginTop: 5,
              }}
            >
              O orçamento deste projeto foi ultrapassado.
            </div>
          )}
        </div>

        {/* MOVIMENTAÇÕES */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              color: COLORS.ink,
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 9,
            }}
          >
            Despesas do projeto
          </div>

          {loading ? (
            <div
              style={{
                color: COLORS.inkSoft,
                fontSize: 10,
              }}
            >
              Carregando...
            </div>
          ) : transactions.length === 0 ? (
            <div
              style={{
                border: `1px dashed ${COLORS.border}`,
                borderRadius: 10,
                padding: 16,
                textAlign: "center",
                color: COLORS.inkSoft,
                fontSize: 10,
              }}
            >
              Nenhuma despesa vinculada a este projeto.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                        "minmax(0, 1fr) 100px 95px 90px 72px",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 9,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: COLORS.ink,
                        fontSize: 10,
                        fontWeight: 650,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {transaction.title}
                    </div>

                    <div
                      style={{
                        color: COLORS.inkSoft,
                        fontSize: 8,
                        marginTop: 2,
                      }}
                    >
                      {formatDate(
                        transaction.transaction_date
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      color: COLORS.ink,
                      fontSize: 10,
                      fontWeight: 650,
                      textAlign: "right",
                    }}
                  >
                    {formatMoney(transaction.amount)}
                  </div>

                  <div
                    style={{
                      color: COLORS.inkSoft,
                      fontSize: 9,
                      textAlign: "center",
                    }}
                  >
                    {statusLabel(transaction.status)}
                  </div>

                  <div
                    style={{
                      color: COLORS.inkSoft,
                      fontSize: 9,
                      textAlign: "center",
                    }}
                  >
                    {transaction.total_installments > 1
                      ? `${transaction.installment_number}/${transaction.total_installments}`
                      : "—"}
                  </div>

                  <div
                    style={{
                        display: "flex",
                        gap: 6,
                        justifyContent: "flex-end",
                    }}
                    >
                    <button
                        type="button"
                        onClick={() =>
                        openEditExpense(transaction)
                        }
                        title="Editar despesa"
                        style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.surface,
                        color: COLORS.primaryDark,
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        }}
                    >
                        <Pencil size={13} />
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                        deleteExpense(transaction)
                        }
                        title="Excluir despesa"
                        style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.surface,
                        color: COLORS.danger,
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        }}
                    >
                        <Trash2 size={13} />
                    </button>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TransactionModal
        open={transactionModalOpen}
        onClose={closeTransactionModal}
        currentUser={currentUser}
        onSaved={handleSaved}
        transactionToEdit={transactionToEdit}
        initialType="despesa"
        sourceModule="projetos"
        sourceId={project.id}
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
  danger = false,
}) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: 11,
      }}
    >
      <div
        style={{
          color: COLORS.inkSoft,
          fontSize: 9,
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: danger
            ? COLORS.danger
            : COLORS.ink,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}