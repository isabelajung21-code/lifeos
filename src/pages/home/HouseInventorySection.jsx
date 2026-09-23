import { useEffect, useState } from "react";
import { Minus, PackageOpen, Plus, Save, ShoppingCart, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const CATEGORIES = [
  ["mercado", "Mercado"], ["limpeza", "Limpeza"], ["higiene", "Higiene"],
  ["farmacia", "Farmácia"], ["pets", "Pets"], ["outros", "Outros"],
];

const UNITS = [
  ["un", "Unidade (un)"],
  ["pct", "Pacote (pct)"],
  ["cx", "Caixa (cx)"],
  ["fardo", "Fardo"],
  ["frasco", "Frasco"],
  ["rolo", "Rolo"],
  ["sache", "Sachê"],
  ["kg", "Quilograma (kg)"],
  ["g", "Grama (g)"],
  ["L", "Litro (L)"],
  ["mL", "Mililitro (mL)"],
];

const emptyForm = {
  item_name: "", category: "mercado", current_quantity: 0,
  minimum_quantity: 1, unit: "un", auto_add_to_shopping: true, notes: "",
};

const fieldStyle = { width: "100%", padding: "9px 10px", borderRadius: 9, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.ink, boxSizing: "border-box" };

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.id) throw new Error("Usuário não encontrado.");
  return result.data.id;
}

function shoppingListType(category) {
  if (category === "mercado") return "mercado";
  if (category === "farmacia") return "farmacia";
  if (["limpeza", "higiene"].includes(category)) return "casa";
  return "outros";
}

export default function HouseInventorySection({ currentUser }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    const { data, error: queryError } = await supabase.from("house_inventory_items").select("*").is("deleted_at", null).order("item_name");
    if (queryError) setError(queryError.message);
    else setItems(data || []);
    setLoading(false);
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setError("");
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      item_name: item.item_name || "", category: item.category || "mercado",
      current_quantity: Number(item.current_quantity || 0), minimum_quantity: Number(item.minimum_quantity || 0),
      unit: item.unit || "", auto_add_to_shopping: item.auto_add_to_shopping !== false, notes: item.notes || "",
    });
    setFormOpen(true);
    setError("");
  }

  async function saveItem(event) {
    event.preventDefault();
    if (!form.item_name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const userId = await findUserId(currentUser);
      const payload = {
        ...form,
        item_name: form.item_name.trim(),
        current_quantity: Number(form.current_quantity),
        minimum_quantity: Number(form.minimum_quantity),
        unit: form.unit.trim() || null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };
      let result;
      if (editingId) result = await supabase.from("house_inventory_items").update(payload).eq("id", editingId).select().single();
      else result = await supabase.from("house_inventory_items").insert({ ...payload, created_by_user_id: userId }).select().single();
      if (result.error) throw result.error;
      await syncShoppingItem(result.data, userId);
      setFormOpen(false);
      await loadItems();
    } catch (err) {
      setError(err.message || "Não foi possível salvar este produto.");
    } finally {
      setSaving(false);
    }
  }

  async function syncShoppingItem(item, userId) {
    const isLow = Number(item.current_quantity) <= Number(item.minimum_quantity);
    if (!item.auto_add_to_shopping || !isLow) {
      if (item.shopping_item_id) await supabase.from("house_inventory_items").update({ shopping_item_id: null }).eq("id", item.id);
      return;
    }
    if (item.shopping_item_id) return;

    const { data: existing } = await supabase.from("house_shopping_items").select("id").ilike("item_name", item.item_name).eq("is_purchased", false).is("deleted_at", null).limit(1).maybeSingle();
    let shoppingId = existing?.id;
    if (!shoppingId) {
      const missing = Math.max(Number(item.minimum_quantity) - Number(item.current_quantity), 1);
      const { data, error: insertError } = await supabase.from("house_shopping_items").insert({
        item_name: item.item_name,
        quantity: missing,
        unit: item.unit || null,
        list_type: shoppingListType(item.category),
        notes: "Adicionado automaticamente pela Despensa",
        created_by_user_id: userId,
      }).select().single();
      if (insertError) throw insertError;
      shoppingId = data.id;
    }
    await supabase.from("house_inventory_items").update({ shopping_item_id: shoppingId }).eq("id", item.id);
  }

  async function changeQuantity(item, amount) {
    const nextQuantity = Math.max(0, Number(item.current_quantity) + amount);
    const userId = await findUserId(currentUser);
    const { data, error: updateError } = await supabase.from("house_inventory_items").update({ current_quantity: nextQuantity, updated_at: new Date().toISOString() }).eq("id", item.id).select().single();
    if (updateError) { setError(updateError.message); return; }
    try {
      await syncShoppingItem(data, userId);
      await loadItems();
    } catch (err) { setError(err.message); }
  }

  async function removeItem(item) {
    const userId = await findUserId(currentUser);
    const now = new Date().toISOString();
    const { error: removeError } = await supabase.from("house_inventory_items").update({ deleted_at: now, deleted_by: userId, updated_at: now }).eq("id", item.id);
    if (removeError) setError(removeError.message);
    else setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
  }

  const filteredItems = items.filter((item) => filter === "todos" || item.category === filter);
  const lowCount = items.filter((item) => Number(item.current_quantity) <= Number(item.minimum_quantity)).length;

  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 14,
        marginTop: 0,
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><PackageOpen size={17} color={COLORS.primaryDark} /><h2 style={{ margin: 0, color: COLORS.ink, fontSize: 15,}}>Despensa e estoque</h2></div><div style={{ color: lowCount ? COLORS.warning : COLORS.inkSoft, fontSize: 11, marginTop: 3 }}>{lowCount ? `${lowCount} ${lowCount === 1 ? "produto precisa" : "produtos precisam"} de reposição` : "Estoque em dia"}</div></div>
        <button onClick={openNew} style={primaryButton}><Plus size={14} /> Novo produto</button>
      </div>

      {error && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 10, borderRadius: 9, marginTop: 12 }}>{error}</div>}

      {formOpen && <form onSubmit={saveItem} style={{ background: COLORS.bg, borderRadius: 12, padding: 14, marginTop: 15 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 9,
          }}
        >
          <div>
            <label style={labelStyle}>
              Produto
            </label>

            <input
              value={form.item_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  item_name: e.target.value,
                })
              }
              placeholder="Ex.: Arroz"
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Categoria
            </label>

            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
              style={fieldStyle}
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Quantidade em estoque
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.current_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  current_quantity: e.target.value,
                })
              }
              placeholder="Ex.: 2"
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Estoque mínimo
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.minimum_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  minimum_quantity: e.target.value,
                })
              }
              placeholder="Ex.: 1"
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Unidade
            </label>

            <select
              value={form.unit}
              onChange={(e) =>
                setForm({
                  ...form,
                  unit: e.target.value,
                })
              }
              style={fieldStyle}
            >
              {UNITS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações" style={{ ...fieldStyle, marginTop: 9 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 7, color: COLORS.ink, fontSize: 13, marginTop: 10 }}><input type="checkbox" checked={form.auto_add_to_shopping} onChange={(e) => setForm({ ...form, auto_add_to_shopping: e.target.checked })} /> Adicionar automaticamente à lista de compras quando atingir o mínimo</label>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button type="submit" disabled={saving} style={primaryButton}><Save size={16} /> {saving ? "Salvando..." : "Salvar"}</button><button type="button" onClick={() => setFormOpen(false)} style={secondaryButton}><X size={16} /> Cancelar</button></div>
      </form>}

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "15px 0 12px" }}>
        {[["todos", "Todos"], ...CATEGORIES].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} style={{ border: `1px solid ${filter === value ? COLORS.primary : COLORS.border}`, background: filter === value ? COLORS.primaryLight : COLORS.surface, color: filter === value ? COLORS.primaryDark : COLORS.inkSoft, borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: filter === value ? 700 : 500 }}>{label}</button>)}
      </div>

      {loading ? <div style={{ color: COLORS.inkSoft, padding: 20, textAlign: "center" }}>Carregando...</div> : filteredItems.length === 0 ? <div style={{ color: COLORS.inkSoft, padding: 22, textAlign: "center", border: `1px dashed ${COLORS.border}`, borderRadius: 11 }}>Nenhum produto cadastrado.</div> : <div style={{ display: "grid", gap: 9 }}>{filteredItems.map((item) => {
        const isLow = Number(item.current_quantity) <= Number(item.minimum_quantity);
        return <article key={item.id} onDoubleClick={() => openEdit(item)} style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap", border: `1px solid ${isLow ? COLORS.warning : COLORS.border}`, background: isLow ? COLORS.warningLight : COLORS.surface, borderRadius: 11, padding: 12 }}>
          <div style={{ flex: "1 1 190px", minWidth: 0 }}><div style={{ color: COLORS.ink, fontWeight: 700 }}>{item.item_name}</div><div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 3 }}>{CATEGORIES.find(([value]) => value === item.category)?.[1]} • mínimo {Number(item.minimum_quantity)} {item.unit || ""}</div>{isLow && item.auto_add_to_shopping && <div style={{ color: COLORS.warning, fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><ShoppingCart size={13} /> Lista de compras ativada</div>}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><button onClick={() => changeQuantity(item, -1)} style={quantityButton}><Minus size={16} /></button><strong style={{ minWidth: 55, textAlign: "center", color: isLow ? COLORS.warning : COLORS.ink }}>{Number(item.current_quantity)} {item.unit || ""}</strong><button onClick={() => changeQuantity(item, 1)} style={quantityButton}><Plus size={16} /></button></div>
          <button onClick={() => openEdit(item)} style={secondaryButton}>Editar</button>
          <button onClick={() => removeItem(item)} title="Mover para a Lixeira" style={{ ...quantityButton, color: COLORS.danger }}><Trash2 size={16} /></button>
        </article>;
      })}</div>}
    </section>
  );
}

const labelStyle = {
  display: "block",
  color: COLORS.inkSoft,
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 5,
};

const primaryButton = { border: 0, background: COLORS.primary, color: "white", padding: "7px 10px", fontSize: 12, borderRadius: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
const secondaryButton = { border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.ink, padding: "8px 10px", borderRadius: 9, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 };
const quantityButton = { border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.primaryDark, width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center" };
