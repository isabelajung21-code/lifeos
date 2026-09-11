import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";

const COLORS = {
  ink: "#1F2937",
  inkSoft: "#6B7280",
  primary: "#4F8EF7",
  border: "#DDE6F2",
  surface: "#FFFFFF",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
  background: "#fff",
  color: COLORS.ink,
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: COLORS.ink,
  marginBottom: 6,
};

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function ShoppingItemModal({
  open,
  onClose,
  onSaved,
  user,
  item = null,
}) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("un");
  const [listType, setListType] = useState("mercado");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setItemName(item.item_name || "");
      setQuantity(Number(item.quantity || 1));
      setUnit(item.unit || "un");
      setListType(item.list_type || "mercado");
      setNotes(item.notes || "");
    } else {
      setItemName("");
      setQuantity(1);
      setUnit("un");
      setListType("mercado");
      setNotes("");
    }
  }, [open, item]);

  if (!open) return null;

  async function handleSave() {
    if (!itemName.trim()) {
      alert("Informe o nome do item.");
      return;
    }

    if (Number(quantity) <= 0) {
      alert("A quantidade deve ser maior que zero.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        item_name: itemName.trim(),
        quantity: Number(quantity),
        unit: unit.trim() || null,
        list_type: listType,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let savedItem = null;

      if (item?.id) {
        const { data, error } = await supabase
          .from("house_shopping_items")
          .update(payload)
          .eq("id", item.id)
          .select()
          .single();

        if (error) throw error;

        savedItem = data;
      } else {
        const { data, error } = await supabase
          .from("house_shopping_items")
          .insert({
            ...payload,
            created_by_user_id: user?.id || null,
          })
          .select()
          .single();

        if (error) throw error;

        savedItem = data;
      }

      await supabase.from("activity_logs").insert({
        user_id: user?.id || null,
        module: "Casa",
        action: item?.id ? "updated" : "created",
        entity_type: "house_shopping_item",
        entity_id: savedItem?.id || null,
        entity_name: savedItem?.item_name || itemName.trim(),
        details: {
          message: item?.id
            ? `Editou o item da lista de compras: ${itemName.trim()}`
            : `Adicionou à lista de compras: ${itemName.trim()}`,
        },
      });

      onSaved?.(savedItem);
      onClose?.();
    } catch (error) {
      console.error("Erro ao salvar item da lista:", error);
      alert("Não foi possível salvar o item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 18,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 18px 50px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: COLORS.ink,
              }}
            >
              {item ? "Editar item" : "Novo item"}
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 12,
                color: COLORS.inkSoft,
              }}
            >
              Adicione um item à lista compartilhada da casa.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: COLORS.inkSoft,
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Field label="Item">
            <input
              style={inputStyle}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Ex.: Arroz"
            />
          </Field>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Field label="Quantidade">
              <input
                type="number"
                min="0.01"
                step="0.01"
                style={inputStyle}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>

            <Field label="Unidade">
              <select
                style={inputStyle}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="un">un</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="cx">cx</option>
                <option value="pct">pct</option>
              </select>
            </Field>
          </div>

          <Field label="Lista">
            <select
              style={inputStyle}
              value={listType}
              onChange={(e) => setListType(e.target.value)}
            >
              <option value="mercado">Mercado</option>
              <option value="farmacia">Farmácia</option>
              <option value="casa">Casa</option>
              <option value="outros">Outros</option>
            </select>
          </Field>

          <Field label="Observações">
            <textarea
              style={{
                ...inputStyle,
                minHeight: 74,
                resize: "vertical",
              }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Marca, tamanho, preferência..."
            />
          </Field>
        </div>

        <div
          style={{
            borderTop: `1px solid ${COLORS.border}`,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: "#fff",
              color: COLORS.ink,
              borderRadius: 10,
              padding: "9px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              border: 0,
              background: COLORS.primary,
              color: "#fff",
              borderRadius: 10,
              padding: "9px 18px",
              fontWeight: 800,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Salvando..." : "Salvar item"}
          </button>
        </div>
      </div>
    </div>
  );
}