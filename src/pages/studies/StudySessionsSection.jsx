import { useEffect, useMemo, useState } from "react";
import { Clock3, History, Plus, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

function today() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
async function findUserId(name) { let r = await supabase.from("users").select("id").eq("display_name", name).maybeSingle(); if (!r.data && !r.error) r = await supabase.from("users").select("id").eq("name", name).maybeSingle(); if (r.error) throw r.error; return r.data?.id; }
function dateLabel(value) { return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)); }
function durationLabel(minutes) { const hours = Math.floor(minutes / 60); const rest = minutes % 60; return hours ? `${hours}h${rest ? ` ${rest}min` : ""}` : `${rest}min`; }

export default function StudySessionsSection({ currentUser, courses }) {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ course_id: "", study_item_id: "", session_date: today(), duration_minutes: 30, notes: "" });

  useEffect(() => { loadData(); }, [currentUser]);

  async function loadData() {
    try {
      const id = await findUserId(currentUser); setUserId(id || null);
      if (!id) return;
      const [sessionResult, itemResult] = await Promise.all([
        supabase.from("study_sessions").select("*").eq("owner_user_id", id).is("deleted_at", null).order("session_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("study_items").select("id,title,course_id").eq("owner_user_id", id).is("deleted_at", null),
      ]);
      if (sessionResult.error) throw sessionResult.error;
      if (itemResult.error) throw itemResult.error;
      setSessions(sessionResult.data || []); setItems(itemResult.data || []);
    } catch (err) { setError(err.message); }
  }

  const totals = useMemo(() => {
    const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
    const week = sessions.filter((s) => new Date(`${s.session_date}T12:00:00`) >= start).reduce((sum, s) => sum + s.duration_minutes, 0);
    return { week, total: sessions.reduce((sum, s) => sum + s.duration_minutes, 0) };
  }, [sessions]);

  async function save(event) {
    event.preventDefault(); setError("");
    if (!form.duration_minutes || Number(form.duration_minutes) <= 0) return setError("Informe uma duração válida.");
    const { error: insertError } = await supabase.from("study_sessions").insert({ owner_user_id: userId, course_id: form.course_id || null, study_item_id: form.study_item_id || null, session_date: form.session_date, duration_minutes: Number(form.duration_minutes), notes: form.notes.trim() || null });
    if (insertError) return setError(insertError.message);
    setShowForm(false); setForm({ course_id: "", study_item_id: "", session_date: today(), duration_minutes: 30, notes: "" }); loadData();
  }

  async function remove(session) {
    if (!window.confirm("Excluir esta sessão de estudo?")) return;
    const { error: removeError } = await supabase.from("study_sessions").update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq("id", session.id);
    if (removeError) setError(removeError.message); else setSessions((current) => current.filter((item) => item.id !== session.id));
  }

  const courseName = (id) => courses.find((course) => course.id === id)?.title || "Estudo geral";
  const itemName = (id) => items.find((item) => item.id === id)?.title;
  const availableItems = form.course_id ? items.filter((item) => item.course_id === form.course_id) : items;

  return <section style={panel}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
      <div><h3 style={{ margin: 0, color: COLORS.ink, fontSize: 17, display: "flex", alignItems: "center", gap: 7 }}><Clock3 size={19} color={COLORS.primaryDark} /> Sessões de estudo</h3><div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 4 }}>Registre o tempo realmente dedicado aos estudos.</div></div>
      <button onClick={() => setShowForm(true)} style={primaryButton}><Plus size={17} /> Registrar sessão</button>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 9, marginTop: 13 }}>
      <Stat label="Últimos 7 dias" value={durationLabel(totals.week)} />
      <Stat label="Tempo total" value={durationLabel(totals.total)} />
      <Stat label="Sessões" value={sessions.length} />
    </div>

    {showForm && <form onSubmit={save} style={{ background: COLORS.bg, padding: 14, borderRadius: 12, marginTop: 13 }}>
      <div style={grid}>
        <Field label="Curso"><select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value, study_item_id: "" })} style={input}><option value="">Estudo geral</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></Field>
        <Field label="Conteúdo"><select value={form.study_item_id} onChange={(e) => setForm({ ...form, study_item_id: e.target.value })} style={input}><option value="">Não vincular</option>{availableItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
        <Field label="Data"><input type="date" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} style={input} /></Field>
        <Field label="Duração (minutos)"><input type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} style={input} /></Field>
      </div>
      <Field label="Observações"><textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...input, resize: "vertical" }} /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}><button type="submit" style={primaryButton}><Clock3 size={16} /> Registrar</button><button type="button" onClick={() => setShowForm(false)} style={secondaryButton}><X size={16} /> Cancelar</button></div>
    </form>}

    {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 10, borderRadius: 9, marginTop: 11 }}>{error}</div>}

    <div style={{ marginTop: 14 }}>
      <h4 style={{ margin: "0 0 9px", color: COLORS.ink, fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}><History size={16} /> Histórico recente</h4>
      <div style={{ display: "grid", gap: 8 }}>{sessions.length === 0 ? <div style={empty}>Nenhuma sessão registrada.</div> : sessions.slice(0, 10).map((session) => <div key={session.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 11 }}><div><strong style={{ color: COLORS.ink, fontSize: 13 }}>{courseName(session.course_id)}</strong>{itemName(session.study_item_id) && <div style={{ color: COLORS.inkSoft, fontSize: 11, marginTop: 3 }}>{itemName(session.study_item_id)}</div>}<div style={{ color: COLORS.primaryDark, fontSize: 11, marginTop: 4 }}>{dateLabel(session.session_date)} • {durationLabel(session.duration_minutes)}</div></div><button onClick={() => remove(session)} style={iconButton} title="Excluir"><Trash2 size={15} /></button></div>)}</div>
    </div>
  </section>;
}

function Stat({ label, value }) { return <div style={{ background: COLORS.bg, borderRadius: 10, padding: 11 }}><div style={{ color: COLORS.primaryDark, fontWeight: 750, fontSize: 17 }}>{value}</div><div style={{ color: COLORS.inkSoft, fontSize: 10, marginTop: 3 }}>{label}</div></div>; }
function Field({ label, children }) { return <label style={{ display: "grid", gap: 5, color: COLORS.inkSoft, fontSize: 11 }}>{label}{children}</label>; }
const panel = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 15, padding: 18 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 10, marginBottom: 10 };
const input = { width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 10px", background: COLORS.surface, color: COLORS.ink, font: "inherit" };
const primaryButton = { display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 9, padding: "9px 12px", background: COLORS.primary, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const secondaryButton = { ...primaryButton, background: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.border}` };
const iconButton = { width: 32, height: 32, display: "grid", placeItems: "center", border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.surface, color: COLORS.danger, cursor: "pointer" };
const empty = { border: `1px dashed ${COLORS.border}`, borderRadius: 10, padding: 18, textAlign: "center", color: COLORS.inkSoft, fontSize: 12 };
