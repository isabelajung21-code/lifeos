import { useEffect, useState } from "react";
import { PackageOpen, ShoppingCart } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

export default function HomeInventoryAlert({ compact = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLowStock(); }, []);

  async function loadLowStock() {
    setLoading(true);
    const { data, error } = await supabase
      .from("house_inventory_items")
      .select("*")
      .is("deleted_at", null)
      .order("item_name");

    if (!error) {
      setItems(
        (data || []).filter(
          (item) =>
            Number(item.current_quantity) <=
            Number(item.minimum_quantity)
        )
      );
    }
    setLoading(false);
  }

  if (!loading && items.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.warningLight,
        border: `1px solid ${COLORS.warning}`,
        borderRadius: compact ? 9 : 14,
        padding: compact ? 10 : 16,
        marginTop: compact ? 0 : 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: loading ? 0 : compact ? 8 : 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PackageOpen size={compact ? 15 : 19} color={COLORS.warning} />
          <h2
            style={{
              margin: 0,
              color: COLORS.ink,
              fontSize: compact ? 12 : 16,
            }}
          >
            Reposição da casa
          </h2>
        </div>

        {!loading && (
          <span
            style={{
              background: COLORS.surface,
              color: COLORS.warning,
              borderRadius: 999,
              padding: "4px 8px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ color: COLORS.inkSoft, fontSize: 12 }}>
          Verificando o estoque...
        </div>
      ) : (
        <div style={{ display: "grid", gap: 7 }}>
          {items.slice(0, compact ? 2 : 5).map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                background: COLORS.surface,
                borderRadius: 8,
                padding: compact ? "7px 8px" : "9px 10px",
              }}
            >
              <div>
                <div style={{ color: COLORS.ink, fontWeight: 650, fontSize: compact ? 11 : 13 }}>
                  {item.item_name}
                </div>
                <div style={{ color: COLORS.inkSoft, fontSize: compact ? 9 : 11, marginTop: 2 }}>
                  Estoque: {Number(item.current_quantity)} {item.unit || ""}
                  {" • "}
                  Mínimo: {Number(item.minimum_quantity)} {item.unit || ""}
                </div>
              </div>

              {item.shopping_item_id && (
                <span
                  title="Já está na lista de compras"
                  style={{ color: COLORS.success, display: "flex" }}
                >
                  <ShoppingCart size={17} />
                </span>
              )}
            </div>
          ))}

          {items.length > (compact ? 2 : 5) && (
            <div style={{ color: COLORS.inkSoft, fontSize: 11, textAlign: "center" }}>
              + {items.length - (compact ? 2 : 5)} itens na Despensa
            </div>
          )}
        </div>
      )}
    </section>
  );
}
