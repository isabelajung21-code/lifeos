import { useEffect, useMemo, useState } from "react";
import { Check, Flame, Repeat2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) {
    result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  }
  if (result.error) throw result.error;
  return result.data?.id;
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

export default function TodayHabitsCard({ currentUser }) {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, [currentUser]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const userId = await findUserId(currentUser);
      if (!userId) throw new Error("Usuário não encontrado.");
      const [habitsResult, logsResult] = await Promise.all([
        supabase.from("habits").select("*").is("deleted_at", null)
          .eq("is_active", true)
          .or(`owner_user_id.eq.${userId},visibility.eq.shared`)
          .order("created_at", { ascending: true }),
        supabase.from("habit_logs").select("*").gte("log_date", startOfWeek()),
      ]);
      if (habitsResult.error) throw habitsResult.error;
      if (logsResult.error) throw logsResult.error;
      setHabits(habitsResult.data || []);
      setLogs(logsResult.data || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar as rotinas.");
    } finally {
      setLoading(false);
    }
  }

  const todayHabits = useMemo(() => habits.filter((habit) => {
    if (habit.frequency_type !== "weekdays") return true;
    return (habit.days_of_week || []).includes(new Date().getDay());
  }), [habits]);

  const today = localDate();

  async function toggle(habit) {
    setError("");
    try {
      const existing = logs.find((log) => log.habit_id === habit.id && log.log_date === today);
      if (existing) {
        const { error: deleteError } = await supabase.from("habit_logs").delete().eq("id", existing.id);
        if (deleteError) throw deleteError;
        setLogs((current) => current.filter((log) => log.id !== existing.id));
      } else {
        const userId = await findUserId(currentUser);
        const { data, error: insertError } = await supabase.from("habit_logs").insert({
          habit_id: habit.id,
          log_date: today,
          completed_count: 1,
          completed_by_user_id: userId,
        }).select().single();
        if (insertError) throw insertError;
        setLogs((current) => [...current, data]);
      }
    } catch (err) {
      setError(err.message || "Não foi possível atualizar esta rotina.");
    }
  }

  const completed = todayHabits.filter((habit) =>
    logs.some((log) => log.habit_id === habit.id && log.log_date === today)
  ).length;

  return (
    <section style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Repeat2 size={19} color={COLORS.primaryDark} />
          <h2 style={{ margin: 0, color: COLORS.ink, fontSize: 16 }}>Rotinas de hoje</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: completed === todayHabits.length && todayHabits.length ? COLORS.success : COLORS.inkSoft, fontSize: 13, fontWeight: 700 }}>
          <Flame size={17} /> {completed}/{todayHabits.length}
        </div>
      </div>

      {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 10, borderRadius: 9, marginBottom: 10 }}>{error}</div>}
      {loading ? <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Carregando rotinas...</div> : todayHabits.length === 0 ? <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Nenhuma rotina programada para hoje.</div> : (
        <div style={{ display: "grid", gap: 8 }}>
          {todayHabits.map((habit) => {
            const done = logs.some((log) => log.habit_id === habit.id && log.log_date === today);
            const weekCount = logs.filter((log) => log.habit_id === habit.id).reduce((sum, log) => sum + Number(log.completed_count || 0), 0);
            return (
              <button key={habit.id} onClick={() => toggle(habit)} style={{ border: `1px solid ${done ? COLORS.success : COLORS.border}`, background: done ? COLORS.successLight : COLORS.bg, borderRadius: 10, padding: "10px 11px", display: "flex", alignItems: "center", gap: 10, textAlign: "left", color: COLORS.ink }}>
                <span style={{ width: 25, height: 25, flex: "0 0 auto", borderRadius: 999, border: `1px solid ${done ? COLORS.success : COLORS.border}`, background: done ? COLORS.success : COLORS.surface, color: "white", display: "grid", placeItems: "center" }}>{done && <Check size={15} />}</span>
                <span style={{ flex: 1, fontWeight: 650, textDecoration: done ? "line-through" : "none", opacity: done ? .72 : 1 }}>{habit.title}</span>
                {habit.frequency_type === "weekly_target" && <span style={{ color: COLORS.inkSoft, fontSize: 12 }}>{weekCount}/{habit.target_count} na semana</span>}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
