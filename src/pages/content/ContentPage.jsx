import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Edit3, Lightbulb, Plus, Save, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";
import ContentPillarsSection from "./ContentPillarsSection";
import ContentMetricsSection from "./ContentMetricsSection";

const emptyForm = { pillar_id: "", title: "", description: "", content_type: "post", platform: "instagram", status: "ideia", priority: "media", scheduled_date: "", scheduled_time: "", caption: "", script: "", call_to_action: "", content_url: "", notes: "" };
const TYPES = { post: "Post", carrossel: "Carrossel", reels: "Reels", stories: "Stories", video: "Vídeo", artigo: "Artigo", email: "E-mail", outro: "Outro" };
const PLATFORMS = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn", blog: "Blog", email: "E-mail", multiplataforma: "Multiplataforma", outro: "Outro" };
const STATUSES = { ideia: "Ideia", planejamento: "Planejamento", producao: "Produção", revisao: "Revisão", agendado: "Agendado", publicado: "Publicado", arquivado: "Arquivado", cancelado: "Cancelado" };
const PRIORITIES = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };

async function findUserId(name) { let r = await supabase.from("users").select("id").eq("display_name", name).maybeSingle(); if (!r.data && !r.error) r = await supabase.from("users").select("id").eq("name", name).maybeSingle(); if (r.error) throw r.error; return r.data?.id; }
function formatDate(value) { return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : null; }

export default function ContentPage({ currentUser }) {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("todos");
  const [error, setError] = useState("");

  useEffect(() => { loadItems(); loadPillars(); }, [currentUser]);
  async function loadPillars() {
    try {
        const id = await findUserId(currentUser);

        if (!id) {
        setPillars([]);
        return;
        }

        const { data, error } = await supabase
        .from("content_pillars")
        .select("*")
        .eq("owner_user_id", id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("name");

        if (error) throw error;

        setPillars(data || []);
    } catch (err) {
        setError(err.message);
    }
    }
  
  async function loadItems() { try { const id = await findUserId(currentUser); setUserId(id || null); if (!id) return; const { data, error: e } = await supabase.from("content_items").select("*").eq("owner_user_id", id).is("deleted_at", null).order("scheduled_date", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }); if (e) throw e; setItems(data || []); } catch (e) { setError(e.message); } }

  const summary = useMemo(() => ({ ideas: items.filter((i) => i.status === "ideia").length, production: items.filter((i) => ["planejamento", "producao", "revisao"].includes(i.status)).length, scheduled: items.filter((i) => i.status === "agendado").length, published: items.filter((i) => i.status === "publicado").length }), [items]);
  const visible = filter === "todos" ? items : items.filter((item) => item.status === filter);

  function openNew() { setEditingId(null); setForm(emptyForm); setShowForm(true); setError(""); }
  function edit(item) { setEditingId(item.id); setForm({ pillar_id: item.pillar_id || "", title: item.title || "", description: item.description || "", content_type: item.content_type, platform: item.platform, status: item.status, priority: item.priority, scheduled_date: item.scheduled_date || "", scheduled_time: item.scheduled_time || "", caption: item.caption || "", script: item.script || "", call_to_action: item.call_to_action || "", content_url: item.content_url || "", notes: item.notes || "" }); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function syncCalendar(item, oldEventId) {
    if (!item.scheduled_date) { if (oldEventId) await supabase.from("calendar_events").update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq("id", oldEventId); return null; }
    const payload = { owner_user_id: userId, title: `Conteúdo: ${item.title}`, description: `${PLATFORMS[item.platform]} • ${TYPES[item.content_type]}`, source_module: "conteudo", source_id: item.id, event_date: item.scheduled_date, start_time: item.scheduled_time || null, all_day: !item.scheduled_time, event_type: "publicacao", type: "conteudo", deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() };
    if (oldEventId) { const { error } = await supabase.from("calendar_events").update(payload).eq("id", oldEventId); if (error) throw error; return oldEventId; }
    const { data, error } = await supabase.from("calendar_events").insert(payload).select("id").single(); if (error) throw error; return data.id;
  }

  async function save(event) {
    event.preventDefault(); setError(""); if (!form.title.trim()) return setError("Informe o título do conteúdo.");
    try {
      const payload = { owner_user_id: userId, pillar_id: form.pillar_id || null, title: form.title.trim(), description: form.description.trim() || null, content_type: form.content_type, platform: form.platform, status: form.status, priority: form.priority, scheduled_date: form.scheduled_date || null, scheduled_time: form.scheduled_time || null, caption: form.caption.trim() || null, script: form.script.trim() || null, call_to_action: form.call_to_action.trim() || null, content_url: form.content_url.trim() || null, notes: form.notes.trim() || null, published_at: form.status === "publicado" ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
      let saved, oldEventId = null;
      if (editingId) { oldEventId = items.find((i) => i.id === editingId)?.calendar_event_id; const { data, error } = await supabase.from("content_items").update(payload).eq("id", editingId).select("*").single(); if (error) throw error; saved = data; }
      else { const { data, error } = await supabase.from("content_items").insert(payload).select("*").single(); if (error) throw error; saved = data; }
      const eventId = await syncCalendar(saved, oldEventId); await supabase.from("content_items").update({ calendar_event_id: eventId }).eq("id", saved.id);
      setShowForm(false); setEditingId(null); setForm(emptyForm); loadItems();
    } catch (e) { setError(e.message); }
  }

  async function remove(item) { if (!window.confirm(`Mover “${item.title}” para a Lixeira?`)) return; const now = new Date().toISOString(); const { error: e } = await supabase.from("content_items").update({ deleted_at: now, deleted_by: userId, updated_at: now }).eq("id", item.id); if (e) return setError(e.message); if (item.calendar_event_id) await supabase.from("calendar_events").update({ deleted_at: now, deleted_by: userId }).eq("id", item.calendar_event_id); setItems((current) => current.filter((entry) => entry.id !== item.id)); }

  return <div style={{ display: "grid", gap: 14 }}>
    <section style={panel}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}><div><h2 style={{ margin: 0, color: COLORS.ink, fontSize: 19, letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: 8 }}><Lightbulb size={19} color={COLORS.primaryDark} /> Conteúdo</h2><p style={{ margin: "5px 0 0", color: COLORS.inkSoft, fontSize: 12 }}>Da ideia à publicação, tudo em um só lugar.</p></div><button onClick={openNew} style={primaryButton}><Plus size={15} /> Novo conteúdo</button></div></section>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 9 }}><Stat label="Ideias" value={summary.ideas} /><Stat label="Em produção" value={summary.production} /><Stat label="Agendados" value={summary.scheduled} /><Stat label="Publicados" value={summary.published} /></div>

    <ContentPillarsSection
        currentUser={currentUser}
        onChange={loadPillars}
    />
    <ContentMetricsSection
        currentUser={currentUser}
        contentItems={items}
    />

    {showForm && <form onSubmit={save} style={{ ...panel, background: COLORS.bg }}><div style={{ display: "flex", justifyContent: "space-between" }}><h3 style={{ margin: 0, color: COLORS.ink, fontSize: 16 }}>{editingId ? "Editar conteúdo" : "Novo conteúdo"}</h3><button type="button" onClick={() => setShowForm(false)} style={iconButton}><X size={17} /></button></div>
      <div style={grid}><Field label="Título *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={input} /></Field>
      <Field label="Pilar editorial">
        <select
            value={form.pillar_id}
            onChange={(e) =>
            setForm({ ...form, pillar_id: e.target.value })
            }
            style={input}
        >
            <option value="">Sem pilar</option>

            {pillars.map((pillar) => (
            <option key={pillar.id} value={pillar.id}>
                {pillar.name}
            </option>
            ))}
        </select>
        </Field>
      <Field label="Formato"><select value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value })} style={input}>{Object.entries(TYPES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field><Field label="Plataforma"><select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} style={input}>{Object.entries(PLATFORMS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={input}>{Object.entries(STATUSES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field><Field label="Prioridade"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={input}>{Object.entries(PRIORITIES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field><Field label="Data programada"><input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} style={input} /></Field><Field label="Horário"><input type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} style={input} /></Field><Field label="Link publicado"><input value={form.content_url} onChange={(e) => setForm({ ...form, content_url: e.target.value })} style={input} /></Field></div>
      <Field label="Descrição"><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={input} /></Field><Field label="Roteiro"><textarea rows="4" value={form.script} onChange={(e) => setForm({ ...form, script: e.target.value })} style={input} /></Field><Field label="Legenda"><textarea rows="3" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} style={input} /></Field><div style={grid}><Field label="Chamada para ação"><input value={form.call_to_action} onChange={(e) => setForm({ ...form, call_to_action: e.target.value })} style={input} /></Field><Field label="Observações"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={input} /></Field></div><button type="submit" style={primaryButton}><Save size={16} /> Salvar</button>
    </form>}
    {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 11, borderRadius: 10 }}>{error}</div>}

    <section style={panel}><div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 13 }}>{[["todos","Todos"], ...Object.entries(STATUSES)].map(([v,l]) => <button key={v} onClick={() => setFilter(v)} style={{ ...filterButton, background: filter === v ? COLORS.primaryLight : COLORS.surface, color: filter === v ? COLORS.primaryDark : COLORS.inkSoft }}>{l}</button>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 1fr))", gap: 10 }}>{visible.length === 0 ? <div style={empty}>Nenhum conteúdo encontrado.</div> : visible.map((item) => <article key={item.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 11 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ color: COLORS.ink, fontSize: 13 }}>{item.title}</strong><span style={badge}>{STATUSES[item.status]}</span></div><div style={{ color: COLORS.inkSoft, fontSize: 10, marginTop: 5 }}>{PLATFORMS[item.platform]} • {TYPES[item.content_type]} • {PRIORITIES[item.priority]}</div>{item.description && <p style={{ color: COLORS.inkSoft, fontSize: 11, lineHeight: 1.45 }}>{item.description}</p>}{item.scheduled_date && <div style={{ color: COLORS.primaryDark, fontSize: 11, display: "flex", gap: 5, alignItems: "center" }}><CalendarDays size={13} /> {formatDate(item.scheduled_date)}{item.scheduled_time ? ` às ${item.scheduled_time.slice(0,5)}` : ""}</div>}<div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 9 }}><button onClick={() => edit(item)} style={iconButton}><Edit3 size={15} /></button><button onClick={() => remove(item)} style={{ ...iconButton, color: COLORS.danger }}><Trash2 size={15} /></button></div></article>)}</div>
    </section>
  </div>;
}

function Stat({ label, value }) { return <div style={panel}><div style={{ color: COLORS.primaryDark, fontWeight: 650, fontSize: 17 }}>{value}</div><div style={{ color: COLORS.inkSoft, fontSize: 10 }}>{label}</div></div>; }
function Field({ label, children }) { return <label style={{ display: "grid", gap: 5, color: COLORS.inkSoft, fontSize: 11, marginBottom: 9 }}>{label}{children}</label>; }
const panel = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: 14,
};
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 10, marginTop: 12 };
const input = { width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 10px", background: COLORS.surface, color: COLORS.ink, font: "inherit", resize: "vertical" };
const primaryButton = { display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 9, padding: "9px 12px", background: COLORS.primary, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const iconButton = { width: 32, height: 32, display: "grid", placeItems: "center", border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.surface, color: COLORS.primaryDark, cursor: "pointer" };
const filterButton = { border: `1px solid ${COLORS.border}`, borderRadius: 99, padding: "6px 9px", fontSize: 10, cursor: "pointer" };
const badge = { background: COLORS.primaryLight, color: COLORS.primaryDark, borderRadius: 99, padding: "4px 7px", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" };
const empty = { gridColumn: "1 / -1", border: `1px dashed ${COLORS.border}`, borderRadius: 10, padding: 18, textAlign: "center", color: COLORS.inkSoft, fontSize: 12 };
