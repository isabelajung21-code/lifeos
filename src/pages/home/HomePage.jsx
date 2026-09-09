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
import ImportantDateModal from "../../components/modals/ImportantDateModal";
import EventModal from "../../components/modals/EventModal";
import CalendarModal from "../../components/modals/CalendarModal";


function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 18,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span style={{ color: COLORS.inkSoft, fontSize: 13 }}>
          {label}
        </span>

        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
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
          fontSize: 27,
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
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 15,
        padding: 20,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 17,
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
              fontSize: 16,
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

export default function HomePage({ currentUser }) {
  const [userId, setUserId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [importantDates, setImportantDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

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
    ]);

    if (tasksResult.error) console.error(tasksResult.error);
    if (notesResult.error) console.error(notesResult.error);
    if (datesResult.error) console.error(datesResult.error);
    if (eventsResult.error) console.error(eventsResult.error);

    setTasks(tasksResult.data || []);
    setNotes(notesResult.data || []);
    setImportantDates(datesResult.data || []);
    setEvents(eventsResult.data || []);

    setLoading(false);
  }

  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const weekEndISO = weekEnd.toISOString().slice(0, 10);

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

  const weekEvents = events.filter((event) => {
    if (!event.event_date) return false;

    const eventStart = event.event_date;
    const eventEnd = event.end_date || event.event_date;

    return eventStart <= weekEndISO && eventEnd >= todayISO;
    
  });

  const priorities = pending
    .filter(
      (task) =>
        task.priority === "alta" ||
        task.priority === "urgente"
    )
    .slice(0, 5);

  const attentionItems = [
    ...overdue.map((task) => ({
      id: `overdue-${task.id}`,
      text: task.title,
      detail: "Tarefa atrasada",
      type: "danger",
    })),

    ...todayTasks
      .filter((task) => task.priority === "alta" || task.priority === "urgente")
      .map((task) => ({
        id: `today-${task.id}`,
        text: task.title,
        detail: "Prioridade para hoje",
        type: "warning",
      })),
  ].slice(0, 6);

  function formatDate(date) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(`${date}T12:00:00`));
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
      <div style={{ marginBottom: 25 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 29,
            color: COLORS.ink,
            letterSpacing: "-0.8px",
          }}
        >
          {getGreeting()}, {currentUser}
        </h1>

        <p
          style={{
            color: COLORS.inkSoft,
            margin: "6px 0 0",
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
          <div className="home-stats">
            <StatCard
              icon={CheckCircle2}
              label="Concluídas"
              value={completed.length}
              detail="tarefas"
            />

            <StatCard
              icon={ListTodo}
              label="Pendentes"
              value={pending.length}
              detail="tarefas"
            />

            <StatCard
              icon={AlertTriangle}
              label="Atrasadas"
              value={overdue.length}
              detail="precisam de atenção"
            />

            <StatCard
              icon={CalendarDays}
              label="Próximos 7 dias"
              value={weekTasks.length}
              detail="tarefas programadas"
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <SectionCard
              title="O que precisa da minha atenção hoje?"
              icon={AlertTriangle}
            >
              {attentionItems.length === 0 ? (
                <div
                  style={{
                    background: COLORS.successLight,
                    borderRadius: 10,
                    padding: 14,
                    color: COLORS.success,
                    fontSize: 13,
                  }}
                >
                  Tudo certo por aqui. Nenhuma pendência urgente no momento.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                  }}
                >
                  {attentionItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background:
                          item.type === "danger"
                            ? COLORS.dangerLight
                            : COLORS.warningLight,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: COLORS.ink,
                        }}
                      >
                        {item.text}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color: COLORS.inkSoft,
                        }}
                      >
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {weekTasks.length === 0 && weekEvents.length === 0 ? (
                <EmptyState>
                  Nenhuma tarefa ou evento nos próximos dias.
                </EmptyState>
              ) : (
                <>
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
                          {event.end_date && event.end_date !== event.event_date
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
                </>
              )}
            </SectionCard>

            <SectionCard
              title="Próximos vencimentos"
              icon={CircleDollarSign}
            >
              <EmptyState>
                Os vencimentos aparecerão aqui quando construirmos o
                Financeiro.
              </EmptyState>
            </SectionCard>

            <SectionCard title="Metas e progresso" icon={Target}>
              <EmptyState>
                Suas metas aparecerão aqui conforme forem cadastradas.
              </EmptyState>
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

          <SectionCard title="Ações rápidas" icon={Plus}>
            <div className="quick-actions">
              {[
                { label: "Nova tarefa", action: () => {setEditingTask(null); setTaskModalOpen(true) }},
                { label: "Nova despesa" },
                { label: "Novo projeto" },
                { label: "Novo evento", action: () => {setEditingEvent(null); setEventModalOpen(true) }},
                { label: "Nova anotação", action: () => setNoteModalOpen(true) },
                { label: "Nova data", action: () => {setEditingDate(null); setDateModalOpen(true) }},
                ].map((item) => (
                <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.bg,
                    color: COLORS.ink,
                    borderRadius: 10,
                     padding: "11px 15px",
                    fontWeight: 600,
                    fontSize: 12,
                    }}
                >
    + {item.label}
  </button>
))}
                
            </div>
          </SectionCard>
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

        <CalendarModal
          open={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          tasks={tasks}
          events={events}
          importantDates={importantDates}

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