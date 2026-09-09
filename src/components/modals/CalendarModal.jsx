import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  ListTodo,
  Pencil,
  Trash2,
} from "lucide-react";
import { COLORS } from "../../constants/theme";

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonth(date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function isDateInsideEvent(dateISO, event) {
  if (!event.event_date) return false;

  const start = event.event_date;
  const end = event.end_date || event.event_date;

  return dateISO >= start && dateISO <= end;
}

export default function CalendarModal({
  open,
  onClose,
  tasks = [],
  events = [],
  importantDates = [],
  onEditEvent,
  onDeleteEvent,
  onEditTask,
  onDeleteTask,
  onCreateEvent,
  onEditImportantDate,
  onDeleteImportantDate,
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(null);

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const result = [];

    for (let i = 0; i < startDay; i++) {
      result.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      result.push(new Date(year, month, day));
    }

    while (result.length % 7 !== 0) {
      result.push(null);
    }

    return result;
  }, [currentMonth]);

  if (!open) return null;

  const todayISO = toISODate(new Date());

  const selectedEvents = selectedDate
    ? events.filter((event) =>
        isDateInsideEvent(selectedDate, event)
      )
    : [];

  const selectedImportantDates = selectedDate
    ? importantDates.filter((item) => {
        if (!item.date_value) return false;

        if (item.repeats_yearly) {
            return item.date_value.slice(5) === selectedDate.slice(5);
        }

        return item.date_value === selectedDate;
        })
    : [];

  const selectedTasks = selectedDate
    ? tasks.filter(
        (task) =>
          task.due_date === selectedDate &&
          task.status !== "cancelada"
      )
    : [];

    const selectedItems = [
        ...selectedEvents.map((event) => ({
            id: `event-${event.id}`,
            kind: "event",
            data: event,
            title: event.title,
            time:
            !event.all_day && event.start_time
                ? event.start_time.slice(0, 5)
                : null,
            endTime:
            !event.all_day && event.end_time
                ? event.end_time.slice(0, 5)
                : null,
        })),

        ...selectedTasks.map((task) => ({
            id: `task-${task.id}`,
            kind: "task",
            data: task,
            title: task.title,
            time: task.due_time
            ? task.due_time.slice(0, 5)
            : null,
            endTime: null,
        })),

        ...selectedImportantDates.map((item) => ({
            id: `important-${item.id}`,
            kind: "important_date",
            data: item,
            title: item.title,
            time: null,
            endTime: null,
        })),
        ].sort((a, b) => {
        if (a.time && b.time) {
            return a.time.localeCompare(b.time);
        }

        if (a.time && !b.time) return -1;
        if (!a.time && b.time) return 1;

        return a.title.localeCompare(b.title, "pt-BR");
        });


  function previousMonth() {
    setCurrentMonth(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
    setSelectedDate(null);
  }

  function goToday() {
    const now = new Date();

    setCurrentMonth(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );

    setSelectedDate(toISODate(now));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(25, 35, 45, 0.42)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: COLORS.surface,
          width: "min(1100px, 96vw)",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 18,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 20px 55px rgba(25,35,45,.18)",
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: "20px 22px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 750,
                fontSize: 20,
                color: COLORS.ink,
                textTransform: "capitalize",
              }}
            >
              {formatMonth(currentMonth)}
            </div>

            <div
              style={{
                fontSize: 12,
                color: COLORS.inkSoft,
                marginTop: 3,
              }}
            >
              Tarefas e eventos
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 7,
              alignItems: "center",
            }}
          >
            <button
              onClick={goToday}
              style={secondaryButton}
            >
              Hoje
            </button>

            <button
              onClick={previousMonth}
              style={iconButton}
              title="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={nextMonth}
              style={iconButton}
              title="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>

            <button
              onClick={onClose}
              style={iconButton}
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          style={{
            padding: 20,
          }}
        >
          {/* Dias da semana */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 6,
              marginBottom: 6,
            }}
          >
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
              (day) => (
                <div
                  key={day}
                  style={{
                    textAlign: "center",
                    color: COLORS.inkSoft,
                    fontWeight: 650,
                    fontSize: 11,
                    padding: 6,
                  }}
                >
                  {day}
                </div>
              )
            )}
          </div>

          {/* Calendário */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 6,
            }}
          >
            {days.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    style={{
                      minHeight: 105,
                      background: COLORS.bg,
                      borderRadius: 10,
                    }}
                  />
                );
              }

              const dateISO = toISODate(date);

              const dayEvents = events.filter((event) =>
                isDateInsideEvent(dateISO, event)
              );

              const dayTasks = tasks.filter(
                (task) =>
                  task.due_date === dateISO &&
                  task.status !== "cancelada"
              );

              const dayImportantDates = importantDates.filter((item) => {
                if (!item.date_value) return false;

                if (item.repeats_yearly) {
                    return item.date_value.slice(5) === dateISO.slice(5);
                }

                return item.date_value === dateISO;
                });

              const selected = selectedDate === dateISO;
              const today = todayISO === dateISO;

              return (
                <button
                  onClick={(e) => {
                    if (e.detail === 2) {
                        onCreateEvent?.(dateISO);
                        return;
                    }

                    setSelectedDate(dateISO);
                    }}
                  style={{
                    minHeight: 105,
                    borderRadius: 10,
                    border: selected
                      ? `2px solid ${COLORS.primary}`
                      : `1px solid ${COLORS.border}`,
                    background: selected
                      ? COLORS.primaryLight
                      : COLORS.surface,
                    padding: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        width: 25,
                        height: 25,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        fontSize: 12,
                        fontWeight: today ? 750 : 600,
                        background: today
                          ? COLORS.primary
                          : "transparent",
                        color: today
                          ? "#fff"
                          : COLORS.ink,
                      }}
                    >
                      {date.getDate()}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCreateEvent?.(dateISO);
                        }}
                        title="Novo evento"
                        style={{
                            width: 22,
                            height: 22,
                            border: "none",
                            borderRadius: 6,
                            background: "transparent",
                            color: COLORS.primary,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 17,
                            lineHeight: 1,
                            padding: 0,
                        }}
                        >
                        +
                        </button>
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {dayImportantDates.slice(0, 1).map((item) => (
                        <div
                            key={`important-${item.id}`}
                            onClick={(e) => {
                            e.stopPropagation();
                            onEditImportantDate?.(item);
                            }}
                            style={{
                            fontSize: 9.5,
                            padding: "3px 5px",
                            borderRadius: 5,
                            background: COLORS.successLight,
                            color: COLORS.success,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "pointer",
                            position: "relative",
                            zIndex: 3,
                            }}
                        >
                            ★ {item.title}
                        </div>
                        ))}
                    {dayEvents.slice(0, 2).map((event) => {
                        const eventStart = event.event_date;
                        const eventEnd = event.end_date || event.event_date;

                        const isStart = dateISO === eventStart;
                        const isEnd = dateISO === eventEnd;
                        const isMultiDay = eventStart !== eventEnd;

                        const dayOfWeek = date.getDay();

                        const isSunday = dayOfWeek === 0;
                        const isSaturday = dayOfWeek === 6;

                        // A faixa precisa começar visualmente se:
                        // - for o primeiro dia real do evento
                        // - OU for domingo, porque começou uma nova linha
                        const visualStart =
                            !isMultiDay || isStart || isSunday;

                        // A faixa precisa terminar visualmente se:
                        // - for o último dia real do evento
                        // - OU for sábado, porque terminou a linha
                        const visualEnd =
                            !isMultiDay || isEnd || isSaturday;

                        return (
                            <div
                            key={event.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditEvent?.(event);
                            }}
                            style={{
                                position: "relative",
                                zIndex: 3,

                                fontSize: 9.5,
                                height: 20,
                                display: "flex",
                                alignItems: "center",

                                background: COLORS.primaryLight,
                                color: COLORS.primaryDark,

                                whiteSpace: "nowrap",
                                overflow: "visible",
                                textOverflow: "ellipsis",
                                
                                cursor: "pointer",
                                

                                borderTopLeftRadius: visualStart ? 5 : 0,
                                borderBottomLeftRadius: visualStart ? 5 : 0,
                                borderTopRightRadius: visualEnd ? 5 : 0,
                                borderBottomRightRadius: visualEnd ? 5 : 0,

                                // Avança sobre o espaço entre as células
                                marginLeft: visualStart ? 0 : -14,
                                marginRight: visualEnd ? 0 : -14,

                                paddingLeft: visualStart ? 5 : 14,
                                paddingRight: visualEnd ? 5 : 14,
                            }}
                            >
                            {(isStart || isSunday) && event.title}
                            </div>
                        );
                        })}

                    {dayTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        style={{
                          fontSize: 9.5,
                          padding: "3px 5px",
                          borderRadius: 5,
                          background: COLORS.warningLight,
                          color: COLORS.ink,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {task.title}
                      </div>
                    ))}

                    {dayEvents.length + dayTasks.length + dayImportantDates.length > 5 && (
                      <div
                        style={{
                          fontSize: 9,
                          color: COLORS.inkSoft,
                        }}
                      >
                        +
                        {dayEvents.length +
                          dayTasks.length +
                          dayImportantDates.lengh-
                          5} itens
                        itens
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalhes do dia selecionado */}
          {selectedDate && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                background: COLORS.bg,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: COLORS.ink,
                  marginBottom: 12,
                }}
              >
                {new Date(
                  `${selectedDate}T12:00:00`
                ).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>

              {selectedEvents.length === 0 &&
              selectedTasks.length === 0  &&
              selectedImportantDates.length === 0 ?(
                <div
                  style={{
                    color: COLORS.inkSoft,
                    fontSize: 13,
                  }}
                >
                  Nenhum item neste dia.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {selectedItems.length === 0 ? (
                    <div
                        style={{
                        padding: "18px 0",
                        color: COLORS.inkSoft,
                        fontSize: 12,
                        }}
                    >
                        Nenhum compromisso para este dia.
                    </div>
                    ) : (
                    <div
                        style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                        }}
                    >
                        {selectedItems.map((item) => {
                        const isEvent = item.kind === "event";
                        const isTask = item.kind === "task";
                        const isImportant = item.kind === "important_date";

                        const background = isEvent
                            ? COLORS.primaryLight
                            : isTask
                            ? COLORS.warningLight
                            : COLORS.successLight;

                        const accent = isEvent
                            ? COLORS.primary
                            : isTask
                            ? COLORS.warning
                            : COLORS.success;

                        const typeLabel = isEvent
                            ? "Evento"
                            : isTask
                            ? "Tarefa"
                            : "Data importante";

                        const editItem = () => {
                            if (isEvent) {
                            onEditEvent?.(item.data);
                            } else if (isTask) {
                            onEditTask?.(item.data);
                            } else {
                            onEditImportantDate?.(item.data);
                            }
                        };

                        const deleteItem = () => {
                            if (isEvent) {
                            onDeleteEvent?.(item.data);
                            } else if (isTask) {
                            onDeleteTask?.(item.data);
                            } else {
                            onDeleteImportantDate?.(item.data);
                            }
                        };

                        return (
                            <div
                            key={item.id}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "70px minmax(0, 1fr) auto",
                                alignItems: "center",
                                gap: 10,
                                padding: "9px 10px",
                                borderRadius: 9,
                                background,
                                borderLeft: `3px solid ${accent}`,
                            }}
                            >
                            {/* Horário */}
                            <div
                                style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: accent,
                                }}
                            >
                                {item.time || "Dia inteiro"}

                                {item.time && item.endTime && (
                                <div
                                    style={{
                                    fontSize: 9.5,
                                    fontWeight: 500,
                                    color: COLORS.inkSoft,
                                    marginTop: 1,
                                    }}
                                >
                                    até {item.endTime}
                                </div>
                                )}
                            </div>

                            {/* Informações */}
                            <div style={{ minWidth: 0 }}>
                                <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 650,
                                    color: COLORS.ink,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                                >
                                {item.title}
                                </div>

                                <div
                                style={{
                                    fontSize: 10,
                                    color: COLORS.inkSoft,
                                    marginTop: 2,
                                }}
                                >
                                {typeLabel}
                                </div>
                            </div>

                            {/* Ações */}
                            <div
                                style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                }}
                            >
                                <button
                                type="button"
                                onClick={editItem}
                                title="Editar"
                                style={{
                                    width: 29,
                                    height: 29,
                                    border: "none",
                                    borderRadius: 7,
                                    background: "rgba(255,255,255,.65)",
                                    color: COLORS.primaryDark,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                >
                                <Pencil size={14} />
                                </button>

                                <button
                                type="button"
                                onClick={deleteItem}
                                title="Excluir"
                                style={{
                                    width: 29,
                                    height: 29,
                                    border: "none",
                                    borderRadius: 7,
                                    background: "rgba(255,255,255,.65)",
                                    color: COLORS.danger,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                >
                                <Trash2 size={14} />
                                </button>
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const iconButton = {
  width: 36,
  height: 36,
  borderRadius: 9,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.ink,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryButton = {
  height: 36,
  padding: "0 13px",
  borderRadius: 9,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.ink,
  fontWeight: 600,
  cursor: "pointer",
};

const detailItem = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  textAlign: "left",
  padding: 10,
  borderRadius: 9,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  cursor: "pointer",
};