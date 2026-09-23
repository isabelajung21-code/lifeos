import { useEffect, useMemo, useState } from "react";
import { Check, Flame, Loader2, Pencil, Plus, Repeat2, Trash2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";
import WaterTrackerCard from "./WaterTrackerCard";
import HabitMonthTracker from "./HabitMonthTracker";


const MODULES = [
  ["pessoal", "Pessoal"],
  ["trabalho", "Trabalho"],
  ["casa", "Casa"],
  ["pets", "Pets"],
  ["estudos", "Estudos"],
  ["financeiro", "Financeiro"],
];

const FREQUENCIES = [
  ["daily", "Todos os dias"],
  ["weekdays", "Dias escolhidos"],
  ["weekly_target", "Meta por semana"],
];

const DAYS = [
  [0, "D"], [1, "S"], [2, "T"], [3, "Q"], [4, "Q"], [5, "S"], [6, "S"],
];

const fieldStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 9, fontSize: 12,
  border: `1px solid ${COLORS.border}`, background: COLORS.surface,
  color: COLORS.ink, outline: "none", boxSizing: "border-box",
};

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) {
    result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  }
  if (result.error) throw result.error;
  if (!result.data?.id) throw new Error("Usuário não encontrado.");
  return result.data.id;
}

function localDate(date = new Date()) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function startOfWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return localDate(date);
}

function startOfMonth() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(1);

  return localDate(date);
}

export default function HabitsPage({ currentUser }) {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [title, setTitle] = useState("");
  const [module, setModule] = useState("pessoal");
  const [frequency, setFrequency] = useState("daily");
  const [targetCount, setTargetCount] = useState(1);
  const [days, setDays] = useState([]);
  const [visibility, setVisibility] = useState("private");
  const [color, setColor] = useState("#5F92CC");
  const [editingHabit, setEditingHabit] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, [currentUser]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const userId = await findUserId(currentUser);
      const [habitsResult, logsResult] = await Promise.all([
        supabase.from("habits").select("*").is("deleted_at", null)
          .or(`owner_user_id.eq.${userId},visibility.eq.shared`)
          .order("created_at", { ascending: false }),
        supabase
          .from("habit_logs")
          .select("*")
          .eq("completed_by_user_id", userId)
          .gte("log_date", startOfMonth()),
      ]);
      if (habitsResult.error) throw habitsResult.error;
      if (logsResult.error) throw logsResult.error;
      setHabits(habitsResult.data || []);
      setLogs(logsResult.data || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar hábitos e rotinas.");
    } finally {
      setLoading(false);
    }
  }

  function resetHabitForm() {
    setTitle("");
    setModule("pessoal");
    setFrequency("daily");
    setTargetCount(1);
    setDays([]);
    setVisibility("private");
    setColor("#5F92CC");
    setEditingHabit(null);
  }

  function startEditingHabit(habit) {
    setEditingHabit(habit);
    setTitle(habit.title || "");
    setModule(
      habit.source_module || "pessoal"
    );
    setFrequency(
      habit.frequency_type || "daily"
    );
    setTargetCount(
      Number(habit.target_count || 1)
    );
    setDays(habit.days_of_week || []);
    setVisibility(
      habit.visibility || "private"
    );
    setColor(
      habit.color || "#5F92CC"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditingHabit() {
    resetHabitForm();
    setError("");
  }

  async function addHabit(event) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    if (
      frequency === "weekdays" &&
      days.length === 0
    ) {
      setError(
        "Escolha pelo menos um dia da semana."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const userId = await findUserId(
        currentUser
      );

      const payload = {
        title: title.trim(),
        source_module: module,
        frequency_type: frequency,

        target_count:
          frequency === "weekly_target"
            ? Number(targetCount)
            : 1,

        days_of_week:
          frequency === "weekdays"
            ? days
            : null,

        visibility,
        color,
        updated_at:
          new Date().toISOString(),
      };

      if (editingHabit) {
        const { data, error: updateError } =
          await supabase
            .from("habits")
            .update(payload)
            .eq("id", editingHabit.id)
            .select()
            .single();

        if (updateError) {
          throw updateError;
        }

        setHabits((current) =>
          current.map((habit) =>
            habit.id === editingHabit.id
              ? data
              : habit
          )
        );
      } else {
        const { data, error: insertError } =
          await supabase
            .from("habits")
            .insert({
              ...payload,
              owner_user_id: userId,
              assigned_to_user_id:
                userId,
            })
            .select()
            .single();

        if (insertError) {
          throw insertError;
        }

        setHabits((current) => [
          data,
          ...current,
        ]);
      }

      resetHabitForm();
    } catch (saveError) {
      setError(
        saveError.message ||
          "Não foi possível salvar esta rotina."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleHabitDate(
    habit,
    date
  ) {
    setError("");

    try {
      const userId = await findUserId(
        currentUser
      );

      const existing = logs.find(
        (log) =>
          log.habit_id === habit.id &&
          log.log_date === date &&
          log.completed_by_user_id === userId
      );

      if (existing) {
        const { error: deleteError } =
          await supabase
            .from("habit_logs")
            .delete()
            .eq("id", existing.id);

        if (deleteError) {
          throw deleteError;
        }

        setLogs((current) =>
          current.filter(
            (log) => log.id !== existing.id
          )
        );
      } else {
        const { data, error: insertError } =
          await supabase
            .from("habit_logs")
            .insert({
              habit_id: habit.id,
              log_date: date,
              completed_count: 1,
              completed_by_user_id: userId,
            })
            .select()
            .single();

        if (insertError) {
          throw insertError;
        }

        setLogs((current) => [
          ...current,
          data,
        ]);
      }
    } catch (toggleError) {
      setError(
        toggleError.message ||
          "Não foi possível atualizar esta rotina."
      );
    }
  }

  async function toggleToday(habit) {
    await toggleHabitDate(
      habit,
      localDate()
    );
  }

  async function updateHabitColor(
    habit,
    newColor
  ) {
    const oldColor =
      habit.color || "#5F92CC";

    setHabits((current) =>
      current.map((item) =>
        item.id === habit.id
          ? { ...item, color: newColor }
          : item
      )
    );

    const { error: updateError } =
      await supabase
        .from("habits")
        .update({
          color: newColor,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", habit.id);

    if (updateError) {
      setHabits((current) =>
        current.map((item) =>
          item.id === habit.id
            ? { ...item, color: oldColor }
            : item
        )
      );

      setError(
        updateError.message ||
          "Não foi possível alterar a cor."
      );
    }
  }

  async function removeHabit(habit) {
    const userId = await findUserId(currentUser);
    const now = new Date().toISOString();
    const { error: removeError } = await supabase.from("habits")
      .update({ deleted_at: now, deleted_by: userId, updated_at: now }).eq("id", habit.id);
    if (removeError) {
      setError(removeError.message);
      return;
    }
    setHabits((current) => current.filter((item) => item.id !== habit.id));
  }

  function shouldAppearToday(habit) {
    if (!habit.is_active) return false;
    if (habit.frequency_type !== "weekdays") return true;
    return (habit.days_of_week || []).includes(new Date().getDay());
  }

  const todayHabits = useMemo(() => habits.filter(shouldAppearToday), [habits]);
  const today = localDate();
  const completedToday = todayHabits.filter((habit) =>
    logs.some((log) => log.habit_id === habit.id && log.log_date === today)
  ).length;

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Repeat2 size={20} color={COLORS.primaryDark} />
        <h1 style={{ margin: 0, color: COLORS.ink, fontSize: 20, letterSpacing: "-0.3px" }}>Hábitos e Rotinas</h1>
      </div>
      <p
        style={{
          color: COLORS.inkSoft,
          margin: "0 0 16px",
          fontSize: 12,
        }}
      >
        Rotinas pessoais e compartilhadas em um só lugar.
      </p>

      <div style={{ marginBottom: 14 }}>
        <WaterTrackerCard
          currentUser={currentUser}
          showChart
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <HabitMonthTracker
          habits={habits}
          logs={logs}
          onToggleDate={toggleHabitDate}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 14, alignItems: "start" }}>
        <form onSubmit={addHabit} style={cardStyle}>
          <h2 style={{ margin: "0 0 12px", color: COLORS.ink, fontSize: 15 }}>Nova rotina</h2>
          <label style={labelStyle}>Nome</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: tomar creatina" style={fieldStyle} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div><label style={labelStyle}>Área</label><select value={module} onChange={(e) => setModule(e.target.value)} style={fieldStyle}>{MODULES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div><label style={labelStyle}>Quem vê</label><select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={fieldStyle}><option value="private">Só {currentUser}</option><option value="shared">Compartilhado</option></select></div>
          </div>

          <div style={{ marginTop: 12 }}><label style={labelStyle}>Frequência</label><select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={fieldStyle}>{FREQUENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>

          <div
            style={{
              marginTop: 12,
            }}
          >
            <label style={labelStyle}>
              Cor do hábito
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <input
                type="color"
                value={color}
                onChange={(event) =>
                  setColor(event.target.value)
                }
                style={{
                  width: 42,
                  height: 34,
                  padding: 3,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 9,
                  background: COLORS.surface,
                  cursor: "pointer",
                }}
              />

              <div
                style={{
                  flex: 1,
                  color: COLORS.inkSoft,
                  fontSize: 11,
                }}
              >
                Essa cor será usada nas bolinhas e
                no gráfico.
              </div>
            </div>
          </div>

          {frequency === "weekdays" && (
            <div style={{ display: "flex", gap: 7, marginTop: 12 }}>{DAYS.map(([value, label]) => <button key={value} type="button" onClick={() => setDays((current) => current.includes(value) ? current.filter((day) => day !== value) : [...current, value])} style={{ width: 30, height: 30, fontSize: 11, borderRadius: 999, border: `1px solid ${days.includes(value) ? COLORS.primary : COLORS.border}`, background: days.includes(value) ? COLORS.primaryLight : COLORS.surface, color: days.includes(value) ? COLORS.primaryDark : COLORS.inkSoft, fontWeight: 700 }}>{label}</button>)}</div>
          )}

          {frequency === "weekly_target" && <div style={{ marginTop: 12 }}><label style={labelStyle}>Quantas vezes por semana?</label><input type="number" min="1" max="7" value={targetCount} onChange={(e) => setTargetCount(e.target.value)} style={fieldStyle} /></div>}

          <button
            type="submit"
            disabled={
              saving || !title.trim()
            }
            style={{
              width: "100%",
              marginTop: 16,
              border: 0,
              borderRadius: 9,
              padding: 9,
              fontSize: 12,
              background: COLORS.primary,
              color: "white",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity:
                saving || !title.trim()
                  ? 0.55
                  : 1,
            }}
          >
            {saving ? (
              <Loader2 size={15} />
            ) : editingHabit ? (
              <Pencil size={15} />
            ) : (
              <Plus size={17} />
            )}

            {editingHabit
              ? "Salvar alterações"
              : "Criar rotina"}
          </button>
        </form>

        <div>
          <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div><div style={{ color: COLORS.inkSoft, fontSize: 12 }}>Progresso de hoje</div><strong style={{ color: COLORS.ink, fontSize: 18 }}>{completedToday}/{todayHabits.length}</strong></div>
            <Flame size={22} color={completedToday === todayHabits.length && todayHabits.length ? COLORS.success : COLORS.warning} />
          </div>

          {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 11, borderRadius: 10, marginBottom: 12 }}>{error}</div>}
          {loading ? <div style={{ textAlign: "center", color: COLORS.inkSoft, padding: 30 }}>Carregando...</div> : todayHabits.length === 0 ? <div style={{ ...cardStyle, textAlign: "center", color: COLORS.inkSoft }}>Nenhuma rotina para hoje.</div> : (
            <div style={{ display: "grid", gap: 9 }}>{todayHabits.map((habit) => {
              const done = logs.some((log) => log.habit_id === habit.id && log.log_date === today);
              const weekCount = logs.filter((log) => log.habit_id === habit.id).reduce((sum, log) => sum + Number(log.completed_count || 0), 0);
              return <article key={habit.id} style={{ ...cardStyle, padding: 11, display: "flex", alignItems: "center", gap: 9 }}>
                <button onClick={() => toggleToday(habit)} style={{ width: 30, height: 30, flex: "0 0 auto", borderRadius: 999, border: `1px solid ${done ? COLORS.success : COLORS.border}`, background: done ? COLORS.successLight : COLORS.surface, color: COLORS.success, display: "grid", placeItems: "center" }}>{done && <Check size={16} />}</button>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ color: COLORS.ink, fontWeight: 700, textDecoration: done ? "line-through" : "none", opacity: done ? .7 : 1 }}>{habit.title}</div><div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 4 }}>{MODULES.find(([v]) => v === habit.source_module)?.[1] || "Pessoal"}{habit.frequency_type === "weekly_target" ? ` • ${weekCount}/${habit.target_count} nesta semana` : ""}{habit.visibility === "shared" ? " • Compartilhado" : ""}</div></div>
                <button
                  type="button"
                  title="Editar hábito"
                  onClick={() =>
                    startEditingHabit(habit)
                  }
                  style={{
                    width: 30,
                    height: 30,
                    flex: "0 0 auto",
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    color: COLORS.primaryDark,
                    background: COLORS.surface,
                  }}
                >
                  <Pencil size={15} />
                </button>
                <input
                  type="color"
                  value={
                    habit.color || "#5F92CC"
                  }
                  title="Alterar cor do hábito"
                  onChange={(event) =>
                    updateHabitColor(
                      habit,
                      event.target.value
                    )
                  }
                  style={{
                    width: 30,
                    height: 30,
                    flex: "0 0 auto",
                    padding: 3,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    background: COLORS.surface,
                    cursor: "pointer",
                  }}
                />
                <button onClick={() => removeHabit(habit)} title="Mover para a Lixeira" style={{ border: 0, background: "transparent", color: COLORS.danger, padding: 7 }}><Trash2 size={17} /></button>
              </article>;
            })}</div>
          )}
        </div>
      </div>
    </section>
  );
}

const labelStyle = { display: "block", color: COLORS.inkSoft, fontSize: 12, marginBottom: 5 };
const cardStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: 14,
  boxShadow: "0 4px 14px rgba(55, 106, 159, 0.04)",
};