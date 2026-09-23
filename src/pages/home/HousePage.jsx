import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Circle,
  House,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import HouseTaskModal from "../../components/modals/HouseTaskModal";
import ShoppingItemModal from "../../components/modals/ShoppingItemModal";
import HouseInventorySection from "./HouseInventorySection";
import TransactionModal from "../../components/modals/TransactionModal";
import HouseMaintenanceModal from "../../components/modals/HouseMaintenanceModal";
import CompleteMaintenanceModal from "../../components/modals/CompleteMaintenanceModal";
import HouseAssetModal from "../../components/modals/HouseAssetModal";




const COLORS = {
  bg: "#F5F9FF",
  surface: "#FFFFFF",
  ink: "#1F2937",
  inkSoft: "#6B7280",
  primary: "#5B8FC9",
  primaryDark: "#376A9F",
  primaryLight: "#E4EFF9",
  border: "#DDE6F2",
  danger: "#D64545",
  dangerLight: "#FDECEC",
  success: "#27845D",
  successLight: "#EAF7F1",
  amber: "#A96D00",
  amberLight: "#FFF5DD",
};

const primaryActionButton = {
  border: 0,
  background: COLORS.primary,
  color: "#fff",
  padding: "9px 12px",
  borderRadius: 9,
  fontWeight: 600,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  cursor: "pointer",
};

function SectionCard({ title, subtitle, right, children }) {
  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              color: COLORS.ink,
            }}
          >
            {title}
          </h2>

          {subtitle && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: COLORS.inkSoft,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {right}
      </div>

      {children}
    </section>
  );
}

function formatDate(date) {
  if (!date) return "Sem prazo";

  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "pt-BR"
  );
}

function priorityLabel(priority) {
  if (priority === "alta") return "Alta";
  if (priority === "baixa") return "Baixa";
  return "Média";
}

function recurrenceLabel(task) {
  if (!task.is_recurring) return null;

  const labels = {
    diaria: "Diária",
    semanal: "Semanal",
    quinzenal: "Quinzenal",
    mensal: "Mensal",
    personalizada: "Personalizada",
  };

  const base =
    labels[task.recurrence_frequency] || "Recorrente";

  const interval = Number(task.recurrence_interval || 1);

  if (
    interval <= 1 ||
    task.recurrence_frequency === "quinzenal"
  ) {
    return base;
  }

  return `${base} · intervalo ${interval}`;
}

function capitalizeName(name) {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function HousePage({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeUser = users.find(
    (item) =>
        item.name?.toLowerCase() ===
        currentUser?.toLowerCase()
    );

  const [taskModalOpen, setTaskModalOpen] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);

  const [statusFilter, setStatusFilter] =
    useState("pendente");

  const [responsibleFilter, setResponsibleFilter] =
    useState("todos");

  const [search, setSearch] = useState("");


  const [shoppingItems, setShoppingItems] = useState([]);
  const [shoppingModalOpen, setShoppingModalOpen] = useState(false);
  const [editingShoppingItem, setEditingShoppingItem] = useState(null);
  const [shoppingFilter, setShoppingFilter] = useState("todos");
  const [houseBills, setHouseBills] = useState([]);
  const [billModalOpen, setBillModalOpen] =
    useState(false);
  const [billStatusFilter, setBillStatusFilter] =
    useState("todos");
  const [billTypeFilter, setBillTypeFilter] =
    useState("todos");
  const [editingBill, setEditingBill] =
    useState(null);
  const [deleteBillModalOpen, setDeleteBillModalOpen] =
    useState(false);
  const [billToDelete, setBillToDelete] =
    useState(null);
  const [deletingBill, setDeletingBill] =
    useState(false);
  const [maintenances, setMaintenances] = useState([]);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState("todos");

  const [
    maintenanceToComplete,
    setMaintenanceToComplete,
  ] = useState(null);

  const [
    completeMaintenanceModalOpen,
    setCompleteMaintenanceModalOpen,
  ] = useState(false);

  const [
    maintenanceHistory,
    setMaintenanceHistory,
  ] = useState([]);

  const [assets, setAssets] = useState([]);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("todos");
  const [assetStatusFilter, setAssetStatusFilter] = useState("todos");
  const [selectedBillMonth, setSelectedBillMonth] =
    useState(() => {
        const now = new Date();

        return {
        year: now.getFullYear(),
        month: now.getMonth(),
        };
    });

function changeBillMonth(offset) {
    setSelectedBillMonth((current) => {
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

function goToCurrentBillMonth() {
    const now = new Date();

    setSelectedBillMonth({
        year: now.getFullYear(),
        month: now.getMonth(),
    });
}

const billMonthLabel = new Date(
    selectedBillMonth.year,
    selectedBillMonth.month,
    1
    ).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
});

  useEffect(() => {
    loadHouse();
  }, []);

  async function loadHouse() {
    try {
        setLoading(true);

    const [
        { data: tasksData, error: tasksError },
        { data: usersData, error: usersError },
        { data: shoppingData, error: shoppingError },
        { data: billsData, error: billsError },
        {
            data: maintenanceData,
            error: maintenanceError,
        },
        {
            data: maintenanceHistoryData,
            error: maintenanceHistoryError,
        },
        {
            data: assetsData,
            error: assetsError,
        },
    ] = await Promise.all([
        supabase
            .from("tasks")
            .select(`
                *,
                task_recurrences (
                id,
                frequency,
                interval_value,
                days_of_week,
                day_of_month,
                start_date,
                end_date,
                next_run_date,
                is_active
                )
            `)
            .eq("source_module", "casa")
            .is("deleted_at", null)
            .order("status", {
                ascending: true,
            })
            .order("due_date", {
                ascending: true,
                nullsFirst: false,
            })
            .order("created_at", {
                ascending: false,
        }),

        supabase
            .from("users")
            .select("id, name")
            .order("name"),

        supabase
            .from("house_shopping_items")
            .select("*")
            .is("deleted_at", null)
            .order("is_purchased", {
            ascending: true,
            })
            .order("created_at", {
            ascending: false,
            }),

        supabase
            .from("house_bills")
            .select(`
            id,
            bill_type,
            provider,
            notes,
            transaction_id,
            finance_transactions (
                id,
                title,
                amount,
                status,
                transaction_date,
                due_date,
                paid_date,
                account_id,
                card_id,
                recurrence_id,
                is_recurring,
                installment_group_id,
                installment_number,
                total_installments,
                deleted_at
            )
            `)
            .order("created_at", {
            ascending: false,
            }),

        supabase
            .from("house_maintenances")
            .select(`
            *,
            responsible:responsible_user_id (
                id,
                name
            )
            `)
            .is("deleted_at", null)
            .order("next_maintenance_date", {
            ascending: true,
            nullsFirst: false,
            }),
        

        supabase
            .from("house_maintenance_history")
            .select(`
                *,
                house_maintenances (*)
            `)
            .order("completed_at", {
                ascending: false,
        }),
        supabase
            .from("house_assets")
            .select("*")
            .is("deleted_at", null)
            .order("created_at", {
                ascending: false,
        }),
    ]);

        if (tasksError) throw tasksError;
        if (usersError) throw usersError;
        if (shoppingError) throw shoppingError;
        if (billsError) throw billsError;
        if (maintenanceError) {
        throw maintenanceError;
        }
        if (maintenanceHistoryError) {
        throw maintenanceHistoryError;
        }
        if (assetsError) {
        throw assetsError;
        }

        setTasks(
            (tasksData || []).map((task) => {
                const recurrence =
                task.task_recurrences?.find(
                    (item) => item.is_active
                ) ||
                task.task_recurrences?.[0] ||
                null;

                let recurrenceFrequency =
                recurrence?.frequency || null;

                let recurrenceInterval =
                recurrence?.interval_value || 1;

                // No sistema antigo "quinzenal" era uma opção própria.
                // No universal, quinzenal = semanal a cada 2 semanas.
                if (
                recurrenceFrequency === "semanal" &&
                Number(recurrenceInterval) === 2
                ) {
                recurrenceFrequency = "quinzenal";
                recurrenceInterval = 1;
                }

                return {
                ...task,

                // Compatibilidade temporária com a interface atual da Casa
                responsible_user_id:
                    task.owner_user_id,

                recurrence_frequency:
                    recurrenceFrequency,

                recurrence_interval:
                    recurrenceInterval,
                };
            })
        );
        setUsers(usersData || []);
        setShoppingItems(shoppingData || []);

        setHouseBills(
        (billsData || []).filter(
            (item) =>
            item.finance_transactions &&
            !item.finance_transactions.deleted_at
        )
        );

        setMaintenances(
            maintenanceData || []
        );
        setMaintenanceHistory(
            (maintenanceHistoryData || []).filter(
                (history) =>
                history.house_maintenances &&
                !history.house_maintenances.deleted_at
            )
        );
        setAssets(
            assetsData || []
        );
    } catch (error) {
        console.error(
        "Erro ao carregar Casa:",
        error
        );
    } finally {
        setLoading(false);
    }
    }

  const userById = useMemo(() => {
    return Object.fromEntries(
      users.map((item) => [
        item.id,
        item.name,
      ])
    );
  }, [users]);

  const filteredTasks = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    return tasks.filter((task) => {
      if (
        statusFilter !== "todas" &&
        task.status !== statusFilter
      ) {
        return false;
      }

      if (
        responsibleFilter !== "todos" &&
        task.responsible_user_id !==
          responsibleFilter
      ) {
        return false;
      }

      if (
        term &&
        !`${task.title || ""} ${
          task.description || ""
        } ${task.notes || ""}`
          .toLowerCase()
          .includes(term)
      ) {
        return false;
      }

      return true;
    });
  }, [
    tasks,
    search,
    statusFilter,
    responsibleFilter,
  ]);

  const pendingCount = tasks.filter(
    (task) =>
      task.status === "pendente"
  ).length;

  const completedCount = tasks.filter(
    (task) =>
      task.status === "concluida"
  ).length;


  function openNewTask() {
    setEditingTask(null);
    setTaskModalOpen(true);
  }

  function openEditTask(task) {
    setEditingTask(task);
    setTaskModalOpen(true);
  }

  async function toggleTask(task) {
    try {
      const completing =
        task.status !== "concluida";

      const newStatus = completing
        ? "concluida"
        : "pendente";

      const { error } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          completed_at: completing
            ? new Date().toISOString()
            : null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;

      await supabase
        .from("activity_logs")
        .insert({
          user_id: activeUser?.id || null,
          module: "Casa",
          action: completing
            ? "completed"
            : "reopened",
          entity_type: "task",
          entity_id: task.id,
          entity_name: task.title,
          details: {
            message: completing
              ? `Concluiu a tarefa doméstica: ${task.title}`
              : `Reabriu a tarefa doméstica: ${task.title}`,
          },
        });

      await loadHouse();
    } catch (error) {
      console.error(
        "Erro ao alterar tarefa:",
        error
      );

      alert(
        "Não foi possível atualizar a tarefa."
      );
    }
  }

    function assetTypeLabel(type) {
        const labels = {
            movel: "Móvel",
            eletrodomestico: "Eletrodoméstico",
            eletronico: "Eletrônico",
            decoracao: "Decoração",
            utilidade: "Utilidade",
            outros: "Outros",
        };

        return labels[type] || "Outros";
        }

        function assetStatusLabel(status) {
        const labels = {
            em_uso: "Em uso",
            guardado: "Guardado",
            emprestado: "Emprestado",
            vendido: "Vendido",
            descartado: "Descartado",
        };

        return labels[status] || status;
        }

        function getWarrantyStatus(asset) {
        if (!asset.warranty_until) {
            return "sem_garantia";
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const warrantyDate = new Date(
            `${asset.warranty_until}T12:00:00`
        );
        warrantyDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
            (warrantyDate - today) /
            (1000 * 60 * 60 * 24)
        );

        if (diffDays < 0) {
            return "vencida";
        }

        if (diffDays <= 30) {
            return "vencendo";
        }

        return "ativa";
    }

  async function deleteTask(task) {
    

    try {
      const deletedAt =
        new Date().toISOString();

      const { error } = await supabase
        .from("tasks")
        .update({
          deleted_at: deletedAt,
          deleted_by: activeUser?.id || null,
          updated_at: deletedAt,
        })
        .eq("id", task.id);

      if (error) throw error;

      await supabase
        .from("activity_logs")
        .insert({
          user_id: activeUser?.id || null,
          module: "Casa",
          action: "deleted",
          entity_type: "task",
          entity_id: task.id,
          entity_name: task.title,
          details: {
            message: `Moveu a tarefa doméstica para a lixeira: ${task.title}`,
          },
        });

      await loadHouse();
    } catch (error) {
      console.error(
        "Erro ao excluir tarefa:",
        error
      );

      alert(
        "Não foi possível mover a tarefa para a lixeira."
      );
    }
  }

    async function deleteAsset(asset) {
        try {
            const deletedAt =
            new Date().toISOString();

            const { error } = await supabase
            .from("house_assets")
            .update({
                deleted_at: deletedAt,
                deleted_by:
                activeUser?.id || null,
                updated_at: deletedAt,
            })
            .eq("id", asset.id);

            if (error) throw error;

            const { error: logError } =
            await supabase
                .from("activity_logs")
                .insert({
                user_id:
                    activeUser?.id || null,
                module: "Casa",
                action: "deleted",
                entity_type:
                    "house_asset",
                entity_id: asset.id,
                entity_name: asset.name,
                details: {
                    message:
                    `Moveu o item para a lixeira: ${asset.name}`,
                },
                });

            if (logError) {
            console.error(
                "Erro ao registrar atividade:",
                logError
            );
            }

            await loadHouse();
        } catch (error) {
            console.error(
            "Erro ao excluir móvel/eletro:",
            error
            );

            alert(
            "Não foi possível mover o item para a lixeira."
            );
        }
    }

  function openNewShoppingItem() {
    setEditingShoppingItem(null);
    setShoppingModalOpen(true);
    }
    
    function openEditShoppingItem(item) {
    setEditingShoppingItem(item);
    setShoppingModalOpen(true);
    }

    async function toggleShoppingItem(item) {
    try {
        const purchased = !item.is_purchased;

        const { error } = await supabase
        .from("house_shopping_items")
        .update({
            is_purchased: purchased,
            purchased_at: purchased
            ? new Date().toISOString()
            : null,
            purchased_by_user_id: purchased
            ? activeUser?.id || null
            : null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

        if (error) throw error;

        await supabase.from("activity_logs").insert({
        user_id: activeUser?.id || null,
        module: "Casa",
        action: purchased ? "purchased" : "reopened",
        entity_type: "house_shopping_item",
        entity_id: item.id,
        entity_name: item.item_name,
        details: {
            message: purchased
            ? `Marcou como comprado: ${item.item_name}`
            : `Devolveu para a lista de compras: ${item.item_name}`,
        },
        });

        await loadHouse();
    } catch (error) {
        console.error("Erro ao atualizar item:", error);
        alert("Não foi possível atualizar o item.");
    }
    }

    async function deleteShoppingItem(item) {


    try {
        const deletedAt = new Date().toISOString();

        const { error } = await supabase
        .from("house_shopping_items")
        .update({
            deleted_at: deletedAt,
            deleted_by: activeUser?.id || null,
            updated_at: deletedAt,
        })
        .eq("id", item.id);

        if (error) throw error;

        await supabase.from("activity_logs").insert({
        user_id: activeUser?.id || null,
        module: "Casa",
        action: "deleted",
        entity_type: "house_shopping_item",
        entity_id: item.id,
        entity_name: item.item_name,
        details: {
            message: `Moveu o item da lista de compras para a lixeira: ${item.item_name}`,
        },
        });

        await loadHouse();
    } catch (error) {
        console.error("Erro ao excluir item:", error);
        alert("Não foi possível mover o item para a lixeira.");
    }
    }

    const filteredShoppingItems = shoppingItems.filter((item) => {
    if (shoppingFilter === "todos") return true;
    return item.list_type === shoppingFilter;
    });

    const pendingShoppingItems = filteredShoppingItems.filter(
    (item) => !item.is_purchased
    );

    const purchasedShoppingItems = filteredShoppingItems.filter(
    (item) => item.is_purchased
    );

    function shoppingTypeLabel(type) {
    const labels = {
        mercado: "Mercado",
        farmacia: "Farmácia",
        casa: "Casa",
        outros: "Outros",
    };

    return labels[type] || "Outros";
    }

    function openNewBill() {
        setEditingBill(null);
        setBillModalOpen(true);
        }

        function billTypeLabel(type) {
        const labels = {
            energia: "Energia",
            agua: "Água",
            internet: "Internet",
            gas: "Gás",
            condominio: "Condomínio",
            aluguel: "Aluguel",
            financiamento: "Financiamento",
            outros: "Outros",
        };

        return labels[type] || "Outros";
        }

        function formatMoney(value) {
        return Number(value || 0).toLocaleString(
            "pt-BR",
            {
            style: "currency",
            currency: "BRL",
            }
        );
        }

        function getBillDisplayStatus(bill) {
        const transaction =
            bill.finance_transactions;

        if (!transaction) return "previsto";

        if (transaction.status === "pago") {
            return "pago";
        }

        if (transaction.status === "cancelado") {
            return "cancelado";
        }

        if (transaction.due_date) {
            const today =
            new Date().toISOString().slice(0, 10);

            if (transaction.due_date < today) {
            return "vencido";
            }
        }

        return "previsto";
    }

    function openEditBill(bill) {
        setEditingBill(bill);
        setBillModalOpen(true);
    }

    async function toggleBillPaid(bill) {
        const transaction =
            bill.finance_transactions;

        if (!transaction?.id) return;

        if (transaction.card_id) {
            alert(
            "Esta conta foi lançada no cartão. O pagamento deve ser feito pela fatura do cartão no Financeiro."
            );
            return;
        }

        try {
            const isPaid =
            transaction.status === "pago";

            const newStatus = isPaid
            ? "previsto"
            : "pago";

            const paidDate = isPaid
            ? null
            : new Date()
                .toISOString()
                .slice(0, 10);

            const { error } = await supabase
            .from("finance_transactions")
            .update({
                status: newStatus,
                paid_date: paidDate,
                updated_at:
                new Date().toISOString(),
            })
            .eq("id", transaction.id);

            if (error) throw error;

            await supabase
            .from("activity_logs")
            .insert({
                user_id: activeUser?.id || null,
                module: "Casa",
                action: isPaid
                ? "reopened"
                : "paid",
                entity_type:
                "finance_transaction",
                entity_id: transaction.id,
                entity_name: transaction.title,
                details: {
                message: isPaid
                    ? `Reabriu a conta da casa: ${transaction.title}`
                    : `Marcou como paga a conta da casa: ${transaction.title}`,
                },
            });

            await loadHouse();
        } catch (error) {
            console.error(
            "Erro ao alterar pagamento da conta:",
            error
            );

            alert(
            "Não foi possível atualizar o pagamento."
            );
        }
    }

    async function completeMaintenance(
        maintenance,
        completionData
        ) {
        try {
            const completedDate =
            completionData.completed_date;

            const actualCost =
            completionData.actual_cost;

            const provider =
            completionData.provider;

            const executionNotes =
            completionData.notes;

            const { error: historyError } =
            await supabase
                .from(
                "house_maintenance_history"
                )
                .insert({
                maintenance_id:
                    maintenance.id,

                completed_at:
                    completedDate,

                estimated_cost:
                    maintenance.estimated_cost,

                actual_cost:
                    actualCost,

                provider:
                    provider ||
                    maintenance.provider ||
                    null,

                notes:
                    executionNotes,

                created_by_user_id:
                    activeUser?.id || null,
                });

            if (historyError) {
            throw historyError;
            }

            let nextMaintenanceDate = null;

            if (
            maintenance.is_recurring &&
            maintenance.recurrence_frequency
            ) {
            nextMaintenanceDate =
                calculateNextMaintenanceDate(
                completedDate,
                maintenance.recurrence_frequency,
                maintenance.recurrence_interval
                );
            }

            const updatePayload = {
            last_maintenance_date:
                completedDate,

            actual_cost:
                actualCost,

            provider:
                provider ||
                maintenance.provider ||
                null,

            completed_at:
                new Date().toISOString(),

            updated_at:
                new Date().toISOString(),
            };

            if (maintenance.is_recurring) {
            updatePayload.status =
                "pendente";

            updatePayload.next_maintenance_date =
                nextMaintenanceDate;
            } else {
            updatePayload.status =
                "concluida";

            updatePayload.next_maintenance_date =
                null;
            }

            const { error: updateError } =
            await supabase
                .from("house_maintenances")
                .update(updatePayload)
                .eq(
                "id",
                maintenance.id
                );

            if (updateError) {
            throw updateError;
            }

            await supabase
            .from("activity_logs")
            .insert({
                user_id:
                activeUser?.id || null,

                module: "Casa",

                action: "completed",

                entity_type:
                "house_maintenance",

                entity_id:
                maintenance.id,

                entity_name:
                maintenance.title,

                details: {
                message:
                    `Concluiu manutenção: ${maintenance.title}`,
                completed_date:
                    completedDate,
                actual_cost:
                    actualCost,
                },
            });

            setCompleteMaintenanceModalOpen(
            false
            );

            setMaintenanceToComplete(null);

            await loadHouse();
        } catch (error) {
            console.error(
            "Erro ao concluir manutenção:",
            error
            );

            alert(
            `Não foi possível concluir a manutenção: ${
                error?.message ||
                "erro desconhecido"
            }`
            );

            throw error;
        }
    }

    async function deleteMaintenance(
        maintenance
        ) {
        try {
            const deletedAt =
            new Date().toISOString();

            const { error } = await supabase
            .from("house_maintenances")
            .update({
                deleted_at: deletedAt,
                deleted_by:
                activeUser?.id || null,
                updated_at: deletedAt,
            })
            .eq("id", maintenance.id);

            if (error) throw error;

            await supabase
            .from("activity_logs")
            .insert({
                user_id:
                activeUser?.id || null,

                module: "Casa",

                action: "deleted",

                entity_type:
                "house_maintenance",

                entity_id:
                maintenance.id,

                entity_name:
                maintenance.title,

                details: {
                message:
                    `Moveu a manutenção para a lixeira: ${maintenance.title}`,
                },
            });

            await loadHouse();
        } catch (error) {
            console.error(
            "Erro ao excluir manutenção:",
            error
            );

            alert(
            "Não foi possível mover a manutenção para a lixeira."
            );
        }
    }

    async function deleteBill(bill) {
        const transaction = bill.finance_transactions;

        if (!transaction?.id) return;

        const isInstallment =
            transaction.installment_group_id &&
            Number(transaction.total_installments) > 1;

        // Conta normal já paga: preserva histórico
        if (!isInstallment && transaction.status === "pago") {
            alert(
            "Esta conta já está paga e não pode ser excluída, pois faz parte do histórico financeiro."
            );
            return;
        }

        setBillToDelete(bill);
        setDeleteBillModalOpen(true);
    }

    function closeDeleteBillModal() {
        if (deletingBill) return;

        setDeleteBillModalOpen(false);
        setBillToDelete(null);
    }

    async function confirmDeleteBill(mode) {
        const bill = billToDelete;
        const transaction = bill?.finance_transactions;

        if (!transaction?.id) return;

        try {
            setDeletingBill(true);

            const deletedAt = new Date().toISOString();

            const isInstallment =
            transaction.installment_group_id &&
            Number(transaction.total_installments) > 1;

            // =====================================
            // CONTA NORMAL
            // =====================================

            if (!isInstallment) {
            if (transaction.status === "pago") {
                alert(
                "Esta conta já está paga e não pode ser excluída, pois faz parte do histórico financeiro."
                );
                return;
            }

            const { error } = await supabase
                .from("finance_transactions")
                .update({
                deleted_at: deletedAt,
                deleted_by: activeUser?.id || null,
                updated_at: deletedAt,
                })
                .eq("id", transaction.id);

            if (error) throw error;

            await supabase.from("activity_logs").insert({
                user_id: activeUser?.id || null,
                module: "Casa",
                action: "deleted",
                entity_type: "finance_transaction",
                entity_id: transaction.id,
                entity_name: transaction.title,
                details: {
                message: `Moveu a conta da casa para a lixeira: ${transaction.title}`,
                },
            });

            setDeleteBillModalOpen(false);
            setBillToDelete(null);

            await loadHouse();
            return;
            }

            // =====================================
            // SOMENTE ESTA PARCELA
            // =====================================

            if (mode === "single") {
            if (transaction.status === "pago") {
                alert(
                "Esta parcela já está paga e não pode ser excluída, pois faz parte do histórico financeiro."
                );
                return;
            }

            const { error } = await supabase
                .from("finance_transactions")
                .update({
                deleted_at: deletedAt,
                deleted_by: activeUser?.id || null,
                updated_at: deletedAt,
                })
                .eq("id", transaction.id);

            if (error) throw error;

            await supabase.from("activity_logs").insert({
                user_id: activeUser?.id || null,
                module: "Casa",
                action: "deleted",
                entity_type: "finance_transaction",
                entity_id: transaction.id,
                entity_name: transaction.title,
                details: {
                message:
                    `Moveu a parcela ${transaction.installment_number}/${transaction.total_installments} ` +
                    `para a lixeira: ${transaction.title}`,
                },
            });

            setDeleteBillModalOpen(false);
            setBillToDelete(null);

            await loadHouse();
            return;
            }

            // =====================================
            // TODO O PARCELAMENTO
            // =====================================

            if (mode === "group") {
            const {
                data: installments,
                error: installmentsError,
            } = await supabase
                .from("finance_transactions")
                .select(`
                id,
                status,
                installment_number,
                total_installments
                `)
                .eq(
                "installment_group_id",
                transaction.installment_group_id
                )
                .is("deleted_at", null);

            if (installmentsError) {
                throw installmentsError;
            }

            const unpaidInstallments =
                (installments || []).filter(
                (item) => item.status !== "pago"
                );

            if (unpaidInstallments.length === 0) {
                alert(
                "Todas as parcelas deste parcelamento já estão pagas. Nenhuma delas pode ser excluída."
                );
                return;
            }

            const unpaidIds = unpaidInstallments.map(
                (item) => item.id
            );

            const { error: deleteGroupError } =
                await supabase
                .from("finance_transactions")
                .update({
                    deleted_at: deletedAt,
                    deleted_by: activeUser?.id || null,
                    updated_at: deletedAt,
                })
                .in("id", unpaidIds);

            if (deleteGroupError) {
                throw deleteGroupError;
            }

            await supabase.from("activity_logs").insert({
                user_id: activeUser?.id || null,
                module: "Casa",
                action: "deleted",
                entity_type: "finance_installment_group",
                entity_id: transaction.id,
                entity_name: transaction.title,
                details: {
                message:
                    `Moveu as parcelas não pagas do parcelamento para a lixeira: ${transaction.title}`,
                installment_group_id:
                    transaction.installment_group_id,
                deleted_installments: unpaidIds.length,
                },
            });

            const paidCount =
                (installments || []).filter(
                (item) => item.status === "pago"
                ).length;

            setDeleteBillModalOpen(false);
            setBillToDelete(null);

            await loadHouse();

            if (paidCount > 0) {
                alert(
                `${unpaidIds.length} parcela(s) foram movidas para a Lixeira.\n\n` +
                `${paidCount} parcela(s) paga(s) foram mantidas para preservar o histórico financeiro.`
                );
            }
            }
        } catch (error) {
            console.error(
            "Erro ao excluir conta da casa:",
            error
            );

            alert(
            "Não foi possível mover a conta para a lixeira."
            );
        } finally {
            setDeletingBill(false);
        }
    }



    const filteredHouseBills = houseBills.filter(
        (bill) => {
            if (
            billTypeFilter !== "todos" &&
            bill.bill_type !== billTypeFilter
            ) {
            return false;
            }

            const status =
            getBillDisplayStatus(bill);

            if (
            billStatusFilter !== "todos" &&
            status !== billStatusFilter
            ) {
            return false;
            }

            return true;
        }
    );

    const selectedMonthHouseBills =
        useMemo(() => {
            const monthKey =
            `${selectedBillMonth.year}-${String(
                selectedBillMonth.month + 1
            ).padStart(2, "0")}`;

            return [...filteredHouseBills]
            .filter((bill) => {
                const transaction =
                bill.finance_transactions;

                const referenceDate =
                transaction?.due_date ||
                transaction?.transaction_date;

                if (!referenceDate) {
                return false;
                }

                return referenceDate.startsWith(
                monthKey
                );
            })
            .sort((a, b) => {
                const transactionA =
                a.finance_transactions;

                const transactionB =
                b.finance_transactions;

                const dateA =
                transactionA?.due_date ||
                transactionA?.transaction_date ||
                "";

                const dateB =
                transactionB?.due_date ||
                transactionB?.transaction_date ||
                "";

                return dateA.localeCompare(dateB);
            });
        }, [
            filteredHouseBills,
            selectedBillMonth.year,
            selectedBillMonth.month,
    ]);

    const groupedHouseBills = useMemo(() => {
        const groups = {};

        [...filteredHouseBills]
            .sort((a, b) => {
            const transactionA =
                a.finance_transactions;
            const transactionB =
                b.finance_transactions;

            const dateA =
                transactionA?.due_date ||
                transactionA?.transaction_date ||
                "";

            const dateB =
                transactionB?.due_date ||
                transactionB?.transaction_date ||
                "";

            return dateA.localeCompare(dateB);
            })
            .forEach((bill) => {
            const transaction =
                bill.finance_transactions;

            const referenceDate =
                transaction?.due_date ||
                transaction?.transaction_date;

            if (!referenceDate) {
                const key = "sem-data";

                if (!groups[key]) {
                groups[key] = {
                    key,
                    label: "SEM DATA",
                    sortDate: "9999-12",
                    bills: [],
                };
                }

                groups[key].bills.push(bill);
                return;
            }

            const [year, month] =
                referenceDate
                .split("-")
                .map(Number);

            const date = new Date(
                year,
                month - 1,
                1
            );

            const key =
                `${year}-${String(month).padStart(
                2,
                "0"
                )}`;

            const label =
                date
                .toLocaleDateString(
                    "pt-BR",
                    {
                    month: "long",
                    year: "numeric",
                    }
                )
                .toUpperCase();

            if (!groups[key]) {
                groups[key] = {
                key,
                label,
                sortDate: key,
                bills: [],
                };
            }

            groups[key].bills.push(bill);
            });

        return Object.values(groups).sort(
            (a, b) =>
            a.sortDate.localeCompare(
                b.sortDate
            )
        );
    }, [filteredHouseBills]);

    const houseBillsSummary = useMemo(() => {
        const today = new Date();
        const todayISO =
            today.toISOString().slice(0, 10);

        let upcomingCount = 0;
        let overdueCount = 0;
        let paidThisMonth = 0;
        let expectedTotal = 0;

        selectedMonthHouseBills.forEach(
            (bill) => {
            const transaction =
                bill.finance_transactions;

            if (
                !transaction ||
                transaction.status === "cancelado"
            ) {
                return;
            }

            const amount =
                Number(transaction.amount || 0);

            if (transaction.status === "pago") {
                paidThisMonth += amount;
                return;
            }

            expectedTotal += amount;

            if (
                transaction.due_date &&
                transaction.due_date < todayISO
            ) {
                overdueCount += 1;
            } else {
                upcomingCount += 1;
            }
            }
        );

        return {
            upcomingCount,
            overdueCount,
            paidThisMonth,
            expectedTotal,
        };
    }, [selectedMonthHouseBills]);

    

  if (loading) {
    return (
      <div
        style={{
          color: COLORS.inkSoft,
          fontSize: 13,
        }}
      >
        Carregando Casa...
      </div>
    );
  }

  function maintenanceTypeLabel(type) {
    const labels = {
        ar_condicionado: "Ar-condicionado",
        hidraulica: "Hidráulica",
        eletrica: "Elétrica",
        limpeza: "Limpeza",
        dedetizacao: "Dedetização",
        filtros: "Filtros",
        eletrodomesticos: "Eletrodomésticos",
        estrutura: "Estrutura",
        jardim: "Jardim",
        outros: "Outros",
    };

    return labels[type] || "Outros";
    }

    function formatDate(date) {
    if (!date) return "Sem data";

    return new Date(
        `${date}T12:00:00`
    ).toLocaleDateString("pt-BR");
    }

    function getMaintenanceStatus(maintenance) {
    if (maintenance.status === "concluida") {
        return "concluida";
    }

    if (!maintenance.next_maintenance_date) {
        return "sem_data";
    }

    

    const today = new Date()
        .toISOString()
        .slice(0, 10);

    if (
        maintenance.next_maintenance_date < today
    ) {
        return "atrasada";
    }

    return "pendente";
    }

    function getMaintenanceAlert(maintenance) {
        if (
            maintenance.status === "concluida" ||
            !maintenance.next_maintenance_date
        ) {
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(
            `${maintenance.next_maintenance_date}T12:00:00`
        );
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
            (dueDate - today) /
            (1000 * 60 * 60 * 24)
        );

        if (diffDays < 0) {
            return {
            type: "overdue",
            label:
                Math.abs(diffDays) === 1
                ? "Atrasada há 1 dia"
                : `Atrasada há ${Math.abs(
                    diffDays
                    )} dias`,
            };
        }

        if (diffDays === 0) {
            return {
            type: "today",
            label: "Vence hoje",
            };
        }

        if (diffDays <= 7) {
            return {
            type: "soon",
            label:
                diffDays === 1
                ? "Vence amanhã"
                : `Vence em ${diffDays} dias`,
            };
        }

        return null;
    }

    const filteredMaintenances =
    maintenances.filter((maintenance) => {
        if (
        maintenanceStatusFilter === "todos"
        ) {
        return true;
        }

        return (
        getMaintenanceStatus(maintenance) ===
        maintenanceStatusFilter
        );
    });

    function calculateNextMaintenanceDate(
        completedDate,
        frequency,
        interval = 1
        ) {
        if (!completedDate) return null;

        const [year, month, day] =
            completedDate.split("-").map(Number);

        const value = Math.max(
            Number(interval) || 1,
            1
        );

        let monthsToAdd = 0;
        let yearsToAdd = 0;

        switch (frequency) {
            case "mensal":
            monthsToAdd = value;
            break;

            case "bimestral":
            monthsToAdd = value * 2;
            break;

            case "trimestral":
            monthsToAdd = value * 3;
            break;

            case "semestral":
            monthsToAdd = value * 6;
            break;

            case "anual":
            yearsToAdd = value;
            break;

            case "personalizada":
            monthsToAdd = value;
            break;

            default:
            return null;
        }

        // Primeiro posiciona no dia 1 para evitar
        // estouro automático do JavaScript.
        const targetDate = new Date(
            year,
            month - 1,
            1,
            12,
            0,
            0
        );

        if (yearsToAdd > 0) {
            targetDate.setFullYear(
            targetDate.getFullYear() + yearsToAdd
            );
        }

        if (monthsToAdd > 0) {
            targetDate.setMonth(
            targetDate.getMonth() + monthsToAdd
            );
        }

        // Descobre o último dia válido
        // do mês de destino.
        const lastDayOfTargetMonth =
            new Date(
            targetDate.getFullYear(),
            targetDate.getMonth() + 1,
            0
            ).getDate();

        // Mantém o mesmo dia sempre que possível.
        // Ex.: 31/01 -> 28/02
        targetDate.setDate(
            Math.min(day, lastDayOfTargetMonth)
        );

        return [
            targetDate.getFullYear(),
            String(
            targetDate.getMonth() + 1
            ).padStart(2, "0"),
            String(
            targetDate.getDate()
            ).padStart(2, "0"),
        ].join("-");
    }

    const maintenanceOccurrences = [
        ...maintenances
            .filter(
            (maintenance) =>
                maintenance.status !==
                "concluida" &&
                maintenance.next_maintenance_date
            )
            .map((maintenance) => ({
            id: `pending-${maintenance.id}`,
            kind: "pending",
            date:
                maintenance.next_maintenance_date,
            maintenance,
            })),

        ...maintenanceHistory.map(
            (history) => ({
            id: `history-${history.id}`,
            kind: "completed",
            date: history.completed_at,
            history,
            maintenance:
                history.house_maintenances,
            })
        ),
        ];

        const groupedMaintenances =
        maintenanceOccurrences.reduce(
            (groups, occurrence) => {
            if (!occurrence.date) {
                return groups;
            }

            const [year, month] =
                occurrence.date
                .split("-")
                .map(Number);

            const key = `${year}-${String(
                month
            ).padStart(2, "0")}`;

            if (!groups[key]) {
                groups[key] = [];
            }

            groups[key].push(occurrence);

            return groups;
            },
            {}
        );

        const maintenanceMonths =
        Object.entries(groupedMaintenances)
            .sort(([a], [b]) =>
            a.localeCompare(b)
            )
            .map(([key, occurrences]) => {
            const [year, month] = key
                .split("-")
                .map(Number);

            const label = new Date(
                year,
                month - 1,
                1
            ).toLocaleDateString(
                "pt-BR",
                {
                month: "long",
                year: "numeric",
                }
            );

            return {
                key,
                label:
                label.charAt(0).toUpperCase() +
                label.slice(1),
                occurrences:
                [...occurrences].sort(
                    (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
                ),
            };
            });

    const maintenancesWithoutDate = maintenances.filter(
        (maintenance) =>
            maintenance.status !== "concluida" &&
            !maintenance.next_maintenance_date
    );

    const filteredAssets = assets.filter(
        (asset) => {
            const search =
            assetSearch.trim().toLowerCase();

            const matchesSearch =
            !search ||
            asset.name
                ?.toLowerCase()
                .includes(search) ||
            asset.brand
                ?.toLowerCase()
                .includes(search) ||
            asset.model
                ?.toLowerCase()
                .includes(search) ||
            asset.room
                ?.toLowerCase()
                .includes(search);

            const matchesType =
            assetTypeFilter === "todos" ||
            asset.asset_type ===
                assetTypeFilter;

            const matchesStatus =
            assetStatusFilter === "todos" ||
            asset.status ===
                assetStatusFilter;

            return (
            matchesSearch &&
            matchesType &&
            matchesStatus
            );
        }
        );

        const assetsInWarranty = assets.filter(
        (asset) =>
            getWarrantyStatus(asset) ===
            "ativa" ||
            getWarrantyStatus(asset) ===
            "vencendo"
        ).length;

        const assetsWarrantySoon =
        assets.filter(
            (asset) =>
            getWarrantyStatus(asset) ===
            "vencendo"
        ).length;

        const assetsTotalValue = assets.reduce(
        (total, asset) =>
            total +
            Number(asset.purchase_value || 0),
        0
    );

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <House
              size={20}
              color={COLORS.primary}
            />

            <h1
              style={{
                margin: 0,
                fontSize: 20,
                letterSpacing: "-0.3px",
                color: COLORS.ink,
              }}
            >
              Casa
            </h1>
          </div>

          <p
            style={{
              margin: "4px 0 0",
              color: COLORS.inkSoft,
              fontSize: 12,
            }}
          >
            Tarefas, compras, contas e
            organização da casa em um só lugar.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewTask}
          style={primaryActionButton}
        >
          <Plus size={16} />
          Nova tarefa
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            borderRadius: 12,
            padding: 13,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: COLORS.inkSoft,
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            Pendentes
          </div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              marginTop: 5,
              color: COLORS.ink,
            }}
          >
            {pendingCount}
          </div>
        </div>

        <div
          style={{
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: COLORS.inkSoft,
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            Concluídas
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              marginTop: 5,
              color: COLORS.success,
            }}
          >
            {completedCount}
          </div>
        </div>
      </div>

      <div
        style={{
            display: "grid",
            gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
            gap: 16,
            alignItems: "start",
        }}
        >

      <SectionCard
        title="Tarefas domésticas"
        subtitle="Organização compartilhada das tarefas da casa."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(180px, 1.6fr) repeat(2, minmax(150px, 0.7fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Buscar tarefa..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: "9px 11px",
              fontSize: 13,
              outline: "none",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            style={{
              width: "100%",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: "9px 11px",
              background: "#fff",
              color: COLORS.ink,
              fontSize: 13,
            }}
          >
            <option value="pendente">
              Pendentes
            </option>

            <option value="concluida">
              Concluídas
            </option>

            <option value="todas">
              Todas
            </option>
          </select>

          <select
            value={responsibleFilter}
            onChange={(e) =>
              setResponsibleFilter(
                e.target.value
              )
            }
            style={{
              width: "100%",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: "9px 11px",
              background: "#fff",
              color: COLORS.ink,
              fontSize: 13,
            }}
          >
            <option value="todos">
              Todos os responsáveis
            </option>

            {users.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {capitalizeName(item.name)}
              </option>
            ))}
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div
            style={{
              border: `1px dashed ${COLORS.border}`,
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              color: COLORS.inkSoft,
              fontSize: 13,
            }}
          >
            Nenhuma tarefa encontrada.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {filteredTasks.map((task) => {
              const completed =
                task.status ===
                "concluida";

              const recurring =
                recurrenceLabel(task);

              return (
                <div
                  key={task.id}
                  style={{
                    border: `1px solid ${
                      completed
                        ? "#DDEBE5"
                        : COLORS.border
                    }`,
                    background: completed
                      ? "#FBFDFC"
                      : "#fff",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 11,
                      flex: 1,
                      minWidth: 220,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleTask(task)
                      }
                      title={
                        completed
                          ? "Reabrir tarefa"
                          : "Concluir tarefa"
                      }
                      style={{
                        border: 0,
                        background:
                          "transparent",
                        padding: 0,
                        marginTop: 1,
                        cursor: "pointer",
                        color: completed
                          ? COLORS.success
                          : COLORS.inkSoft,
                      }}
                    >
                      {completed ? (
                        <Check
                          size={20}
                        />
                      ) : (
                        <Circle
                          size={20}
                        />
                      )}
                    </button>

                    <div>
                      <div
                        style={{
                          color: COLORS.ink,
                          fontSize: 13.5,
                          fontWeight: 600,
                          textDecoration:
                            completed
                              ? "line-through"
                              : "none",
                          opacity: completed
                            ? 0.65
                            : 1,
                        }}
                      >
                        {task.title}
                      </div>

                      {task.description && (
                        <div
                          style={{
                            marginTop: 3,
                            color:
                              COLORS.inkSoft,
                            fontSize: 12,
                          }}
                        >
                          {
                            task.description
                          }
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          marginTop: 7,
                        }}
                      >
                        <span
                          style={{
                            background:
                              COLORS.primaryLight,
                            color:
                              COLORS.primaryDark,
                            borderRadius: 999,
                            padding:
                              "3px 7px",
                            fontSize: 10.5,
                            fontWeight: 600,
                          }}
                        >
                          {
                            priorityLabel(
                              task.priority
                            )
                          }
                        </span>

                        <span
                          style={{
                            background:
                              "#F4F6F8",
                            color:
                              COLORS.inkSoft,
                            borderRadius: 999,
                            padding:
                              "3px 7px",
                            fontSize: 10.5,
                            fontWeight: 600,
                          }}
                        >
                          {formatDate(
                            task.due_date
                          )}
                        </span>

                        <span
                          style={{
                            background:
                              "#F4F6F8",
                            color:
                              COLORS.inkSoft,
                            borderRadius: 999,
                            padding:
                              "3px 7px",
                            fontSize: 10.5,
                            fontWeight: 600,
                          }}
                        >
                          {task.responsible_user_id
                            ? capitalizeName(
                                userById[task.responsible_user_id]
                                ) || "Responsável"
                            : "Sem responsável"}
                        </span>

                        {recurring && (
                          <span
                            style={{
                              background:
                                COLORS.amberLight,
                              color:
                                COLORS.amber,
                              borderRadius: 999,
                              padding:
                                "3px 7px",
                              fontSize: 10.5,
                              fontWeight: 600,
                              display: "flex",
                              alignItems:
                                "center",
                              gap: 4,
                            }}
                          >
                            <RotateCcw
                              size={10}
                            />

                            {recurring}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openEditTask(
                          task
                        )
                      }
                      title="Editar"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        border: `1px solid ${COLORS.border}`,
                        background: "#fff",
                        display: "grid",
                        placeItems:
                          "center",
                        cursor: "pointer",
                        color:
                          COLORS.inkSoft,
                      }}
                    >
                      <Pencil
                        size={15}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteTask(task)
                      }
                      title="Excluir"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        border: `1px solid ${COLORS.border}`,
                        background: "#fff",
                        display: "grid",
                        placeItems:
                          "center",
                        cursor: "pointer",
                        color:
                          COLORS.danger,
                      }}
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <HouseInventorySection currentUser={currentUser} />

      <SectionCard
        title="Lista de compras"
        subtitle="Lista compartilhada para mercado, farmácia e itens da casa."
        right={
            <button
            type="button"
            onClick={openNewShoppingItem}
            style={primaryActionButton}
            >
            <Plus size={15} />
            Adicionar item
            </button>
        }
        >
        <div
            style={{
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
            marginBottom: 16,
            }}
        >
            {[
            ["todos", "Todos"],
            ["mercado", "Mercado"],
            ["farmacia", "Farmácia"],
            ["casa", "Casa"],
            ["outros", "Outros"],
            ].map(([value, label]) => (
            <button
                key={value}
                type="button"
                onClick={() => setShoppingFilter(value)}
                style={{
                border: `1px solid ${
                    shoppingFilter === value
                    ? COLORS.primary
                    : COLORS.border
                }`,
                background:
                    shoppingFilter === value
                    ? COLORS.primaryLight
                    : "#fff",
                color:
                    shoppingFilter === value
                    ? COLORS.primaryDark
                    : COLORS.inkSoft,
                borderRadius: 999,
                padding: "6px 11px",
                fontSize: 11.5,
                fontWeight: 800,
                cursor: "pointer",
                }}
            >
                {label}
            </button>
            ))}
        </div>

        {pendingShoppingItems.length === 0 ? (
            <div
            style={{
                border: `1px dashed ${COLORS.border}`,
                borderRadius: 12,
                padding: 22,
                textAlign: "center",
                color: COLORS.inkSoft,
                fontSize: 13,
            }}
            >
            Nenhum item pendente nesta lista.
            </div>
        ) : (
            <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
            >
            {pendingShoppingItems.map((item) => (
                <div
                key={item.id}
                style={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: "11px 13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                }}
                >
                <div
                    style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    flex: 1,
                    minWidth: 200,
                    }}
                >
                    <button
                    type="button"
                    onClick={() => toggleShoppingItem(item)}
                    title="Marcar como comprado"
                    style={{
                        border: 0,
                        background: "transparent",
                        color: COLORS.inkSoft,
                        padding: 0,
                        cursor: "pointer",
                    }}
                    >
                    <Circle size={20} />
                    </button>

                    <div>
                    <div
                        style={{
                        color: COLORS.ink,
                        fontSize: 13.5,
                        fontWeight: 500,
                        }}
                    >
                        {item.item_name}
                    </div>

                    <div
                        style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginTop: 6,
                        }}
                    >
                        <span
                        style={{
                            background: COLORS.primaryLight,
                            color: COLORS.primaryDark,
                            borderRadius: 999,
                            padding: "3px 7px",
                            fontSize: 10.5,
                            fontWeight: 500,
                        }}
                        >
                        {item.quantity} {item.unit || ""}
                        </span>

                        <span
                        style={{
                            background: "#F4F6F8",
                            color: COLORS.inkSoft,
                            borderRadius: 999,
                            padding: "3px 7px",
                            fontSize: 10.5,
                            fontWeight: 400,
                        }}
                        >
                        {shoppingTypeLabel(item.list_type)}
                        </span>
                    </div>

                    {item.notes && (
                        <div
                        style={{
                            color: COLORS.inkSoft,
                            fontSize: 11.5,
                            marginTop: 5,
                        }}
                        >
                        {item.notes}
                        </div>
                    )}
                    </div>
                </div>

                <div
                    style={{
                    display: "flex",
                    gap: 5,
                    }}
                >
                    <button
                    type="button"
                    onClick={() => openEditShoppingItem(item)}
                    title="Editar"
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        border: `1px solid ${COLORS.border}`,
                        background: "#fff",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        color: COLORS.inkSoft,
                    }}
                    >
                    <Pencil size={15} />
                    </button>

                    <button
                    type="button"
                    onClick={() => deleteShoppingItem(item)}
                    title="Excluir"
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        border: `1px solid ${COLORS.border}`,
                        background: "#fff",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        color: COLORS.danger,
                    }}
                    >
                    <Trash2 size={15} />
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}

        {purchasedShoppingItems.length > 0 && (
            <div style={{ marginTop: 18 }}>
            <div
                style={{
                fontSize: 11,
                fontWeight: 800,
                color: COLORS.inkSoft,
                textTransform: "uppercase",
                marginBottom: 8,
                }}
            >
                Comprados
            </div>

            <div
                style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
                }}
            >
                {purchasedShoppingItems.map((item) => (
                <div
                    key={item.id}
                    style={{
                    border: `1px solid ${COLORS.border}`,
                    background: "#FBFDFC",
                    borderRadius: 12,
                    padding: "10px 13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    }}
                >
                    <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                    >
                    <button
                        type="button"
                        onClick={() => toggleShoppingItem(item)}
                        title="Voltar para a lista"
                        style={{
                        border: 0,
                        background: "transparent",
                        color: COLORS.success,
                        padding: 0,
                        cursor: "pointer",
                        }}
                    >
                        <Check size={19} />
                    </button>

                    <div>
                        <div
                        style={{
                            color: COLORS.inkSoft,
                            fontSize: 13,
                            fontWeight: 500,
                            textDecoration: "line-through",
                        }}
                        >
                        {item.item_name}
                        </div>

                        <div
                        style={{
                            color: COLORS.inkSoft,
                            fontSize: 10.5,
                            marginTop: 2,
                        }}
                        >
                        {item.quantity} {item.unit || ""} ·{" "}
                        {shoppingTypeLabel(item.list_type)}
                        </div>
                    </div>
                    </div>

                    <button
                    type="button"
                    onClick={() => deleteShoppingItem(item)}
                    title="Excluir"
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        border: `1px solid ${COLORS.border}`,
                        background: "#fff",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        color: COLORS.danger,
                    }}
                    >
                    <Trash2 size={14} />
                    </button>
                </div>
                ))}
            </div>
            </div>
        )}
        
        </SectionCard>
    </div>

    <SectionCard
        title="Contas da casa"
        subtitle="Despesas da residência integradas ao Financeiro."
        right={
            <button
            type="button"
            onClick={openNewBill}
            style={primaryActionButton}
            >
            <Plus size={15} />
            Nova conta
            </button>
        }
        >
        <div
            style={{
                display: "grid",
                gridTemplateColumns:
                "repeat(auto-fit, minmax(145px, 1fr))",
                gap: 8,
                marginBottom: 12,
            }}
            >
            <div
                style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: 10,
                background: COLORS.bg,
                }}
            >
                <div
                style={{
                    fontSize: 9.5,
                    color: COLORS.inkSoft,
                    marginBottom: 4,
                    fontWeight: 600,
                }}
                >
                A vencer
                </div>

                <div
                style={{
                    fontSize: 17,
                    color: COLORS.ink,
                    fontWeight: 600,
                }}
                >
                {houseBillsSummary.upcomingCount}
                </div>
            </div>

            <div
                style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: 10,
                background: COLORS.bg,
                }}
            >
                <div
                style={{
                    fontSize: 9.5,
                    color: COLORS.inkSoft,
                    marginBottom: 4,
                    fontWeight: 600,
                }}
                >
                Vencidas
                </div>

                <div
                style={{
                    fontSize: 17,
                    color: COLORS.danger,
                    fontWeight: 600,
                }}
                >
                {houseBillsSummary.overdueCount}
                </div>
            </div>

            <div
                style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: 10,
                background: COLORS.bg,
                }}
            >
                <div
                style={{
                    fontSize: 9.5,
                    color: COLORS.inkSoft,
                    marginBottom: 4,
                    fontWeight: 600,
                }}
                >
                Pagas no mês
                </div>

                <div
                style={{
                    fontSize: 17,
                    color: COLORS.success,
                    fontWeight: 600,
                }}
                >
                {formatMoney(
                    houseBillsSummary.paidThisMonth
                )}
                </div>
            </div>

            <div
                style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: 10,
                background: COLORS.bg,
                }}
            >
                <div
                style={{
                    fontSize: 9.5,
                    color: COLORS.inkSoft,
                    marginBottom: 4,
                    fontWeight: 600,
                }}
                >
                Total a pagar
                </div>

                <div
                style={{
                    fontSize: 17,
                    color: COLORS.ink,
                    fontWeight: 600,
                }}
                >
                {formatMoney(
                    houseBillsSummary.expectedTotal
                )}
                </div>
            </div>
            </div>
        <div
            style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
            }}
        >
            {/* Navegação das contas por mês */}
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
                onClick={() => changeBillMonth(-1)}
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
                {billMonthLabel}
                </div>

                <button
                type="button"
                onClick={() => changeBillMonth(1)}
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
                onClick={goToCurrentBillMonth}
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
            <select
            value={billTypeFilter}
            onChange={(e) =>
                setBillTypeFilter(e.target.value)
            }
            style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 9,
                padding: "8px 10px",
                background: "#fff",
                color: COLORS.ink,
                fontSize: 12,
            }}
            >
            {/* Navegação entre meses */}
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
                    onClick={() =>
                        changeBillMonth(-1)
                    }
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
                    {billMonthLabel}
                    </div>

                    <button
                    type="button"
                    onClick={() =>
                        changeBillMonth(1)
                    }
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
                    onClick={
                    goToCurrentBillMonth
                    }
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
            <option value="todos">
                Todos os tipos
            </option>
            <option value="energia">Energia</option>
            <option value="agua">Água</option>
            <option value="internet">Internet</option>
            <option value="gas">Gás</option>
            <option value="condominio">
                Condomínio
            </option>
            <option value="aluguel">
                Aluguel
            </option>
            <option value="financiamento">
                Financiamento
            </option>
            <option value="outros">Outros</option>
            </select>

            <select
            value={billStatusFilter}
            onChange={(e) =>
                setBillStatusFilter(e.target.value)
            }
            style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 9,
                padding: "8px 10px",
                background: "#fff",
                color: COLORS.ink,
                fontSize: 12,
            }}
            >
            <option value="todos">
                Todos os status
            </option>
            <option value="previsto">
                A vencer
            </option>
            <option value="vencido">
                Vencidas
            </option>
            <option value="pago">
                Pagas
            </option>
            </select>
        </div>

        {selectedMonthHouseBills.length === 0 ? (
            <div
            style={{
                border: `1px dashed ${COLORS.border}`,
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
                color: COLORS.inkSoft,
                fontSize: 13,
            }}
            >
            Nenhuma conta neste mês.
            </div>
        ) : (
            <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
            >

                {selectedMonthHouseBills.map((bill) => {
                    const transaction =
                        bill.finance_transactions;

                    const status =
                        getBillDisplayStatus(bill);

                    return (
                        <div
                        key={bill.id}
                        style={{
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 12,
                            padding: "12px 14px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                        >
                        <div
                            style={{
                            flex: 1,
                            minWidth: 220,
                            }}
                        >
                            <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                flexWrap: "wrap",
                            }}
                            >
                            <div
                                style={{
                                fontSize: 13.5,
                                fontWeight: 750,
                                color: COLORS.ink,
                                }}
                            >
                                {transaction?.title}
                            </div>

                            <span
                                style={{
                                background:
                                    COLORS.primaryLight,
                                color:
                                    COLORS.primaryDark,
                                borderRadius: 999,
                                padding: "3px 7px",
                                fontSize: 10.5,
                                fontWeight: 400,
                                }}
                            >
                                {billTypeLabel(
                                bill.bill_type
                                )}
                            </span>

                            {transaction?.installment_group_id &&
                                transaction?.installment_number &&
                                transaction?.total_installments && (
                                <span
                                    style={{
                                    background:
                                        COLORS.bg,
                                    color:
                                        COLORS.inkSoft,
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: 999,
                                    padding: "3px 7px",
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    }}
                                >
                                    {
                                    transaction.installment_number
                                    }
                                    /
                                    {
                                    transaction.total_installments
                                    }
                                </span>
                                )}
                            </div>

                            <div
                            style={{
                                marginTop: 6,
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                fontSize: 11.5,
                                color: COLORS.inkSoft,
                            }}
                            >
                            {bill.provider && (
                                <span>
                                {bill.provider}
                                </span>
                            )}

                            <span>
                                Vencimento:{" "}
                                {formatDate(
                                transaction?.due_date
                                )}
                            </span>

                            {transaction?.is_recurring && (
                                <span>
                                ↻ Recorrente
                                </span>
                            )}
                            </div>
                        </div>

                        <div
                            style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            }}
                        >
                            <div
                            style={{
                                textAlign: "right",
                            }}
                            >
                            <div
                                style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: COLORS.ink,
                                }}
                            >
                                {formatMoney(
                                transaction?.amount
                                )}
                            </div>

                            <div
                                style={{
                                marginTop: 4,
                                fontSize: 10.5,
                                fontWeight: 800,
                                color:
                                    status === "pago"
                                    ? COLORS.success
                                    : status ===
                                        "vencido"
                                    ? COLORS.danger
                                    : COLORS.amber,
                                }}
                            >
                                {status === "pago"
                                ? "Paga"
                                : status ===
                                    "vencido"
                                ? "Vencida"
                                : "A vencer"}
                            </div>
                            </div>

                            <div
                            style={{
                                display: "flex",
                                gap: 5,
                            }}
                            >
                            {!transaction?.card_id && (
                                <button
                                type="button"
                                onClick={() =>
                                    toggleBillPaid(
                                    bill
                                    )
                                }
                                title={
                                    status === "pago"
                                    ? "Reabrir conta"
                                    : "$"
                                }
                                style={{
                                    height: 34,
                                    borderRadius: 9,
                                    border: `1px solid ${
                                    status === "pago"
                                        ? COLORS.border
                                        : "#CFE8DC"
                                    }`,
                                    background:
                                    status === "pago"
                                        ? "#fff"
                                        : COLORS.successLight,
                                    color:
                                    status === "pago"
                                        ? COLORS.inkSoft
                                        : COLORS.success,
                                    padding: "0 10px",
                                    cursor: "pointer",
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    whiteSpace:
                                    "nowrap",
                                }}
                                >
                                {status === "pago"
                                    ? "Reabrir"
                                    : "$"}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                openEditBill(bill)
                                }
                                title="Editar"
                                style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                border: `1px solid ${COLORS.border}`,
                                background: "#fff",
                                display: "grid",
                                placeItems:
                                    "center",
                                cursor: "pointer",
                                color:
                                    COLORS.inkSoft,
                                }}
                            >
                                <Pencil size={15} />
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                deleteBill(bill)
                                }
                                title="Excluir"
                                style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                border: `1px solid ${COLORS.border}`,
                                background: "#fff",
                                display: "grid",
                                placeItems:
                                    "center",
                                cursor: "pointer",
                                color:
                                    COLORS.danger,
                                }}
                            >
                                <Trash2 size={15} />
                            </button>
                            </div>
                        </div>
                        </div>
                    );
                    })}
                    </div>
                )}
                </SectionCard>

        <div
            style={{
                display: "grid",
                gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
            gap: 14,
                alignItems: "start",
            }}
        >
        
        <SectionCard title="Manutenção">
            <div
                style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 10,
                }}
            >
                <button
                type="button"
                onClick={() => {
                    setEditingMaintenance(null);
                    setMaintenanceModalOpen(true);
                }}
                style={primaryActionButton}
                >
                <Plus size={15} />
                Nova manutenção
                </button>
            </div>

            {maintenanceMonths.length === 0 ? (
                <div
                    style={{
                    padding: "18px 0",
                    textAlign: "center",
                    color: COLORS.inkSoft,
                    fontSize: 10.5,
                    }}
                >
                    Nenhuma manutenção encontrada.
                </div>
                ) : (
                <div
                    style={{
                    display: "grid",
                    gap: 16,
                    }}
                >
                    {maintenanceMonths.map(
                    (month) => (
                        <div key={month.key}>
                        {/* CABEÇALHO DO MÊS */}
                        <div
                            style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            marginBottom: 7,
                            }}
                        >
                            <div
                            style={{
                                fontSize: 11,
                                color: COLORS.ink,
                            }}
                            >
                            {month.label}
                            </div>

                            <div
                            style={{
                                height: 1,
                                flex: 1,
                                background:
                                COLORS.border,
                            }}
                            />

                            <div
                            style={{
                                fontSize: 9,
                                color:
                                COLORS.inkSoft,
                            }}
                            >
                            {
                                month.occurrences
                                .length
                            }{" "}
                            {month.occurrences
                                .length === 1
                                ? "manutenção"
                                : "manutenções"}
                            </div>
                        </div>

                        {/* MANUTENÇÕES DO MÊS */}
                        <div
                            style={{
                            display: "grid",
                            gap: 7,
                            }}
                        >
                            {month.occurrences.map(
                            (occurrence) => {
                                const maintenance =
                                occurrence.maintenance;

                                const isCompleted =
                                occurrence.kind ===
                                "completed";

                                const alert = !isCompleted
                                    ? getMaintenanceAlert(maintenance)
                                    : null;

                                const today =
                                new Date()
                                    .toISOString()
                                    .slice(0, 10);

                                const isOverdue =
                                !isCompleted &&
                                occurrence.date <
                                    today;

                                return (
                                <div
                                    key={
                                    occurrence.id
                                    }
                                    style={{
                                    border:
                                        `1px solid ${COLORS.border}`,
                                    borderRadius: 10,
                                    padding: 11,
                                    background:
                                        COLORS.surface,
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems:
                                        "center",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    }}
                                >
                                    {/* INFORMAÇÕES */}
                                    <div
                                    style={{
                                        flex: 1,
                                        minWidth: 200,
                                    }}
                                    >
                                    <div
                                        style={{
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        gap: 7,
                                        flexWrap:
                                            "wrap",
                                        }}
                                    >
                                        <div
                                        style={{
                                            fontSize:
                                            13.5,
                                            color:
                                            COLORS.ink,
                                            fontWeight: 600,
                                        }}
                                        >
                                        {maintenance?.title ||
                                            "Manutenção"}
                                        </div>

                                        <span
                                        style={{
                                            fontSize: 9,
                                            padding:
                                            "3px 7px",
                                            borderRadius:
                                            999,
                                            fontWeight: 600,

                                            background:
                                            isCompleted
                                                ? COLORS.successLight
                                                : isOverdue
                                                ? COLORS.dangerLight
                                                : COLORS.primaryLight,

                                            color:
                                            isCompleted
                                                ? COLORS.success
                                                : isOverdue
                                                ? COLORS.danger
                                                : COLORS.primary,
                                        }}
                                        >
                                        {isCompleted
                                            ? "Concluída"
                                            : isOverdue
                                            ? "Atrasada"
                                            : "Pendente"}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                        marginTop: 4,
                                        display:
                                            "flex",
                                        gap: 7,
                                        flexWrap:
                                            "wrap",
                                        fontSize: 9.5,
                                        color:
                                            COLORS.inkSoft,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {maintenance?.maintenance_type && (
                                        <span>
                                            {maintenanceTypeLabel(
                                            maintenance.maintenance_type
                                            )}
                                        </span>
                                        )}

                                        {maintenance?.location && (
                                        <span>
                                            •{" "}
                                            {
                                            maintenance.location
                                            }
                                        </span>
                                        )}

                                        <span>
                                        •{" "}
                                        {isCompleted
                                            ? "Realizada em"
                                            : "Prevista para"}
                                        :{" "}
                                        {formatDate(
                                            occurrence.date
                                        )}
                                        </span>

                                        {alert && (
                                            <div
                                                style={{
                                                marginTop: 6,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 5,
                                                padding: "4px 7px",
                                                borderRadius: 7,
                                                fontSize: 9.5,
                                                fontWeight: 600,

                                                background:
                                                    alert.type === "overdue"
                                                    ? COLORS.dangerLight
                                                    : alert.type === "today"
                                                    ? COLORS.dangerLight
                                                    : COLORS.amberLight,

                                                color:
                                                    alert.type === "overdue" ||
                                                    alert.type === "today"
                                                    ? COLORS.danger
                                                    : COLORS.amber,
                                                }}
                                            >
                                                {alert.type === "overdue" ||
                                                alert.type === "today"
                                                ? "⚠"
                                                : "◷"}

                                                {alert.label}
                                            </div>
                                        )}
                                    </div>

                                    {/* DADOS DA EXECUÇÃO */}
                                    {isCompleted && (
                                        <div
                                        style={{
                                            marginTop: 4,
                                            display:
                                            "flex",
                                            gap: 8,
                                            flexWrap:
                                            "wrap",
                                            fontSize:
                                            9.5,
                                            color:
                                            COLORS.inkSoft,
                                        }}
                                        >
                                        {occurrence
                                            .history
                                            ?.actual_cost !=
                                            null && (
                                            <span>
                                            Custo:{" "}
                                            {formatMoney(
                                                occurrence
                                                .history
                                                .actual_cost
                                            )}
                                            </span>
                                        )}

                                        {occurrence
                                            .history
                                            ?.provider && (
                                            <span>
                                            • Prestador:{" "}
                                            {
                                                occurrence
                                                .history
                                                .provider
                                            }
                                            </span>
                                        )}

                                        {occurrence
                                            .history
                                            ?.notes && (
                                            <span>
                                            •{" "}
                                            {
                                                occurrence
                                                .history
                                                .notes
                                            }
                                            </span>
                                        )}
                                        </div>
                                    )}

                                    {/* DADOS DA PRÓXIMA */}
                                    {!isCompleted &&
                                        maintenance
                                        ?.provider && (
                                        <div
                                            style={{
                                            marginTop: 4,
                                            fontSize:
                                                9.5,
                                            color:
                                                COLORS.inkSoft,
                                            }}
                                        >
                                            Prestador:{" "}
                                            {
                                            maintenance.provider
                                            }
                                        </div>
                                        )}
                                    </div>

                                    {/* AÇÕES */}
                                    
                                    <div
                                        style={{
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        gap: 7,
                                        }}
                                    >
                                        {!isCompleted && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                setMaintenanceToComplete(
                                                    maintenance
                                                );

                                                setCompleteMaintenanceModalOpen(
                                                    true
                                                );
                                                }}
                                                style={{
                                                border: "none",
                                                borderRadius: 8,
                                                padding: "6px 10px",
                                                background: COLORS.success,
                                                color: "#fff",
                                                cursor: "pointer",
                                                fontSize: 9.5,
                                                fontWeight: 600,
                                                }}
                                                title="Concluir manutenção"
                                            >
                                                ✓
                                            </button>
                                        )}

                                        <button
                                        type="button"
                                        onClick={() => {
                                            setEditingMaintenance(
                                            maintenance
                                            );

                                            setMaintenanceModalOpen(
                                            true
                                            );
                                        }}
                                        style={{
                                            border:
                                            `1px solid ${COLORS.border}`,
                                            background:
                                            "#fff",
                                            borderRadius:
                                            8,
                                            padding:
                                            "5px 8px",
                                            cursor:
                                            "pointer",
                                            color:
                                            COLORS.inkSoft,
                                            fontSize:
                                            9.5,
                                            fontWeight: 600
                                        }}
                                        >
                                        Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteMaintenance(maintenance)
                                            }
                                            style={{
                                                border: `1px solid ${COLORS.border}`,
                                                background: "#fff",
                                                borderRadius: 8,
                                                padding: "5px 8px",
                                                cursor: "pointer",
                                                color: COLORS.danger,
                                                fontSize: 9.5,
                                                fontWeight: 600
                                            }}
                                            >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                                );
                            }
                            )}
                        </div>
                        </div>
                    )
                    )}
                </div>
                )}

                {maintenancesWithoutDate.length > 0 && (
                    <div
                        style={{
                        marginTop: 16,
                        }}
                    >
                        <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            marginBottom: 7,
                        }}
                        >
                        <div
                            style={{
                            fontSize: 11,
                            color: COLORS.ink,
                            }}
                        >
                            Sem data
                        </div>

                        <div
                            style={{
                            height: 1,
                            flex: 1,
                            background: COLORS.border,
                            }}
                        />

                        <div
                            style={{
                            fontSize: 9,
                            color: COLORS.inkSoft,
                            }}
                        >
                            {maintenancesWithoutDate.length}{" "}
                            {maintenancesWithoutDate.length === 1
                            ? "manutenção"
                            : "manutenções"}
                        </div>
                        </div>

                        <div
                        style={{
                            display: "grid",
                            gap: 7,
                        }}
                        >
                        {maintenancesWithoutDate.map(
                            (maintenance) => (
                            <div
                                key={maintenance.id}
                                style={{
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 10,
                                padding: 11,
                                background: COLORS.surface,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                flexWrap: "wrap",
                                }}
                            >
                                <div
                                style={{
                                    flex: 1,
                                    minWidth: 200,
                                }}
                                >
                                <div
                                    style={{
                                    fontSize: 11.5,
                                    color: COLORS.ink,
                                    }}
                                >
                                    {maintenance.title}
                                </div>

                                <div
                                    style={{
                                    marginTop: 4,
                                    display: "flex",
                                    gap: 7,
                                    flexWrap: "wrap",
                                    fontSize: 9.5,
                                    color: COLORS.inkSoft,
                                    }}
                                >
                                    <span>
                                    {maintenanceTypeLabel(
                                        maintenance.maintenance_type
                                    )}
                                    </span>

                                    {maintenance.location && (
                                    <span>
                                        • {maintenance.location}
                                    </span>
                                    )}

                                    <span>• Sem data prevista</span>
                                </div>

                                {maintenance.provider && (
                                    <div
                                    style={{
                                        marginTop: 4,
                                        fontSize: 9.5,
                                        color: COLORS.inkSoft,
                                    }}
                                    >
                                    Prestador: {maintenance.provider}
                                    </div>
                                )}
                                </div>

                                <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                }}
                                >
                                <button
                                    type="button"
                                    onClick={() => {
                                    setMaintenanceToComplete(
                                        maintenance
                                    );

                                    setCompleteMaintenanceModalOpen(
                                        true
                                    );
                                    }}
                                    style={{
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "6px 10px",
                                    background: COLORS.success,
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: 9.5,
                                    }}
                                    title="Concluir manutenção"
                                >
                                    ✓
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                    setEditingMaintenance(
                                        maintenance
                                    );

                                    setMaintenanceModalOpen(
                                        true
                                    );
                                    }}
                                    style={{
                                    border: `1px solid ${COLORS.border}`,
                                    background: "#fff",
                                    borderRadius: 8,
                                    padding: "5px 8px",
                                    cursor: "pointer",
                                    color: COLORS.inkSoft,
                                    fontSize: 9.5,
                                    }}
                                >
                                    Editar
                                </button>
                                </div>
                            </div>
                            )
                        )}
                        </div>
                    </div>
                    )}
            </SectionCard>
            <SectionCard title="Móveis & Eletros">
                {/* RESUMO */}
                <div
                    style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: 8,
                    marginBottom: 14,
                    }}
                >
                    {[
                    ["Itens cadastrados", assets.length],
                    ["Em garantia", assetsInWarranty],
                    [
                        "Garantias vencendo",
                        assetsWarrantySoon,
                    ],
                    [
                        "Valor cadastrado",
                        formatMoney(assetsTotalValue),
                    ],
                    ].map(([label, value]) => (
                    <div
                        key={label}
                        style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 10,
                        padding: 10,
                        background: COLORS.surface,
                        }}
                    >
                        <div
                        style={{
                            fontSize: 9,
                            color: COLORS.inkSoft,
                        }}
                        >
                        {label}
                        </div>

                        <div
                        style={{
                            marginTop: 3,
                            fontSize: 14,
                            color: COLORS.ink,
                        }}
                        >
                        {value}
                        </div>
                    </div>
                    ))}
                </div>

                {/* BUSCA + NOVO ITEM */}
                <div
                    style={{
                    display: "flex",
                    gap: 8,
                    justifyContent:
                        "space-between",
                    flexWrap: "wrap",
                    marginBottom: 10,
                    }}
                >
                    <input
                    type="text"
                    value={assetSearch}
                    onChange={(e) =>
                        setAssetSearch(
                        e.target.value
                        )
                    }
                    placeholder="Buscar item, marca, modelo ou cômodo..."
                    style={{
                        flex: 1,
                        minWidth: 200,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 9,
                        padding: "8px 10px",
                        fontSize: 10.5,
                        color: COLORS.ink,
                        outline: "none",
                    }}
                    />

                    <button
                    type="button"
                    onClick={() => {
                        setEditingAsset(null);
                        setAssetModalOpen(true);
                    }}
                    style={primaryActionButton}
                    >
                    <Plus size={15} />
                    Novo item
                    </button>
                </div>

                {/* FILTROS */}
                <div
                    style={{
                    display: "flex",
                    gap: 7,
                    flexWrap: "wrap",
                    marginBottom: 12,
                    }}
                >
                    <select
                    value={assetTypeFilter}
                    onChange={(e) =>
                        setAssetTypeFilter(
                        e.target.value
                        )
                    }
                    style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        padding: "6px 8px",
                        background: "#fff",
                        color: COLORS.inkSoft,
                        fontSize: 9.5,
                    }}
                    >
                    <option value="todos">
                        Todos os tipos
                    </option>
                    <option value="movel">
                        Móveis
                    </option>
                    <option value="eletrodomestico">
                        Eletrodomésticos
                    </option>
                    <option value="eletronico">
                        Eletrônicos
                    </option>
                    <option value="decoracao">
                        Decoração
                    </option>
                    <option value="utilidade">
                        Utilidades
                    </option>
                    <option value="outros">
                        Outros
                    </option>
                    </select>

                    <select
                    value={assetStatusFilter}
                    onChange={(e) =>
                        setAssetStatusFilter(
                        e.target.value
                        )
                    }
                    style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        padding: "6px 8px",
                        background: "#fff",
                        color: COLORS.inkSoft,
                        fontSize: 9.5,
                    }}
                    >
                    <option value="todos">
                        Todos os status
                    </option>
                    <option value="em_uso">
                        Em uso
                    </option>
                    <option value="guardado">
                        Guardado
                    </option>
                    <option value="emprestado">
                        Emprestado
                    </option>
                    <option value="vendido">
                        Vendido
                    </option>
                    <option value="descartado">
                        Descartado
                    </option>
                    </select>
                </div>

                {/* LISTAGEM */}
                {filteredAssets.length === 0 ? (
                    <div
                    style={{
                        padding: "20px 0",
                        textAlign: "center",
                        color: COLORS.inkSoft,
                        fontSize: 10.5,
                    }}
                    >
                    Nenhum item encontrado.
                    </div>
                ) : (
                    <div
                    style={{
                        display: "grid",
                        gap: 8,
                    }}
                    >
                    {filteredAssets.map(
                        (asset) => {
                        const warrantyStatus =
                            getWarrantyStatus(asset);

                        return (
                            <div
                            key={asset.id}
                            style={{
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 10,
                                padding: 11,
                                background:
                                COLORS.surface,
                                display: "flex",
                                justifyContent:
                                "space-between",
                                alignItems: "center",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                            >
                            <div
                                style={{
                                flex: 1,
                                minWidth: 200,
                                }}
                            >
                                <div
                                style={{
                                    display: "flex",
                                    alignItems:
                                    "center",
                                    gap: 7,
                                    flexWrap: "wrap",
                                }}
                                >
                                <span
                                    style={{
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: COLORS.ink,
                                    }}
                                >
                                    {asset.name}
                                </span>

                                <span
                                    style={{
                                    fontSize: 9,
                                    padding:
                                        "3px 7px",
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    background:
                                        COLORS.primaryLight,
                                    color:
                                        COLORS.primary,
                                    }}
                                >
                                    {assetStatusLabel(
                                    asset.status
                                    )}
                                </span>
                                </div>

                                <div
                                style={{
                                    marginTop: 4,
                                    display: "flex",
                                    gap: 7,
                                    flexWrap: "wrap",
                                    fontSize: 9.5,
                                    color:
                                    COLORS.inkSoft,
                                }}
                                >
                                <span>
                                    {assetTypeLabel(
                                    asset.asset_type
                                    )}
                                </span>

                                {asset.room && (
                                    <span>
                                    • {asset.room}
                                    </span>
                                )}

                                {asset.brand && (
                                    <span>
                                    • {asset.brand}
                                    </span>
                                )}

                                {asset.model && (
                                    <span>
                                    • {asset.model}
                                    </span>
                                )}
                                </div>

                                {(asset.purchase_date ||
                                asset.purchase_value !=
                                    null) && (
                                <div
                                    style={{
                                    marginTop: 4,
                                    fontSize: 9.5,
                                    color:
                                        COLORS.inkSoft,
                                    }}
                                >
                                    {asset.purchase_date &&
                                    `Compra: ${formatDate(
                                        asset.purchase_date
                                    )}`}

                                    {asset.purchase_date &&
                                    asset.purchase_value !=
                                        null &&
                                    " • "}

                                    {asset.purchase_value !=
                                    null &&
                                    formatMoney(
                                        asset.purchase_value
                                    )}
                                </div>
                                )}

                                {asset.warranty_until && (
                                <div
                                    style={{
                                    marginTop: 5,
                                    fontSize: 9.5,
                                    color:
                                        warrantyStatus ===
                                        "vencida"
                                        ? COLORS.danger
                                        : warrantyStatus ===
                                            "vencendo"
                                        ? COLORS.amber
                                        : COLORS.success,
                                    }}
                                >
                                    {warrantyStatus ===
                                    "vencida"
                                    ? "Garantia vencida"
                                    : warrantyStatus ===
                                        "vencendo"
                                    ? "Garantia vencendo em breve"
                                    : "Em garantia"}

                                    {" • até "}

                                    {formatDate(
                                    asset.warranty_until
                                    )}
                                </div>
                                )}
                            </div>

                            {/* AÇÕES */}
                            <div
                                style={{
                                display: "flex",
                                gap: 7,
                                alignItems:
                                    "center",
                                }}
                            >
                                <button
                                type="button"
                                onClick={() => {
                                    setEditingAsset(
                                    asset
                                    );
                                    setAssetModalOpen(
                                    true
                                    );
                                }}
                                style={{
                                    border:
                                    `1px solid ${COLORS.border}`,
                                    background: "#fff",
                                    borderRadius: 8,
                                    padding:
                                    "5px 8px",
                                    cursor:
                                    "pointer",
                                    color:
                                    COLORS.inkSoft,
                                    fontSize: 9.5,
                                    fontWeight: 700
                                }}
                                >
                                Editar
                                </button>

                                <button
                                type="button"
                                onClick={() =>
                                    deleteAsset(asset)
                                }
                                style={{
                                    border:
                                    `1px solid ${COLORS.border}`,
                                    background: "#fff",
                                    borderRadius: 8,
                                    padding:
                                    "5px 8px",
                                    cursor:
                                    "pointer",
                                    color:
                                    COLORS.danger,
                                    fontSize: 9.5,
                                    fontWeight: 700
                                }}
                                >
                                Excluir
                                </button>
                            </div>
                            </div>
                        );
                        }
                    )}
                    </div>
                )}
                </SectionCard>
            </div>

      <HouseTaskModal
        open={taskModalOpen}
        onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
        }}
        onSaved={loadHouse}
        user={activeUser}
        task={editingTask}
        users={users}
        />

        <ShoppingItemModal
            open={shoppingModalOpen}
            onClose={() => {
                setShoppingModalOpen(false);
                setEditingShoppingItem(null);
            }}
            onSaved={loadHouse}
            user={activeUser}
            item={editingShoppingItem}
        />

        <TransactionModal
            open={billModalOpen}
            onClose={() => {
                setBillModalOpen(false);
                setEditingBill(null);
            }}
            onSaved={async () => {
                setBillModalOpen(false);
                setEditingBill(null);
                await loadHouse();
            }}
            currentUser={currentUser}
            initialType="despesa"
            sourceModule="casa"
            transactionToEdit={
                editingBill?.finance_transactions ||
                null
            }
            houseBillToEdit={editingBill}
        />

        <HouseMaintenanceModal
            open={maintenanceModalOpen}
            onClose={() => {
                setMaintenanceModalOpen(false);
                setEditingMaintenance(null);
            }}
            onSaved={async () => {
                setMaintenanceModalOpen(false);
                setEditingMaintenance(null);
                await loadHouse();
            }}
            user={activeUser}
            maintenance={editingMaintenance}
            users={users}
        />

        <CompleteMaintenanceModal
            open={
                completeMaintenanceModalOpen
            }
            maintenance={
                maintenanceToComplete
            }
            onClose={() => {
                setCompleteMaintenanceModalOpen(
                false
                );

                setMaintenanceToComplete(null);
            }}
            onConfirm={async (
                completionData
            ) => {
                if (!maintenanceToComplete) {
                return;
                }

                await completeMaintenance(
                maintenanceToComplete,
                completionData
                );
            }}
        />

        <HouseAssetModal
            open={assetModalOpen}
            asset={editingAsset}
            user={activeUser}
            onClose={() => {
                setAssetModalOpen(false);
                setEditingAsset(null);
            }}
            onSaved={async () => {
                await loadHouse();
            }}
        />

        {deleteBillModalOpen && billToDelete && (
            <div
                onClick={closeDeleteBillModal}
                style={{
                position: "fixed",
                inset: 0,
                background: "rgba(31, 41, 55, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                zIndex: 9999,
                }}
            >
                <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: 460,
                    background: COLORS.surface,
                    borderRadius: 18,
                    border: `1px solid ${COLORS.border}`,
                    boxShadow: "0 20px 60px rgba(31, 41, 55, 0.18)",
                    padding: 24,
                }}
                >
                <div
                    style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: COLORS.dangerLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                    }}
                >
                    <Trash2
                    size={21}
                    color={COLORS.danger}
                    />
                </div>

                <h3
                    style={{
                    margin: 0,
                    color: COLORS.ink,
                    fontSize: 18,
                    }}
                >
                    {Number(
                    billToDelete.finance_transactions
                        ?.total_installments
                    ) > 1
                    ? "Excluir parcela"
                    : "Excluir conta"}
                </h3>

                <p
                    style={{
                    margin: "8px 0 0",
                    color: COLORS.inkSoft,
                    fontSize: 13,
                    lineHeight: 1.6,
                    }}
                >
                    {Number(
                    billToDelete.finance_transactions
                        ?.total_installments
                    ) > 1 ? (
                    <>
                        Esta conta pertence a um parcelamento de{" "}
                        <strong>
                        {
                            billToDelete.finance_transactions
                            .total_installments
                        }
                        x
                        </strong>
                        .
                        <br />
                        Escolha o que deseja excluir.
                    </>
                    ) : (
                    <>
                        Deseja mover{" "}
                        <strong>
                        "
                        {
                            billToDelete.finance_transactions
                            ?.title
                        }
                        "
                        </strong>{" "}
                        para a Lixeira?
                    </>
                    )}
                </p>

                {Number(
                    billToDelete.finance_transactions
                    ?.total_installments
                ) > 1 && (
                    <div
                    style={{
                        marginTop: 14,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: COLORS.primaryLight,
                        color: COLORS.primaryDark,
                        fontSize: 12,
                        lineHeight: 1.5,
                    }}
                    >
                    Parcela{" "}
                    <strong>
                        {
                        billToDelete.finance_transactions
                            ?.installment_number
                        }
                        /
                        {
                        billToDelete.finance_transactions
                            ?.total_installments
                        }
                    </strong>
                    {" · "}
                    Parcelas já pagas serão preservadas no
                    histórico financeiro.
                    </div>
                )}

                <div
                    style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                    marginTop: 22,
                    }}
                >
                    {Number(
                    billToDelete.finance_transactions
                        ?.total_installments
                    ) > 1 ? (
                    <>
                        <button
                        type="button"
                        disabled={deletingBill}
                        onClick={() =>
                            confirmDeleteBill("single")
                        }
                        style={{
                            border: 0,
                            borderRadius: 10,
                            background: COLORS.danger,
                            color: "#fff",
                            padding: "11px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: deletingBill
                            ? "not-allowed"
                            : "pointer",
                            opacity: deletingBill ? 0.65 : 1,
                        }}
                        >
                        {deletingBill
                            ? "Excluindo..."
                            : "Excluir somente esta parcela"}
                        </button>

                        <button
                        type="button"
                        disabled={deletingBill}
                        onClick={() =>
                            confirmDeleteBill("group")
                        }
                        style={{
                            border: `1px solid ${COLORS.danger}`,
                            borderRadius: 10,
                            background: COLORS.surface,
                            color: COLORS.danger,
                            padding: "11px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: deletingBill
                            ? "not-allowed"
                            : "pointer",
                            opacity: deletingBill ? 0.65 : 1,
                        }}
                        >
                        Excluir todo o parcelamento
                        </button>
                    </>
                    ) : (
                    <button
                        type="button"
                        disabled={deletingBill}
                        onClick={() =>
                        confirmDeleteBill("single")
                        }
                        style={{
                        border: 0,
                        borderRadius: 10,
                        background: COLORS.danger,
                        color: "#fff",
                        padding: "11px 14px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: deletingBill
                            ? "not-allowed"
                            : "pointer",
                        opacity: deletingBill ? 0.65 : 1,
                        }}
                    >
                        {deletingBill
                        ? "Excluindo..."
                        : "Mover para a Lixeira"}
                    </button>
                    )}

                    <button
                    type="button"
                    disabled={deletingBill}
                    onClick={closeDeleteBillModal}
                    style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 10,
                        background: COLORS.surface,
                        color: COLORS.ink,
                        padding: "11px 14px",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: deletingBill
                        ? "not-allowed"
                        : "pointer",
                    }}
                    >
                    Cancelar
                    </button>
                </div>
                </div>
            </div>
        )}
    </div>

    
  );
}