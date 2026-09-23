import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Inbox,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const MODULES = [
  ["geral", "Geral"],
  ["trabalho", "Trabalho"],
  ["projetos", "Projetos"],
  ["financeiro", "Financeiro"],
  ["casa", "Casa"],
  ["pets", "Pets"],
  ["conteudo", "Conteúdo"],
  ["estudos", "Estudos"],
  ["entretenimento", "Entretenimento"],
];

const fieldStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 9,
  fontSize: 12,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.ink,
  outline: "none",
  boxSizing: "border-box",
};

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
  if (!result.data?.id) throw new Error("Usuário não encontrado.");
  return result.data.id;
}

export default function InboxPage({ currentUser }) {
  const [items, setItems] = useState([]);
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadItems();
  }, [currentUser]);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const userId = await findUserId(currentUser);
      const { data, error: queryError } = await supabase
        .from("inbox_items")
        .select("*")
        .is("deleted_at", null)
        .or(`owner_user_id.eq.${userId},visibility.eq.shared`)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      setItems(data || []);
    } catch (err) {
      setError(
        err.message?.includes("inbox_items")
          ? "Execute primeiro a migração SQL da Fase 1 no Supabase."
          : err.message || "Não foi possível carregar a Caixa de Entrada."
      );
    } finally {
      setLoading(false);
    }
  }

  async function addItem(event) {
    event.preventDefault();
    const cleanContent = content.trim();
    if (!cleanContent) return;

    setSaving(true);
    setError("");
    try {
      const userId = await findUserId(currentUser);
      const { data, error: insertError } = await supabase
        .from("inbox_items")
        .insert({
          owner_user_id: userId,
          content: cleanContent,
          due_date: dueDate || null,
          visibility,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setItems((current) => [data, ...current]);
      setContent("");
      setDueDate("");
    } catch (err) {
      setError(err.message || "Não foi possível salvar este item.");
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id, changes) {
    setError("");
    const previous = items;
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );

    const { error: updateError } = await supabase
      .from("inbox_items")
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      setItems(previous);
      setError(updateError.message || "Não foi possível atualizar este item.");
    }
  }

  async function organizeItem(item) {
    const userId = await findUserId(currentUser);
    await updateItem(item.id, {
      status: "organized",
      organized_at: new Date().toISOString(),
      organized_by_user_id: userId,
    });
  }

  async function moveToTrash(id) {
    const userId = await findUserId(currentUser);
    const deletedAt = new Date().toISOString();
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    const { error: deleteError } = await supabase
      .from("inbox_items")
      .update({ deleted_at: deletedAt, deleted_by: userId, updated_at: deletedAt })
      .eq("id", id);

    if (deleteError) {
      setItems(previous);
      setError(deleteError.message || "Não foi possível mover o item para a Lixeira.");
    }
  }

  const visibleItems = useMemo(
    () => items.filter((item) => item.status === filter),
    [items, filter]
  );

  const pendingCount = items.filter((item) => item.status === "pending").length;
  const organizedCount = items.filter((item) => item.status === "organized").length;

  return (
    <section>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Inbox size={20} color={COLORS.primaryDark} />
          <h1 style={{ margin: 0, color: COLORS.ink, fontSize: 20, letterSpacing: "-0.3px" }}>Caixa de Entrada</h1>
        </div>
        <p style={{ margin: "4px 0 0", color: COLORS.inkSoft, fontSize: 12 }}>
          Tire da cabeça agora. O destino pode ser decidido depois.
        </p>
      </div>

      <form
        onSubmit={addItem}
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
          boxShadow: "0 8px 24px rgba(55, 106, 159, 0.06)",
        }}
      >
        <label style={{ display: "block", color: COLORS.ink, fontWeight: 700, marginBottom: 8 }}>
          O que está passando pela sua cabeça?
        </label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Ex.: comprar ração, terminar a proposta da Bruna, marcar veterinário..."
          rows={3}
          style={{ ...fieldStyle, resize: "vertical", fontFamily: "inherit" }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 10,
            marginTop: 10,
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: 12, color: COLORS.inkSoft, marginBottom: 5 }}>
              Data, se já souber
            </label>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: COLORS.inkSoft, marginBottom: 5 }}>
              Visibilidade
            </label>
            <select value={visibility} onChange={(event) => setVisibility(event.target.value)} style={fieldStyle}>
              <option value="private">Só {currentUser}</option>
              <option value="shared">Compartilhado</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !content.trim()}
            style={{
              alignSelf: "end",
              minHeight: 36,
              border: 0,
              borderRadius: 9,
              background: COLORS.primary,
              color: "white",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 12,
              opacity: saving || !content.trim() ? 0.55 : 1,
            }}
          >
            {saving ? <Loader2 size={15} /> : <Plus size={15} />}
            Descarregar
          </button>
        </div>
      </form>

      {error && (
        <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: 12, borderRadius: 10, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <FilterButton active={filter === "pending"} onClick={() => setFilter("pending")}>
          A organizar ({pendingCount})
        </FilterButton>
        <FilterButton active={filter === "organized"} onClick={() => setFilter("organized")}>
          Organizados ({organizedCount})
        </FilterButton>
      </div>

      {loading ? (
        <div style={{ color: COLORS.inkSoft, padding: 32, textAlign: "center" }}>Carregando...</div>
      ) : visibleItems.length === 0 ? (
        <div style={{ background: COLORS.surface, border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: 22, fontSize: 12, textAlign: "center", color: COLORS.inkSoft }}>
          {filter === "pending" ? "Tudo organizado por aqui ✨" : "Nenhum item organizado ainda."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {visibleItems.map((item) => (
            <article
              key={item.id}
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, fontSize: 12 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: COLORS.ink, fontWeight: 650, whiteSpace: "pre-wrap" }}>{item.content}</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, color: COLORS.inkSoft, fontSize: 12 }}>
                    {item.due_date && <span><CalendarDays size={13} style={{ verticalAlign: -2, marginRight: 4 }} />{new Date(`${item.due_date}T12:00:00`).toLocaleDateString("pt-BR")}</span>}
                    <span>{item.visibility === "shared" ? "Compartilhado" : "Privado"}</span>
                  </div>
                </div>
                <button onClick={() => moveToTrash(item.id)} title="Mover para a Lixeira" style={iconButtonStyle}>
                  <Trash2 size={17} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
                <select
                  value={item.target_module || "geral"}
                  onChange={(event) => updateItem(item.id, { target_module: event.target.value })}
                  disabled={item.status === "organized"}
                  style={{ ...fieldStyle, width: "auto", minWidth: 145, padding: "8px 10px" }}
                >
                  {MODULES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                {item.status === "pending" ? (
                  <button onClick={() => organizeItem(item)} style={actionButtonStyle}>
                    <CheckCircle2 size={16} /> Marcar como organizado
                  </button>
                ) : (
                  <button onClick={() => updateItem(item.id, { status: "pending", organized_at: null, organized_by_user_id: null })} style={actionButtonStyle}>
                    <RotateCcw size={16} /> Voltar para organizar
                  </button>
                )}
                {item.status === "organized" && <span style={{ display: "flex", alignItems: "center", gap: 5, color: COLORS.success, fontSize: 13 }}><Archive size={15} /> Organizado em {MODULES.find(([value]) => value === (item.target_module || "geral"))?.[1]}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
        background: active ? COLORS.primaryLight : COLORS.surface,
        color: active ? COLORS.primaryDark : COLORS.inkSoft,
        padding: "6px 9px",
        fontSize: 11,
        borderRadius: 999,
        fontWeight: active ? 700 : 500,
      }}
    >
      {children}
    </button>
  );
}

const iconButtonStyle = {
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.danger,
  width: 30,
  height: 30,
  borderRadius: 9,
  display: "grid",
  placeItems: "center",
};

const actionButtonStyle = {
  border: 0,
  background: COLORS.primaryLight,
  color: COLORS.primaryDark,
  padding: "7px 9px",
  borderRadius: 9,
  fontSize: 11,
  fontWeight: 650,
  display: "flex",
  alignItems: "center",
  gap: 6,
};
