import { useEffect, useState } from "react";
import { AlertTriangle, FileText, Plus, Save, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const CATEGORIES = [
  ["pessoal", "Pessoal"], ["casa", "Casa"], ["veiculo", "Veículos"],
  ["pets", "Pets"], ["trabalho", "Trabalho"], ["estudos", "Estudos"], ["outros", "Outros"],
];
const emptyForm = { title: "", category: "pessoal", document_type: "", document_number: "", issued_at: "", expires_at: "", reminder_days: 30, visibility: "private", notes: "" };
const fieldStyle = { width: "100%", padding: "9px 10px", borderRadius: 9, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.ink, boxSizing: "border-box" };

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.id) throw new Error("Usuário não encontrado.");
  return result.data.id;
}

function expiryStatus(document) {
  if (!document.expires_at) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${document.expires_at}T12:00:00`);
  const days = Math.ceil((expiry - today) / 86400000);
  if (days < 0) return { label: `Vencido há ${Math.abs(days)} dias`, color: COLORS.danger, background: COLORS.dangerLight };
  if (days <= Number(document.reminder_days || 0)) return { label: days === 0 ? "Vence hoje" : `Vence em ${days} dias`, color: COLORS.warning, background: COLORS.warningLight };
  return { label: `Válido até ${expiry.toLocaleDateString("pt-BR")}`, color: COLORS.success, background: COLORS.successLight };
}

export default function DocumentsPage({ currentUser }) {
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadDocuments(); }, [currentUser]);

  async function loadDocuments() {
    setLoading(true); setError("");
    try {
      const userId = await findUserId(currentUser);
      const { data, error: queryError } = await supabase.from("documents").select("*").is("deleted_at", null).or(`owner_user_id.eq.${userId},visibility.eq.shared`).order("expires_at", { ascending: true, nullsFirst: false });
      if (queryError) throw queryError;
      setDocuments(data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function openNew() { setEditingId(null); setForm(emptyForm); setFormOpen(true); }
  function openEdit(document) { setEditingId(document.id); setForm({ ...emptyForm, ...document, issued_at: document.issued_at || "", expires_at: document.expires_at || "" }); setFormOpen(true); }

  async function saveDocument(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    try {
      const userId = await findUserId(currentUser);
      const payload = { title: form.title.trim(), category: form.category, document_type: form.document_type.trim() || null, document_number: form.document_number.trim() || null, issued_at: form.issued_at || null, expires_at: form.expires_at || null, reminder_days: Number(form.reminder_days), visibility: form.visibility, notes: form.notes.trim() || null, updated_at: new Date().toISOString() };
      const result = editingId ? await supabase.from("documents").update(payload).eq("id", editingId) : await supabase.from("documents").insert({ ...payload, owner_user_id: userId });
      if (result.error) throw result.error;
      setFormOpen(false); await loadDocuments();
    } catch (err) { setError(err.message); }
  }

  async function removeDocument(document) {
    if (!window.confirm(`Mover “${document.title}” para a Lixeira?`)) return;
    const userId = await findUserId(currentUser); const now = new Date().toISOString();
    const { error: removeError } = await supabase.from("documents").update({ deleted_at: now, deleted_by: userId, updated_at: now }).eq("id", document.id);
    if (removeError) setError(removeError.message); else setDocuments((current) => current.filter((item) => item.id !== document.id));
  }

  const visible = documents.filter((document) => filter === "todos" || document.category === filter);

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div><div style={{ display: "flex", alignItems: "center", gap: 9 }}><FileText size={20} color={COLORS.primaryDark} /><h1 style={{ margin: 0, color: COLORS.ink, fontSize: 20, letterSpacing: "-0.3px" }}>Documentos</h1></div><p style={{ color: COLORS.inkSoft, margin: "4px 0 0", fontSize: 12 }}>Informações importantes e alertas de validade.</p></div>
        <button onClick={openNew} style={primaryButton}><Plus size={15} /> Novo documento</button>
      </div>
      {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 11, borderRadius: 10, marginBottom: 12 }}>{error}</div>}

      {formOpen && <form onSubmit={saveDocument} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <Field label="Nome"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: CNH" style={fieldStyle} /></Field>
          <Field label="Categoria"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={fieldStyle}>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Tipo"><input value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })} placeholder="Identidade, contrato..." style={fieldStyle} /></Field>
          <Field label="Número"><input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} style={fieldStyle} /></Field>
          <Field label="Emissão"><input type="date" value={form.issued_at} onChange={(e) => setForm({ ...form, issued_at: e.target.value })} style={fieldStyle} /></Field>
          <Field label="Validade"><input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} style={fieldStyle} /></Field>
          <Field label="Avisar com antecedência"><select value={form.reminder_days} onChange={(e) => setForm({ ...form, reminder_days: e.target.value })} style={fieldStyle}><option value="7">7 dias</option><option value="15">15 dias</option><option value="30">30 dias</option><option value="60">60 dias</option><option value="90">90 dias</option></select></Field>
          <Field label="Visibilidade"><select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} style={fieldStyle}><option value="private">Só {currentUser}</option><option value="shared">Compartilhado</option></select></Field>
        </div>
        <Field label="Observações"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...fieldStyle, resize: "vertical" }} /></Field>
        <div style={{ display: "flex", gap: 8, marginTop: 11 }}><button type="submit" style={primaryButton}><Save size={16} /> Salvar</button><button type="button" onClick={() => setFormOpen(false)} style={secondaryButton}><X size={16} /> Cancelar</button></div>
      </form>}

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 13 }}>{[["todos", "Todos"], ...CATEGORIES].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} style={{ border: `1px solid ${filter === value ? COLORS.primary : COLORS.border}`, background: filter === value ? COLORS.primaryLight : COLORS.surface, color: filter === value ? COLORS.primaryDark : COLORS.inkSoft, borderRadius: 999, padding: "5px 9px", fontSize: 11 }}>{label}</button>)}</div>

      {loading ? <div style={{ color: COLORS.inkSoft, textAlign: "center", padding: 30 }}>Carregando...</div> : visible.length === 0 ? <div style={{ color: COLORS.inkSoft, textAlign: "center", padding: 20, border: `1px dashed ${COLORS.border}`, borderRadius: 12, fontSize: 12 }}>Nenhum documento cadastrado.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 10 }}>{visible.map((document) => {
        const status = expiryStatus(document);
        return <article key={document.id} onDoubleClick={() => openEdit(document)} style={{ background: COLORS.surface, border: `1px solid ${status?.color || COLORS.border}`, borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 9 }}><div><strong style={{ color: COLORS.ink, fontSize: 13 }}>{document.title}</strong><div style={{ color: COLORS.inkSoft, fontSize: 11, marginTop: 4 }}>{CATEGORIES.find(([value]) => value === document.category)?.[1]}{document.visibility === "shared" ? " • Compartilhado" : ""}</div></div><button onClick={() => removeDocument(document)} style={deleteButton}><Trash2 size={16} /></button></div>
          {document.document_number && <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 10 }}>Nº {document.document_number}</div>}
          {status && <div style={{ display: "flex", alignItems: "center", gap: 5, background: status.background, color: status.color, borderRadius: 8, padding: "6px 7px", fontSize: 11, fontWeight: 700, marginTop: 10 }}><AlertTriangle size={14} /> {status.label}</div>}
          <button onClick={() => openEdit(document)} style={{ ...secondaryButton, marginTop: 11 }}>Editar</button>
        </article>;
      })}</div>}
    </section>
  );
}

function Field({ label, children }) { return <label style={{ display: "block", marginTop: 9 }}><span style={{ display: "block", color: COLORS.inkSoft, fontSize: 12, fontWeight: 600, marginBottom: 5 }}>{label}</span>{children}</label>; }
const primaryButton = { border: 0, background: COLORS.primary, color: "white", padding: "9px 12px", borderRadius: 9, fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
const secondaryButton = { border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.ink, padding: "8px 10px", borderRadius: 9, fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 5 };
const deleteButton = { border: 0, background: "transparent", color: COLORS.danger, padding: 4 };
