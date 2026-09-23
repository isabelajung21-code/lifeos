import { useEffect, useState } from "react";
import { GraduationCap, RotateCcw, Trash2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const GROUPS = [
  { table: "study_courses", label: "Curso", title: (item) => item.title },
  { table: "study_items", label: "Planejamento", title: (item) => item.title },
  { table: "study_sessions", label: "Sessão", title: (item) => `Sessão de ${item.duration_minutes} minutos` },
  { table: "study_materials", label: "Material", title: (item) => item.title },
];

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  return result.data?.id;
}

export default function StudiesTrashSection({ currentUser }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { loadItems(); }, [currentUser]);

  async function loadItems() {
    try {
      setError("");
      const userId = await findUserId(currentUser);
      if (!userId) return setItems([]);

      const results = await Promise.all(
        GROUPS.map(async (group) => {
          const { data, error: queryError } = await supabase
            .from(group.table)
            .select("*")
            .eq("owner_user_id", userId)
            .not("deleted_at", "is", null)
            .order("deleted_at", { ascending: false });
          if (queryError) throw queryError;
          return (data || []).map((item) => ({
            ...item,
            trash_table: group.table,
            trash_type: group.label,
            trash_title: group.title(item),
          }));
        }),
      );

      setItems(results.flat().sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function restore(item) {
    const { error: restoreError } = await supabase
      .from(item.trash_table)
      .update({ deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (restoreError) setError(restoreError.message);
    else setItems((current) => current.filter((entry) => !(entry.id === item.id && entry.trash_table === item.trash_table)));
  }

  async function remove(item) {
    if (!window.confirm(`Excluir “${item.trash_title}” definitivamente?`)) return;
    const { error: removeError } = await supabase.from(item.trash_table).delete().eq("id", item.id);
    if (removeError) setError(removeError.message);
    else setItems((current) => current.filter((entry) => !(entry.id === item.id && entry.trash_table === item.trash_table)));
  }

  if (items.length === 0 && !error) return null;

  return (
    <section style={{ marginTop: 22 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.ink, fontSize: 18, marginBottom: 12 }}>
        <GraduationCap size={19} color={COLORS.primaryDark} /> Estudos
      </h2>

      {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 11, borderRadius: 10, marginBottom: 10 }}>{error}</div>}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div key={`${item.trash_table}-${item.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
            <div>
              <div style={{ color: COLORS.ink, fontWeight: 650 }}>{item.trash_title}</div>
              <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 5 }}>{item.trash_type}</div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={() => restore(item)} title="Restaurar" style={buttonStyle}><RotateCcw size={17} /></button>
              <button onClick={() => remove(item)} title="Excluir definitivamente" style={{ ...buttonStyle, color: COLORS.danger }}><Trash2 size={17} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const buttonStyle = { border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.primaryDark, width: 35, height: 35, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer" };
