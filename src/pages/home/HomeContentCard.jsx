import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, Lightbulb } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(name) { let r = await supabase.from("users").select("id").eq("display_name", name).maybeSingle(); if (!r.data && !r.error) r = await supabase.from("users").select("id").eq("name", name).maybeSingle(); if (r.error) throw r.error; return r.data?.id; }
function dateInfo(value) { if (!value) return { label: "Sem data", overdue: false }; const now = new Date(); now.setHours(0,0,0,0); const date = new Date(`${value}T12:00:00`); date.setHours(0,0,0,0); const days = Math.round((date-now)/86400000); if (days < 0) return { label: `Atrasado ${Math.abs(days)}d`, overdue: true }; if (days === 0) return { label: "Hoje", overdue: false }; if (days === 1) return { label: "Amanhã", overdue: false }; return { label: `Em ${days} dias`, overdue: false }; }

export default function HomeContentCard({ currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { load(); }, [currentUser]);
  async function load() { setLoading(true); try { const id = await findUserId(currentUser); if (!id) return; const { data, error } = await supabase.from("content_items").select("id,title,status,platform,scheduled_date,scheduled_time").eq("owner_user_id", id).is("deleted_at", null).in("status", ["planejamento","producao","revisao","agendado"]).order("scheduled_date", { ascending: true, nullsFirst: false }).limit(5); if (error) throw error; setItems(data || []); } catch { setItems([]); } finally { setLoading(false); } }

  return <section style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, marginTop: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><Lightbulb size={19} color={COLORS.primaryDark} /><h2 style={{ margin: 0, color: COLORS.ink, fontSize: 16 }}>Conteúdos em andamento</h2></div>{loading ? <div style={{ color: COLORS.inkSoft, fontSize: 12 }}>Carregando conteúdos...</div> : items.length === 0 ? <div style={{ color: COLORS.inkSoft, background: COLORS.bg, borderRadius: 10, padding: 11, fontSize: 12 }}>Nenhum conteúdo em andamento.</div> : <div style={{ display: "grid", gap: 8 }}>{items.map((item) => { const info = dateInfo(item.scheduled_date); return <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 9, background: info.overdue ? COLORS.dangerLight : COLORS.bg, borderRadius: 10, padding: 10 }}><div><strong style={{ color: COLORS.ink, fontSize: 12 }}>{item.title}</strong><div style={{ color: COLORS.inkSoft, fontSize: 10, marginTop: 3 }}>{item.platform} • {item.status.replaceAll("_", " ")}</div></div><div style={{ display: "flex", alignItems: "center", gap: 4, color: info.overdue ? COLORS.danger : COLORS.primaryDark, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{info.overdue ? <AlertCircle size={13} /> : <CalendarDays size={13} />}{info.label}</div></div>; })}</div>}</section>;
}
