import { useEffect, useState } from "react";
import { CheckCircle2, FolderKanban, ListTodo, Repeat2, TrendingDown } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

function localDate(date = new Date()) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function weekRange() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: localDate(start), end: localDate(end) };
}

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.id) throw new Error("Usuário não encontrado.");
  return result.data.id;
}

function currency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function WeeklyReviewCard({ currentUser }) {
  const [summary, setSummary] = useState({ completed: 0, pending: 0, habitsDone: 0, habitsTarget: 0, expenses: 0, activeProjects: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadReview(); }, [currentUser]);

  async function loadReview() {
    setLoading(true);
    setError("");
    try {
      const userId = await findUserId(currentUser);
      const { start, end } = weekRange();
      const startTimestamp = `${start}T00:00:00`;
      const endTimestamp = `${end}T23:59:59`;

      const [completedTasks, pendingTasks, habits, habitLogs, expenses, projects] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact" }).is("deleted_at", null).eq("status", "concluida").gte("completed_at", startTimestamp).lte("completed_at", endTimestamp).or(`owner_user_id.eq.${userId},assigned_to_user_id.eq.${userId},visibility.eq.shared`),
        supabase.from("tasks").select("id", { count: "exact" }).is("deleted_at", null).not("status", "in", '("concluida","cancelada")').gte("due_date", start).lte("due_date", end).or(`owner_user_id.eq.${userId},assigned_to_user_id.eq.${userId},visibility.eq.shared`),
        supabase.from("habits").select("id, frequency_type, target_count, days_of_week").is("deleted_at", null).eq("is_active", true).or(`owner_user_id.eq.${userId},visibility.eq.shared`),
        supabase.from("habit_logs").select("habit_id, completed_count").gte("log_date", start).lte("log_date", end),
        supabase.from("finance_transactions").select("amount").is("deleted_at", null).eq("type", "despesa").not("status", "eq", "cancelado").gte("transaction_date", start).lte("transaction_date", end),
        supabase.from("projects").select("id", { count: "exact" }).eq("owner_user_id", userId).is("deleted_at", null).in("status", ["planejamento", "em_andamento"]),
      ]);

      const firstError = [completedTasks, pendingTasks, habits, habitLogs, expenses, projects].find((result) => result.error)?.error;
      if (firstError) throw firstError;

      const habitsList = habits.data || [];
      const logsList = habitLogs.data || [];
      const currentWeekday = new Date().getDay();
      const target = habitsList.reduce((total, habit) => {
        if (habit.frequency_type === "weekly_target") return total + Number(habit.target_count || 1);
        if (habit.frequency_type === "weekdays") {
          return total + (habit.days_of_week || []).filter((day) => day <= currentWeekday).length;
        }
        return total + currentWeekday + 1;
      }, 0);

      setSummary({
        completed: completedTasks.count || 0,
        pending: pendingTasks.count || 0,
        habitsDone: logsList.reduce((total, log) => total + Number(log.completed_count || 0), 0),
        habitsTarget: target,
        expenses: (expenses.data || []).reduce((total, item) => total + Number(item.amount || 0), 0),
        activeProjects: projects.count || 0,
      });
    } catch (err) {
      setError(err.message || "Não foi possível montar o resumo da semana.");
    } finally {
      setLoading(false);
    }
  }

  const habitPercent = summary.habitsTarget > 0 ? Math.min(100, Math.round((summary.habitsDone / summary.habitsTarget) * 100)) : 0;

  return (
    <section style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, marginTop: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, color: COLORS.ink, fontSize: 17 }}>Sua semana</h2>
        <p style={{ margin: "4px 0 0", color: COLORS.inkSoft, fontSize: 12 }}>De domingo até hoje</p>
      </div>

      {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 10, borderRadius: 9 }}>{error}</div>}
      {loading ? <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Montando seu resumo...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <ReviewItem icon={CheckCircle2} label="Tarefas concluídas" value={summary.completed} color={COLORS.success} background={COLORS.successLight} />
          <ReviewItem icon={ListTodo} label="Pendentes na semana" value={summary.pending} color={COLORS.warning} background={COLORS.warningLight} />
          <ReviewItem icon={Repeat2} label="Constância dos hábitos" value={`${habitPercent}%`} detail={`${summary.habitsDone}/${summary.habitsTarget}`} color={COLORS.primaryDark} background={COLORS.primaryLight} />
          <ReviewItem icon={TrendingDown} label="Gastos na semana" value={currency(summary.expenses)} color={COLORS.danger} background={COLORS.dangerLight} />
          <ReviewItem icon={FolderKanban} label="Projetos ativos" value={summary.activeProjects} color={COLORS.primaryDark} background={COLORS.primaryLight} />
        </div>
      )}
    </section>
  );
}

function ReviewItem({ icon: Icon, label, value, detail, color, background }) {
  return (
    <div style={{ background, borderRadius: 11, padding: 13 }}>
      <Icon size={18} color={color} />
      <div style={{ color: COLORS.inkSoft, fontSize: 11, marginTop: 9 }}>{label}</div>
      <div style={{ color: COLORS.ink, fontSize: 19, fontWeight: 800, marginTop: 2 }}>{value}</div>
      {detail && <div style={{ color, fontSize: 11, marginTop: 2 }}>{detail}</div>}
    </div>
  );
}
