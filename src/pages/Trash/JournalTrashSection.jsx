import { useEffect, useState } from "react";
import { BookHeart, RotateCcw, Trash2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(currentUser) {
  let result = await supabase
    .from("users")
    .select("id")
    .eq("display_name", currentUser)
    .maybeSingle();

  if (!result.data && !result.error) {
    result = await supabase
      .from("users")
      .select("id")
      .eq("name", currentUser)
      .maybeSingle();
  }

  if (result.error) throw result.error;
  return result.data?.id;
}

function formatDate(value) {
  if (!value) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

export default function JournalTrashSection({ currentUser }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadItems();
  }, [currentUser]);

  async function loadItems() {
    try {
      setError("");
      const userId = await findUserId(currentUser);

      if (!userId) {
        setItems([]);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("owner_user_id", userId)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (queryError) throw queryError;
      setItems(data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function restore(id) {
    const { error: restoreError } = await supabase
      .from("journal_entries")
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (restoreError) {
      setError(restoreError.message);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function remove(id) {
    if (!window.confirm("Excluir este registro do diário definitivamente?")) return;

    const { error: removeError } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id);

    if (removeError) {
      setError(removeError.message);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
  }

  if (items.length === 0 && !error) return null;

  return (
    <section style={{ marginTop: 22 }}>
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: COLORS.ink,
          fontSize: 18,
          marginBottom: 12,
        }}
      >
        <BookHeart size={19} color={COLORS.primaryDark} />
        Diário
      </h2>

      {error && (
        <div
          style={{
            background: COLORS.dangerLight,
            color: COLORS.danger,
            padding: 11,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div>
              <div style={{ color: COLORS.ink, fontWeight: 650 }}>
                Registro de {formatDate(item.entry_date)}
              </div>
              <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 5 }}>
                {item.mood ? `Humor: ${item.mood}` : "Sem humor informado"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 7 }}>
              <button
                type="button"
                onClick={() => restore(item.id)}
                title="Restaurar"
                style={buttonStyle}
              >
                <RotateCcw size={17} />
              </button>
              <button
                type="button"
                onClick={() => remove(item.id)}
                title="Excluir definitivamente"
                style={{ ...buttonStyle, color: COLORS.danger }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const buttonStyle = {
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.primaryDark,
  width: 35,
  height: 35,
  borderRadius: 9,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};
