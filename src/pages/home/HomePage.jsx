import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Flag,
  Plus,
  StickyNote,
  Target,
  ListTodo,
  HeartPulse,
  X,
} from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";
import TaskModal from "../../components/modals/TaskModal";
import {
  Pencil,
  Trash2,
  RotateCcw,
  Pin,
  PinOff,
} from "lucide-react";
import QuickNoteModal from "../../components/modals/QuickNoteModal";
import TodayHabitsCard from "./TodayHabitsCard";
import HomeJournalCard from "./HomeJournalCard";
import HomeStudiesCard from "./HomeStudiesCard";
import HomeInboxCapture from "./HomeInboxCapture";
import HomeInventoryAlert from "./HomeInventoryAlert";
import WeeklyReviewCard from "./WeeklyReviewCard";
import HomeLifeGoalsCard from "./HomeLifeGoalsCard";
import HomeDocumentsAlert from "./HomeDocumentsAlert";
import ImportantDateModal from "../../components/modals/ImportantDateModal";
import EventModal from "../../components/modals/EventModal";
import CalendarModal from "../../components/modals/CalendarModal";
import TransactionModal from "../../components/modals/TransactionModal";
import HomeContentCard from "./HomeContentCard";
import HomeEntertainmentCard from "./HomeEntertainmentCard";
import WaterTrackerCard from "../habits/WaterTrackerCard";



function StatCard({ icon: Icon, label, value, detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 14,
        minWidth: 0,
        textAlign: "left",
        fontFamily: "inherit",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span style={{ color: COLORS.inkSoft, fontSize: 13 }}>
          {label}
        </span>

        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: COLORS.primaryLight,
            color: COLORS.primaryDark,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon size={17} />
        </div>
      </div>

      <div
        style={{
          fontSize: 21,
          fontWeight: 800,
          color: COLORS.ink,
        }}
      >
        {value}
      </div>

      {detail && (
        <div
          style={{
            marginTop: 5,
            fontSize: 12,
            color: COLORS.inkSoft,
          }}
        >
          {detail}
        </div>
      )}
    </button>
  );
}

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 16,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 13,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          {Icon && <Icon size={18} color={COLORS.primaryDark} />}

          <h2
            style={{
              margin: 0,
              fontSize: 15,
              color: COLORS.ink,
            }}
          >
            {title}
          </h2>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div
      style={{
        color: COLORS.inkSoft,
        fontSize: 13,
        padding: "13px 0",
      }}
    >
      {children}
    </div>
  );
}

function TaskRow({
  task,
  onEdit,
  onToggle,
  onDelete,
}) {
  const completed = task.status === "concluida";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "11px 0",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            textDecoration: completed ? "line-through" : "none",
            color: completed ? COLORS.inkSoft : COLORS.ink,
          }}
        >
          {task.title}
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: 11,
            color: COLORS.inkSoft,
          }}
        >
          {task.category || task.source_module || "Geral"}
          {task.due_date ? ` • ${task.due_date}` : ""}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 5,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onToggle(task)}
          title={completed ? "Reabrir" : "Concluir"}
          style={taskActionButtonStyle}
        >
          {completed ? (
            <RotateCcw size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}
        </button>

        <button
          onClick={() => onEdit(task)}
          title="Editar"
          style={taskActionButtonStyle}
        >
          <Pencil size={15} />
        </button>

        <button
          onClick={() => onDelete(task)}
          title="Excluir"
          style={{
            ...taskActionButtonStyle,
            color: COLORS.danger,
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

const taskActionButtonStyle = {
  width: 30,
  height: 30,
  display: "grid",
  placeItems: "center",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: COLORS.surface,
  color: COLORS.inkSoft,
  padding: 0,
};

export default function HomePage({ currentUser, onNavigate }) {
  const [userId, setUserId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [importantDates, setImportantDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskListFilter, setTaskListFilter] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [maintenances, setMaintenances] = useState([]);
  const [houseAssets, setHouseAssets] = useState([]);
  const [financeTransactions, setFinanceTransactions] = useState([]);
  const [financeGoals, setFinanceGoals] = useState([]);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [pets, setPets] = useState([]);
  const [petVaccinations, setPetVaccinations] = useState([]);
  const [petDewormings, setPetDewormings] = useState([]);
  const [petMedications, setPetMedications] = useState([]);
  const [petHealthPlans, setPetHealthPlans] = useState([]);
  const [petAppointments, setPetAppointments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectMilestones, setProjectMilestones] = useState([]);


  useEffect(() => {
    loadHome();
  }, [currentUser]);

  async function loadHome() {
    setLoading(true);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("display_name", currentUser)
      .single();

    if (userError || !user) {
      console.error("Erro ao localizar usuário:", userError);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const [
      tasksResult,
      notesResult,
      datesResult,
      eventsResult,
      maintenancesResult,
      assetsResult,
      financeTransactionsResult,
      financeGoalsResult,
      petsResult,
      petVaccinationsResult,
      petDewormingsResult,
      petMedicationsResult,
      petHealthPlansResult,
      petAppointmentsResult,
      projectsResult,
      projectMilestonesResult,
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("owner_user_id", user.id)
        .is("deleted_at", null)
        .order("due_date", { ascending: true }),

      supabase
        .from("quick_notes")
        .select("*")
        .eq("owner_user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("important_dates")
        .select("*")
        .eq("owner_user_id", user.id)
        .is("deleted_at", null)
        .order("date_value", { ascending: true }),

      supabase
        .from("calendar_events")
        .select("*")
        .eq("owner_user_id", user.id)
        .is("deleted_at", null)
        .order("event_date", { ascending: true }),

      supabase
        .from("house_maintenances")
        .select("*")
        .is("deleted_at", null),

      supabase
        .from("house_assets")
        .select("*")
        .is("deleted_at", null),

      supabase
        .from("finance_transactions")
        .select(`
          id,
          title,
          amount,
          status,
          due_date,
          transaction_date,
          type,
          source_module,
          created_by_user_id
        `)
        .eq("type", "despesa")
        .is("deleted_at", null)
        .neq("status", "pago")
        .order("due_date", {
          ascending: true,
          nullsFirst: false,
      }),

      supabase
        .from("finance_goals")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),

      supabase
        .from("pets")
        .select("*")
        .is("deleted_at", null),

      supabase
        .from("pet_vaccinations")
        .select("*")
        .is("deleted_at", null),

      supabase
        .from("pet_deworming")
        .select("*")
        .is("deleted_at", null),

      supabase
        .from("pet_medications")
        .select("*")
        .is("deleted_at", null),

      supabase
        .from("pet_health_plans")
        .select("*")
        .is("deleted_at", null),

      supabase
        .from("pet_appointments")
        .select("*")
        .is("deleted_at", null),

      supabase
        .from("projects")
        .select("*")
        .eq("owner_user_id", user.id)
        .is("deleted_at", null)
        .is("archived_at", null),

      supabase
        .from("project_milestones")
        .select(`
          *,
          project:projects(
            id,
            title,
            owner_user_id,
            status,
            archived_at,
            deleted_at
          )
        `)
        .is("deleted_at", null),

    ]);

    if (tasksResult.error) console.error(tasksResult.error);
    if (notesResult.error) console.error(notesResult.error);
    if (datesResult.error) console.error(datesResult.error);
    if (eventsResult.error) console.error(eventsResult.error);
    if (maintenancesResult.error) {console.error(maintenancesResult.error);}
    if (assetsResult.error) {console.error(assetsResult.error);}
    if (financeTransactionsResult.error) {
      console.error(
        "Erro ao carregar vencimentos:",
        financeTransactionsResult.error
      );
    }

    if (financeGoalsResult.error) {
      console.error(
        "Erro ao carregar metas financeiras:",
        financeGoalsResult.error
      );
    }

    setTasks(tasksResult.data || []);
    setNotes(notesResult.data || []);
    setImportantDates(datesResult.data || []);
    setEvents(eventsResult.data || []);
    setMaintenances(maintenancesResult.data || []);
    setHouseAssets(assetsResult.data || []);
    setFinanceTransactions(financeTransactionsResult.data || []);
    setFinanceGoals(financeGoalsResult.data || []);

    if (petsResult.error) {
      console.error("Erro ao carregar pets:", petsResult.error);
    }

    if (petVaccinationsResult.error) {
      console.error(
        "Erro ao carregar vacinas:",
        petVaccinationsResult.error
      );
    }

    if (petDewormingsResult.error) {
      console.error(
        "Erro ao carregar vermífugos:",
        petDewormingsResult.error
      );
    }

    if (petMedicationsResult.error) {
      console.error(
        "Erro ao carregar medicamentos:",
        petMedicationsResult.error
      );
    }

    if (petHealthPlansResult.error) {
      console.error(
        "Erro ao carregar planos dos pets:",
        petHealthPlansResult.error
      );
    }

    if (petAppointmentsResult.error) {
      console.error(
        "Erro ao carregar atendimentos:",
        petAppointmentsResult.error
      );
    }

    setPets(petsResult.data || []);
    setPetVaccinations(
      petVaccinationsResult.data || []
    );
    setPetDewormings(
      petDewormingsResult.data || []
    );
    setPetMedications(
      petMedicationsResult.data || []
    );
    setPetHealthPlans(
      petHealthPlansResult.data || []
    );
    setPetAppointments(
      petAppointmentsResult.data || []
    );

    if (projectsResult.error) {
      console.error(
        "Erro ao carregar projetos:",
        projectsResult.error
      );
    }

    if (projectMilestonesResult.error) {
      console.error(
        "Erro ao carregar marcos dos projetos:",
        projectMilestonesResult.error
      );
    }

    setProjects(projectsResult.data || []);

    setProjectMilestones(
      (projectMilestonesResult.data || []).filter(
        (milestone) =>
          milestone.project &&
          milestone.project.owner_user_id === user.id &&
          !milestone.project.deleted_at &&
          !milestone.project.archived_at &&
          milestone.project.status !== "cancelado"
      )
    );

    setLoading(false);
  }

  const today = new Date();

  function toLocalISODate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  const todayISO = toLocalISODate(today);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const weekEndISO = toLocalISODate(weekEnd);

  const completed = tasks.filter(
    (task) => task.status === "concluida"
  );

  const pending = tasks.filter(
    (task) =>
      task.status !== "concluida" &&
      task.status !== "cancelada"
  );

  const overdue = pending.filter(
    (task) => task.due_date && task.due_date < todayISO
  );

  const todayTasks = pending.filter(
    (task) => task.due_date === todayISO
  );

  const weekTasks = pending.filter(
    (task) =>
      task.due_date &&
      task.due_date >= todayISO &&
      task.due_date <= weekEndISO
  );

  const taskLists = {
    completed: {
      title: "Tarefas concluídas",
      items: completed,
    },
    pending: {
      title: "Tarefas pendentes",
      items: pending,
    },
    overdue: {
      title: "Tarefas atrasadas",
      items: overdue,
    },
    week: {
      title: "Tarefas dos próximos 7 dias",
      items: weekTasks,
    },
  };

  const selectedTaskList = taskListFilter
    ? taskLists[taskListFilter]
    : null;

  const weekEvents = events.filter((event) => {
    if (!event.event_date) return false;

    const eventStart = event.event_date;
    const eventEnd = event.end_date || event.event_date;

    return eventStart <= weekEndISO && eventEnd >= todayISO;
    
  });

  const weekProjects = (projects || [])
    .filter(
      (project) =>
        project.due_date &&
        project.due_date >= todayISO &&
        project.due_date <= weekEndISO &&
        project.status !== "concluido" &&
        project.status !== "cancelado" &&
        !project.archived_at
    )
    .sort((a, b) =>
      a.due_date.localeCompare(b.due_date)
    );

  const weekMilestones = (projectMilestones || [])
    .filter(
      (milestone) =>
        milestone.due_date &&
        milestone.due_date >= todayISO &&
        milestone.due_date <= weekEndISO &&
        milestone.status !== "concluido"
    )
    .sort((a, b) =>
      a.due_date.localeCompare(b.due_date)
    );

  const homeGoals = (financeGoals || [])
    .map((goal) => {
      const target = Number(goal.target_value || 0);
      const current = Number(goal.current_value || 0);

      const progress =
        target > 0
          ? Math.min((current / target) * 100, 100)
          : 0;

      return {
        ...goal,
        target,
        current,
        progress,
        completed:
          progress >= 100 ||
          goal.status === "concluida",
      };
    })
    .filter((goal) => !goal.completed)
    .sort((a, b) => {
      if (a.target_date && b.target_date) {
        return a.target_date.localeCompare(b.target_date);
      }

      if (a.target_date) return -1;
      if (b.target_date) return 1;

      return b.progress - a.progress;
    })
    .slice(0, 3);

  const priorities = pending
    .filter(
      (task) =>
        task.priority === "alta" ||
        task.priority === "urgente"
    )
    .slice(0, 5);

  const upcomingPayments = (financeTransactions || [])
    .filter((transaction) => {
      const date =
        transaction.due_date ||
        transaction.transaction_date;

      return (
        date &&
        transaction.status !== "pago" &&
        transaction.status !== "cancelado"
      );
    })
    .map((transaction) => ({
      ...transaction,
      paymentDate:
        transaction.due_date ||
        transaction.transaction_date,
    }))
    .sort((a, b) =>
      a.paymentDate.localeCompare(b.paymentDate)
    )
    .slice(0, 5);

  const maintenanceAttentionItems = (
    maintenances || []
  )
    .filter(
      (maintenance) =>
        !maintenance.deleted_at &&
        maintenance.status !== "concluida" &&
        maintenance.next_maintenance_date
    )
    .map((maintenance) => {
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
          id: `maintenance-${maintenance.id}`,
          text: maintenance.title,
          daysUntil: diffDays,
          detail:
            Math.abs(diffDays) === 1
              ? "Manutenção atrasada há 1 dia"
              : `Manutenção atrasada há ${Math.abs(diffDays)} dias`,
          type: "danger",
        };
      }

      if (diffDays === 0) {
        return {
          id: `maintenance-${maintenance.id}`,
          text: maintenance.title,
          daysUntil: diffDays,
          detail: "Manutenção vence hoje",
          type: "danger",
        };
      }

      if (diffDays <= 7) {
        return {
          id: `maintenance-${maintenance.id}`,
          text: maintenance.title,
          daysUntil: diffDays,
          detail:
            diffDays === 1
              ? "Manutenção vence amanhã"
              : `Manutenção vence em ${diffDays} dias`,
          type: "warning",
        };
      }

      return null;
    })
    .filter(Boolean);

  const warrantyAttentionItems = (
    houseAssets || []
  )
    .filter(
      (asset) =>
        asset.warranty_until &&
        asset.status !== "vendido" &&
        asset.status !== "descartado"
    )
    .map((asset) => {
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
        return null;
      }

      if (diffDays === 0) {
        return {
          id: `warranty-${asset.id}`,
          text: asset.name,
          detail: "Garantia vence hoje",
          type: "danger",
          daysUntil: diffDays,
        };
      }

      if (diffDays <= 30) {
        return {
          id: `warranty-${asset.id}`,
          text: asset.name,
          detail:
            diffDays === 1
              ? "Garantia vence amanhã"
              : `Garantia vence em ${diffDays} dias`,
          type: "warning",
          daysUntil: diffDays,
        };
      }

      return null;
    })
    .filter(Boolean);

  function getPetName(petId) {
    return (
      pets.find((pet) => pet.id === petId)?.name ||
      "Pet"
    );
  }

  function getDaysUntil(dateString) {
    if (!dateString) return null;

    const current = new Date();
    current.setHours(0, 0, 0, 0);

    const target = new Date(
      `${dateString}T12:00:00`
    );
    target.setHours(0, 0, 0, 0);

    return Math.round(
      (target - current) /
        (1000 * 60 * 60 * 24)
    );
  }

  const petVaccineAttentionItems =
    (petVaccinations || [])
      .filter((item) => item.next_due_date)
      .map((item) => {
        const days = getDaysUntil(
          item.next_due_date
        );

        if (days === null || days > 30) {
          return null;
        }

        const petName = getPetName(
          item.pet_id
        );

        if (days < 0) {
          return {
            id: `pet-vaccine-${item.id}`,
            text: `${petName} • ${item.vaccine_name}`,
            detail:
              Math.abs(days) === 1
                ? "Vacina atrasada há 1 dia"
                : `Vacina atrasada há ${Math.abs(
                    days
                  )} dias`,
            type: "danger",
            daysUntil: days,
          };
        }

        if (days === 0) {
          return {
            id: `pet-vaccine-${item.id}`,
            text: `${petName} • ${item.vaccine_name}`,
            detail: "Vacina vence hoje",
            type: "danger",
            daysUntil: days,
          };
        }

        return {
          id: `pet-vaccine-${item.id}`,
          text: `${petName} • ${item.vaccine_name}`,
          detail:
            days === 1
              ? "Vacina vence amanhã"
              : `Vacina vence em ${days} dias`,
          type: "warning",
          daysUntil: days,
        };
      })
      .filter(Boolean);

  const petPlanAttentionItems =
    (petHealthPlans || [])
      .filter(
        (item) =>
          item.is_active &&
          item.limits_renewal_date
      )
      .map((item) => {
        const days = getDaysUntil(
          item.limits_renewal_date
        );

        if (days === null || days > 30) {
          return null;
        }

        const petName = getPetName(
          item.pet_id
        );

        if (days < 0) {
          return {
            id: `pet-plan-${item.id}`,
            text: `${petName} • Plano de saúde`,
            detail:
              "Renovação dos limites está vencida",
            type: "danger",
            daysUntil: days,
          };
        }

        if (days === 0) {
          return {
            id: `pet-plan-${item.id}`,
            text: `${petName} • Plano de saúde`,
            detail:
              "Limites do plano renovam hoje",
            type: "warning",
            daysUntil: days,
          };
        }

        return {
          id: `pet-plan-${item.id}`,
          text: `${petName} • Plano de saúde`,
          detail:
            days === 1
              ? "Limites renovam amanhã"
              : `Limites renovam em ${days} dias`,
          type: "warning",
          daysUntil: days,
        };
      })
      .filter(Boolean);

  const petAppointmentAttentionItems =
    (petAppointments || [])
      .filter((item) => {
        if (!item.appointment_date) {
          return false;
        }

        const days = getDaysUntil(
          item.appointment_date
        );

        return days >= 0 && days <= 7;
      })
      .map((item) => {
        const days = getDaysUntil(
          item.appointment_date
        );

        const petName = getPetName(
          item.pet_id
        );

        return {
          id: `pet-appointment-${item.id}`,
          text: `${petName} • ${
            item.appointment_type ||
            "Atendimento"
          }`,
          detail:
            days === 0
              ? "Atendimento hoje"
              : days === 1
              ? "Atendimento amanhã"
              : `Atendimento em ${days} dias`,
          type:
            days === 0
              ? "danger"
              : "warning",
          daysUntil: days,
        };
      });

  const petMedicationAttentionItems =
    (petMedications || [])
      .filter((item) => {
        if (item.is_continuous) {
          return true;
        }

        if (!item.end_date) {
          return false;
        }

        const days = getDaysUntil(
          item.end_date
        );

        return days >= 0 && days <= 7;
      })
      .map((item) => {
        const petName = getPetName(
          item.pet_id
        );

        if (item.is_continuous) {
          return {
            id: `pet-medication-${item.id}`,
            text: `${petName} • ${item.medication_name}`,
            detail: item.frequency
              ? `Medicamento contínuo • ${item.frequency}`
              : "Medicamento de uso contínuo",
            type: "warning",
            daysUntil: 7,
          };
        }

        const days = getDaysUntil(
          item.end_date
        );

        return {
          id: `pet-medication-${item.id}`,
          text: `${petName} • ${item.medication_name}`,
          detail:
            days === 0
              ? "Tratamento termina hoje"
              : days === 1
              ? "Tratamento termina amanhã"
              : `Tratamento termina em ${days} dias`,
          type: "warning",
          daysUntil: days,
        };
      });

  const currentMonth =
    today.getMonth() + 1;

  const petDewormingAttentionItems =
    (petDewormings || [])
      .filter(
        (item) =>
          Number(item.recurrence_month) ===
          currentMonth
      )
      .map((item) => {
        const petName = getPetName(
          item.pet_id
        );

        return {
          id: `pet-deworming-${item.id}`,
          text: `${petName} • Vermífugo`,
          detail: item.medication_name
            ? `Vermífugo do mês • ${item.medication_name}`
            : "Vermífugo programado para este mês",
          type: "warning",
          daysUntil: 15,
        };
      });

  const projectAttentionItems = (projects || [])
    .filter(
      (project) =>
        project.due_date &&
        project.status !== "concluido" &&
        project.status !== "cancelado" &&
        !project.archived_at
    )
    .map((project) => {
      const days = getDaysUntil(project.due_date);

      if (days === null || days > 7) {
        return null;
      }

      if (days < 0) {
        return {
          id: `project-${project.id}`,
          text: project.title,
          detail:
            Math.abs(days) === 1
              ? "Projeto atrasado há 1 dia"
              : `Projeto atrasado há ${Math.abs(days)} dias`,
          type: "danger",
          daysUntil: days,
        };
      }

      if (days === 0) {
        return {
          id: `project-${project.id}`,
          text: project.title,
          detail: "Prazo do projeto é hoje",
          type: "danger",
          daysUntil: 0,
        };
      }

      return {
        id: `project-${project.id}`,
        text: project.title,
        detail:
          days === 1
            ? "Prazo do projeto é amanhã"
            : `Prazo do projeto em ${days} dias`,
        type: "warning",
        daysUntil: days,
      };
    })
    .filter(Boolean);

  const milestoneAttentionItems = (projectMilestones || [])
    .filter(
      (milestone) =>
        milestone.due_date &&
        milestone.status !== "concluido"
    )
    .map((milestone) => {
      const days = getDaysUntil(milestone.due_date);

      if (days === null || days > 7) {
        return null;
      }

      const projectName =
        milestone.project?.title || "Projeto";

      if (days < 0) {
        return {
          id: `project-milestone-${milestone.id}`,
          text: milestone.title,
          detail: `${projectName} • Marco atrasado há ${Math.abs(
            days
          )} ${
            Math.abs(days) === 1 ? "dia" : "dias"
          }`,
          type: "danger",
          daysUntil: days,
        };
      }

      if (days === 0) {
        return {
          id: `project-milestone-${milestone.id}`,
          text: milestone.title,
          detail: `${projectName} • Marco vence hoje`,
          type: "danger",
          daysUntil: 0,
        };
      }

      return {
        id: `project-milestone-${milestone.id}`,
        text: milestone.title,
        detail: `${projectName} • ${
          days === 1
            ? "Marco vence amanhã"
            : `Marco vence em ${days} dias`
        }`,
        type: "warning",
        daysUntil: days,
      };
    })
    .filter(Boolean);

  const attentionItems = [
    // Projetos próximos ou atrasados
    ...projectAttentionItems.map((item) => ({
      ...item,
      urgency:
        item.type === "danger" ? 1 : 3,
      urgencyOrder:
        item.daysUntil ?? 9999,
    })),

    // Marcos de projetos próximos ou atrasados
    ...milestoneAttentionItems.map((item) => ({
      ...item,
      urgency:
        item.type === "danger" ? 1 : 3,
      urgencyOrder:
        item.daysUntil ?? 9999,
    })),

    // Tarefas atrasadas
    ...overdue.map((task) => ({
      id: `overdue-${task.id}`,
      text: task.title,
      detail: "Tarefa atrasada",
      type: "danger",

      urgency: 1,
      urgencyDate: task.due_date || "9999-12-31",
      urgencyOrder: task.due_date || "9999-12-31",
    })),

    // Tarefas importantes que vencem hoje
    ...todayTasks
      .filter(
        (task) =>
          task.priority === "alta" ||
          task.priority === "urgente"
      )
      .map((task) => ({
        id: `today-${task.id}`,
        text: task.title,
        detail: "Prioridade para hoje",
        type: "warning",

        urgency: 2,
        urgencyDate: task.due_date || todayISO,
        urgencyOrder: task.due_date || "9999-12-31",
      })),

    // Manutenções
    ...maintenanceAttentionItems.map(
      (item) => ({
        ...item,

        urgency:
          item.type === "danger"
            ? 1
            : 3,

        urgencyOrder:
          item.daysUntil ?? 9999,
      })
    ),

    // Garantias
    ...warrantyAttentionItems.map(
      (item) => ({
        ...item,

        urgency:
          item.type === "danger"
            ? 2
            : 4,

        urgencyOrder:
          item.daysUntil ?? 9999,
      })
    ),
    // Pets — vacinas
  ...petVaccineAttentionItems.map(
    (item) => ({
      ...item,
      urgency:
        item.type === "danger" ? 1 : 3,
      urgencyOrder:
        item.daysUntil ?? 9999,
    })
  ),

  // Pets — plano de saúde
  ...petPlanAttentionItems.map(
    (item) => ({
      ...item,
      urgency:
        item.type === "danger" ? 1 : 4,
      urgencyOrder:
        item.daysUntil ?? 9999,
    })
  ),

  // Pets — consultas e atendimentos
  ...petAppointmentAttentionItems.map(
    (item) => ({
      ...item,
      urgency:
        item.daysUntil === 0 ? 1 : 3,
      urgencyOrder:
        item.daysUntil ?? 9999,
    })
  ),

  // Pets — medicamentos
  ...petMedicationAttentionItems.map(
    (item) => ({
      ...item,
      urgency: 4,
      urgencyOrder:
        item.daysUntil ?? 9999,
    })
  ),

  // Pets — vermífugo
  ...petDewormingAttentionItems.map(
    (item) => ({
      ...item,
      urgency: 4,
      urgencyOrder:
        item.daysUntil ?? 9999,
    })
  ),
  ]
    .sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return a.urgency - b.urgency;
      }

      if (
        typeof a.urgencyOrder === "number" &&
        typeof b.urgencyOrder === "number"
      ) {
        return a.urgencyOrder - b.urgencyOrder;
      }

      return String(a.urgencyOrder).localeCompare(
        String(b.urgencyOrder)
      );
    })
    .slice(0, 6);


  function formatDate(date) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(`${date}T12:00:00`));
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value || 0));
  }

  function getPaymentDateLabel(date) {
    if (date < todayISO) {
      return `Atrasado • ${formatDate(date)}`;
    }

    if (date === todayISO) {
      return "Vence hoje";
    }

    return `Vence em ${formatDate(date)}`;
  }

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }

async function getCurrentUserId() {
  if (userId) return userId;

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("display_name", currentUser)
    .single();

  return data?.id || null;
}

async function toggleTaskStatus(task) {
  const id = await getCurrentUserId();
  if (!id) return;

  const isCompleted = task.status === "concluida";

  const newStatus = isCompleted ? "pendente" : "concluida";

  const { error } = await supabase
    .from("tasks")
    .update({
      status: newStatus,
      completed_at: isCompleted ? null : new Date().toISOString(),
    })
    .eq("id", task.id);

  if (error) {
    console.error(error);
    return;
  }

  await supabase.from("activity_logs").insert({
    user_id: id,
    module: task.source_module || "geral",
    action: isCompleted ? "reabriu" : "concluiu",
    entity_type: "task",
    entity_id: task.id,
    entity_name: task.title,
  });

  await loadHome();
}

async function deleteTask(task) {
  const id = await getCurrentUserId();
  if (!id) return;

  const { error } = await supabase
    .from("tasks")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: id,
    })
    .eq("id", task.id);

  if (error) {
    console.error(error);
    return;
  }

  await supabase.from("activity_logs").insert({
    user_id: id,
    module: task.source_module || "geral",
    action: "enviou para a lixeira",
    entity_type: "task",
    entity_id: task.id,
    entity_name: task.title,
  });

  await loadHome();
}

async function toggleNotePin(note) {
  const id = await getCurrentUserId();
  if (!id) return;

  const { error } = await supabase
    .from("quick_notes")
    .update({
      pinned: !note.pinned,
    })
    .eq("id", note.id);

  if (error) {
    console.error(error);
    return;
  }

  await supabase.from("activity_logs").insert({
    user_id: id,
    module: "inicio",
    action: note.pinned ? "desafixou" : "fixou",
    entity_type: "quick_note",
    entity_id: note.id,
    entity_name: note.content.slice(0, 80),
  });

  await loadHome();
}

async function deleteNote(note) {
  const id = await getCurrentUserId();
  if (!id) return;

  const { error } = await supabase
    .from("quick_notes")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: id,
    })
    .eq("id", note.id);

  if (error) {
    console.error(error);
    return;
  }

  await supabase.from("activity_logs").insert({
    user_id: id,
    module: "inicio",
    action: "enviou para a lixeira",
    entity_type: "quick_note",
    entity_id: note.id,
    entity_name: note.content.slice(0, 80),
  });

  await loadHome();
}

async function deleteImportantDate(dateItem) {
  const id = await getCurrentUserId();
  if (!id) return;

  const { error } = await supabase
    .from("important_dates")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: id,
    })
    .eq("id", dateItem.id);

  if (error) {
    console.error(error);
    return;
  }

  await supabase.from("activity_logs").insert({
    user_id: id,
    module: "inicio",
    action: "enviou para a lixeira",
    entity_type: "important_date",
    entity_id: dateItem.id,
    entity_name: dateItem.title,
  });

  await loadHome();
}

async function deleteEvent(event) {
  const id = await getCurrentUserId();
  if (!id) return;

  const { error } = await supabase
    .from("calendar_events")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: id,
    })
    .eq("id", event.id);

  if (error) {
    console.error(error);
    return;
  }

  await supabase.from("activity_logs").insert({
    user_id: id,
    module: "inicio",
    action: "enviou para a lixeira",
    entity_type: "calendar_event",
    entity_id: event.id,
    entity_name: event.title,
  });

  await loadHome();
}

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 21,
            color: COLORS.ink,
            letterSpacing: "-0.4px",
          }}
        >
          {getGreeting()}, {currentUser}
        </h1>

        <p
          style={{
            color: COLORS.inkSoft,
            margin: "6px 0 0",
            fontSize: 12,
          }}
        >
          Aqui está o resumo da sua semana.
        </p>
      </div>

      {loading ? (
        <div style={{ color: COLORS.inkSoft }}>
          Carregando seu lifeOS...
        </div>
      ) : (
        <>

          <div className="home-quick-actions">
            {[
              {
                label: "Tarefa",
                icon: ListTodo,
                action: () => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                },
              },
              {
                label: "Despesa",
                icon: CircleDollarSign,
                action: () => setTransactionModalOpen(true),
              },
              {
                label: "Projeto",
                icon: Target,
              },
              {
                label: "Evento",
                icon: CalendarDays,
                action: () => {
                  setEditingEvent(null);
                  setEventModalOpen(true);
                },
              },
              {
                label: "Anotação",
                icon: StickyNote,
                action: () => {
                  setEditingNote(null);
                  setNoteModalOpen(true);
                },
              },
                            {
                label: "Check-in",
                icon: HeartPulse,
                action: () => {
                  sessionStorage.setItem(
                    "lifeos-health-tab",
                    "Check-in"
                  );

                  sessionStorage.setItem(
                    "lifeos-open-today-checkin",
                    "true"
                  );

                  onNavigate?.("health");
                },
              },
              {
                label: "Data",
                icon: Plus,
                action: () => {
                  setEditingDate(null);
                  setDateModalOpen(true);
                },
              },
            ].map((item) => {
              const ActionIcon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="home-quick-action"
                >
                  <ActionIcon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="home-stats">
            <StatCard
              icon={CheckCircle2}
              label="Concluídas"
              value={completed.length}
              detail="tarefas"
              onClick={() => setTaskListFilter("completed")}
            />

            <StatCard
              icon={ListTodo}
              label="Pendentes"
              value={pending.length}
              detail="tarefas"
              onClick={() => setTaskListFilter("pending")}
            />

            <StatCard
              icon={AlertTriangle}
              label="Atrasadas"
              value={overdue.length}
              detail="precisam de atenção"
              onClick={() => setTaskListFilter("overdue")}
            />

            <StatCard
              icon={CalendarDays}
              label="Próximos 7 dias"
              value={weekTasks.length}
              detail="tarefas programadas"
              onClick={() => setTaskListFilter("week")}
            />
          </div>

          <div className="home-grid-two">
            <HomeInboxCapture currentUser={currentUser} />
            <WeeklyReviewCard currentUser={currentUser} />
          </div>

          <div className="home-grid-two">
            <HomeJournalCard currentUser={currentUser} />
            <TodayHabitsCard currentUser={currentUser} />
          </div>

          <div style={{ marginTop: 18 }}>
            <WaterTrackerCard
              currentUser={currentUser}
              compact
            />
          </div>

          <div className="home-grid-three">
            <HomeStudiesCard currentUser={currentUser} />
            <HomeContentCard currentUser={currentUser} />
            <HomeEntertainmentCard currentUser={currentUser} />
          </div>

          <div style={{ marginTop: 18}}>
                              
            <SectionCard
              title="O que precisa da minha atenção hoje?"
              icon={AlertTriangle}
            >
              <div className="home-attention-grid">
                {attentionItems.length === 0 && (
                  <div className="home-attention-ok">
                    Tudo certo por aqui. Nenhuma pendência urgente no momento.
                  </div>
                )}

                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className={
                      item.type === "danger"
                        ? "home-attention-item danger"
                        : "home-attention-item warning"
                    }
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: COLORS.ink,
                      }}
                    >
                      {item.text}
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 10,
                        color: COLORS.inkSoft,
                      }}
                    >
                      {item.detail}
                    </div>
                  </div>
                ))}

                <HomeInventoryAlert compact />

                <HomeDocumentsAlert
                  currentUser={currentUser}
                  compact
                />
              </div>
            </SectionCard>
          </div>

          <div className="home-grid">
            <SectionCard title="Prioridades de hoje" icon={Flag}>
              {priorities.length === 0 ? (
                <EmptyState>
                  Nenhuma prioridade cadastrada.
                </EmptyState>
              ) : (
                priorities.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={(task)=>{
                      setEditingTask(task);
                      setTaskModalOpen(true);
                    }}
                    onToggle={toggleTaskStatus}
                    onDelete={deleteTask}
                  />
                ))
              )}
            </SectionCard>

            <SectionCard
              title="Próximos dias"
              icon={Clock3}
              action={
                <button
                  onClick={() => setCalendarOpen(true)}
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.surface,
                    color: COLORS.primaryDark,
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Ver calendário
                </button>
              }
            >
              {weekTasks.length === 0 &&
              weekEvents.length === 0 &&
              weekProjects.length === 0 &&
              weekMilestones.length === 0 ? (
                <EmptyState>
                  Nenhuma tarefa, evento ou prazo nos próximos dias.
                </EmptyState>
              ) : (
                <>
                  {/* TAREFAS */}
                  {weekTasks.map((task) => (
                    <TaskRow
                      key={`task-${task.id}`}
                      task={task}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setTaskModalOpen(true);
                      }}
                      onToggle={toggleTaskStatus}
                      onDelete={deleteTask}
                    />
                  ))}

                  {/* EVENTOS */}
                  {weekEvents.map((event) => (
                    <div
                      key={`event-${event.id}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 0",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: COLORS.ink,
                          }}
                        >
                          {event.title}
                        </div>

                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 11,
                            color: COLORS.inkSoft,
                          }}
                        >
                          Evento • {formatDate(event.event_date)}

                          {event.end_date &&
                          event.end_date !== event.event_date
                            ? ` até ${formatDate(event.end_date)}`
                            : ""}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          flexShrink: 0,
                        }}
                      >
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setEventModalOpen(true);
                          }}
                          title="Editar evento"
                          style={taskActionButtonStyle}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => deleteEvent(event)}
                          title="Excluir evento"
                          style={{
                            ...taskActionButtonStyle,
                            color: COLORS.danger,
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* PROJETOS */}
                  {weekProjects.map((project) => (
                    <div
                      key={`project-${project.id}`}
                      style={{
                        padding: "11px 0",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <Target
                          size={14}
                          color={COLORS.primaryDark}
                        />

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: COLORS.ink,
                          }}
                        >
                          {project.title}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          marginLeft: 21,
                          fontSize: 11,
                          color: COLORS.primaryDark,
                        }}
                      >
                        Projeto • {formatDate(project.due_date)}
                        {" • "}
                        {Number(project.progress || 0)}% concluído
                      </div>
                    </div>
                  ))}

                  {/* MARCOS */}
                  {weekMilestones.map((milestone) => (
                    <div
                      key={`milestone-${milestone.id}`}
                      style={{
                        padding: "11px 0",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <Flag
                          size={14}
                          color={COLORS.primaryDark}
                        />

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: COLORS.ink,
                          }}
                        >
                          {milestone.title}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          marginLeft: 21,
                          fontSize: 11,
                          color: COLORS.inkSoft,
                        }}
                      >
                        Marco •{" "}
                        {milestone.project?.title || "Projeto"}
                        {" • "}
                        {formatDate(milestone.due_date)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </SectionCard>

            <SectionCard
              title="Próximos vencimentos"
              icon={CircleDollarSign}
            >
              {upcomingPayments.length === 0 ? (
                <EmptyState>
                  Nenhum vencimento pendente.
                </EmptyState>
              ) : (
                upcomingPayments.map((transaction) => {
                  const overdue =
                    transaction.paymentDate < todayISO;

                  const dueToday =
                    transaction.paymentDate === todayISO;

                  return (
                    <div
                      key={transaction.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 0",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: COLORS.ink,
                          }}
                        >
                          {transaction.title}
                        </div>

                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 11,
                            color: overdue
                              ? COLORS.danger
                              : dueToday
                              ? COLORS.warning
                              : COLORS.inkSoft,
                            fontWeight:
                              overdue || dueToday
                                ? 600
                                : 400,
                          }}
                        >
                          {getPaymentDateLabel(
                            transaction.paymentDate
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          flexShrink: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: overdue
                            ? COLORS.danger
                            : COLORS.ink,
                        }}
                      >
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  );
                })
              )}
            </SectionCard>

            <SectionCard title="Metas e progresso" icon={Target}>
              {homeGoals.length === 0 ? (
                <EmptyState>
                  Nenhuma meta financeira em andamento.
                </EmptyState>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {homeGoals.map((goal) => (
                    <div key={goal.id}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: COLORS.ink,
                            minWidth: 0,
                          }}
                        >
                          {goal.title}
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: COLORS.primaryDark,
                            flexShrink: 0,
                          }}
                        >
                          {goal.progress.toFixed(0)}%
                        </div>
                      </div>

                      <div
                        style={{
                          height: 7,
                          borderRadius: 999,
                          background: COLORS.primaryLight,
                          overflow: "hidden",
                          marginTop: 8,
                        }}
                      >
                        <div
                          style={{
                            width: `${goal.progress}%`,
                            height: "100%",
                            background: COLORS.primary,
                            borderRadius: 999,
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: 7,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          fontSize: 10.5,
                          color: COLORS.inkSoft,
                        }}
                      >
                        <span>
                          {formatCurrency(goal.current)}
                          {" de "}
                          {formatCurrency(goal.target)}
                        </span>

                        {goal.target_date && (
                          <span>
                            até {formatDate(goal.target_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <HomeLifeGoalsCard
                currentUser={currentUser}
                compact
              />
            </SectionCard>

            <SectionCard
              title="Datas importantes"
              icon={CalendarDays}
              action={
                <button
                  onClick={() => {
                    setEditingDate(null);
                    setDateModalOpen(true);
                  }}
                  style={{
                    border: 0,
                    background: COLORS.primaryLight,
                    color: COLORS.primaryDark,
                    width: 29,
                    height: 29,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Plus size={16} />
                </button>
              }
            >
              {importantDates.length === 0 ? (
                <EmptyState>
                  Nenhuma data importante cadastrada.
                </EmptyState>
              ) : (
                importantDates.slice(0, 5).map((dateItem) => (
                  <div
                    key={dateItem.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 0",
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: COLORS.ink,
                        }}
                      >
                        {dateItem.title}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          color: COLORS.inkSoft,
                          fontSize: 11,
                        }}
                      >
                        {formatDate(dateItem.date_value)}
                        {dateItem.category
                          ? ` • ${dateItem.category}`
                          : ""}
                        {dateItem.repeats_yearly
                          ? " • Anual"
                          : ""}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => {
                          setEditingDate(dateItem);
                          setDateModalOpen(true);
                        }}
                        title="Editar"
                        style={taskActionButtonStyle}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => deleteImportantDate(dateItem)}
                        title="Excluir"
                        style={{
                          ...taskActionButtonStyle,
                          color: COLORS.danger,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </SectionCard>

            <SectionCard
              title="Anotações rápidas"
              icon={StickyNote}
              action={
                <button
                  onClick={() => {setEditingNote(null); setNoteModalOpen(true)}}
                  style={{
                    border: 0,
                    background: COLORS.primaryLight,
                    color: COLORS.primaryDark,
                    width: 29,
                    height: 29,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Plus size={16} />
                </button>
              }
            >
              {notes.length === 0 ? (
                <EmptyState>
                   Nenhuma anotação rápida.
                </EmptyState>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "11px 0",
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: COLORS.ink,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {note.content}
                      </div>

                      {note.pinned && (
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 10,
                            color: COLORS.primaryDark,
                            fontWeight: 600,
                          }}
                        >
                          Fixada
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => toggleNotePin(note)}
                        title={note.pinned ? "Desafixar" : "Fixar"}
                        style={taskActionButtonStyle}
                      >
                        {note.pinned ? (
                          <PinOff size={15} />
                        ) : (
                          <Pin size={15} />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setEditingNote(note);
                          setNoteModalOpen(true);
                        }}
                        title="Editar"
                        style={taskActionButtonStyle}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => deleteNote(note)}
                        title="Excluir"
                        style={{
                          ...taskActionButtonStyle,
                          color: COLORS.danger,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </SectionCard>
          </div>

          
          {selectedTaskList && (
            <div
              onClick={() => setTaskListFilter(null)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1100,
                background: "rgba(15, 23, 42, 0.38)",
                display: "grid",
                placeItems: "center",
                padding: 16,
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(620px, 100%)",
                  maxHeight: "min(680px, 85vh)",
                  overflowY: "auto",
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: "0 18px 55px rgba(15, 23, 42, 0.18)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        color: COLORS.ink,
                        fontSize: 16,
                      }}
                    >
                      {selectedTaskList.title}
                    </h2>
                    <div
                      style={{
                        marginTop: 3,
                        color: COLORS.inkSoft,
                        fontSize: 11,
                      }}
                    >
                      {selectedTaskList.items.length} tarefa(s)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTaskListFilter(null)}
                    title="Fechar"
                    style={taskActionButtonStyle}
                  >
                    <X size={16} />
                  </button>
                </div>

                {selectedTaskList.items.length === 0 ? (
                  <EmptyState>Nenhuma tarefa nesta lista.</EmptyState>
                ) : (
                  selectedTaskList.items.map((task) => (
                    <TaskRow
                      key={`filtered-${task.id}`}
                      task={task}
                      onToggle={toggleTaskStatus}
                      onEdit={(selectedTask) => {
                        setTaskListFilter(null);
                        setEditingTask(selectedTask);
                        setTaskModalOpen(true);
                      }}
                      onDelete={deleteTask}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          <TaskModal
            open={taskModalOpen}
            taskToEdit={editingTask}
            currentUser={currentUser}
            onSaved={loadHome}
            onClose={() =>{
              setTaskModalOpen(false);
              setEditingTask(null);
            }}
            />
          <QuickNoteModal
            open={noteModalOpen}
            noteToEdit={editingNote}
            currentUser={currentUser}
            onSaved={loadHome}
            onClose={() => {setNoteModalOpen(false); setEditingNote(null)}}
          />
          <ImportantDateModal
            open={dateModalOpen}
            dateToEdit={editingDate}
            currentUser={currentUser}
            onSaved={loadHome}
            onClose={() => {
              setDateModalOpen(false);
              setEditingDate(null);
            }}
          />
          <EventModal
            open={eventModalOpen}
            eventToEdit={editingEvent}
            currentUser={currentUser}
            onSaved={loadHome}
            onClose={() => {
              setEventModalOpen(false);
              setEditingEvent(null);
            }}
          />

          <TransactionModal
            open={transactionModalOpen}
            currentUser={currentUser}
            initialType="despesa"
            sourceModule="financeiro"
            transactionToEdit={null}
            onSaved={loadHome}
            onClose={() => {
              setTransactionModalOpen(false);
            }}
          />

        <CalendarModal
          open={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          tasks={tasks}
          events={events}
          importantDates={importantDates}
          projects={projects}
          projectMilestones={projectMilestones}

          onCreateEvent={(dateISO) => {
            setEditingEvent({
              event_date: dateISO,
              end_date: dateISO,
              __new: true,
            });
            setEventModalOpen(true);
          }}

          onEditEvent={(event) => {
            setEditingEvent(event);
            setEventModalOpen(true);
          }}

          onDeleteEvent={(event) => {
            deleteEvent(event);
          }}

          onEditTask={(task) => {
            setEditingTask(task);
            setTaskModalOpen(true);
          }}

          onDeleteTask={(task) => {
            deleteTask(task);
          }}

          onEditImportantDate={(item) => {
            setEditingDate(item);
            setDateModalOpen(true);
          }}

          onDeleteImportantDate={(item) => {
            deleteImportantDate(item);
          }}
        />
        </>
      )}
    </div>
  );
}
