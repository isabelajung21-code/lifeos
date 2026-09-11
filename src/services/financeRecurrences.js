import { supabase } from "./supabase";

// =====================================
// UTILIDADES DE DATA
// =====================================

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function addMonths(dateString, months) {
  const date = parseDate(dateString);
  const originalDay = date.getDate();

  date.setDate(1);
  date.setMonth(date.getMonth() + months);

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  date.setDate(
    Math.min(originalDay, lastDay)
  );

  return formatDate(date);
}

// =====================================
// CALCULA PRÓXIMA DATA
// =====================================

export function getNextFinanceRecurrenceDate(
  currentDate,
  frequency,
  intervalValue = 1
) {
  const interval = Math.max(
    Number(intervalValue || 1),
    1
  );

  const date = parseDate(currentDate);

  if (frequency === "semanal") {
    date.setDate(
      date.getDate() + 7 * interval
    );

    return formatDate(date);
  }

  if (frequency === "quinzenal") {
    date.setDate(
      date.getDate() + 14 * interval
    );

    return formatDate(date);
  }

  if (frequency === "mensal") {
    return addMonths(
      currentDate,
      interval
    );
  }

  if (frequency === "bimestral") {
    return addMonths(
      currentDate,
      2 * interval
    );
  }

  if (frequency === "trimestral") {
    return addMonths(
      currentDate,
      3 * interval
    );
  }

  if (frequency === "semestral") {
    return addMonths(
      currentDate,
      6 * interval
    );
  }

  if (frequency === "anual") {
    return addMonths(
      currentDate,
      12 * interval
    );
  }

  return null;
}

// =====================================
// PROCESSA RECORRÊNCIAS PENDENTES
// =====================================

export async function processFinanceRecurrences() {
  const today = formatDate(new Date());

  const {
    data: recurrences,
    error: recurrenceError,
  } = await supabase
    .from("finance_recurrences")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("next_run_date", "is", null)
    .lte("next_run_date", today);

  if (recurrenceError) {
    console.error(
      "Erro ao buscar recorrências financeiras:",
      recurrenceError
    );

    throw recurrenceError;
  }

  if (!recurrences?.length) {
    return {
      created: 0,
    };
  }

  let created = 0;

  for (const recurrence of recurrences) {
    let nextDate =
      recurrence.next_run_date;

    // Proteção contra loop infinito caso
    // exista alguma recorrência inválida.
    let safetyCounter = 0;

    while (
      nextDate &&
      nextDate <= today &&
      safetyCounter < 500
    ) {
      safetyCounter += 1;

      // =====================================
      // RESPEITA DATA FINAL
      // =====================================

      if (
        recurrence.end_date &&
        nextDate >
          recurrence.end_date
      ) {
        await supabase
          .from("finance_recurrences")
          .update({
            is_active: false,
            next_run_date: null,
          })
          .eq("id", recurrence.id);

        nextDate = null;
        break;
      }

      // =====================================
      // EVITA DUPLICAÇÃO
      // =====================================

      const {
        data: existing,
        error: existingError,
      } = await supabase
        .from("finance_transactions")
        .select("id")
        .eq(
          "recurrence_id",
          recurrence.id
        )
        .eq(
          "transaction_date",
          nextDate
        )
        .is("deleted_at", null)
        .limit(1);

      if (existingError) {
        console.error(
          "Erro ao verificar ocorrência:",
          existingError
        );

        throw existingError;
      }

            // =====================================
            // CRIA A MOVIMENTAÇÃO
            // =====================================

            if (!existing?.length) {
              const isHouseRecurrence =
                recurrence.source_module === "casa";

              let houseBillTemplate = null;

              // =====================================
              // SE VEIO DE CASA, BUSCA OS DADOS
              // DA CONTA ORIGINAL
              // =====================================

              if (isHouseRecurrence) {
                if (!recurrence.source_id) {
                  throw new Error(
                    `Recorrência da Casa "${recurrence.title}" está sem source_id.`
                  );
                }

                const {
                  data: template,
                  error: templateError,
                } = await supabase
                  .from("house_bills")
                  .select(
                    `
                      id,
                      bill_type,
                      provider,
                      notes
                    `
                  )
                  .eq(
                    "id",
                    recurrence.source_id
                  )
                  .maybeSingle();

                if (templateError) {
                  console.error(
                    "Erro ao buscar conta da Casa usada como modelo:",
                    templateError
                  );

                  throw templateError;
                }

                if (!template) {
                  throw new Error(
                    `Não foi possível localizar os dados da conta da Casa "${recurrence.title}".`
                  );
                }

                houseBillTemplate =
                  template;
              }

              // =====================================
              // MONTA A MOVIMENTAÇÃO FINANCEIRA
              // =====================================

              const transactionPayload = {
                type:
                  recurrence.transaction_type,

                title:
                  recurrence.title,

                amount:
                  Number(recurrence.amount),

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
                  nextDate,

                due_date:
                  null,

                paid_date:
                  null,

                status:
                  "previsto",

                notes:
                  recurrence.notes || null,

                source_module:
                  recurrence.source_module ||
                  "financeiro",

                // Para Casa, o source_id será definido
                // somente depois que criarmos o novo
                // house_bills desta ocorrência.
                source_id:
                  isHouseRecurrence
                    ? null
                    : recurrence.source_id ||
                      null,

                created_by_user_id:
                  recurrence.created_by_user_id ||
                  null,

                recurrence_id:
                  recurrence.id,

                is_recurring:
                  true,

                installment_group_id:
                  null,

                installment_number:
                  null,

                total_installments:
                  1,

                invoice_payment_id:
                  null,
              };

              // =====================================
              // CRIA FINANCE_TRANSACTION
              // =====================================

              const {
                data: insertedTransaction,
                error: insertError,
              } = await supabase
                .from(
                  "finance_transactions"
                )
                .insert(
                  transactionPayload
                )
                .select("id")
                .single();

              if (insertError) {
                // Outra execução pode ter criado
                // a ocorrência entre o SELECT
                // e o INSERT.
                if (
                  insertError.code ===
                  "23505"
                ) {
                  console.warn(
                    "Ocorrência recorrente já existente:",
                    recurrence.id,
                    nextDate
                  );
                } else {
                  console.error(
                    "Erro ao gerar movimentação recorrente:",
                    insertError
                  );

                  throw insertError;
                }
              } else {
                // =====================================
                // SE FOR CASA, CRIA NOVO HOUSE_BILLS
                // PARA ESTA OCORRÊNCIA
                // =====================================

                if (
                  isHouseRecurrence &&
                  insertedTransaction?.id
                ) {
                  const {
                    data: newHouseBill,
                    error: houseBillError,
                  } = await supabase
                    .from("house_bills")
                    .insert({
                      transaction_id:
                        insertedTransaction.id,

                      bill_type:
                        houseBillTemplate.bill_type,

                      provider:
                        houseBillTemplate.provider ||
                        null,

                      notes:
                        houseBillTemplate.notes ||
                        null,
                    })
                    .select("id")
                    .single();

                  if (houseBillError) {
                    console.error(
                      "Erro ao criar conta recorrente da Casa:",
                      houseBillError
                    );

                    // Remove a movimentação financeira
                    // criada nesta tentativa para não
                    // deixar registro órfão.
                    await supabase
                      .from(
                        "finance_transactions"
                      )
                      .delete()
                      .eq(
                        "id",
                        insertedTransaction.id
                      );

                    throw houseBillError;
                  }

                  // =====================================
                  // VINCULA A MOVIMENTAÇÃO AO NOVO
                  // HOUSE_BILLS
                  // =====================================

                  const {
                    error: sourceLinkError,
                  } = await supabase
                    .from(
                      "finance_transactions"
                    )
                    .update({
                      source_id:
                        newHouseBill.id,
                    })
                    .eq(
                      "id",
                      insertedTransaction.id
                    );

                  if (sourceLinkError) {
                    console.error(
                      "Erro ao vincular movimentação à conta da Casa:",
                      sourceLinkError
                    );

                    // Exclui a movimentação criada.
                    // Se a FK estiver com ON DELETE CASCADE,
                    // o house_bills correspondente também
                    // será removido.
                    await supabase
                      .from(
                        "finance_transactions"
                      )
                      .delete()
                      .eq(
                        "id",
                        insertedTransaction.id
                      );

                    throw sourceLinkError;
                  }
                }

                created += 1;
              }
            }

      // =====================================
      // CALCULA PRÓXIMA EXECUÇÃO
      // =====================================

      const calculatedNextDate =
        getNextFinanceRecurrenceDate(
          nextDate,
          recurrence.frequency,
          recurrence.interval_value
        );

      if (!calculatedNextDate) {
        await supabase
          .from("finance_recurrences")
          .update({
            is_active: false,
            next_run_date: null,
          })
          .eq("id", recurrence.id);

        nextDate = null;
        break;
      }

      nextDate =
        calculatedNextDate;

      // Se a próxima ocorrência ultrapassar
      // a data final, encerra a recorrência.
      if (
        recurrence.end_date &&
        nextDate >
          recurrence.end_date
      ) {
        await supabase
          .from("finance_recurrences")
          .update({
            is_active: false,
            next_run_date: null,
          })
          .eq("id", recurrence.id);

        nextDate = null;
        break;
      }

      // =====================================
      // ATUALIZA NEXT_RUN_DATE
      // =====================================

      const {
        error: updateError,
      } = await supabase
        .from("finance_recurrences")
        .update({
          next_run_date:
            nextDate,
        })
        .eq(
          "id",
          recurrence.id
        );

      if (updateError) {
        console.error(
          "Erro ao atualizar próxima recorrência:",
          updateError
        );

        throw updateError;
      }
    }
  }

  return {
    created,
  };
}