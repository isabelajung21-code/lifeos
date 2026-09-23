import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, GraduationCap } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(name) {
  let result = await supabase.from("users").select("id").eq("display_name", name).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", name).maybeSingle();
  if (result.error) throw result.error;
  return result.data?.id;
}

function dateInfo(value) {
  if (!value) return { label: "Sem prazo", overdue: false };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(`${value}T12:00:00`); date.setHours(0, 0, 0, 0);
  const days = Math.round((date - today) / 86400000);
  if (days < 0) return { label: `Atrasado há ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}`, overdue: true };
  if (days === 0) return { label: "Hoje", overdue: false };
  if (days === 1) return { label: "Amanhã", overdue: false };
  return { label: `Em ${days} dias`, overdue: false };
}

export default function HomeStudiesCard({ currentUser }) {
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [currentUser]);

  async function loadData() {
    setLoading(true);
    try {
      const userId = await findUserId(currentUser);
      if (!userId) return;
      const [itemResult, courseResult] = await Promise.all([
        supabase.from("study_items").select("*").eq("owner_user_id", userId).is("deleted_at", null).in("status", ["pendente", "em_andamento"]).order("due_date", { ascending: true, nullsFirst: false }).limit(5),
        supabase.from("study_courses").select("id,title").eq("owner_user_id", userId).is("deleted_at", null),
      ]);
      if (itemResult.error) throw itemResult.error;
      if (courseResult.error) throw courseResult.error;
      setItems(itemResult.data || []); setCourses(courseResult.data || []);
    } catch { setItems([]); setCourses([]); }
    finally { setLoading(false); }
  }

  const courseName = (id) => courses.find((course) => course.id === id)?.title || "Estudos";

  return <section style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, marginTop: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><GraduationCap size={19} color={COLORS.primaryDark} /><h2 style={{ margin: 0, color: COLORS.ink, fontSize: 16 }}>Próximos estudos</h2></div>
    {loading ? <div style={{ color: COLORS.inkSoft, fontSize: 12 }}>Carregando planejamento...</div> : items.length === 0 ? <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.success, background: COLORS.successLight, borderRadius: 10, padding: 11, fontSize: 12 }}><CheckCircle2 size={17} /> Nenhum estudo pendente.</div> : <div style={{ display: "grid", gap: 8 }}>{items.map((item) => {
      const info = dateInfo(item.due_date);
      return <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: info.overdue ? COLORS.dangerLight : COLORS.bg, borderRadius: 10, padding: "10px 11px" }}><div><div style={{ color: COLORS.ink, fontWeight: 700, fontSize: 13 }}>{item.title}</div><div style={{ color: COLORS.inkSoft, fontSize: 10, marginTop: 3 }}>{courseName(item.course_id)} • {item.estimated_minutes ? `${item.estimated_minutes} min` : "Tempo livre"}</div></div><div style={{ color: info.overdue ? COLORS.danger : COLORS.primaryDark, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{info.overdue ? <AlertCircle size={14} /> : <CalendarDays size={14} />}{info.label}</div></div>;
    })}</div>}
  </section>;
}
