import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function QuickNoteModal({
  open,
  onClose,
  currentUser,
  onSaved,
  noteToEdit = null,
}) {
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");

    if (noteToEdit) {
      setContent(noteToEdit.content || "");
      setPinned(noteToEdit.pinned || false);
    } else {
      setContent("");
      setPinned(false);
    }
  }, [open, noteToEdit]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Digite uma anotação.");
      return;
    }

    setSaving(true);
    setError("");

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("display_name", currentUser)
      .single();

    if (userError || !user) {
      console.error(userError);
      setError("Não foi possível identificar o usuário.");
      setSaving(false);
      return;
    }

    let note;
    let noteError;

    if (noteToEdit) {
      const result = await supabase
        .from("quick_notes")
        .update({
          content: content.trim(),
          pinned,
        })
        .eq("id", noteToEdit.id)
        .select()
        .single();

      note = result.data;
      noteError = result.error;
    } else {
      const result = await supabase
        .from("quick_notes")
        .insert({
          owner_user_id: user.id,
          content: content.trim(),
          pinned,
        })
        .select()
        .single();

      note = result.data;
      noteError = result.error;
    }

    if (noteError) {
      console.error(noteError);
      setError("Não foi possível salvar a anotação.");
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      module: "inicio",
      action: noteToEdit ? "editou" : "criou",
      entity_type: "quick_note",
      entity_id: note.id,
      entity_name: content.trim().slice(0, 80),
    });

    setSaving(false);

    if (onSaved) {
      await onSaved();
    }

    onClose();
  }

  const inputStyle = {
    width: "100%",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: 12,
    background: COLORS.surface,
    color: COLORS.ink,
    outline: "none",
  };
  
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(25, 38, 52, 0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: COLORS.surface,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 20px 60px rgba(30, 50, 70, 0.16)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                color: COLORS.ink,
              }}
            >
              {noteToEdit ? "Editar anotação" : "Nova anotação"}
            </h2>

            <div
              style={{
                color: COLORS.inkSoft,
                fontSize: 12,
                marginTop: 3,
              }}
            >
              Salve uma informação rápida para consultar depois.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              color: COLORS.inkSoft,
              padding: 5,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva sua anotação..."
            rows={6}
            style={{
              width: "100%",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: 12,
              background: COLORS.surface,
              color: COLORS.ink,
              resize: "vertical",
              outline: "none",
            }}
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 14,
              fontSize: 13,
              color: COLORS.ink,
            }}
          >
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />

            Fixar anotação
          </label>

          {error && (
            <div
              style={{
                marginTop: 15,
                padding: 11,
                borderRadius: 9,
                background: COLORS.dangerLight,
                color: COLORS.danger,
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 9,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                color: COLORS.ink,
                borderRadius: 9,
                padding: "10px 16px",
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                border: 0,
                background: COLORS.primaryDark,
                color: "#FFFFFF",
                borderRadius: 9,
                padding: "10px 18px",
                fontWeight: 700,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Salvando..." : noteToEdit ? "Salvar Alterações" : "Salvar anotação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}