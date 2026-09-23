import { useEffect, useState } from "react";
import { BookMarked, ExternalLink, Plus, Star, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const TYPES = { link: "Link", livro: "Livro", artigo: "Artigo", video: "Vídeo", arquivo: "Arquivo", outro: "Outro" };
const emptyForm = { course_id: "", title: "", material_type: "link", url: "", description: "", is_favorite: false };

async function findUserId(name) {
  let result = await supabase.from("users").select("id").eq("display_name", name).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", name).maybeSingle();
  if (result.error) throw result.error;
  return result.data?.id;
}

function safeUrl(value) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export default function StudyMaterialsSection({ currentUser, courses }) {
  const [userId, setUserId] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadMaterials(); }, [currentUser]);

  async function loadMaterials() {
    try {
      const id = await findUserId(currentUser); setUserId(id || null);
      if (!id) return setMaterials([]);
      const { data, error: queryError } = await supabase.from("study_materials").select("*").eq("owner_user_id", id).is("deleted_at", null).order("is_favorite", { ascending: false }).order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setMaterials(data || []);
    } catch (err) { setError(err.message); }
  }

  async function save(event) {
    event.preventDefault(); setError("");
    if (!form.title.trim()) return setError("Informe o título do material.");
    const { error: insertError } = await supabase.from("study_materials").insert({ owner_user_id: userId, course_id: form.course_id || null, title: form.title.trim(), material_type: form.material_type, url: form.url.trim() || null, description: form.description.trim() || null, is_favorite: form.is_favorite });
    if (insertError) return setError(insertError.message);
    setForm(emptyForm); setShowForm(false); loadMaterials();
  }

  async function toggleFavorite(material) {
    const { error: updateError } = await supabase.from("study_materials").update({ is_favorite: !material.is_favorite, updated_at: new Date().toISOString() }).eq("id", material.id);
    if (updateError) setError(updateError.message); else loadMaterials();
  }

  async function remove(material) {
    if (!window.confirm(`Mover “${material.title}” para a Lixeira?`)) return;
    const { error: removeError } = await supabase.from("study_materials").update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_at: new Date().toISOString() }).eq("id", material.id);
    if (removeError) setError(removeError.message); else setMaterials((current) => current.filter((item) => item.id !== material.id));
  }

  const courseName = (id) => courses.find((course) => course.id === id)?.title || "Geral";

  return <section style={panel}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
      <div><h3 style={{ margin: 0, color: COLORS.ink, fontSize: 17, display: "flex", alignItems: "center", gap: 7 }}><BookMarked size={19} color={COLORS.primaryDark} /> Materiais de estudo</h3><div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 4 }}>Guarde suas principais referências em um só lugar.</div></div>
      <button onClick={() => { setForm({ ...emptyForm, course_id: courses[0]?.id || "" }); setShowForm(true); }} style={primaryButton}><Plus size={17} /> Novo material</button>
    </div>

    {showForm && <form onSubmit={save} style={{ background: COLORS.bg, borderRadius: 12, padding: 14, marginTop: 13 }}>
      <div style={grid}>
        <Field label="Curso"><select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} style={input}><option value="">Geral</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></Field>
        <Field label="Título *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={input} /></Field>
        <Field label="Tipo"><select value={form.material_type} onChange={(e) => setForm({ ...form, material_type: e.target.value })} style={input}>{Object.entries(TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Link ou endereço"><input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." style={input} /></Field>
      </div>
      <Field label="Descrição"><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...input, resize: "vertical" }} /></Field>
      <label style={{ display: "flex", gap: 7, alignItems: "center", color: COLORS.ink, fontSize: 12, marginTop: 10 }}><input type="checkbox" checked={form.is_favorite} onChange={(e) => setForm({ ...form, is_favorite: e.target.checked })} /> Marcar como favorito</label>
      <div style={{ display: "flex", gap: 8, marginTop: 11 }}><button type="submit" style={primaryButton}>Salvar</button><button type="button" onClick={() => setShowForm(false)} style={secondaryButton}><X size={16} /> Cancelar</button></div>
    </form>}

    {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 10, borderRadius: 9, marginTop: 11 }}>{error}</div>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 10, marginTop: 14 }}>
      {materials.length === 0 ? <div style={empty}>Nenhum material cadastrado.</div> : materials.map((material) => <article key={material.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 11, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 9 }}><div><strong style={{ color: COLORS.ink, fontSize: 13 }}>{material.title}</strong><div style={{ color: COLORS.inkSoft, fontSize: 10, marginTop: 4 }}>{TYPES[material.material_type]} • {courseName(material.course_id)}</div></div><button onClick={() => toggleFavorite(material)} style={{ ...iconButton, color: material.is_favorite ? COLORS.warning : COLORS.inkSoft }} title="Favoritar"><Star size={16} fill={material.is_favorite ? "currentColor" : "none"} /></button></div>
        {material.description && <p style={{ color: COLORS.inkSoft, fontSize: 11, lineHeight: 1.45 }}>{material.description}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>{material.url ? <a href={safeUrl(material.url)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", gap: 5, alignItems: "center", color: COLORS.primaryDark, fontSize: 11, textDecoration: "none" }}><ExternalLink size={13} /> Abrir</a> : <span />}<button onClick={() => remove(material)} style={{ ...iconButton, color: COLORS.danger }} title="Mover para a Lixeira"><Trash2 size={15} /></button></div>
      </article>)}
    </div>
  </section>;
}

function Field({ label, children }) { return <label style={{ display: "grid", gap: 5, color: COLORS.inkSoft, fontSize: 11 }}>{label}{children}</label>; }
const panel = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 15, padding: 18 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 10, marginBottom: 10 };
const input = { width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 10px", background: COLORS.surface, color: COLORS.ink, font: "inherit" };
const primaryButton = { display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 9, padding: "9px 12px", background: COLORS.primary, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const secondaryButton = { ...primaryButton, background: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.border}` };
const iconButton = { width: 31, height: 31, display: "grid", placeItems: "center", border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.surface, cursor: "pointer" };
const empty = { gridColumn: "1 / -1", border: `1px dashed ${COLORS.border}`, borderRadius: 10, padding: 18, textAlign: "center", color: COLORS.inkSoft, fontSize: 12 };
