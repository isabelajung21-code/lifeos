import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function PayInvoiceModal({
  open,
  onClose,
  card,
  invoice,
  currentUser,
  onSaved,
}) {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    if (!open) return;

    loadAccounts();

    setAccountId("");
    setPaymentDate(
      new Date().toISOString().slice(0, 10)
    );
    setPaymentAmount(
        invoice?.pendingTotal
            ? String(invoice.pendingTotal)
            : ""
        );
    setError("");
  }, [open]);

  async function loadAccounts() {
    const { data, error } = await supabase
      .from("finance_accounts")
      .select("*")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setAccounts(data || []);
  }

  function money(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function handlePay() {
    if (!accountId) {
      setError("Selecione a conta usada para pagar a fatura.");
      return;
    }

    const amountToPay = Number(paymentAmount);

    if (!amountToPay || amountToPay <= 0) {
        setError("Informe um valor de pagamento maior que zero.");
        return;
    }

    setSaving(true);
    setError("");

    try {
        const { data: user, error: userError } =
            await supabase
                .from("users")
                .select("id")
                .eq("display_name", currentUser)
                .single();

    if (userError) throw userError;

    // ========================================
    // 1. BUSCA TODAS AS COMPRAS/PARCELAS
    // PENDENTES DESSE CARTÃO
    // ========================================

    const { data: cardItems, error: cardItemsError } =
        await supabase
            .from("finance_transactions")
            .select("*")
            .eq("card_id", card.id)
            .eq("type", "despesa")
            .neq("status", "cancelado")
            .is("deleted_at", null)
            .order("transaction_date", {
             ascending: true,
        });

    if (cardItemsError) {
        throw cardItemsError;
    }

    const allCardItems = cardItems || [];

    // ========================================
    // 2. BUSCA O QUE JÁ FOI PAGO
    // EM CADA PARCELA
    // ========================================

    const cardItemIds = allCardItems.map(
        (item) => item.id
    );

    let allocations = [];

    if (cardItemIds.length > 0) {
        const {
        data: allocationData,
        error: allocationError,
        } = await supabase
        .from("finance_payment_allocations")
        .select(
            "card_transaction_id, amount"
        )
        .in(
            "card_transaction_id",
            cardItemIds
        );

        if (allocationError) {
        throw allocationError;
        }

        allocations = allocationData || [];
    }

    const paidByTransaction = {};

    allocations.forEach((allocation) => {
        const id =
        allocation.card_transaction_id;

        paidByTransaction[id] =
        Number(paidByTransaction[id] || 0) +
        Number(allocation.amount || 0);
    });

    // ========================================
    // 3. CALCULA SALDO RESTANTE
    // DE CADA COMPRA/PARCELA
    // ========================================

    const pendingItems = allCardItems
        .map((item) => {
        const originalAmount =
            Number(item.amount || 0);

        const alreadyPaid =
            Number(
            paidByTransaction[item.id] || 0
            );

        return {
            ...item,
            alreadyPaid,
            remaining:
            Math.max(
                originalAmount - alreadyPaid,
                0
            ),
        };
        })
        .filter(
        (item) => item.remaining > 0
        );

    const maximumPayable =
        pendingItems.reduce(
        (sum, item) =>
            sum + item.remaining,
        0
        );

    if (amountToPay > maximumPayable + 0.001) {
        throw new Error(
        `O valor máximo que pode ser pago ou antecipado é ${money(
            maximumPayable
        )}.`
        );
    }

    // ========================================
    // 4. PRIORIZA A FATURA SELECIONADA
    // E DEPOIS AS FUTURAS
    // ========================================

    const invoiceIds = new Set(
        (invoice.transactions || []).map(
        (item) => item.id
        )
    );

    const currentInvoiceItems =
        pendingItems.filter((item) =>
        invoiceIds.has(item.id)
        );

    const futureItems =
        pendingItems.filter(
        (item) =>
            !invoiceIds.has(item.id)
        );

    const orderedItems = [
        ...currentInvoiceItems,
        ...futureItems,
    ];

    // ========================================
    // 5. CRIA O PAGAMENTO
    // ========================================

    const {
        data: payment,
        error: paymentError,
    } = await supabase
        .from("finance_transactions")
        .insert({
        type: "despesa",
        title: `Pagamento fatura ${card.name}`,
        description:
            `Pagamento/antecipação do cartão ${card.name}`,
        amount: amountToPay,
        account_id: accountId,
        card_id: null,
        transaction_date: paymentDate,
        paid_date: paymentDate,
        status: "pago",
        source_module: "financeiro",
        source_id: card.id,
        created_by_user_id: user.id,
        notes: null,
        })
        .select("id")
        .single();

    if (paymentError) {
        throw paymentError;
    }

    // ========================================
    // 6. DISTRIBUI O PAGAMENTO
    // ========================================

    let remainingPayment =
        Math.round(amountToPay * 100) / 100;

    const newAllocations = [];

    for (const item of orderedItems) {
        if (remainingPayment <= 0) break;

        const allocated =
        Math.min(
            remainingPayment,
            item.remaining
        );

        const roundedAllocation =
        Math.round(allocated * 100) / 100;

        if (roundedAllocation <= 0) {
        continue;
        }

        newAllocations.push({
        payment_transaction_id:
            payment.id,
        card_transaction_id:
            item.id,
        amount: roundedAllocation,
        });

        remainingPayment =
        Math.round(
            (
            remainingPayment -
            roundedAllocation
            ) * 100
        ) / 100;
    }

    const {
        error: allocationsInsertError,
    } = await supabase
        .from(
        "finance_payment_allocations"
        )
        .insert(newAllocations);

    if (allocationsInsertError) {
        await supabase
        .from("finance_transactions")
        .delete()
        .eq("id", payment.id);

        throw allocationsInsertError;
    }

    // ========================================
    // 7. ATUALIZA STATUS DAS PARCELAS
    // ========================================

    for (const allocation of newAllocations) {
        const transaction =
        pendingItems.find(
            (item) =>
            item.id ===
            allocation.card_transaction_id
        );

        if (!transaction) continue;

        const newPaidTotal =
        transaction.alreadyPaid +
        Number(allocation.amount);

        const fullyPaid =
        newPaidTotal >=
        Number(transaction.amount) -
            0.001;

        const { error: updateError } =
        await supabase
            .from("finance_transactions")
            .update({
            status: fullyPaid
                ? "pago"
                : "previsto",
            paid_date: fullyPaid
                ? paymentDate
                : null,
            invoice_payment_id:
                fullyPaid
                ? payment.id
                : null,
            })
            .eq("id", transaction.id);

        if (updateError) {
        throw updateError;
        }
    }

    // ========================================
    // 8. HISTÓRICO
    // ========================================

    await supabase
        .from("activity_logs")
        .insert({
        user_id: user.id,
        action: "created",
        entity_type:
            "finance_transaction",
        entity_id: payment.id,
        description:
            `Pagou/antecipou ${money(
            amountToPay
            )} no cartão ${card.name}`,
        });

    onSaved?.();
    onClose?.();
    } catch (err) {
    console.error(err);

    setError(
        err.message ||
        "Não foi possível realizar o pagamento."
    );
    } finally {
    setSaving(false);
    }
    }

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(25,35,45,.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(440px, 96vw)",
          background: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 22px 65px rgba(0,0,0,.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 750,
                color: COLORS.ink,
              }}
            >
              Pagar fatura
            </div>

            <div
              style={{
                fontSize: 11,
                color: COLORS.inkSoft,
                marginTop: 3,
              }}
            >
              {card?.name}
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
            background: COLORS.primaryLight,
            borderRadius: 10,
            padding: "12px 13px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: COLORS.primaryDark,
            }}
          >
            Valor a pagar
          </div>

          <label
            style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.inkSoft,
                marginBottom: 5,
            }}
            >
            Valor do pagamento
            </label>

            <input
            type="number"
            min="0.01"
            step="0.01"
            value={paymentAmount}
            onChange={(e) =>
                setPaymentAmount(e.target.value)
            }
            style={{
                width: "100%",
                boxSizing: "border-box",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 9,
                padding: "9px 10px",
                fontSize: 12,
                color: COLORS.ink,
                marginBottom: 12,
            }}
            />

          <div
            style={{
              fontSize: 21,
              fontWeight: 750,
              color: COLORS.primaryDark,
              marginTop: 2,
            }}
          >
            {money(invoice?.pendingTotal)}
          </div>
        </div>

        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.inkSoft,
            marginBottom: 5,
          }}
        >
          Conta para pagamento
        </label>

        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          style={{
            width: "100%",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 9,
            padding: "9px 10px",
            fontSize: 12,
            background: COLORS.surface,
            color: COLORS.ink,
            marginBottom: 12,
          }}
        >
          <option value="">Selecione...</option>

          {accounts.map((account) => (
            <option
              key={account.id}
              value={account.id}
            >
              {account.name}
            </option>
          ))}
        </select>

        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.inkSoft,
            marginBottom: 5,
          }}
        >
          Data do pagamento
        </label>

        <input
          type="date"
          value={paymentDate}
          onChange={(e) =>
            setPaymentDate(e.target.value)
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 9,
            padding: "9px 10px",
            fontSize: 12,
            color: COLORS.ink,
          }}
        />

        {error && (
          <div
            style={{
              marginTop: 12,
              background: COLORS.dangerLight,
              color: COLORS.danger,
              borderRadius: 8,
              padding: "9px 10px",
              fontSize: 11,
            }}
          >
            {error}
          </div>
        )}

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
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              borderRadius: 9,
              padding: "9px 13px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handlePay}
            style={{
              border: "none",
              background: COLORS.primary,
              color: "#fff",
              borderRadius: 9,
              padding: "9px 14px",
              cursor: saving ? "default" : "pointer",
              fontWeight: 650,
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving ? "Pagando..." : "Confirmar pagamento"}
          </button>
        </div>
      </div>
    </div>
  );
}