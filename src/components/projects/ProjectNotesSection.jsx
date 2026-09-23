import { useEffect, useState } from "react";
import {
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

export default function ProjectNotesSection({
  project,
  userId,
}) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    if (!project?.id) return;
    loadNotes();
  }, [project?.id]);

  async function loadNotes() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("project_notes")
        .select("*")
        .eq("project_id", project.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setNotes(data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar notas do projeto:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingNote(null);

    setForm({
      title: "",
      content: "",
    });

    setFormOpen(true);
  }

  function openEdit(note) {
    setEditingNote(note);

    setForm({
      title: note.title || "",
      content: note.content || "",
    });

    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingNote(null);

    setForm({
      title: "",
      content: "",
    });
  }

  async function save(e) {
    e.preventDefault();

    if (!form.content.trim()) {
      alert("Escreva o conteúdo da nota.");
      return;
    }

    try {
      let savedNote;

      const payload = {
        title: form.title.trim() || null,
        content: form.content.trim(),
        updated_at: new Date().toISOString(),
      };

      if (editingNote) {
        const { data, error } = await supabase
          .from("project_notes")
          .update(payload)
          .eq("id", editingNote.id)
          .select()
          .single();

        if (error) throw error;

        savedNote = data;
      } else {
        const { data, error } = await supabase
          .from("project_notes")
          .insert({
            project_id: project.id,
            ...payload,
          })
          .select()
          .single();

        if (error) throw error;

        savedNote = data;
      }

      const noteName =
        savedNote.title ||
        savedNote.content.slice(0, 60);

      const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Projetos",
          action: editingNote
            ? "updated"
            : "created",
          entity_type: "project_note",
          entity_id: savedNote.id,
          entity_name: noteName,
          details: {
            message: editingNote
              ? `Atualizou uma nota do projeto ${project.title}`
              : `Criou uma nota no projeto ${project.title}`,
          },
        });

      if (logError) {
        console.error(
          "Erro ao registrar nota no histórico:",
          logError
        );
      }

      closeForm();
      await loadNotes();
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      alert("Não foi possível salvar a nota.");
    }
  }

  async function remove(note) {
    
    try {
      const { error } = await supabase
        .from("project_notes")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", note.id);

      if (error) throw error;

      const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Projetos",
          action: "deleted",
          entity_type: "project_note",
          entity_id: note.id,
          entity_name:
            note.title ||
            note.content?.slice(0, 60) ||
            "Nota",
          details: {
            message: `Moveu uma nota do projeto ${project.title} para a Lixeira`,
          },
        });

      if (logError) {
        console.error(
          "Erro ao registrar exclusão no histórico:",
          logError
        );
      }

      setNotes((prev) =>
        prev.filter((item) => item.id !== note.id)
      );
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      alert("Não foi possível excluir a nota.");
    }
  }

  return (
    <section style={sectionStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontWeight: 700,
              color: COLORS.ink,
              fontSize: 15,
            }}
          >
            <FileText
              size={16}
              color={COLORS.primaryDark}
            />
            Notas
          </div>

          <div
            style={{
              color: COLORS.inkSoft,
              fontSize: 10,
              marginTop: 3,
            }}
          >
            {notes.length}{" "}
            {notes.length === 1 ? "nota" : "notas"}
          </div>
        </div>

        <button
          type="button"
          onClick={openNew}
          title="Nova nota"
          style={{
            ...actionButtonStyle,
            background: COLORS.primaryLight,
            color: COLORS.primaryDark,
          }}
        >
          <Plus size={16} />
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={save}
          style={{
            padding: 12,
            borderRadius: 10,
            background: COLORS.bg,
            marginBottom: 12,
          }}
        >
          <input
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder="Título da nota (opcional)"
            style={inputStyle}
          />

          <textarea
            value={form.content}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                content: e.target.value,
              }))
            }
            placeholder="Escreva sua nota..."
            rows={4}
            style={{
              ...inputStyle,
              marginTop: 8,
              resize: "vertical",
              lineHeight: 1.5,
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 7,
              marginTop: 9,
            }}
          >
            <button
              type="button"
              onClick={closeForm}
              style={secondaryButtonStyle}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={primaryButtonStyle}
            >
              {editingNote
                ? "Salvar"
                : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <EmptyState>Carregando...</EmptyState>
      ) : notes.length === 0 ? (
        <EmptyState>
          Nenhuma nota cadastrada.
        </EmptyState>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 8,
          }}
        >
          {notes.map((note) => (
            <div
              key={note.id}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: 11,
                background: COLORS.surface,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {note.title && (
                    <div
                      style={{
                        color: COLORS.ink,
                        fontSize: 12,
                        fontWeight: 700,
                        marginBottom: 5,
                      }}
                    >
                      {note.title}
                    </div>
                  )}

                  <div
                    style={{
                      color: COLORS.inkSoft,
                      fontSize: 11,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {note.content}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openEdit(note)}
                    title="Editar nota"
                    style={actionButtonStyle}
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(note)}
                    title="Excluir nota"
                    style={{
                      ...actionButtonStyle,
                      color: COLORS.danger,
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div
      style={{
        padding: "18px 4px",
        textAlign: "center",
        color: COLORS.inkSoft,
        fontSize: 11,
      }}
    >
      {children}
    </div>
  );
}

const sectionStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: 16,
};

const actionButtonStyle = {
  width: 30,
  height: 30,
  display: "grid",
  placeItems: "center",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: COLORS.surface,
  color: COLORS.inkSoft,
  cursor: "pointer",
  padding: 0,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 9px",
  background: COLORS.surface,
  color: COLORS.ink,
  fontSize: 11,
  outline: "none",
};

const primaryButtonStyle = {
  border: 0,
  borderRadius: 8,
  padding: "7px 11px",
  background: COLORS.primary,
  color: "#fff",
  fontSize: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "7px 11px",
  background: COLORS.surface,
  color: COLORS.inkSoft,
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
};