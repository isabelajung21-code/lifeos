import { useEffect, useState } from "react";
import { Layers3, Plus, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(name) { let r = await supabase.from("users").select("id").eq("display_name", name).maybeSingle(); if (!r.data && !r.error) r = await supabase.from("users").select("id").eq("name", name).maybeSingle(); if (r.error) throw r.error; return r.data?.id; }

export default function ContentPillarsSection({ currentUser, onChange, }) {
  const [userId, setUserId] = useState(null);
  const [pillars, setPillars] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#5B8FC9" });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, [currentUser]);
  async function load() { try { const id = await findUserId(currentUser); setUserId(id || null); if (!id) return; const { data, error: e } = await supabase.from("content_pillars").select("*").eq("owner_user_id", id).is("deleted_at", null).order("name"); if (e) throw e; setPillars(data || []); } catch (e) { setError(e.message); } }

  async function save(event) { event.preventDefault(); if (!form.name.trim()) return setError("Informe o nome do pilar."); const { error: e } = await supabase.from("content_pillars").insert({ owner_user_id: userId, name: form.name.trim(), description: form.description.trim() || null, color: form.color }); if (e) return setError(e.message); setForm({ name: "", description: "", color: "#5B8FC9" }); setShowForm(false); load(); onChange?.(); }
  async function remove(item) { if (!window.confirm(`Mover o pilar “${item.name}” para a Lixeira?`)) return; const { error: e } = await supabase.from("content_pillars").update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_at: new Date().toISOString() }).eq("id", item.id); if (e) setError(e.message); else setPillars((current) => current.filter((p) => p.id !== item.id)); onChange?.(); }

  return <section style={panel}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}><div><h3 style={{ margin: 0, color: COLORS.ink, fontSize: 17, display: "flex", gap: 7, alignItems: "center" }}><Layers3 size={19} color={COLORS.primaryDark} /> Pilares editoriais</h3><div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 4 }}>Temas principais que orientam sua produção.</div></div><button onClick={() => setShowForm(true)} style={primaryButton}><Plus size={16} /> Novo pilar</button></div>
    {showForm && <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 8, alignItems: "end", background: COLORS.bg, borderRadius: 11, padding: 12, marginTop: 12 }}><Field label="Nome"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={input} /></Field><Field label="Descrição"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={input} /></Field><Field label="Cor"><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ ...input, height: 38, padding: 4 }} /></Field><div style={{ display: "flex", gap: 5 }}><button type="submit" style={primaryButton}>Salvar</button><button type="button" onClick={() => setShowForm(false)} style={iconButton}><X size={16} /></button></div></form>}
    {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 9, borderRadius: 9, marginTop: 10 }}>{error}</div>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 13 }}>{pillars.length === 0 ? <div style={empty}>Nenhum pilar cadastrado.</div> : pillars.map((item) => <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${item.color}`, borderRadius: 10, padding: "9px 10px" }}><div><strong style={{ color: COLORS.ink, fontSize: 12 }}>{item.name}</strong>{item.description && <div style={{ color: COLORS.inkSoft, fontSize: 10, marginTop: 2 }}>{item.description}</div>}</div><button onClick={() => remove(item)} style={{ ...iconButton, color: COLORS.danger }}><Trash2 size={14} /></button></div>)}</div>
  </section>;
}

function Field({ label, children }) { return <label style={{ display: "grid", gap: 4, color: COLORS.inkSoft, fontSize: 10 }}>{label}{children}</label>; }
const panel = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 17 };
const input = { width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 9px", background: COLORS.surface, color: COLORS.ink };
const primaryButton = { display: "inline-flex", alignItems: "center", gap: 5, border: 0, borderRadius: 8, padding: "8px 11px", background: COLORS.primary, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const iconButton = { width: 32, height: 32, display: "grid", placeItems: "center", border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.surface, cursor: "pointer" };
const empty = { width: "100%", border: `1px dashed ${COLORS.border}`, borderRadius: 9, padding: 17, textAlign: "center", color: COLORS.inkSoft, fontSize: 11 };
