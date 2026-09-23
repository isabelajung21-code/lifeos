import { useEffect, useState } from "react";
import { CalendarDays, Check, Circle, Edit3, ListChecks, Plus, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const emptyForm = { course_id: "", title: "", item_type: "conteudo", priority: "media", due_date: "", due_time: "", estimated_minutes: "", description: "" };
const TYPES = { conteudo: "Conteúdo", aula: "Aula", leitura: "Leitura", revisao: "Revisão", trabalho: "Trabalho", prova: "Prova", outro: "Outro" };
const PRIORITIES = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  return result.data?.id;
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : "Sem prazo";
}

export default function StudyItemsSection({ currentUser, courses }) {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadItems(); }, [currentUser]);

  async function loadItems() {
    try {
      const id = await findUserId(currentUser);
      setUserId(id || null);
      if (!id) return setItems([]);
      const { data, error: queryError } = await supabase.from("study_items").select("*").eq("owner_user_id", id).is("deleted_at", null).order("due_date", { ascending: true, nullsFirst: false });
      if (queryError) throw queryError;
      setItems(data || []);
    } catch (err) { setError(err.message); }
  }

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm, course_id: courses[0]?.id || "" });
    setShowForm(true);
  }

  function edit(item) {
    setEditingId(item.id);
    setForm({ course_id: item.course_id || "", title: item.title || "", item_type: item.item_type, priority: item.priority, due_date: item.due_date || "", due_time: item.due_time || "", estimated_minutes: item.estimated_minutes || "", description: item.description || "" });
    setShowForm(true);
  }

  async function syncCalendar(item, oldEventId) {
    if (!item.due_date) {
      if (oldEventId) await supabase.from("calendar_events").update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq("id", oldEventId);
      return null;
    }
    const course = courses.find((entry) => entry.id === item.course_id);
    const payload = { owner_user_id: userId, title: `Estudos: ${item.title}`, description: course ? `${course.title}${item.description ? ` — ${item.description}` : ""}` : item.description || null, source_module: "estudos", source_id: item.id, event_date: item.due_date, start_time: item.due_time || null, all_day: !item.due_time, event_type: item.item_type, type: "estudo", deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() };
    if (oldEventId) {
      const { error } = await supabase.from("calendar_events").update(payload).eq("id", oldEventId);
      if (error) throw error;
      return oldEventId;
    }
    const { data, error } = await supabase.from("calendar_events").insert(payload).select("id").single();
    if (error) throw error;
    return data.id;
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Informe o título do item.");
    try {
      const payload = { owner_user_id: userId, course_id: form.course_id || null, title: form.title.trim(), item_type: form.item_type, priority: form.priority, due_date: form.due_date || null, due_time: form.due_time || null, estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null, description: form.description.trim() || null, updated_at: new Date().toISOString() };
      let saved;
      if (editingId) {
        const current = items.find((item) => item.id === editingId);
        const { data, error } = await supabase.from("study_items").update(payload).eq("id", editingId).select("*").single();
        if (error) throw error;
        saved = data;
        const eventId = await syncCalendar(saved, current?.calendar_event_id);
        await supabase.from("study_items").update({ calendar_event_id: eventId }).eq("id", saved.id);
      } else {
        const { data, error } = await supabase.from("study_items").insert(payload).select("*").single();
        if (error) throw error;
        saved = data;
        const eventId = await syncCalendar(saved, null);
        if (eventId) await supabase.from("study_items").update({ calendar_event_id: eventId }).eq("id", saved.id);
      }
      setShowForm(false); setEditingId(null); setForm(emptyForm); await loadItems();
    } catch (err) { setError(err.message); }
  }

  async function toggleDone(item) {
    const done = item.status === "concluido";
    const { error: updateError } = await supabase.from("study_items").update({ status: done ? "pendente" : "concluido", completed_at: done ? null : new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", item.id);
    if (updateError) setError(updateError.message); else loadItems();
  }

  async function remove(item) {
    if (!window.confirm(`Mover “${item.title}” para a Lixeira?`)) return;
    const now = new Date().toISOString();
    const { error: deleteError } = await supabase.from("study_items").update({ deleted_at: now, deleted_by: userId, updated_at: now }).eq("id", item.id);
    if (deleteError) return setError(deleteError.message);
    if (item.calendar_event_id) await supabase.from("calendar_events").update({ deleted_at: now, deleted_by: userId }).eq("id", item.calendar_event_id);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  const courseName = (id) => courses.find((course) => course.id === id)?.title || "Sem curso";

  return <section style={panel}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div><h3 style={{ margin: 0, color: COLORS.ink, fontSize: 17, display: "flex", gap: 7, alignItems: "center" }}><ListChecks size={19} color={COLORS.primaryDark} /> Planejamento de estudos</h3><div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 4 }}>Prazos aparecem automaticamente na Agenda.</div></div>
      <button onClick={openNew} style={primaryButton}><Plus size={17} /> Novo item</button>
    </div>

    {showForm && <form onSubmit={save} style={{ background: COLORS.bg, borderRadius: 12, padding: 14, marginTop: 14 }}>
      <div style={grid}>
        <Field label="Curso"><select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} style={input}><option value="">Sem curso</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></Field>
        <Field label="Título *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={input} /></Field>
        <Field label="Tipo"><select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })} style={input}>{Object.entries(TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Prioridade"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={input}>{Object.entries(PRIORITIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Prazo"><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} style={input} /></Field>
        <Field label="Horário"><input type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} style={input} /></Field>
        <Field label="Tempo estimado (min)"><input type="number" min="1" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} style={input} /></Field>
      </div>
      <Field label="Descrição"><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...input, resize: "vertical" }} /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 11 }}><button type="submit" style={primaryButton}><Check size={16} /> Salvar</button><button type="button" onClick={() => setShowForm(false)} style={secondaryButton}><X size={16} /> Cancelar</button></div>
    </form>}

    {error && <div style={{ color: COLORS.danger, background: COLORS.dangerLight, padding: 10, borderRadius: 9, marginTop: 12 }}>{error}</div>}

    <div style={{ display: "grid", gap: 9, marginTop: 14 }}>
      {items.length === 0 ? <div style={empty}>Nenhum item de estudo cadastrado.</div> : items.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, border: `1px solid ${COLORS.border}`, borderRadius: 11, padding: 12, opacity: item.status === "concluido" ? 0.65 : 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}><button onClick={() => toggleDone(item)} style={{ ...iconButton, border: 0 }} title="Concluir">{item.status === "concluido" ? <Check size={18} color={COLORS.success} /> : <Circle size={18} />}</button><div><div style={{ color: COLORS.ink, fontWeight: 700, fontSize: 13, textDecoration: item.status === "concluido" ? "line-through" : "none" }}>{item.title}</div><div style={{ color: COLORS.inkSoft, fontSize: 11, marginTop: 4 }}>{courseName(item.course_id)} • {TYPES[item.item_type]} • {PRIORITIES[item.priority]}</div><div style={{ color: COLORS.primaryDark, fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={12} /> {formatDate(item.due_date)}{item.due_time ? ` às ${item.due_time.slice(0, 5)}` : ""}</div></div></div>
        <div style={{ display: "flex", gap: 6 }}><button onClick={() => edit(item)} style={iconButton}><Edit3 size={15} /></button><button onClick={() => remove(item)} style={{ ...iconButton, color: COLORS.danger }}><Trash2 size={15} /></button></div>
      </div>)}
    </div>
  </section>;
}

function Field({ label, children }) { return <label style={{ display: "grid", gap: 5, color: COLORS.inkSoft, fontSize: 11 }}>{label}{children}</label>; }
const panel = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 15, padding: 18 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 10, marginBottom: 10 };
const input = { width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 10px", background: COLORS.surface, color: COLORS.ink, font: "inherit" };
const primaryButton = { display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 9, padding: "9px 12px", background: COLORS.primary, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const secondaryButton = { ...primaryButton, background: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.border}` };
const iconButton = { width: 32, height: 32, display: "grid", placeItems: "center", border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.surface, color: COLORS.primaryDark, cursor: "pointer" };
const empty = { border: `1px dashed ${COLORS.border}`, borderRadius: 11, padding: 20, textAlign: "center", color: COLORS.inkSoft, fontSize: 12 };
