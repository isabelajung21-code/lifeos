import { useEffect, useMemo, useState } from "react";
import { BarChart3, Plus, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const emptyForm = { content_item_id: "", reference_date: today(), reach: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, followers_gained: 0 };
async function findUserId(name) { let r = await supabase.from("users").select("id").eq("display_name", name).maybeSingle(); if (!r.data && !r.error) r = await supabase.from("users").select("id").eq("name", name).maybeSingle(); if (r.error) throw r.error; return r.data?.id; }

export default function ContentMetricsSection({ currentUser, contentItems }) {
  const [userId, setUserId] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, [currentUser]);
  async function load() { try { const id = await findUserId(currentUser); setUserId(id || null); if (!id) return; const { data, error: e } = await supabase.from("content_metrics").select("*").eq("owner_user_id", id).is("deleted_at", null).order("reference_date", { ascending: false }); if (e) throw e; setMetrics(data || []); } catch (e) { setError(e.message); } }

  const totals = useMemo(() => metrics.reduce((sum, row) => ({ reach: sum.reach + row.reach, views: sum.views + row.views, engagement: sum.engagement + row.likes + row.comments + row.shares + row.saves, followers: sum.followers + row.followers_gained }), { reach: 0, views: 0, engagement: 0, followers: 0 }), [metrics]);
  const published = contentItems.filter((item) => item.status === "publicado");
  const contentName = (id) => contentItems.find((item) => item.id === id)?.title || "Publicação";

  async function save(event) { event.preventDefault(); if (!form.content_item_id) return setError("Escolha uma publicação."); const payload = { ...form, owner_user_id: userId }; Object.keys(payload).forEach((key) => { if (["reach","views","likes","comments","shares","saves","clicks","followers_gained"].includes(key)) payload[key] = Number(payload[key] || 0); }); const { error: e } = await supabase.from("content_metrics").insert(payload); if (e) return setError(e.message); setForm(emptyForm); setShowForm(false); load(); }
  async function remove(item) { if (!window.confirm("Excluir este registro de métricas?")) return; const { error: e } = await supabase.from("content_metrics").update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq("id", item.id); if (e) setError(e.message); else setMetrics((current) => current.filter((row) => row.id !== item.id)); }

  return <section style={panel}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}><div><h3 style={{ margin: 0, color: COLORS.ink, fontSize: 17, display: "flex", alignItems: "center", gap: 7 }}><BarChart3 size={19} color={COLORS.primaryDark} /> Desempenho</h3><div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 4 }}>Acompanhe os resultados das publicações.</div></div><button onClick={() => setShowForm(true)} style={primaryButton}><Plus size={16} /> Registrar métricas</button></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 12 }}><Stat label="Alcance" value={totals.reach} /><Stat label="Visualizações" value={totals.views} /><Stat label="Interações" value={totals.engagement} /><Stat label="Novos seguidores" value={totals.followers} /></div>
    {showForm && <form onSubmit={save} style={{ background: COLORS.bg, borderRadius: 11, padding: 12, marginTop: 12 }}><div style={grid}><Field label="Publicação"><select value={form.content_item_id} onChange={(e) => setForm({ ...form, content_item_id: e.target.value })} style={input}><option value="">Selecione</option>{published.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field><Field label="Data"><input type="date" value={form.reference_date} onChange={(e) => setForm({ ...form, reference_date: e.target.value })} style={input} /></Field>{["reach","views","likes","comments","shares","saves","clicks","followers_gained"].map((key) => <Field key={key} label={{reach:"Alcance",views:"Visualizações",likes:"Curtidas",comments:"Comentários",shares:"Compartilhamentos",saves:"Salvamentos",clicks:"Cliques",followers_gained:"Novos seguidores"}[key]}><input type="number" min={key === "followers_gained" ? undefined : "0"} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={input} /></Field>)}</div><div style={{ display: "flex", gap: 7 }}><button type="submit" style={primaryButton}>Salvar</button><button type="button" onClick={() => setShowForm(false)} style={iconButton}><X size={16} /></button></div></form>}
    {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 9, borderRadius: 9, marginTop: 10 }}>{error}</div>}
    <div style={{ display: "grid", gap: 7, marginTop: 12 }}>{metrics.slice(0, 8).map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: 10 }}><div><strong style={{ color: COLORS.ink, fontSize: 12 }}>{contentName(item.content_item_id)}</strong><div style={{ color: COLORS.inkSoft, fontSize: 10, marginTop: 3 }}>{new Date(`${item.reference_date}T12:00:00`).toLocaleDateString("pt-BR")} • {item.reach} alcance • {item.views} visualizações</div></div><button onClick={() => remove(item)} style={{ ...iconButton, color: COLORS.danger }}><Trash2 size={14} /></button></div>)}</div>
  </section>;
}

function Stat({ label, value }) { return <div style={{ background: COLORS.bg, borderRadius: 9, padding: 10 }}><strong style={{ color: COLORS.primaryDark, fontSize: 17 }}>{value.toLocaleString("pt-BR")}</strong><div style={{ color: COLORS.inkSoft, fontSize: 9 }}>{label}</div></div>; }
function Field({ label, children }) { return <label style={{ display: "grid", gap: 4, color: COLORS.inkSoft, fontSize: 10 }}>{label}{children}</label>; }
const panel = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 17 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 8, marginBottom: 10 };
const input = { width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 9px", background: COLORS.surface, color: COLORS.ink };
const primaryButton = { display: "inline-flex", alignItems: "center", gap: 5, border: 0, borderRadius: 8, padding: "8px 11px", background: COLORS.primary, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const iconButton = { width: 32, height: 32, display: "grid", placeItems: "center", border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.surface, cursor: "pointer" };
