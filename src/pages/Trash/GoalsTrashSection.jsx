import { useEffect, useState } from "react";
import { Flag, RotateCcw, Trash2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  return result.data?.id;
}

export default function GoalsTrashSection({ currentUser }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { loadItems(); }, [currentUser]);

  async function loadItems() {
    setError("");
    try {
      const userId = await findUserId(currentUser);
      if (!userId) return;
      const { data, error: queryError } = await supabase.from("goals").select("*").not("deleted_at", "is", null).or(`owner_user_id.eq.${userId},visibility.eq.shared`).order("deleted_at", { ascending: false });
      if (queryError) throw queryError;
      setItems(data || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar as metas excluídas.");
    }
  }

  async function restore(id) {
    const { error: restoreError } = await supabase.from("goals").update({ deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() }).eq("id", id);
    if (restoreError) { setError(restoreError.message); return; }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function remove(id) {
    if (!window.confirm("Excluir esta meta definitivamente? O projeto vinculado não será excluído.")) return;
    const { error: removeError } = await supabase.from("goals").delete().eq("id", id);
    if (removeError) { setError(removeError.message); return; }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  if (items.length === 0 && !error) return null;

  return (
    <section style={{ marginTop: 22 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.ink, fontSize: 18, marginBottom: 12 }}>
        <Flag size={19} color={COLORS.primaryDark} /> Metas pessoais
      </h2>
      {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 11, borderRadius: 10, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
            <div>
              <div style={{ color: COLORS.ink, fontWeight: 650 }}>{item.title}</div>
              <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 5 }}>Progresso: {item.progress}%{item.visibility === "shared" ? " • Compartilhada" : ""}</div>
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