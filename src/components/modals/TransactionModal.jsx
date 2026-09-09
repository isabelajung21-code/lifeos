import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  type: "despesa",
  title: "",
  description: "",
  amount: "",
  category_id: "",
  account_id: "",
  card_id: "",
  transaction_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  paid_date: "",
  status: "previsto",
  notes: "",
  installments: 1,

  is_recurring: false,
  recurrence_frequency: "mensal",
  recurrence_interval: 1,
  recurrence_end_date: "",
};

export default function TransactionModal({
  open,
  onClose,
  currentUser,
  onSaved,
  transactionToEdit,
  initialType = "despesa",
}) {
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasPaidInstallments, setHasPaidInstallments] = useState(false);
  const [showRecurrenceEditOptions, setShowRecurrenceEditOptions] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    loadOptions();
    setError("");

    if (transactionToEdit) {
      async function loadTransactionForEdit() {
        // Compra parcelada
        if (
          transactionToEdit.installment_group_id &&
          Number(transactionToEdit.total_installments) > 1
        ) {
          const { data: installments, error } = await supabase
            .from("finance_transactions")
            .select("*")
            .eq(
              "installment_group_id",
              transactionToEdit.installment_group_id
            )
            .is("deleted_at", null)
            .order("installment_number", {
              ascending: true,
            });

          if (error) {
            console.error(error);
            setError("Não foi possível carregar o parcelamento.");
            return;
          }

          const items = installments || [];

          const first = items[0] || transactionToEdit;

          const hasPaid = items.some(
            (item) => item.status === "pago"
          );

          setHasPaidInstallments(hasPaid);

          const totalAmount = items.reduce(
            (sum, item) =>
              sum + Number(item.amount || 0),
            0
          );

          

          setForm({
            type: first.type || "despesa",
            title: first.title || "",
            description: first.description || "",
            amount: totalAmount.toFixed(2),
            category_id: first.category_id || "",
            account_id: first.account_id || "",
            card_id: first.card_id || "",
            transaction_date:
              first.transaction_date ||
              new Date().toISOString().slice(0, 10),
            due_date: first.due_date || "",
            paid_date: first.paid_date || "",
            status: first.status || "previsto",
            notes: first.notes || "",
            installments:
              first.total_installments || items.length || 1,
          });

          return;
        }


        // Movimentação normal
        setHasPaidInstallments(false);
        let recurrenceData = null;

        if (transactionToEdit.recurrence_id) {
          const {
            data,
            error: recurrenceError,
          } = await supabase
            .from("finance_recurrences")
            .select("*")
            .eq("id", transactionToEdit.recurrence_id)
            .maybeSingle();

          if (recurrenceError) {
            console.error(
              "Erro ao carregar recorrência:",
              recurrenceError
            );
          }

          recurrenceData = data;
        }
        setForm({
          type: transactionToEdit.type || "despesa",
          title: transactionToEdit.title || "",
          description: transactionToEdit.description || "",
          amount: transactionToEdit.amount ?? "",
          category_id: transactionToEdit.category_id || "",
          account_id: transactionToEdit.account_id || "",
          card_id: transactionToEdit.card_id || "",
          transaction_date:
            transactionToEdit.transaction_date ||
            new Date().toISOString().slice(0, 10),
          due_date: transactionToEdit.due_date || "",
          paid_date: transactionToEdit.paid_date || "",
          status: transactionToEdit.status || "previsto",
          notes: transactionToEdit.notes || "",
          installments:
            transactionToEdit.total_installments || 1,
          is_recurring:
            Boolean(transactionToEdit.recurrence_id),

          recurrence_frequency:
            recurrenceData?.frequency || "mensal",

          recurrence_interval:
            recurrenceData?.interval_value || 1,

          recurrence_end_date:
            recurrenceData?.end_date || "",
        });
      }

      loadTransactionForEdit();
        } else {
          setHasPaidInstallments(false);

          setForm({
            ...initialForm,
            type: initialType,
            transaction_date: new Date()
              .toISOString()
              .slice(0, 10),
          });
        }
        }, [open, transactionToEdit, initialType]);

  async function loadOptions() {
    const [categoriesResult, accountsResult, cardsResult] = await Promise.all([
      supabase
        .from("finance_categories")
        .select("*")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("name"),

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
    ]);

    if (categoriesResult.error) console.error(categoriesResult.error);
    if (accountsResult.error) console.error(accountsResult.error);
    if (cardsResult.error) console.error(cardsResult.error);

    setCategories(categoriesResult.data || []);
    setAccounts(accountsResult.data || []);
    setCards(cardsResult.data || []);
  }

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function addMonthsToDate(dateString, months) {
    const date = new Date(`${dateString}T12:00:00`);

    const originalDay = date.getDate();

    date.setDate(1);
    date.setMonth(date.getMonth() + months);

    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    date.setDate(Math.min(originalDay, lastDay));

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function addDaysToDate(dateString, days) {
    const date = new Date(`${dateString}T12:00:00`);

    date.setDate(date.getDate() + days);

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function getNextRecurrenceDate(
    startDate,
    frequency,
    intervalValue = 1
  ) {
    const date = new Date(
      `${startDate}T12:00:00`
    );

    const interval = Math.max(
      Number(intervalValue || 1),
      1
    );

    // SEMANAL
    if (frequency === "semanal") {
      date.setDate(
        date.getDate() + 7 * interval
      );
    }

    // QUINZENAL
    if (frequency === "quinzenal") {
      date.setDate(
        date.getDate() + 14 * interval
      );
    }

    // FREQUÊNCIAS BASEADAS EM MESES
    if (
      frequency === "mensal" ||
      frequency === "bimestral" ||
      frequency === "trimestral" ||
      frequency === "semestral"
    ) {
      const originalDay = date.getDate();

      let monthsToAdd = 1;

      if (frequency === "bimestral") {
        monthsToAdd = 2;
      }

      if (frequency === "trimestral") {
        monthsToAdd = 3;
      }

      if (frequency === "semestral") {
        monthsToAdd = 6;
      }

      monthsToAdd *= interval;

      date.setDate(1);

      date.setMonth(
        date.getMonth() + monthsToAdd
      );

      const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();

      date.setDate(
        Math.min(originalDay, lastDay)
      );
    }

    // ANUAL
    if (frequency === "anual") {
      const month = date.getMonth();
      const originalDay = date.getDate();

      date.setDate(1);

      date.setFullYear(
        date.getFullYear() + interval
      );

      date.setMonth(month);

      const lastDay = new Date(
        date.getFullYear(),
        month + 1,
        0
      ).getDate();

      date.setDate(
        Math.min(originalDay, lastDay)
      );
    }

    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getDate()
      ).padStart(2, "0"),
    ].join("-");
  }

  async function handleSubmit(e, forcedRecurrenceScope = null) {
    e?.preventDefault?.();

    // Se estiver editando uma movimentação recorrente,
    // primeiro pergunta onde aplicar a alteração.
    if (
      transactionToEdit?.recurrence_id &&
      !forcedRecurrenceScope
    ) {
      setShowRecurrenceEditOptions(true);
      return;
    }

    if (forcedRecurrenceScope) {
      setShowRecurrenceEditOptions(false);
    }

    if (!form.title.trim()) {
      setError("Informe o nome da movimentação.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // =====================================
      // USUÁRIO
      // =====================================

      const { data: user, error: userError } =
        await supabase
          .from("users")
          .select("id")
          .eq("display_name", currentUser)
          .single();

      if (userError) throw userError;

      // =====================================
      // PAYLOAD BASE
      // =====================================

      const payload = {
        type: form.type,
        title: form.title.trim(),
        description:
          form.description.trim() || null,
        amount: Number(form.amount),
        category_id:
          form.category_id || null,
        account_id:
          form.account_id || null,
        card_id:
          form.card_id || null,
        transaction_date:
          form.transaction_date,
        due_date:
          form.due_date || null,
        paid_date:
          form.paid_date || null,
        status: form.status,
        notes:
          form.notes.trim() || null,
        source_module: "financeiro",
        created_by_user_id: user.id,
      };

      let result;

      const totalInstallments =
        form.type === "despesa" &&
        form.card_id
          ? Number(form.installments || 1)
          : 1;

      // =====================================
      // NOVA RECORRÊNCIA
      // =====================================

      if (
        !transactionToEdit &&
        form.is_recurring &&
        totalInstallments === 1
      ) {
        const frequencyMap = {
          weekly: "semanal",
          biweekly: "quinzenal",
          monthly: "mensal",
          bimonthly: "bimestral",
          quarterly: "trimestral",
          semiannual: "semestral",
          yearly: "anual",

          semanal: "semanal",
          quinzenal: "quinzenal",
          mensal: "mensal",
          bimestral: "bimestral",
          trimestral: "trimestral",
          semestral: "semestral",
          anual: "anual",
          personalizada: "personalizada",
        };

        const selectedFrequency =
          frequencyMap[
            form.recurrence_frequency
          ] || "mensal";

        const intervalValue = Math.max(
          Number(
            form.recurrence_interval || 1
          ),
          1
        );

        const transactionDate =
          new Date(
            `${form.transaction_date}T12:00:00`
          );

        const nextRunDate =
          getNextRecurrenceDate(
            form.transaction_date,
            selectedFrequency,
            intervalValue
          );

        const recurrencePayload = {
          title:
            form.title.trim(),

          transaction_type:
            form.type,

          amount:
            Number(form.amount),

          category_id:
            form.category_id || null,

          account_id:
            form.account_id || null,

          card_id:
            form.card_id || null,

          frequency:
            selectedFrequency,

          interval_value:
            intervalValue,

          day_of_week:
            [
              "semanal",
              "quinzenal",
            ].includes(
              selectedFrequency
            )
              ? transactionDate.getDay()
              : null,

          day_of_month:
            [
              "mensal",
              "bimestral",
              "trimestral",
              "semestral",
            ].includes(
              selectedFrequency
            )
              ? transactionDate.getDate()
              : null,

          start_date:
            form.transaction_date,

          end_date:
            form.recurrence_end_date ||
            null,

          next_run_date:
            nextRunDate,

          is_active: true,

          notes:
            form.notes.trim() || null,

          created_by_user_id:
            user.id,
        };

        console.log(
          "Recorrência enviada:",
          recurrencePayload
        );

        const {
          data: recurrence,
          error: recurrenceError,
        } = await supabase
          .from("finance_recurrences")
          .insert(recurrencePayload)
          .select("id")
          .single();

        if (recurrenceError) {
          throw recurrenceError;
        }

        payload.recurrence_id =
          recurrence.id;

        payload.is_recurring = true;
      }

      // =====================================
      // EDIÇÃO
      // =====================================

      if (transactionToEdit) {
                
        // =====================================
        // EDIÇÃO DE MOVIMENTAÇÃO RECORRENTE
        // =====================================

        if (
          transactionToEdit.recurrence_id &&
          form.is_recurring &&
          forcedRecurrenceScope
        ) {
          const recurrenceId =
            transactionToEdit.recurrence_id;

          // Busca a regra original
          const {
            data: currentRecurrence,
            error: recurrenceLoadError,
          } = await supabase
            .from("finance_recurrences")
            .select("*")
            .eq("id", recurrenceId)
            .single();

          if (recurrenceLoadError) {
            throw recurrenceLoadError;
          }

          const frequencyMap = {
            weekly: "semanal",
            biweekly: "quinzenal",
            monthly: "mensal",
            bimonthly: "bimestral",
            quarterly: "trimestral",
            semiannual: "semestral",
            yearly: "anual",

            semanal: "semanal",
            quinzenal: "quinzenal",
            mensal: "mensal",
            bimestral: "bimestral",
            trimestral: "trimestral",
            semestral: "semestral",
            anual: "anual",
          };

          const selectedFrequency =
            frequencyMap[form.recurrence_frequency] ||
            "mensal";

          const intervalValue = Math.max(
            Number(form.recurrence_interval || 1),
            1
          );

          const transactionDate = new Date(
            `${form.transaction_date}T12:00:00`
          );

          const commonRecurrenceData = {
            title: form.title.trim(),

            transaction_type: form.type,

            amount: Number(form.amount),

            category_id:
              form.category_id || null,

            account_id:
              form.account_id || null,

            card_id:
              form.card_id || null,

            frequency:
              selectedFrequency,

            interval_value:
              intervalValue,

            day_of_week: [
              "semanal",
              "quinzenal",
            ].includes(selectedFrequency)
              ? transactionDate.getDay()
              : null,

            day_of_month: [
              "mensal",
              "bimestral",
              "trimestral",
              "semestral",
            ].includes(selectedFrequency)
              ? transactionDate.getDate()
              : null,

            end_date:
              form.recurrence_end_date || null,

            notes:
              form.notes.trim() || null,
          };

          const commonTransactionData = {
            title: form.title.trim(),

            description:
              form.description.trim() || null,

            amount:
              Number(form.amount),

            category_id:
              form.category_id || null,

            account_id:
              form.account_id || null,

            card_id:
              form.card_id || null,

            notes:
              form.notes.trim() || null,
          };

          // =====================================
          // 1. SOMENTE ESTA
          // =====================================

          if (forcedRecurrenceScope === "single") {
            let savedTransaction = null;

            // =====================================
            // PROJEÇÃO VIRTUAL
            // Ainda não existe no banco.
            // Cria uma ocorrência real excepcional.
            // =====================================

            if (transactionToEdit.is_projection) {
              const {
                data: insertedTransaction,
                error: insertError,
              } = await supabase
                .from("finance_transactions")
                .insert({
                  ...payload,

                  // mantém a ocorrência exatamente
                  // na data da projeção selecionada
                  transaction_date:
                    transactionToEdit.transaction_date,

                  recurrence_id:
                    recurrenceId,

                  is_recurring: true,
                })
                .select()
                .single();

              if (insertError) {
                throw insertError;
              }

              savedTransaction =
                insertedTransaction;
            }

            // =====================================
            // MOVIMENTAÇÃO QUE JÁ EXISTE NO BANCO
            // =====================================

            else {
              const {
                data: updatedTransaction,
                error: singleError,
              } = await supabase
                .from("finance_transactions")
                .update({
                  ...payload,

                  recurrence_id:
                    recurrenceId,

                  is_recurring: true,
                })
                .eq(
                  "id",
                  transactionToEdit.id
                )
                .select()
                .single();

              if (singleError) {
                throw singleError;
              }

              savedTransaction =
                updatedTransaction;
            }

            // =====================================
            // HISTÓRICO
            // =====================================

            await supabase
              .from("activity_logs")
              .insert({
                user_id:
                  user.id,

                module:
                  "Financeiro",

                action:
                  transactionToEdit.is_projection
                    ? "created"
                    : "updated",

                entity_type:
                  "finance_transaction",

                entity_id:
                  savedTransaction?.id || null,

                entity_name:
                  form.title.trim(),

                details: {
                  message:
                    transactionToEdit.is_projection
                      ? `Personalizou somente esta ocorrência projetada de ${form.title.trim()}`
                      : `Alterou somente esta ocorrência de ${form.title.trim()}`,
                },
              });

            onSaved?.();
            onClose?.();
            return;
          }

          // =====================================
          // 2. ESTA E TODAS AS PRÓXIMAS
          // =====================================

          if (forcedRecurrenceScope === "future") {
            const previousDate =
              addDaysToDate(
                form.transaction_date,
                -1
              );

            // Encerra a regra antiga antes desta ocorrência
            const {
              error: closeOldError,
            } = await supabase
              .from("finance_recurrences")
              .update({
                end_date: previousDate,
                next_run_date: null,
                is_active: false,
              })
              .eq("id", recurrenceId);

            if (closeOldError) {
              throw closeOldError;
            }

            // Cria uma nova regra a partir desta ocorrência
            const newNextRunDate =
              getNextRecurrenceDate(
                form.transaction_date,
                selectedFrequency,
                intervalValue
              );

            const {
              data: newRecurrence,
              error: createRecurrenceError,
            } = await supabase
              .from("finance_recurrences")
              .insert({
                ...commonRecurrenceData,

                start_date:
                  form.transaction_date,

                next_run_date:
                  newNextRunDate,

                is_active: true,

                created_by_user_id:
                  user.id,
              })
              .select("id")
              .single();

            if (createRecurrenceError) {
              throw createRecurrenceError;
            }

            // Todas as ocorrências existentes
            // desta data em diante passam para a nova série.
            const {
              error: futureTransactionsError,
            } = await supabase
              .from("finance_transactions")
              .update({
                ...commonTransactionData,

                recurrence_id:
                  newRecurrence.id,

                is_recurring: true,
              })
              .eq(
                "recurrence_id",
                recurrenceId
              )
              .gte(
                "transaction_date",
                form.transaction_date
              )
              .is("deleted_at", null);

            if (futureTransactionsError) {
              throw futureTransactionsError;
            }

            await supabase
              .from("activity_logs")
              .insert({
                user_id: user.id,
                module: "Financeiro",
                action: "updated",
                entity_type:
                  "finance_recurrence",
                entity_id:
                  newRecurrence.id,
                entity_name:
                  form.title.trim(),
                details: {
                  message:
                    `Alterou esta e todas as próximas ocorrências de ${form.title.trim()}`,
                },
              });

            onSaved?.();
            onClose?.();
            return;
          }

          // =====================================
          // 3. TODAS AS MOVIMENTAÇÕES
          // =====================================

          if (forcedRecurrenceScope === "all") {
            // Descobre a ocorrência mais recente
            const {
              data: lastTransaction,
              error: lastTransactionError,
            } = await supabase
              .from("finance_transactions")
              .select("transaction_date")
              .eq(
                "recurrence_id",
                recurrenceId
              )
              .is("deleted_at", null)
              .order(
                "transaction_date",
                {
                  ascending: false,
                }
              )
              .limit(1)
              .maybeSingle();

            if (lastTransactionError) {
              throw lastTransactionError;
            }

            const referenceDate =
              lastTransaction?.transaction_date ||
              form.transaction_date;

            const newNextRunDate =
              getNextRecurrenceDate(
                referenceDate,
                selectedFrequency,
                intervalValue
              );

            // Atualiza a regra
            const {
              error: updateRecurrenceError,
            } = await supabase
              .from("finance_recurrences")
              .update({
                ...commonRecurrenceData,

                // mantém o início original da série
                start_date:
                  currentRecurrence.start_date,

                next_run_date:
                  newNextRunDate,

                is_active: true,
              })
              .eq("id", recurrenceId);

            if (updateRecurrenceError) {
              throw updateRecurrenceError;
            }

            // Atualiza todas as ocorrências já existentes.
            // Não altera transaction_date, status ou paid_date.
            const {
              error: allTransactionsError,
            } = await supabase
              .from("finance_transactions")
              .update({
                ...commonTransactionData,

                is_recurring: true,
              })
              .eq(
                "recurrence_id",
                recurrenceId
              )
              .is("deleted_at", null);

            if (allTransactionsError) {
              throw allTransactionsError;
            }

            await supabase
              .from("activity_logs")
              .insert({
                user_id: user.id,
                module: "Financeiro",
                action: "updated",
                entity_type:
                  "finance_recurrence",
                entity_id:
                  recurrenceId,
                entity_name:
                  form.title.trim(),
                details: {
                  message:
                    `Alterou toda a recorrência de ${form.title.trim()}`,
                },
              });

            onSaved?.();
            onClose?.();
            return;
          }
        }

        const isInstallmentPurchase =
          transactionToEdit.installment_group_id &&
          Number(
            transactionToEdit.total_installments
          ) > 1;

        // =====================================
        // PARCELAMENTO COM PARCELA PAGA
        // =====================================

        if (
          isInstallmentPurchase &&
          hasPaidInstallments
        ) {
          const {
            error: updateGroupError,
          } = await supabase
            .from("finance_transactions")
            .update({
              title:
                form.title.trim(),

              description:
                form.description.trim() ||
                null,

              category_id:
                form.category_id || null,

              notes:
                form.notes.trim() || null,
            })
            .eq(
              "installment_group_id",
              transactionToEdit.installment_group_id
            )
            .is("deleted_at", null);

          if (updateGroupError) {
            throw updateGroupError;
          }

          await supabase
            .from("activity_logs")
            .insert({
              user_id: user.id,
              module: "Financeiro",
              action: "updated",
              entity_type:
                "finance_transaction",
              entity_id:
                transactionToEdit.id,
              entity_name:
                form.title.trim(),
              details: {
                message:
                  `Alterou informações da compra parcelada: ${form.title.trim()}`,
              },
            });

          onSaved?.();
          onClose?.();
          return;
        }

        // =====================================
        // PARCELAMENTO SEM PARCELA PAGA
        // =====================================

        if (isInstallmentPurchase) {
          const groupId =
            transactionToEdit.installment_group_id;

          const {
            data: existingInstallments,
            error: installmentsError,
          } = await supabase
            .from("finance_transactions")
            .select("*")
            .eq(
              "installment_group_id",
              groupId
            )
            .is("deleted_at", null)
            .order(
              "installment_number",
              {
                ascending: true,
              }
            );

          if (installmentsError) {
            throw installmentsError;
          }

          const totalInstallmentsEdit =
            Number(
              form.installments || 1
            );

          const totalAmountCents =
            Math.round(
              Number(form.amount) * 100
            );

          const baseInstallmentCents =
            Math.floor(
              totalAmountCents /
                totalInstallmentsEdit
            );

          const remainder =
            totalAmountCents -
            baseInstallmentCents *
              totalInstallmentsEdit;

          const oldIds =
            (
              existingInstallments || []
            ).map(
              (item) => item.id
            );

          if (oldIds.length > 0) {
            const {
              error: deleteOldError,
            } = await supabase
              .from(
                "finance_transactions"
              )
              .delete()
              .in("id", oldIds);

            if (deleteOldError) {
              throw deleteOldError;
            }
          }

          const newInstallments = [];

          for (
            let i = 1;
            i <=
            totalInstallmentsEdit;
            i++
          ) {
            const installmentCents =
              baseInstallmentCents +
              (i ===
              totalInstallmentsEdit
                ? remainder
                : 0);

            newInstallments.push({
              ...payload,

              title:
                form.title.trim(),

              amount:
                installmentCents /
                100,

              transaction_date:
                addMonthsToDate(
                  form.transaction_date,
                  i - 1
                ),

              due_date: null,
              paid_date: null,

              status: "previsto",

              installment_group_id:
                groupId,

              installment_number: i,

              total_installments:
                totalInstallmentsEdit,

              invoice_payment_id:
                null,

              recurrence_id: null,
              is_recurring: false,
            });
          }

          result = await supabase
            .from(
              "finance_transactions"
            )
            .insert(
              newInstallments
            );

          if (result.error) {
            throw result.error;
          }
        } else {
          // =====================================
          // EDIÇÃO NORMAL
          // =====================================

          result = await supabase
            .from(
              "finance_transactions"
            )
            .update(payload)
            .eq(
              "id",
              transactionToEdit.id
            );

          if (result.error) {
            throw result.error;
          }
        }
      }

      // =====================================
      // NOVA COMPRA PARCELADA
      // =====================================

      else if (
        form.type === "despesa" &&
        form.card_id &&
        totalInstallments > 1
      ) {
        const installmentGroupId =
          crypto.randomUUID();

        const totalAmount =
          Math.round(
            Number(form.amount) * 100
          );

        const baseInstallment =
          Math.floor(
            totalAmount /
              totalInstallments
          );

        const remainder =
          totalAmount -
          baseInstallment *
            totalInstallments;

        const installments = [];

        for (
          let i = 1;
          i <= totalInstallments;
          i++
        ) {
          const installmentCents =
            baseInstallment +
            (i ===
            totalInstallments
              ? remainder
              : 0);

          installments.push({
            ...payload,

            title:
              form.title.trim(),

            amount:
              installmentCents /
              100,

            transaction_date:
              addMonthsToDate(
                form.transaction_date,
                i - 1
              ),

            due_date: null,
            paid_date: null,

            status: "previsto",

            installment_group_id:
              installmentGroupId,

            installment_number: i,

            total_installments:
              totalInstallments,

            recurrence_id: null,
            is_recurring: false,
          });
        }

        result = await supabase
          .from(
            "finance_transactions"
          )
          .insert(installments);

        if (result.error) {
          throw result.error;
        }
      }

      // =====================================
      // NOVA MOVIMENTAÇÃO NORMAL
      // =====================================

      else {
        result = await supabase
          .from(
            "finance_transactions"
          )
          .insert({
            ...payload,

            installment_group_id:
              null,

            installment_number:
              null,

            total_installments: 1,
          });

        if (result.error) {
          throw result.error;
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

          action:
            transactionToEdit
              ? "updated"
              : "created",

          entity_type:
            "finance_transaction",

          entity_id:
            transactionToEdit?.id ||
            null,

          entity_name:
            payload.title,

          details: {
            message:
              transactionToEdit
                ? `Alterou movimentação financeira: ${payload.title}`
                : form.is_recurring
                ? `Criou movimentação recorrente: ${payload.title}`
                : totalInstallments >
                  1
                ? `Criou compra parcelada: ${payload.title} em ${totalInstallments}x`
                : `Criou movimentação financeira: ${payload.title}`,
          },
        });

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível salvar."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const filteredCategories = categories.filter(
    (category) => category.type === form.type
  );

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.inkSoft,
    marginBottom: 5,
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 9,
    padding: "9px 10px",
    fontSize: 12,
    color: COLORS.ink,
    background: COLORS.surface,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(25,35,45,.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(720px, 96vw)",
          maxHeight: "92vh",
          overflowY: "auto",
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
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 750,
                color: COLORS.ink,
              }}
            >
              {transactionToEdit
                ? "Editar movimentação"
                : "Nova movimentação"}
            </div>

            <div
              style={{
                fontSize: 11,
                color: COLORS.inkSoft,
                marginTop: 2,
              }}
            >
              Registre receitas e despesas do Financeiro
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              border: "none",
              background: COLORS.bg,
              borderRadius: 9,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={17} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <label style={labelStyle}>Tipo</label>
            <select
              value={form.type}
              onChange={(e) => {
                handleChange("type", e.target.value);
                handleChange("category_id", "");

                if (
                  form.status === "pago" ||
                  form.status === "recebido"
                ) {
                  handleChange("status", "previsto");
                }
              }}
              style={inputStyle}
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Valor</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="0,00"
              style={inputStyle}
              disabled={hasPaidInstallments}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Nome</label>
            <input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Ex.: Mercado, Salário, Internet..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Categoria</label>
            <select
              value={form.category_id}
              onChange={(e) =>
                handleChange("category_id", e.target.value)
              }
              style={inputStyle}
            >
              <option value="">Sem categoria</option>

              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              style={inputStyle}
            >
              <option value="previsto">Previsto</option>

              {form.type === "despesa" && !form.card_id && (
                <option value="pago">Pago</option>
              )}

              {form.type === "receita" && (
                <option value="recebido">Recebido</option>
              )}

              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Data</label>
            <input
              type="date"
              value={form.transaction_date}
              onChange={(e) =>
                handleChange("transaction_date", e.target.value)
              }
              style={inputStyle}
              disabled={hasPaidInstallments}
            />
          </div>

          <div>
            <label style={labelStyle}>Vencimento</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => handleChange("due_date", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Conta</label>
            <select
              value={form.account_id}
              onChange={(e) => {
                handleChange("account_id", e.target.value);

                if (e.target.value) {
                  handleChange("card_id", "");
                }
              }}
              style={inputStyle}
            >
              <option value="">Nenhuma</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Cartão</label>
            <select
              value={form.card_id}
              onChange={(e) => {
                const cardId = e.target.value;

                handleChange("card_id", cardId);

                if (cardId) {
                  handleChange("account_id", "");
                  handleChange("status", "previsto");
                }
              }}
              style={inputStyle}
              disabled={hasPaidInstallments}
            >
              <option value="">Nenhum</option>

              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>

          {form.type === "despesa" && form.card_id && (
            <div>
              <label style={labelStyle}>Parcelamento</label>

              <select
                value={form.installments}
                onChange={(e) =>
                  handleChange(
                    "installments",
                    Number(e.target.value)
                  )
                }
                style={inputStyle}
                disabled={hasPaidInstallments}
              >
                {Array.from({ length: 60 }, (_, index) => {
                  const number = index + 1;

                  return (
                    <option key={number} value={number}>
                      {number === 1
                        ? "À vista"
                        : `${number}x`}
                    </option>
                  );
                })}
              </select>

              {Number(form.installments) > 1 &&
                Number(form.amount) > 0 && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      padding: "9px 11px",
                      borderRadius: 9,
                      background: COLORS.primaryLight,
                      color: COLORS.primaryDark,
                      fontSize: 11,
                    }}
                  >
                    {form.installments} parcelas de aproximadamente{" "}
                    <strong>
                      {(
                        Number(form.amount) /
                        Number(form.installments)
                      ).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </strong>

                    <div
                      style={{
                        fontSize: 9.5,
                        marginTop: 3,
                        opacity: 0.8,
                      }}
                    >
                      O valor total de{" "}
                      {Number(form.amount).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}{" "}
                      ficará comprometido no limite do cartão.
                    </div>
                  </div>
                )}

            </div>
          )}

          {Number(form.installments || 1) === 1 &&
            (!transactionToEdit ||
              Boolean(transactionToEdit.recurrence_id)) && (
              <>
                <div
                  style={{
                    gridColumn: "1 / -1",
                    marginTop: 2,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLORS.ink,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.is_recurring}
                      disabled={Boolean(
                        transactionToEdit?.recurrence_id
                      )}
                      onChange={(e) =>
                        handleChange(
                          "is_recurring",
                          e.target.checked
                        )
                      }
                    />

                    Movimentação recorrente
                  </label>
                </div>

                {form.is_recurring && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: 12,
                      padding: 12,
                      borderRadius: 10,
                      background: COLORS.primaryLight,
                    }}
                  >
                    <div>
                      <label style={labelStyle}>
                        Frequência
                      </label>

                      <select
                        value={
                          form.recurrence_frequency
                        }
                        onChange={(e) =>
                          handleChange(
                            "recurrence_frequency",
                            e.target.value
                          )
                        }
                        style={{
                          ...inputStyle,
                          background:
                            COLORS.surface,
                        }}
                      >
                        <option value="semanal">
                          Semanalmente
                        </option>
                        
                        <option value="quinzenal">
                          Quinzenalmente
                        </option>

                        <option value="mensal">
                          Mensalmente
                        </option>

                        <option value="bimestral">
                          A cada 2 meses
                        </option>

                        <option value="trimestral">
                          A cada 3 meses
                        </option>

                        <option value="semestral">
                          A cada 6 meses
                        </option>

                        <option value="anual">
                          Anualmente
                        </option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Repetir a cada
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={
                          form.recurrence_interval
                        }
                        onChange={(e) =>
                          handleChange(
                            "recurrence_interval",
                            Math.max(
                              Number(
                                e.target.value || 1
                              ),
                              1
                            )
                          )
                        }
                        style={{
                          ...inputStyle,
                          background:
                            COLORS.surface,
                        }}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Data de início
                      </label>

                      <input
                        type="date"
                        value={
                          form.transaction_date
                        }
                        onChange={(e) =>
                          handleChange(
                            "transaction_date",
                            e.target.value
                          )
                        }
                        style={{
                          ...inputStyle,
                          background:
                            COLORS.surface,
                        }}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Término
                      </label>

                      <input
                        type="date"
                        value={
                          form.recurrence_end_date
                        }
                        min={
                          form.transaction_date
                        }
                        onChange={(e) =>
                          handleChange(
                            "recurrence_end_date",
                            e.target.value
                          )
                        }
                        style={{
                          ...inputStyle,
                          background:
                            COLORS.surface,
                        }}
                      />

                      <div
                        style={{
                          fontSize: 9.5,
                          color: COLORS.inkSoft,
                          marginTop: 4,
                        }}
                      >
                        Deixe em branco para não
                        definir uma data final.
                      </div>
                    </div>

                    <div
                      style={{
                        gridColumn: "1 / -1",
                        fontSize: 10.5,
                        color: COLORS.primaryDark,
                      }}
                    >
                      {form.recurrence_frequency === "semanal" &&
                        `Será repetida a cada ${form.recurrence_interval} semana(s).`}

                      {form.recurrence_frequency === "quinzenal" &&
                        `Será repetida a cada ${form.recurrence_interval} quinzena(s).`}

                      {form.recurrence_frequency === "mensal" &&
                        `Será repetida a cada ${form.recurrence_interval} mês(es).`}

                      {form.recurrence_frequency === "bimestral" &&
                        `Será repetida a cada ${Number(form.recurrence_interval) * 2} mês(es).`}

                      {form.recurrence_frequency === "trimestral" &&
                        `Será repetida a cada ${Number(form.recurrence_interval) * 3} mês(es).`}

                      {form.recurrence_frequency === "semestral" &&
                        `Será repetida a cada ${Number(form.recurrence_interval) * 6} mês(es).`}

                      {form.recurrence_frequency === "anual" &&
                        `Será repetida a cada ${form.recurrence_interval} ano(s).`}
                    </div>
                  </div>
                )}
              </>
            )}

          {transactionToEdit &&
            transactionToEdit.installment_group_id &&
            hasPaidInstallments && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "10px 12px",
                  borderRadius: 9,
                  background: COLORS.warningLight,
                  color: COLORS.warning,
                  fontSize: 10.5,
                  lineHeight: 1.5,
                }}
              >
                Esta compra já possui parcela(s) paga(s). Para preservar o
                histórico financeiro, o valor total, parcelamento, cartão e
                data da compra não podem ser alterados.
              </div>
            )}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                handleChange("description", e.target.value)
              }
              rows={2}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "9px 11px",
              background: COLORS.dangerLight,
              color: COLORS.danger,
              borderRadius: 8,
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
          {showRecurrenceEditOptions && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                border: `1px solid ${COLORS.primary}`,
                borderRadius: 12,
                background: COLORS.primaryLight,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 6,
                  color: COLORS.ink,
                }}
              >
                Alterar movimentação recorrente
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: COLORS.inkSoft,
                  marginBottom: 14,
                }}
              >
                Como você deseja aplicar esta alteração?
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    handleSubmit(
                      null,
                      "single"
                    )
                  }
                  style={{
                    padding: "11px 12px",
                    borderRadius: 9,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.surface,
                    cursor: "pointer",
                    textAlign: "left",
                    color: COLORS.ink,
                  }}
                >
                  <strong>
                    Somente esta movimentação
                  </strong>

                  <div
                    style={{
                      fontSize: 12,
                      color: COLORS.inkSoft,
                      marginTop: 3,
                    }}
                  >
                    As demais continuam seguindo a regra atual.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSubmit(
                      null,
                      "future"
                    )
                  }
                  style={{
                    padding: "11px 12px",
                    borderRadius: 9,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.surface,
                    cursor: "pointer",
                    textAlign: "left",
                    color: COLORS.ink,
                  }}
                >
                  <strong>
                    Esta e todas as próximas
                  </strong>

                  <div
                    style={{
                      fontSize: 12,
                      color: COLORS.inkSoft,
                      marginTop: 3,
                    }}
                  >
                    As anteriores permanecem como estão.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSubmit(
                      null,
                      "all"
                    )
                  }
                  style={{
                    padding: "11px 12px",
                    borderRadius: 9,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.surface,
                    cursor: "pointer",
                    textAlign: "left",
                    color: COLORS.ink,
                  }}
                >
                  <strong>
                    Todas as movimentações
                  </strong>

                  <div
                    style={{
                      fontSize: 12,
                      color: COLORS.inkSoft,
                      marginTop: 3,
                    }}
                  >
                    Atualiza a série inteira, inclusive ocorrências anteriores.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowRecurrenceEditOptions(
                      false
                    )
                  }
                  style={{
                    padding: 9,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: COLORS.inkSoft,
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.ink,
              borderRadius: 9,
              padding: "9px 14px",
              cursor: "pointer",
              fontSize: 12,
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
              padding: "9px 16px",
              cursor: saving ? "default" : "pointer",
              fontSize: 12,
              fontWeight: 650,
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}