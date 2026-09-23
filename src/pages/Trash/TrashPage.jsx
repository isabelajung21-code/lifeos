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
        shoppingItemsResult,
        maintenancesResult,
        assetsResult,
        petVaccinationsResult,
        petDewormingsResult,
        petMedicationsResult,
        petHealthPlansResult,
        petWeightsResult,
        petAppointmentsResult,
        projectNotesResult,
        projectDecisionsResult,
        projectRisksResult,
        projectMilestonesResult,
        projectsResult,
      ] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .not("deleted_at", "is", null)
          .or(
            `owner_user_id.eq.${user.id},source_module.eq.casa`
          ),

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


        supabase
          .from("house_shopping_items")
          .select("*")
          .not("deleted_at", "is", null),
        
        supabase
          .from("house_maintenances")
          .select("*")
          .not("deleted_at", "is", null),

        supabase
          .from("house_assets")
          .select("*")
          .not("deleted_at", "is", null),

        supabase
          .from("pet_vaccinations")
          .select(`
            *,
            pet:pets(id, name)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("pet_deworming")
          .select(`
            *,
            pet:pets(id, name)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("pet_medications")
          .select(`
            *,
            pet:pets(id, name)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("pet_health_plans")
          .select(`
            *,
            pet:pets(id, name)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("pet_weights")
          .select(`
            *,
            pet:pets(id, name)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("pet_appointments")
          .select(`
            *,
            pet:pets(id, name)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("project_notes")
          .select(`
            *,
            project:projects(id, title)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("project_decisions")
          .select(`
            *,
            project:projects(id, title)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("project_risks")
          .select(`
            *,
            project:projects(id, title)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("project_milestones")
          .select(`
            *,
            project:projects(id, title)
          `)
          .not("deleted_at", "is", null),

        supabase
          .from("projects")
          .select("*")
          .not("deleted_at", "is", null),
        
        ]);

      // Itens dos módulos mais recentes. Todos são normalizados abaixo e
      // entram na mesma lista cronológica da Lixeira.
      const [
        inboxResult,
        habitsResult,
        inventoryResult,
        personalGoalsResult,
        documentsResult,
        journalResult,
        studyCoursesResult,
        studyItemsResult,
        studySessionsResult,
        studyMaterialsResult,
        contentItemsResult,
        contentPillarsResult,
        contentMetricsResult,
        entertainmentItemsResult,
        entertainmentProgressResult,
        visibleListsResult,
        deletedListsResult,
      ] = await Promise.all([
        supabase.from("inbox_items").select("*").not("deleted_at", "is", null).or(`owner_user_id.eq.${user.id},visibility.eq.shared`),
        supabase.from("habits").select("*").not("deleted_at", "is", null).or(`owner_user_id.eq.${user.id},visibility.eq.shared`),
        supabase.from("house_inventory_items").select("*").not("deleted_at", "is", null),
        supabase.from("goals").select("*").not("deleted_at", "is", null).or(`owner_user_id.eq.${user.id},visibility.eq.shared`),
        supabase.from("documents").select("*").not("deleted_at", "is", null).or(`owner_user_id.eq.${user.id},visibility.eq.shared`),
        supabase.from("journal_entries").select("*").eq("owner_user_id", user.id).not("deleted_at", "is", null),
        supabase.from("study_courses").select("*").eq("owner_user_id", user.id).not("deleted_at", "is", null),
        supabase.from("study_items").select("*").eq("owner_user_id", user.id).not("deleted_at", "is", null),
        supabase.from("study_sessions").select("*").eq("owner_user_id", user.id).not("deleted_at", "is", null),
        supabase.from("study_materials").select("*").eq("owner_user_id", user.id).not("deleted_at", "is", null),
        supabase.from("content_items").select("*").eq("owner_user_id", user.id).not("deleted_at", "is", null),
        supabase.from("content_pillars").select("*").eq("owner_user_id", user.id).not("deleted_at", "is", null),
        supabase.from("content_metrics").select("*").eq("owner_user_id", user.id).not("deleted_at", "is", null),
        supabase.from("entertainment_items").select("*").not("deleted_at", "is", null),
        supabase.from("entertainment_progress").select("*").not("deleted_at", "is", null),
        supabase.from("lists").select("id, title, owner_user_id, visibility").or(`owner_user_id.eq.${user.id},visibility.eq.shared`),
        supabase.from("lists").select("*").not("deleted_at", "is", null).or(`owner_user_id.eq.${user.id},visibility.eq.shared`),
      ]);

      const extraResults = [
        inboxResult, habitsResult, inventoryResult, personalGoalsResult,
        documentsResult, journalResult, studyCoursesResult, studyItemsResult,
        studySessionsResult, studyMaterialsResult, contentItemsResult,
        contentPillarsResult, contentMetricsResult, entertainmentItemsResult,
        entertainmentProgressResult, visibleListsResult, deletedListsResult,
      ];

      const extraError = extraResults.find((result) => result.error)?.error;
      if (extraError) throw extraError;

      const visibleLists = visibleListsResult.data || [];
      const visibleListIds = visibleLists.map((list) => list.id);
      const listMap = new Map(visibleLists.map((list) => [list.id, list.title]));

      let deletedListItems = [];
      if (visibleListIds.length > 0) {
        const { data, error } = await supabase
          .from("list_items")
          .select("*")
          .in("list_id", visibleListIds)
          .not("deleted_at", "is", null);

        if (error) throw error;
        deletedListItems = data || [];
      }

      const tasks = (tasksResult.data || []).map((item) => ({
        ...item,
        type: "task",
        title: item.title,
        module:
          item.source_module === "casa"
            ? "Casa"
            : item.source_module || "Geral",

        typeLabel:
          item.source_module === "casa"
            ? "Tarefa doméstica"
            : "Tarefa",
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


      const shoppingItems = (
        shoppingItemsResult.data || []
      ).map((item) => ({
        ...item,
        type: "house_shopping_item",
        title: item.item_name,
        module: "Casa",
      }));

      const maintenances = (
        maintenancesResult.data || []
      ).map((item) => ({
        ...item,
        type: "house_maintenance",
        title: item.title,
        module: "Casa",
      }));

      const houseAssets = (
        assetsResult.data || []
      ).map((item) => ({
        ...item,
        type: "house_asset",
        title: item.name,
        module: "Casa",
      }));

      const petVaccinations = (
        petVaccinationsResult.data || []
      ).map((item) => ({
        ...item,
        type: "pet_vaccination",
        title: `${item.pet?.name || "Pet"} • ${
          item.vaccine_name || "Vacina"
        }`,
        module: "Pets",
      }));

      const petDewormings = (
        petDewormingsResult.data || []
      ).map((item) => ({
        ...item,
        type: "pet_deworming",
        title: `${item.pet?.name || "Pet"} • ${
          item.medication_name || "Vermífugo"
        }`,
        module: "Pets",
      }));

      const petMedications = (
        petMedicationsResult.data || []
      ).map((item) => ({
        ...item,
        type: "pet_medication",
        title: `${item.pet?.name || "Pet"} • ${
          item.medication_name || "Medicamento"
        }`,
        module: "Pets",
      }));

      const petHealthPlans = (
        petHealthPlansResult.data || []
      ).map((item) => ({
        ...item,
        type: "pet_health_plan",
        title: `${item.pet?.name || "Pet"} • ${
          item.plan_name ||
          item.provider ||
          "Plano de saúde"
        }`,
        module: "Pets",
      }));

      const petWeights = (
        petWeightsResult.data || []
      ).map((item) => ({
        ...item,
        type: "pet_weight",
        title: `${item.pet?.name || "Pet"} • ${
          Number(item.weight || 0)
        } kg`,
        module: "Pets",
      }));

      const petAppointments = (
        petAppointmentsResult.data || []
      ).map((item) => ({
        ...item,
        type: "pet_appointment",
        title: `${item.pet?.name || "Pet"} • ${
          item.appointment_type ||
          "Atendimento"
        }`,
        module: "Pets",
      }));

      const projectNotes = (
        projectNotesResult.data || []
      ).map((item) => ({
        ...item,
        type: "project_note",
        title:
          item.title ||
          item.content?.slice(0, 80) ||
          "Nota do projeto",
        module: "Projetos",
        projectTitle:
          item.project?.title || "Projeto",
      }));

      const projectDecisions = (
        projectDecisionsResult.data || []
      ).map((item) => ({
        ...item,
        type: "project_decision",
        title: item.title || "Decisão do projeto",
        module: "Projetos",
        projectTitle:
          item.project?.title || "Projeto",
      }));

      const projectRisks = (
        projectRisksResult.data || []
      ).map((item) => ({
        ...item,
        type: "project_risk",
        title: item.title || "Risco do projeto",
        module: "Projetos",
        projectTitle:
          item.project?.title || "Projeto",
      }));

      const projectMilestones = (
        projectMilestonesResult.data || []
      ).map((item) => ({
        ...item,
        type: "project_milestone",
        title: item.title || "Marco do projeto",
        module: "Projetos",
        projectTitle:
          item.project?.title || "Projeto",
      }));

      const deletedProjects = (
        projectsResult.data || []
      ).map((item) => ({
        ...item,
        type: "project",
        title: item.title || "Projeto",
        module: "Projetos",
      }));

      const inboxItems = (inboxResult.data || []).map((item) => ({
        ...item,
        type: "inbox_item",
        title: item.title || item.content || "Item da caixa de entrada",
        module: "Caixa de entrada",
      }));

      const habits = (habitsResult.data || []).map((item) => ({
        ...item,
        type: "habit",
        title: item.title || item.name || "Rotina",
        module: "Rotinas",
      }));

      const inventoryItems = (inventoryResult.data || []).map((item) => ({
        ...item,
        type: "house_inventory_item",
        title: item.item_name || item.name || "Produto",
        module: "Casa",
      }));

      const personalGoals = (personalGoalsResult.data || []).map((item) => ({
        ...item,
        type: "personal_goal",
        title: item.title || "Meta pessoal",
        module: "Metas",
      }));

      const documents = (documentsResult.data || []).map((item) => ({
        ...item,
        type: "document",
        title: item.title || item.name || "Documento",
        module: "Documentos",
      }));

      const journalEntries = (journalResult.data || []).map((item) => ({
        ...item,
        type: "journal_entry",
        title: item.title || `Diário de ${item.entry_date || "registro"}`,
        module: "Diário",
      }));

      const studyCourses = (studyCoursesResult.data || []).map((item) => ({
        ...item,
        type: "study_course",
        title: item.title || "Curso",
        module: "Estudos",
      }));

      const studyItems = (studyItemsResult.data || []).map((item) => ({
        ...item,
        type: "study_item",
        title: item.title || "Planejamento de estudo",
        module: "Estudos",
      }));

      const studySessions = (studySessionsResult.data || []).map((item) => ({
        ...item,
        type: "study_session",
        title: item.title || `Sessão de ${item.duration_minutes || 0} minutos`,
        module: "Estudos",
      }));

      const studyMaterials = (studyMaterialsResult.data || []).map((item) => ({
        ...item,
        type: "study_material",
        title: item.title || "Material de estudo",
        module: "Estudos",
      }));

      const contentItems = (contentItemsResult.data || []).map((item) => ({
        ...item,
        type: "content_item",
        title: item.title || "Conteúdo",
        module: "Conteúdo",
      }));

      const contentPillars = (contentPillarsResult.data || []).map((item) => ({
        ...item,
        type: "content_pillar",
        title: item.name || "Pilar de conteúdo",
        module: "Conteúdo",
      }));

      const contentMetrics = (contentMetricsResult.data || []).map((item) => ({
        ...item,
        type: "content_metric",
        title: `Métricas de ${item.reference_date || "conteúdo"}`,
        module: "Conteúdo",
      }));

      const entertainmentItems = (entertainmentItemsResult.data || []).map((item) => ({
        ...item,
        type: "entertainment_item",
        title: item.title || "Livro, filme ou série",
        module: "Entretenimento",
      }));

      const entertainmentProgress = (entertainmentProgressResult.data || []).map((item) => ({
        ...item,
        type: "entertainment_progress",
        title: item.title || `Progresso de ${item.progress_date || "entretenimento"}`,
        module: "Entretenimento",
      }));

      const deletedLists = (deletedListsResult.data || []).map((item) => ({
        ...item,
        type: "list",
        title: item.title || "Lista",
        module: "Listas",
      }));

      const listItems = deletedListItems.map((item) => ({
        ...item,
        type: "list_item",
        title: item.content || "Item de lista",
        module: "Listas",
        listTitle: listMap.get(item.list_id) || "Lista",
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
        ...shoppingItems,
        ...maintenances,
        ...houseAssets,
        ...petVaccinations,
        ...petDewormings,
        ...petMedications,
        ...petHealthPlans,
        ...petWeights,
        ...petAppointments,
        ...projectNotes,
        ...projectDecisions,
        ...projectRisks,
        ...projectMilestones,
        ...deletedProjects,
        ...inboxItems,
        ...habits,
        ...inventoryItems,
        ...personalGoals,
        ...documents,
        ...journalEntries,
        ...studyCourses,
        ...studyItems,
        ...studySessions,
        ...studyMaterials,
        ...contentItems,
        ...contentPillars,
        ...contentMetrics,
        ...entertainmentItems,
        ...entertainmentProgress,
        ...deletedLists,
        ...listItems,
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
      house_shopping_item: "house_shopping_items",
      house_maintenance: "house_maintenances",
      house_asset: "house_assets",
      pet_vaccination: "pet_vaccinations",
      pet_deworming: "pet_deworming",
      pet_medication: "pet_medications",
      pet_health_plan: "pet_health_plans",
      pet_weight: "pet_weights",
      pet_appointment: "pet_appointments",
      project_note: "project_notes",
      project_decision: "project_decisions",
      project_risk: "project_risks",
      project_milestone: "project_milestones",
      project: "projects",
      inbox_item: "inbox_items",
      habit: "habits",
      house_inventory_item: "house_inventory_items",
      personal_goal: "goals",
      list: "lists",
      list_item: "list_items",
      document: "documents",
      journal_entry: "journal_entries",
      study_course: "study_courses",
      study_item: "study_items",
      study_session: "study_sessions",
      study_material: "study_materials",
      content_item: "content_items",
      content_pillar: "content_pillars",
      content_metric: "content_metrics",
      entertainment_item: "entertainment_items",
      entertainment_progress: "entertainment_progress",
    };

    return tables[type];
  }

  function getTypeLabel(item) {
    if (
      item.type === "task" &&
      item.source_module === "casa"
    ) {
      return "Tarefa doméstica";
    }

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

      house_shopping_item: "Item da lista de compras",
      house_maintenance: "Manutenção da casa",
      house_asset: "Móvel / Eletro",
      pet_vaccination: "Vacina",
      pet_deworming: "Vermífugo",
      pet_medication: "Medicamento",
      pet_health_plan: "Plano de saúde",
      pet_weight: "Registro de peso",
      pet_appointment: "Consulta / Atendimento",
      project_note: "Nota de projeto",
      project_decision: "Decisão de projeto",
      project_risk: "Risco de projeto",
      project_milestone: "Marco de projeto",
      project: "Projeto",
      inbox_item: "Item da caixa de entrada",
      habit: "Rotina",
      house_inventory_item: "Produto da despensa",
      personal_goal: "Meta pessoal",
      list: "Lista",
      list_item: "Item de lista",
      document: "Documento",
      journal_entry: "Registro do diário",
      study_course: "Curso",
      study_item: "Planejamento de estudo",
      study_session: "Sessão de estudo",
      study_material: "Material de estudo",
      content_item: "Conteúdo",
      content_pillar: "Pilar de conteúdo",
      content_metric: "Métricas de conteúdo",
      entertainment_item: "Livro, filme ou série",
      entertainment_progress: "Progresso de entretenimento",
    };

    return labels[item.type] || "Item";
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

      const typesWithUpdatedAt = [
        "inbox_item",
        "habit",
        "house_inventory_item",
        "personal_goal",
        "list",
        "list_item",
        "document",
        "journal_entry",
        "study_course",
        "study_item",
        "study_session",
        "study_material",
        "content_item",
        "content_pillar",
        "content_metric",
        "entertainment_item",
      ];

      if (typesWithUpdatedAt.includes(item.type)) {
        restoreData.updated_at = new Date().toISOString();
      }

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
      // PETS — RECALCULA PESO ATUAL
      // =====================================

      if (item.type === "pet_weight") {
        const { data: latestWeight, error: weightError } =
          await supabase
            .from("pet_weights")
            .select("weight, measured_at, created_at")
            .eq("pet_id", item.pet_id)
            .is("deleted_at", null)
            .order("measured_at", {
              ascending: false,
            })
            .order("created_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

        if (weightError) {
          throw weightError;
        }

        const { error: petUpdateError } =
          await supabase
            .from("pets")
            .update({
              current_weight:
                latestWeight?.weight ?? null,
            })
            .eq("id", item.pet_id);

        if (petUpdateError) {
          throw petUpdateError;
        }
      }

      if (item.type === "task") {
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            module:
              item.source_module === "casa"
                ? "Casa"
                : item.source_module || "Geral",
            action: "restored",
            entity_type: "task",
            entity_id: item.id,
            entity_name: item.title,
            details: {
              message:
                item.source_module === "casa"
                  ? `Restaurou a tarefa doméstica: ${item.title}`
                  : `Restaurou a tarefa: ${item.title}`,
            },
          });
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

      // =====================================
      // HISTÓRICO GENÉRICO DE RESTAURAÇÃO
      // PARA TIPOS SEM TRATAMENTO ESPECÍFICO
      // =====================================

      const typesWithSpecificRestoreLog = [
        "task",
        "finance_transaction",
        "finance_recurrence",
        "finance_budget",
        "finance_subscription",
        "finance_goal",
        "finance_investment",
      ];

      if (
        !typesWithSpecificRestoreLog.includes(
          item.type
        )
      ) {
        const { error: logError } =
          await supabase
            .from("activity_logs")
            .insert({
              user_id: user.id,
              module: item.module || "Geral",
              action: "restored",
              entity_type: item.type,
              entity_id: item.id,
              entity_name:
                item.title || "Item restaurado",
              details: {
                message: `Restaurou: ${
                  item.title || "item"
                }`,
              },
            });

        if (logError) {
          console.error(
            "Erro ao registrar restauração no histórico:",
            logError
          );
        }
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

  async function permanentlyDeleteProject(item) {
    try {
      // ==========================================
      // 1. PRESERVA TAREFAS
      // ==========================================

      const { error: tasksError } = await supabase
        .from("tasks")
        .update({
          source_module: "geral",
          source_id: null,
        })
        .eq("source_module", "projetos")
        .eq("source_id", item.id);

      if (tasksError) throw tasksError;

      // ==========================================
      // 2. PRESERVA HISTÓRICO FINANCEIRO
      // ==========================================

      const { error: financeError } = await supabase
        .from("finance_transactions")
        .update({
          source_module: "financeiro",
          source_id: null,
        })
        .eq("source_module", "projetos")
        .eq("source_id", item.id);

      if (financeError) throw financeError;

      // ==========================================
      // 3. EXCLUI O PROJETO
      // ==========================================

      const { error: projectError } = await supabase
        .from("projects")
        .delete()
        .eq("id", item.id);

      if (projectError) throw projectError;

      // Os filhos próprios do projeto são removidos
      // por ON DELETE CASCADE:
      // - project_milestones
      // - project_notes
      // - project_decisions
      // - project_risks

      await loadTrash();

      alert("Projeto excluído definitivamente.");
    } catch (error) {
      console.error(
        "Erro ao excluir projeto definitivamente:",
        error
      );

      alert(
        "Não foi possível excluir o projeto definitivamente."
      );
    }
  }

  async function deleteForever(item) {
    const confirmed = window.confirm(
      `Excluir definitivamente "${item.title}"? Essa ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    if (item.type === "project") {
      const confirmed = window.confirm(
        `Excluir definitivamente o projeto "${item.title}"?\n\n` +
          "Essa ação não pode ser desfeita.\n\n" +
          "As tarefas e movimentações financeiras serão preservadas, mas deixarão de estar vinculadas ao projeto."
      );

      if (!confirmed) return;

      await permanentlyDeleteProject(item);
      return;
    }


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

      if (item.type === "house_shopping_item") {
        const { error: unlinkError } = await supabase
          .from("house_inventory_items")
          .update({
            shopping_item_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("shopping_item_id", item.id);

        if (unlinkError) throw unlinkError;

        const { error: deleteShoppingError } = await supabase
          .from("house_shopping_items")
          .delete()
          .eq("id", item.id);

        if (deleteShoppingError) throw deleteShoppingError;

        await supabase.from("activity_logs").insert({
          user_id: user.id,
          module: "Casa",
          action: "deleted_forever",
          entity_type: "house_shopping_item",
          entity_id: null,
          entity_name: item.title,
          details: {
            message: `Excluiu definitivamente item da lista de compras: ${item.title}`,
          },
        });

        await loadTrash();
        return;
      }

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

      // =====================================
      // PETS — RECALCULA PESO APÓS EXCLUSÃO
      // =====================================

      if (item.type === "pet_weight") {
        const { data: latestWeight, error: weightError } =
          await supabase
            .from("pet_weights")
            .select("weight, measured_at, created_at")
            .eq("pet_id", item.pet_id)
            .is("deleted_at", null)
            .order("measured_at", {
              ascending: false,
            })
            .order("created_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

        if (weightError) {
          throw weightError;
        }

        const { error: petUpdateError } =
          await supabase
            .from("pets")
            .update({
              current_weight:
                latestWeight?.weight ?? null,
            })
            .eq("id", item.pet_id);

        if (petUpdateError) {
          throw petUpdateError;
        }
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
      <div style={{ marginBottom: 16 }}>
        <h1
          style={{
            margin: 0,
            color: COLORS.ink,
            fontSize: 20,
            letterSpacing: "-0.3px",
          }}
        >
          Lixeira
        </h1>

        <p
          style={{
            color: COLORS.inkSoft,
            marginTop: 4,
            fontSize: 12,
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
            borderRadius: 12,
            padding: 18,
            color: COLORS.inkSoft,
            fontSize: 12,
          }}
        >
          A lixeira está vazia.
        </div>
      ) : (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
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
                gap: 12,
                padding: "11px 13px",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: COLORS.ink,
                    fontWeight: 600,
                    fontSize: 13,
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
                  {item.module || "Geral"}
                  {item.projectTitle
                    ? ` • ${item.projectTitle}`
                    : ""}
                  {item.listTitle
                    ? ` • ${item.listTitle}`
                    : ""}
                  {" • excluído em "}
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
                  {getTypeLabel(item)}
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
                    width: 30,
                    height: 30,
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    background: COLORS.surface,
                    color: COLORS.primaryDark,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={14} />
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