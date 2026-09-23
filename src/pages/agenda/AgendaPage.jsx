import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, ListTodo, PawPrint, Plus, Wrench } from "lucide-react";
import EventModal from "../../components/modals/EventModal";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function localDate(date = new Date()) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function dateFromKey(key) {
  return new Date(`${key}T12:00:00`);
}

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.id) throw new Error("Usuário não encontrado.");
  return result.data.id;
}

export default function AgendaPage({ currentUser }) {
  const today = localDate();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventModalOpen, setEventModalOpen] = useState(false);

  useEffect(() => { loadAgenda(); }, [currentUser, cursor.getFullYear(), cursor.getMonth()]);

  async function loadAgenda() {
    setLoading(true);
    setError("");
    try {
      const userId = await findUserId(currentUser);
      const monthStart = localDate(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
      const monthEnd = localDate(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));

      const [events, tasks, finances, vaccines, maintenances] = await Promise.all([
        supabase.from("calendar_events").select("*").eq("owner_user_id", userId).is("deleted_at", null).lte("event_date", monthEnd).or(`end_date.is.null,end_date.gte.${monthStart}`),
        supabase.from("tasks").select("*").is("deleted_at", null).not("status", "in", '("concluida","cancelada")').gte("due_date", monthStart).lte("due_date", monthEnd).or(`owner_user_id.eq.${userId},assigned_to_user_id.eq.${userId},visibility.eq.shared`),
        supabase.from("finance_transactions").select("*").is("deleted_at", null).in("status", ["previsto"]).gte("due_date", monthStart).lte("due_date", monthEnd),
        supabase.from("pet_vaccinations").select("*, pet:pets(name)").is("deleted_at", null).gte("next_due_date", monthStart).lte("next_due_date", monthEnd),
        supabase.from("house_maintenances").select("*").is("deleted_at", null).eq("status", "pendente").gte("next_maintenance_date", monthStart).lte("next_maintenance_date", monthEnd),
      ]);

      const firstError = [events, tasks, finances, vaccines, maintenances].find((result) => result.error)?.error;
      if (firstError) throw firstError;

      setItems([
        ...(events.data || []).map((item) => ({ ...item, agendaType: "event", date: item.event_date, label: item.title })),
        ...(tasks.data || []).map((item) => ({ ...item, agendaType: "task", date: item.due_date, label: item.title })),
        ...(finances.data || []).map((item) => ({ ...item, agendaType: "finance", date: item.due_date, label: item.title })),
        ...(vaccines.data || []).map((item) => ({ ...item, agendaType: "vaccine", date: item.next_due_date, label: `${item.pet?.name || "Pet"} • ${item.vaccine_name}` })),
        ...(maintenances.data || []).map((item) => ({ ...item, agendaType: "maintenance", date: item.next_maintenance_date, label: item.title })),
      ]);
    } catch (err) {
      setError(err.message || "Não foi possível carregar a Agenda.");
    } finally {
      setLoading(false);
    }
  }

  const calendarDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const previousLastDay = new Date(year, month, 0).getDate();
    const cells = [];
    for (let index = firstWeekday - 1; index >= 0; index--) cells.push({ date: new Date(year, month - 1, previousLastDay - index), current: false });
    for (let day = 1; day <= lastDay; day++) cells.push({ date: new Date(year, month, day), current: true });
    let nextDay = 1;
    while (cells.length < 42) cells.push({ date: new Date(year, month + 1, nextDay++), current: false });
    return cells;
  }, [cursor]);

  function itemsForDate(dateKey) {
    return items.filter((item) => {
      if (item.agendaType !== "event") return item.date === dateKey;
      return item.event_date <= dateKey && (item.end_date || item.event_date) >= dateKey;
    });
  }

  const selectedItems = itemsForDate(selectedDate).sort((a, b) => (a.start_time || "99:99").localeCompare(b.start_time || "99:99"));

  function changeMonth(amount) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + amount, 1);
    setCursor(next);
    setSelectedDate(localDate(next));
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div><div style={{ display: "flex", alignItems: "center", gap: 9 }}><CalendarDays size={16} color={COLORS.primaryDark} /><h1 style={{ margin: 0, color: COLORS.ink, fontSize: 20, letterSpacing: "-0.3px" }}>Agenda</h1></div><p style={{ color: COLORS.inkSoft, margin: "4px 0 0", fontSize: 12, }}>Tudo que tem data, reunido em um só lugar.</p></div>
        <button onClick={() => setEventModalOpen(true)} style={primaryButton}><Plus size={15} /> Novo compromisso</button>
      </div>

      {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 12, borderRadius: 10, marginBottom: 14 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 14, alignItems: "start" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => changeMonth(-1)} style={iconButton}><ChevronLeft size={16} /></button>
            <strong style={{ color: COLORS.ink, fontSize: 15 }}>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</strong>
            <button onClick={() => changeMonth(1)} style={iconButton}><ChevronRight size={16} /></button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 5 }}>
            {WEEKDAYS.map((day) => <div key={day} style={{ textAlign: "center", color: COLORS.inkSoft, fontSize: 11, fontWeight: 700, padding: "4px 0" }}>{day}</div>)}
            {calendarDays.map(({ date, current }) => {
                const key = localDate(date);
                const count = itemsForDate(key).length;
                const selected = key === selectedDate;
                const isToday = key === today;

                function selectDay() {
                    setSelectedDate(key);

                    if (!current) {
                    setCursor(
                        new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        1
                        )
                    );
                    }
                }

                return (
                    <button
                    key={key}
                    type="button"
                    onClick={selectDay}
                    style={{
                        minHeight: 58,
                        border: `1px solid ${
                        selected
                            ? COLORS.primary
                            : COLORS.border
                        }`,
                        borderRadius: 9,
                        background: selected
                        ? COLORS.primaryLight
                        : COLORS.surface,
                        color: current
                        ? COLORS.ink
                        : COLORS.inkSoft,
                        padding: 6,
                        textAlign: "left",
                        opacity: current ? 1 : 0.55,
                    }}
                    >
                    <span
                        style={{
                        display: "grid",
                        placeItems: "center",
                        width: 22,
                        height: 22,
                        fontSize: 11,
                        borderRadius: 999,
                        background: isToday
                            ? COLORS.primary
                            : "transparent",
                        color: isToday
                            ? "white"
                            : "inherit",
                        fontWeight: 700,
                        }}
                    >
                        {date.getDate()}
                    </span>

                    {count > 0 && (
                        <span
                        style={{
                            display: "block",
                            marginTop: 8,
                            width: Math.min(count, 4) * 7,
                            height: 4,
                            borderRadius: 99,
                            background: COLORS.primary,
                        }}
                        />
                    )}
                    </button>
                );
                })}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 4px", color: COLORS.ink, fontSize: 17 }}>{dateFromKey(selectedDate).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</h2>
          <div style={{ color: COLORS.inkSoft, fontSize: 12, marginBottom: 14 }}>{selectedItems.length} {selectedItems.length === 1 ? "item" : "itens"}</div>
          {loading ? <div style={{ color: COLORS.inkSoft }}>Carregando...</div> : selectedItems.length === 0 ? <div style={{ color: COLORS.inkSoft, padding: "20px 0", textAlign: "center" }}>Nada programado para esta data.</div> : <div style={{ display: "grid", gap: 9 }}>{selectedItems.map((item) => <AgendaItem key={`${item.agendaType}-${item.id}`} item={item} />)}</div>}
        </div>
      </div>

      <EventModal open={eventModalOpen} onClose={() => setEventModalOpen(false)} currentUser={currentUser} onSaved={loadAgenda} />
    </section>
  );
}

function AgendaItem({ item }) {
  const config = {
    event: [CalendarDays, "Compromisso", COLORS.primaryDark, COLORS.primaryLight],
    task: [ListTodo, "Tarefa", COLORS.warning, COLORS.warningLight],
    finance: [CircleDollarSign, "Vencimento", COLORS.danger, COLORS.dangerLight],
    vaccine: [PawPrint, "Vacina", COLORS.success, COLORS.successLight],
    maintenance: [Wrench, "Manutenção", COLORS.inkSoft, COLORS.bg],
  }[item.agendaType];
  const [Icon, typeLabel, color, background] = config;
  return <div style={{ display: "flex", gap: 10, background, borderRadius: 10, padding: 11 }}><Icon size={18} color={color} style={{ flex: "0 0 auto", marginTop: 1 }} /><div style={{ minWidth: 0 }}><div style={{ color: COLORS.ink, fontWeight: 700, fontSize: 13 }}>{item.label}</div><div style={{ color, fontSize: 11, marginTop: 3 }}>{item.start_time ? `${item.start_time.slice(0, 5)} • ` : ""}{typeLabel}</div></div></div>;
}

const cardStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: 14,
  boxShadow: "0 4px 14px rgba(55, 106, 159, 0.04)",
};
const iconButton = { border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.primaryDark, width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center" };
const primaryButton = { border: 0, background: COLORS.primary, color: "white", padding: "8px 11px", borderRadius: 9, fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6 };