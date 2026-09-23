import { useEffect, useState } from "react";
import { PackageOpen, RotateCcw, Trash2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

export default function InventoryTrashSection() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setError("");
    const { data, error: queryError } = await supabase
      .from("house_inventory_items")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (queryError) setError(queryError.message);
    else setItems(data || []);
  }

  async function restore(id) {
    const { error: restoreError } = await supabase
      .from("house_inventory_items")
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
    if (!window.confirm("Excluir este produto definitivamente da Despensa?")) return;

    const { error: removeError } = await supabase
      .from("house_inventory_items")
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
        <PackageOpen size={19} color={COLORS.primaryDark} />
        Despensa e estoque
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
                {item.item_name}
              </div>
              <div
                style={{
                  color: COLORS.inkSoft,
                  fontSize: 12,
                  marginTop: 5,
                }}
              >
                Estoque: {Number(item.current_quantity)} {item.unit || ""}
                {" • "}
                Mínimo: {Number(item.minimum_quantity)} {item.unit || ""}
              </div>
            </div>

            <div style={{ display: "flex", gap: 7 }}>
              <button
                onClick={() => restore(item.id)}
                title="Restaurar"
                style={buttonStyle}
              >
                <RotateCcw size={17} />
              </button>

              <button
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
};