import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function SubscriptionModal({
  open,
  onClose,
  onSaved,
  user,
  subscription = null,
  categories = [],
  accounts = [],
  cards = [],
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentType, setPaymentType] = useState("account");
  const [accountId, setAccountId] = useState("");
  const [cardId, setCardId] = useState("");
  const [frequency, setFrequency] = useState("mensal");
  const [startDate, setStartDate] = useState("");
  const [billingDay, setBillingDay] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (subscription) {
      setName(subscription.name || "");
      setAmount(
        subscription.amount != null
          ? String(subscription.amount)
          : ""
      );
      setCategoryId(subscription.category_id || "");

      if (subscription.card_id) {
        setPaymentType("card");
        setCardId(subscription.card_id);
        setAccountId("");
      } else {
        setPaymentType("account");
        setAccountId(subscription.account_id || "");
        setCardId("");
      }

      setFrequency(subscription.frequency || "mensal");
      setStartDate(subscription.start_date || "");
      setBillingDay(
        subscription.billing_day != null
          ? String(subscription.billing_day)
          : ""
      );
      setNotes(subscription.notes || "");
    } else {
      const today = new Date();

      setName("");
      setAmount("");
      setCategoryId("");
      setPaymentType("account");
      setAccountId("");
      setCardId("");
      setFrequency("mensal");
      setStartDate(
        `${today.getFullYear()}-${String(
          today.getMonth() + 1
        ).padStart(2, "0")}-${String(
          today.getDate()
        ).padStart(2, "0")}`
      );
      setBillingDay(String(today.getDate()));
      setNotes("");
    }
  }, [open, subscription]);

  if (!open) return null;

  const availableCategories = categories.filter(
    (category) =>
      category.type === "despesa" ||
      category.transaction_type === "despesa" ||
      (!category.type && !category.transaction_type)
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      alert("Informe o nome da assinatura.");
      return;
    }

    const parsedAmount = Number(
      String(amount).replace(",", ".")
    );

    if (!parsedAmount || parsedAmount <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    if (!startDate) {
      alert("Informe a data de início.");
      return;
    }

    const parsedBillingDay = Number(billingDay);

    if (
      !parsedBillingDay ||
      parsedBillingDay < 1 ||
      parsedBillingDay > 31
    ) {
      alert("Informe um dia de cobrança entre 1 e 31.");
      return;
    }

    if (paymentType === "account" && !accountId) {
      alert("Selecione uma conta.");
      return;
    }

    if (paymentType === "card" && !cardId) {
      alert("Selecione um cartão.");
      return;
    }

    setSaving(true);

    try {
      if (subscription?.id) {
        const recurrencePayload = {
            title: name.trim(),
            transaction_type: "despesa",
            amount: parsedAmount,
            category_id: categoryId || null,

            account_id:
            paymentType === "account"
                ? accountId
                : null,

            card_id:
            paymentType === "card"
                ? cardId
                : null,

            frequency,
            interval_value: 1,
            day_of_week: null,
            day_of_month: parsedBillingDay,
            start_date: startDate,
            notes: notes.trim() || null,
        };

        /*
        * Atualiza a recorrência vinculada.
        */
        if (subscription.recurrence_id) {
            const { error: recurrenceUpdateError } =
            await supabase
                .from("finance_recurrences")
                .update(recurrencePayload)
                .eq("id", subscription.recurrence_id);

            if (recurrenceUpdateError) {
            throw recurrenceUpdateError;
            }
        }

        /*
        * Atualiza a assinatura.
        */
        const subscriptionPayload = {
            name: name.trim(),
            amount: parsedAmount,
            category_id: categoryId || null,

            account_id:
            paymentType === "account"
                ? accountId
                : null,

            card_id:
            paymentType === "card"
                ? cardId
                : null,

            billing_day: parsedBillingDay,
            frequency,
            start_date: startDate,
            notes: notes.trim() || null,
        };

        const {
            data: updatedSubscription,
            error: subscriptionUpdateError,
        } = await supabase
            .from("finance_subscriptions")
            .update(subscriptionPayload)
            .eq("id", subscription.id)
            .select()
            .single();

        if (subscriptionUpdateError) {
            throw subscriptionUpdateError;
        }

        await supabase
            .from("activity_logs")
            .insert({
            user_id: user?.id || null,
            module: "Financeiro",
            action: "updated",
            entity_type: "finance_subscription",
            entity_id: updatedSubscription.id,
            entity_name: name.trim(),
            details: {
                message:
                `Atualizou assinatura: ${name.trim()}`,
                amount: parsedAmount,
                frequency,
                recurrence_id:
                subscription.recurrence_id || null,
            },
            });

        await onSaved?.();
        onClose?.();

        return;
        }

      /*
       * 1. Cria a regra financeira.
       */
      const recurrencePayload = {
        title: name.trim(),
        transaction_type: "despesa",
        amount: parsedAmount,
        category_id: categoryId || null,
        account_id:
          paymentType === "account"
            ? accountId
            : null,
        card_id:
          paymentType === "card"
            ? cardId
            : null,
        frequency,
        interval_value: 1,
        day_of_week: null,
        day_of_month: parsedBillingDay,
        start_date: startDate,
        end_date: null,
        next_run_date: startDate,
        is_active: true,
        notes: notes.trim() || null,
        created_by_user_id: user?.id || null,
      };

      const {
        data: recurrence,
        error: recurrenceError,
      } = await supabase
        .from("finance_recurrences")
        .insert(recurrencePayload)
        .select()
        .single();

      if (recurrenceError) {
        throw recurrenceError;
      }

      /*
       * 2. Cria a assinatura vinculada.
       */
      const subscriptionPayload = {
        name: name.trim(),
        amount: parsedAmount,
        category_id: categoryId || null,
        account_id:
          paymentType === "account"
            ? accountId
            : null,
        card_id:
          paymentType === "card"
            ? cardId
            : null,
        billing_day: parsedBillingDay,
        frequency,
        start_date: startDate,
        next_billing_date: startDate,
        is_active: true,
        notes: notes.trim() || null,
        created_by_user_id: user?.id || null,
        recurrence_id: recurrence.id,
      };

      const {
        data: savedSubscription,
        error: subscriptionError,
      } = await supabase
        .from("finance_subscriptions")
        .insert(subscriptionPayload)
        .select()
        .single();

      if (subscriptionError) {
        /*
         * Evita deixar uma recorrência órfã caso
         * a criação da assinatura falhe.
         */
        await supabase
          .from("finance_recurrences")
          .delete()
          .eq("id", recurrence.id);

        throw subscriptionError;
      }

      /*
       * 3. Histórico.
       */
      await supabase.from("activity_logs").insert({
        user_id: user?.id || null,
        module: "Financeiro",
        action: "created",
        entity_type: "finance_subscription",
        entity_id: savedSubscription.id,
        entity_name: name.trim(),
        details: {
          message: `Criou assinatura: ${name.trim()}`,
          amount: parsedAmount,
          frequency,
          recurrence_id: recurrence.id,
        },
      });

      await onSaved?.();
      onClose?.();
    } catch (error) {
      console.error(
        "Erro ao salvar assinatura:",
        error
      );

      alert(
        `Erro ao salvar assinatura${
          error?.message
            ? `: ${error.message}`
            : "."
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    border: "1px solid #d9e2e8",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 12,
    boxSizing: "border-box",
    background: "#fff",
  };

  const labelStyle = {
    display: "block",
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 4,
    color: "#68747A",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 30, 40, 0.42)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 14,
          padding: 18,
          boxShadow: "0 18px 50px rgba(0,0,0,0.16)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              {subscription
                ? "Editar assinatura"
                : "Nova assinatura"}
            </div>

            <div
              style={{
                fontSize: 10,
                color: "#68747A",
                marginTop: 2,
              }}
            >
              {subscription
                ? "As alterações serão sincronizadas com a recorrência financeira."
                : "A cobrança será adicionada às recorrências financeiras."}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>
              Nome da assinatura
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Netflix"
              style={fieldStyle}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle}>
                Valor
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Categoria
              </label>

              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value)
                }
                style={fieldStyle}
              >
                <option value="">
                  Sem categoria
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
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle}>
                Forma de cobrança
              </label>

              <select
                value={paymentType}
                onChange={(e) =>
                  setPaymentType(e.target.value)
                }
                style={fieldStyle}
              >
                <option value="account">
                  Conta
                </option>
                <option value="card">
                  Cartão
                </option>
              </select>
            </div>

            <div>
              {paymentType === "account" ? (
                <>
                  <label style={labelStyle}>
                    Conta
                  </label>

                  <select
                    value={accountId}
                    onChange={(e) =>
                      setAccountId(e.target.value)
                    }
                    style={fieldStyle}
                  >
                    <option value="">
                      Selecione
                    </option>

                    {accounts.map((account) => (
                      <option
                        key={account.id}
                        value={account.id}
                      >
                        {account.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label style={labelStyle}>
                    Cartão
                  </label>

                  <select
                    value={cardId}
                    onChange={(e) =>
                      setCardId(e.target.value)
                    }
                    style={fieldStyle}
                  >
                    <option value="">
                      Selecione
                    </option>

                    {cards.map((card) => (
                      <option
                        key={card.id}
                        value={card.id}
                      >
                        {card.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle}>
                Frequência
              </label>

              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value)
                }
                style={fieldStyle}
              >
                <option value="semanal">
                  Semanal
                </option>
                <option value="quinzenal">
                  Quinzenal
                </option>
                <option value="mensal">
                  Mensal
                </option>
                <option value="bimestral">
                  Bimestral
                </option>
                <option value="trimestral">
                  Trimestral
                </option>
                <option value="semestral">
                  Semestral
                </option>
                <option value="anual">
                  Anual
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Dia da cobrança
              </label>

              <input
                type="number"
                min="1"
                max="31"
                value={billingDay}
                onChange={(e) =>
                  setBillingDay(e.target.value)
                }
                style={fieldStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>
              Início
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
              style={fieldStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Observações
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              rows={3}
              style={{
                ...fieldStyle,
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                border: "1px solid #d9e2e8",
                background: "#fff",
                borderRadius: 8,
                padding: "8px 12px",
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
                background: "#478C85",
                color: "#fff",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                fontWeight: 700,
              }}
            >
              {saving
                ? "Salvando..."
                : subscription
                ? "Salvar alterações"
                : "Salvar assinatura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}