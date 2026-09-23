import { useEffect, useState } from "react";
import { Check, ListChecks, Plus, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const CATEGORIES = [
  ["geral", "Geral"], ["quero_comprar", "Quero comprar"],
  ["lugares", "Lugares"], ["presentes", "Presentes"],
  ["viagens", "Viagens"], ["ideias", "Ideias"],
  ["casa", "Casa"], ["outros", "Outros"],
];

const fieldStyle = { width: "100%", padding: "9px 10px", borderRadius: 9, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.ink, boxSizing: "border-box" };

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.id) throw new Error("Usuário não encontrado.");
  return result.data.id;
}

export default function ListsPage({ currentUser }) {
  const [lists, setLists] = useState([]);
  const [items, setItems] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("geral");
  const [visibility, setVisibility] = useState("private");
  const [newItems, setNewItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, [currentUser]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const userId = await findUserId(currentUser);
      const { data: listsData, error: listsError } = await supabase.from("lists").select("*").is("deleted_at", null).is("archived_at", null).or(`owner_user_id.eq.${userId},visibility.eq.shared`).order("created_at", { ascending: false });
      if (listsError) throw listsError;
      const listIds = (listsData || []).map((list) => list.id);
      let itemsData = [];
      if (listIds.length) {
        const result = await supabase.from("list_items").select("*").in("list_id", listIds).is("deleted_at", null).order("position").order("created_at");
        if (result.error) throw result.error;
        itemsData = result.data || [];
      }
      setLists(listsData || []);
      setItems(itemsData);
    } catch (err) {
      setError(err.message || "Não foi possível carregar as listas.");
    } finally {
      setLoading(false);
    }
  }

  async function createList(event) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const userId = await findUserId(currentUser);
      const { error: insertError } = await supabase.from("lists").insert({ owner_user_id: userId, title: title.trim(), description: description.trim() || null, category, visibility });
      if (insertError) throw insertError;
      setTitle(""); setDescription(""); setCategory("geral"); setVisibility("private"); setFormOpen(false);
      await loadData();
    } catch (err) { setError(err.message); }
  }

  async function addItem(listId) {
    const content = (newItems[listId] || "").trim();
    if (!content) return;
    try {
      const userId = await findUserId(currentUser);
      const position = items.filter((item) => item.list_id === listId).length;
      const { data, error: insertError } = await supabase.from("list_items").insert({ list_id: listId, content, position, created_by_user_id: userId }).select().single();
      if (insertError) throw insertError;
      setItems((current) => [...current, data]);
      setNewItems((current) => ({ ...current, [listId]: "" }));
    } catch (err) { setError(err.message); }
  }

  async function toggleItem(item) {
    const userId = await findUserId(currentUser);
    const completed = !item.is_completed;
    const changes = { is_completed: completed, completed_at: completed ? new Date().toISOString() : null, completed_by_user_id: completed ? userId : null, updated_at: new Date().toISOString() };
    const { error: updateError } = await supabase.from("list_items").update(changes).eq("id", item.id);
    if (updateError) { setError(updateError.message); return; }
    setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, ...changes } : currentItem));
  }

  async function removeItem(item) {
    const userId = await findUserId(currentUser);
    const now = new Date().toISOString();
    const { error: removeError } = await supabase.from("list_items").update({ deleted_at: now, deleted_by: userId, updated_at: now }).eq("id", item.id);
    if (removeError) { setError(removeError.message); return; }
    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
  }

  async function removeList(list) {
    if (!window.confirm(`Mover a lista “${list.title}” para a Lixeira?`)) return;
    const userId = await findUserId(currentUser);
    const now = new Date().toISOString();
    const { error: removeError } = await supabase.from("lists").update({ deleted_at: now, deleted_by: userId, updated_at: now }).eq("id", list.id);
    if (removeError) { setError(removeError.message); return; }
    setLists((current) => current.filter((currentList) => currentList.id !== list.id));
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div><div style={{ display: "flex", alignItems: "center", gap: 9 }}><ListChecks size={20} color={COLORS.primaryDark} /><h1 style={{ margin: 0, color: COLORS.ink, fontSize: 20, letterSpacing: "-0.3px" }}>Listas</h1></div><p style={{ color: COLORS.inkSoft, margin: "4px 0 0", fontSize: 12}}>Ideias e desejos que não precisam virar projetos.</p></div>
        <button onClick={() => setFormOpen(true)} style={primaryButton}><Plus size={15} /> Nova lista</button>
      </div>

      {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 11, borderRadius: 10, marginBottom: 12 }}>{error}</div>}

      {formOpen && <form onSubmit={createList} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 9 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome da lista" style={fieldStyle} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={fieldStyle}>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={fieldStyle}><option value="private">Só {currentUser}</option><option value="shared">Compartilhada</option></select>
        </div>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição opcional" style={{ ...fieldStyle, marginTop: 9 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}><button type="submit" style={primaryButton}>Criar lista</button><button type="button" onClick={() => setFormOpen(false)} style={secondaryButton}><X size={16} /> Cancelar</button></div>
      </form>}

      {loading ? <div style={{ color: COLORS.inkSoft, textAlign: "center", padding: 30 }}>Carregando...</div> : lists.length === 0 ? <div style={{ color: COLORS.inkSoft, textAlign: "center", padding: 20, border: `1px dashed ${COLORS.border}`, borderRadius: 12, fontSize: 12 }}>Nenhuma lista criada.</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 10 }}>
          {lists.map((list) => {
            const listItems = items.filter((item) => item.list_id === list.id);
            const completed = listItems.filter((item) => item.is_completed).length;
            return <article key={list.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><h2 style={{ margin: 0, color: COLORS.ink, fontSize: 15 }}>{list.title}</h2><div style={{ color: COLORS.inkSoft, fontSize: 11, marginTop: 4 }}>{CATEGORIES.find(([value]) => value === list.category)?.[1]} • {completed}/{listItems.length}{list.visibility === "shared" ? " • Compartilhada" : ""}</div></div><button onClick={() => removeList(list)} title="Mover lista para a Lixeira" style={deleteButton}><Trash2 size={16} /></button></div>
              {list.description && <p style={{ color: COLORS.inkSoft, fontSize: 12 }}>{list.description}</p>}
              <div style={{ display: "grid", gap: 7, marginTop: 12 }}>{listItems.map((item) => <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}><button onClick={() => toggleItem(item)} style={{ width: 24, height: 24, flex: "0 0 auto", borderRadius: 999, border: `1px solid ${item.is_completed ? COLORS.success : COLORS.border}`, background: item.is_completed ? COLORS.success : COLORS.surface, color: "white", display: "grid", placeItems: "center" }}>{item.is_completed && <Check size={13} />}</button><span style={{ flex: 1, color: COLORS.ink, fontSize: 12, textDecoration: item.is_completed ? "line-through" : "none", opacity: item.is_completed ? .65 : 1 }}>{item.content}</span><button onClick={() => removeItem(item)} style={deleteButton}><X size={15} /></button></div>)}</div>
              <div style={{ display: "flex", gap: 7, marginTop: 13 }}><input value={newItems[list.id] || ""} onChange={(e) => setNewItems((current) => ({ ...current, [list.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(list.id); } }} placeholder="Adicionar item..." style={{ ...fieldStyle, flex: 1 }} /><button onClick={() => addItem(list.id)} style={smallButton}><Plus size={15} /></button></div>
            </article>;
          })}
        </div>
      )}
    </section>
  );
}

const primaryButton = { border: 0, background: COLORS.primary, color: "white", padding: "9px 12px", borderRadius: 9, fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
const secondaryButton = { border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.ink, padding: "8px 10px", borderRadius: 9, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 };
const smallButton = { border: 0, background: COLORS.primaryLight, color: COLORS.primaryDark, width: 34, borderRadius: 9, display: "grid", placeItems: "center" };
const deleteButton = { border: 0, background: "transparent", color: COLORS.danger, padding: 4 };