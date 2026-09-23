import { useState } from "react";
import { CheckCircle2, Inbox, Loader2, Plus } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) {
    result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  }
  if (result.error) throw result.error;
  if (!result.data?.id) throw new Error("Usuário não encontrado.");
  return result.data.id;
}

export default function HomeInboxCapture({ currentUser }) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const cleanContent = content.trim();
    if (!cleanContent) return;

    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const userId = await findUserId(currentUser);
      const { error: insertError } = await supabase.from("inbox_items").insert({
        owner_user_id: userId,
        content: cleanContent,
        visibility,
      });
      if (insertError) throw insertError;
      setContent("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Não foi possível salvar na Caixa de Entrada.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, marginTop: 18, boxShadow: "0 7px 22px rgba(55, 106, 159, 0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <Inbox size={19} color={COLORS.primaryDark} />
        <h2 style={{ margin: 0, color: COLORS.ink, fontSize: 16 }}>Descarregar</h2>
      </div>
      <p style={{ margin: "0 0 12px", color: COLORS.inkSoft, fontSize: 12 }}>Registre agora. Você decide onde organizar depois.</p>

      <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="O que está passando pela sua cabeça?"
          style={{ flex: "1 1 300px", minWidth: 0, padding: "11px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.ink, outline: "none" }}
        />
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)} style={{ padding: "10px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.ink }}>
          <option value="private">Só {currentUser}</option>
          <option value="shared">Compartilhado</option>
        </select>
        <button type="submit" disabled={saving || !content.trim()} style={{ border: 0, background: COLORS.primary, color: "white", padding: "10px 14px", borderRadius: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: saving || !content.trim() ? .55 : 1 }}>
          {saving ? <Loader2 size={17} /> : <Plus size={17} />} Descarregar
        </button>
      </form>

      {saved && <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.success, fontSize: 12, marginTop: 10 }}><CheckCircle2 size={15} /> Salvo na Caixa de Entrada.</div>}
      {error && <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 10 }}>{error}</div>}
    </section>
  );
}
