import { useEffect, useState } from "react";
import { BookHeart, CalendarDays, Save, Trash2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const MOODS = [
  ["otimo", "🤩 Ótimo"],
  ["bem", "😊 Bem"],
  ["neutro", "😐 Neutro"],
  ["cansado", "😴 Cansado"],
  ["dificil", "😔 Difícil"],
];

function localDate(date = new Date()) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

const emptyForm = {
  entry_date: localDate(),
  mood: "",
  best_moment: "",
  mind_notes: "",
  gratitude: "",
  content: "",
};

const fieldStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 9,
  fontSize: 12,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.ink,
  boxSizing: "border-box",
  fontFamily: "inherit",
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

export default function JournalPage({ currentUser }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadEntries();
  }, [currentUser]);

  async function loadEntries(selectedDate = form.entry_date) {
    setLoading(true);
    setError("");

    try {
      const userId = await findUserId(currentUser);
      const { data, error: queryError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("owner_user_id", userId)
        .is("deleted_at", null)
        .order("entry_date", { ascending: false });

      if (queryError) throw queryError;

      const loaded = data || [];
      setEntries(loaded);
      loadDateIntoForm(selectedDate, loaded);
    } catch (err) {
      setError(err.message || "Não foi possível carregar o Diário.");
    } finally {
      setLoading(false);
    }
  }

  function loadDateIntoForm(date, source = entries) {
    const existing = source.find((entry) => entry.entry_date === date);

    if (existing) {
      setEditingId(existing.id);
      setForm({
        entry_date: existing.entry_date,
        mood: existing.mood || "",
        best_moment: existing.best_moment || "",
        mind_notes: existing.mind_notes || "",
        gratitude: existing.gratitude || "",
        content: existing.content || "",
      });
    } else {
      setEditingId(null);
      setForm({ ...emptyForm, entry_date: date });
    }

    setMessage("");
    setError("");
  }

  async function saveEntry(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const userId = await findUserId(currentUser);
      const payload = {
        owner_user_id: userId,
        entry_date: form.entry_date,
        mood: form.mood || null,
        best_moment: form.best_moment.trim() || null,
        mind_notes: form.mind_notes.trim() || null,
        gratitude: form.gratitude.trim() || null,
        content: form.content.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const result = editingId
        ? await supabase
            .from("journal_entries")
            .update(payload)
            .eq("id", editingId)
            .select()
            .single()
        : await supabase
            .from("journal_entries")
            .insert(payload)
            .select()
            .single();

      if (result.error) throw result.error;

      setEditingId(result.data.id);
      setMessage(editingId ? "Registro atualizado." : "Dia registrado no Diário.");
      await loadEntries(form.entry_date);
    } catch (err) {
      setError(err.message || "Não foi possível salvar este registro.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(entry) {
    
    const userId = await findUserId(currentUser);
    const now = new Date().toISOString();
    const { error: removeError } = await supabase
      .from("journal_entries")
      .update({ deleted_at: now, deleted_by: userId, updated_at: now })
      .eq("id", entry.id);

    if (removeError) {
      setError(removeError.message);
      return;
    }

    const remaining = entries.filter((item) => item.id !== entry.id);
    setEntries(remaining);

    if (entry.id === editingId) {
      setEditingId(null);
      setForm({ ...emptyForm, entry_date: localDate() });
    }
  }

  function formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <section>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <BookHeart size={20} color={COLORS.primaryDark} />
          <h1 style={{ margin: 0, color: COLORS.ink, fontSize: 20, letterSpacing: "-0.3px" }}>Diário</h1>
        </div>
        <p
          style={{
            color: COLORS.inkSoft,
            margin: "4px 0 0",
            fontSize: 12,
          }}
        >
          Um espaço privado para registrar seus dias.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
          gap: 14,
          alignItems: "start",
        }}
      >
        <form onSubmit={saveEntry} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <CalendarDays size={18} color={COLORS.primaryDark} />
            <strong style={{ color: COLORS.ink }}>
              {editingId ? "Editar registro" : "Registrar o dia"}
            </strong>
          </div>

          <Field label="Data">
            <input
              type="date"
              value={form.entry_date}
              max={localDate()}
              onChange={(event) => loadDateIntoForm(event.target.value)}
              style={fieldStyle}
            />
          </Field>

          <Field label="Como foi seu dia?">
            <select
              value={form.mood}
              onChange={(event) => setForm({ ...form, mood: event.target.value })}
              style={fieldStyle}
            >
              <option value="">Selecione</option>
              {MOODS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <TextField label="⭐ Melhor coisa do dia" value={form.best_moment} onChange={(value) => setForm({ ...form, best_moment: value })} />
          <TextField label="🧠 O que ficou na sua cabeça?" value={form.mind_notes} onChange={(value) => setForm({ ...form, mind_notes: value })} />
          <TextField label="🙏 Algo pelo qual é grata" value={form.gratitude} onChange={(value) => setForm({ ...form, gratitude: value })} />
          <TextField label="📝 Registro livre" value={form.content} onChange={(value) => setForm({ ...form, content: value })} rows={4} />

          {error && <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 10 }}>{error}</div>}
          {message && <div style={{ color: COLORS.success, fontSize: 12, marginTop: 10 }}>{message}</div>}

          <button type="submit" disabled={saving} style={{ ...primaryButton, width: "100%", marginTop: 13 }}>
            <Save size={15} /> {saving ? "Salvando..." : editingId ? "Atualizar registro" : "Salvar no Diário"}
          </button>
        </form>

        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 13px", color: COLORS.ink, fontSize: 15 }}>Histórico</h2>
          {loading ? (
            <div style={{ color: COLORS.inkSoft }}>Carregando...</div>
          ) : entries.length === 0 ? (
            <div style={{ color: COLORS.inkSoft, textAlign: "center", padding: 18, fontSize: 12 }}>
              Nenhum dia registrado ainda.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 9 }}>
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  onClick={() => loadDateIntoForm(entry.entry_date)}
                  style={{
                    border: `1px solid ${entry.id === editingId ? COLORS.primary : COLORS.border}`,
                    background: entry.id === editingId ? COLORS.primaryLight : COLORS.surface,
                    borderRadius: 9,
                    padding: 10,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <strong style={{ color: COLORS.ink, fontSize: 13 }}>
                        {MOODS.find(([value]) => value === entry.mood)?.[1] || "📖 Registro"}
                      </strong>
                      <div style={{ color: COLORS.inkSoft, fontSize: 11, marginTop: 3 }}>
                        {formatDate(entry.entry_date)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeEntry(entry);
                      }}
                      title="Mover para a Lixeira"
                      style={deleteButton}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {(entry.best_moment || entry.content) && (
                    <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 9, lineHeight: 1.45 }}>
                      {(entry.best_moment || entry.content).slice(0, 120)}
                      {(entry.best_moment || entry.content).length > 120 ? "..." : ""}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginTop: 10 }}>
      <span style={{ display: "block", color: COLORS.inkSoft, fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function TextField({ label, value, onChange, rows = 2 }) {
  return (
    <Field label={label}>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...fieldStyle, resize: "vertical" }}
      />
    </Field>
  );
}

const cardStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: 14,
};

const primaryButton = {
  border: 0,
  background: COLORS.primary,
  color: "white",
  padding: "8px 11px",
  borderRadius: 9,
  fontWeight: 600,
  fontSize: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

const deleteButton = {
  border: 0,
  background: "transparent",
  color: COLORS.danger,
  padding: 4,
};
