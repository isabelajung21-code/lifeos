import { useEffect, useState } from "react";
import { ListChecks, RotateCcw, Trash2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  return result.data?.id;
}

export default function ListsTrashSection({ currentUser }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { loadItems(); }, [currentUser]);

  async function loadItems() {
    setError("");
    try {
      const userId = await findUserId(currentUser);
      if (!userId) return;
      const { data: visibleLists, error: visibleError } = await supabase.from("lists").select("id, title, owner_user_id, visibility").or(`owner_user_id.eq.${userId},visibility.eq.shared`);
      if (visibleError) throw visibleError;
      const listIds = (visibleLists || []).map((list) => list.id);
      const { data: listsData, error: listsError } = await supabase.from("lists").select("*").not("deleted_at", "is", null).or(`owner_user_id.eq.${userId},visibility.eq.shared`).order("deleted_at", { ascending: false });
      if (listsError) throw listsError;

      let deletedItems = [];
      if (listIds.length) {
        const result = await supabase.from("list_items").select("*").in("list_id", listIds).not("deleted_at", "is", null).order("deleted_at", { ascending: false });
        if (result.error) throw result.error;
        deletedItems = result.data || [];
      }

      const listMap = new Map((visibleLists || []).map((list) => [list.id, list.title]));
      setItems([
        ...(listsData || []).map((list) => ({ ...list, trashType: "list", displayTitle: list.title, detail: "Lista completa" })),
        ...deletedItems.map((item) => ({ ...item, trashType: "item", displayTitle: item.content, detail: `Item de: ${listMap.get(item.list_id) || "Lista"}` })),
      ].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)));
    } catch (err) {
      setError(err.message || "Não foi possível carregar as listas excluídas.");
    }
  }

  async function restore(item) {
    const table = item.trashType === "list" ? "lists" : "list_items";
    const { error: restoreError } = await supabase.from(table).update({ deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() }).eq("id", item.id);
    if (restoreError) { setError(restoreError.message); return; }
    setItems((current) => current.filter((currentItem) => !(currentItem.id === item.id && currentItem.trashType === item.trashType)));
  }

  async function remove(item) {
    const label = item.trashType === "list" ? "esta lista e todos os seus itens" : "este item";
    if (!window.confirm(`Excluir ${label} definitivamente?`)) return;
    const table = item.trashType === "list" ? "lists" : "list_items";
    const { error: removeError } = await supabase.from(table).delete().eq("id", item.id);
    if (removeError) { setError(removeError.message); return; }
    setItems((current) => current.filter((currentItem) => !(currentItem.id === item.id && currentItem.trashType === item.trashType)));
  }

  if (items.length === 0 && !error) return null;

  return (
    <section style={{ marginTop: 22 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.ink, fontSize: 18, marginBottom: 12 }}><ListChecks size={19} color={COLORS.primaryDark} /> Listas</h2>
      {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 11, borderRadius: 10, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => <div key={`${item.trashType}-${item.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
          <div><div style={{ color: COLORS.ink, fontWeight: 650 }}>{item.displayTitle}</div><div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 5 }}>{item.detail}</div></div>
          <div style={{ display: "flex", gap: 7 }}><button onClick={() => restore(item)} title="Restaurar" style={buttonStyle}><RotateCcw size={17} /></button><button onClick={() => remove(item)} title="Excluir definitivamente" style={{ ...buttonStyle, color: COLORS.danger }}><Trash2 size={17} /></button></div>
        </div>)}
      </div>
    </section>
  );
}

const buttonStyle = { border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.primaryDark, width: 35, height: 35, borderRadius: 9, display: "grid", placeItems: "center" };
