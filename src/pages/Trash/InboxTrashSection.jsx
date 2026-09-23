import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function getUserId(currentUser) {
  const { data, error } = await supabase.from("users").select("id").eq("display_name", currentUser).single();
  if (error) throw error;
  return data.id;
}

export default function InboxTrashSection({ currentUser }) {
  const [items, setItems] = useState([]);

  useEffect(() => { loadItems(); }, [currentUser]);

  async function loadItems() {
    try {
      const userId = await getUserId(currentUser);
      const { data } = await supabase.from("inbox_items").select("*").or(`owner_user_id.eq.${userId},visibility.eq.shared`).not("deleted_at", "is", null).order("deleted_at", { ascending: false });
      setItems(data || []);
    } catch {
      setItems([]);
    }
  }

  async function restore(id) {
    await supabase.from("inbox_items").update({ deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() }).eq("id", id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function remove(id) {
    if (!window.confirm("Excluir este item definitivamente?")) return;
    await supabase.from("inbox_items").delete().eq("id", id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  if (items.length === 0) return null;

  return (
    <section style={{ marginTop: 22 }}>
      <h2 style={{ color: COLORS.ink, fontSize: 18, marginBottom: 12 }}>Caixa de Entrada</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
            <div>
              <div style={{ color: COLORS.ink, fontWeight: 650 }}>{item.content}</div>
              <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 5 }}>Item da Caixa de Entrada</div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={() => restore(item.id)} title="Restaurar" style={buttonStyle}><RotateCcw size={17} /></button>
              <button onClick={() => remove(item.id)} title="Excluir definitivamente" style={{ ...buttonStyle, color: COLORS.danger }}><Trash2 size={17} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const buttonStyle = { border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.primaryDark, width: 35, height: 35, borderRadius: 9, display: "grid", placeItems: "center" };