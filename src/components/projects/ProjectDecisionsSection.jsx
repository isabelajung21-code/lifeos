import { useEffect, useState } from "react";
import {
  GitBranch,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

function toLocalISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "";

  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "pt-BR"
  );
}

export default function ProjectDecisionsSection({
  project,
  userId,
}) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDecision, setEditingDecision] =
    useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    decision_date: toLocalISODate(),
  });

  useEffect(() => {
    if (!project?.id) return;
    loadDecisions();
  }, [project?.id]);

  async function loadDecisions() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("project_decisions")
        .select("*")
        .eq("project_id", project.id)
        .is("deleted_at", null)
        .order("decision_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDecisions(data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar decisões do projeto:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingDecision(null);

    setForm({
      title: "",
      description: "",
      decision_date: toLocalISODate(),
    });

    setFormOpen(true);
  }

  function openEdit(decision) {
    setEditingDecision(decision);

    setForm({
      title: decision.title || "",
      description: decision.description || "",
      decision_date:
        decision.decision_date || toLocalISODate(),
    });

    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingDecision(null);

    setForm({
      title: "",
      description: "",
      decision_date: toLocalISODate(),
    });
  }

  async function save(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Informe o título da decisão.");
      return;
    }

    try {
      let savedDecision;

      const payload = {
        title: form.title.trim(),
        description:
          form.description.trim() || null,
        decision_date:
          form.decision_date || toLocalISODate(),
        updated_at: new Date().toISOString(),
      };

      if (editingDecision) {
        const { data, error } = await supabase
          .from("project_decisions")
          .update(payload)
          .eq("id", editingDecision.id)
          .select()
          .single();

        if (error) throw error;

        savedDecision = data;
      } else {
        const { data, error } = await supabase
          .from("project_decisions")
          .insert({
            project_id: project.id,
            ...payload,
          })
          .select()
          .single();

        if (error) throw error;

        savedDecision = data;
      }

      const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Projetos",
          action: editingDecision
            ? "updated"
            : "created",
          entity_type: "project_decision",
          entity_id: savedDecision.id,
          entity_name: savedDecision.title,
          details: {
            message: editingDecision
              ? `Atualizou decisão do projeto ${project.title}: ${savedDecision.title}`
              : `Registrou decisão no projeto ${project.title}: ${savedDecision.title}`,
          },
        });

      if (logError) {
        console.error(
          "Erro ao registrar decisão no histórico:",
          logError
        );
      }

      closeForm();
      await loadDecisions();
    } catch (error) {
      console.error(
        "Erro ao salvar decisão:",
        error
      );

      alert("Não foi possível salvar a decisão.");
    }
  }

  async function remove(decision) {
    
    try {
      const { error } = await supabase
        .from("project_decisions")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", decision.id);

      if (error) throw error;

      const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Projetos",
          action: "deleted",
          entity_type: "project_decision",
          entity_id: decision.id,
          entity_name: decision.title,
          details: {
            message: `Moveu a decisão ${decision.title} do projeto ${project.title} para a Lixeira`,
          },
        });

      if (logError) {
        console.error(
          "Erro ao registrar exclusão no histórico:",
          logError
        );
      }

      setDecisions((prev) =>
        prev.filter(
          (item) => item.id !== decision.id
        )
      );
    } catch (error) {
      console.error(
        "Erro ao excluir decisão:",
        error
      );

      alert("Não foi possível excluir a decisão.");
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
            <GitBranch
              size={16}
              color={COLORS.primaryDark}
            />
            Decisões
          </div>

          <div
            style={{
              color: COLORS.inkSoft,
              fontSize: 10,
              marginTop: 3,
            }}
          >
            {decisions.length}{" "}
            {decisions.length === 1
              ? "decisão"
              : "decisões"}
          </div>
        </div>

        <button
          type="button"
          onClick={openNew}
          title="Nova decisão"
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
            placeholder="Qual decisão foi tomada?"
            style={inputStyle}
          />

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Contexto, motivo ou observações..."
            rows={3}
            style={{
              ...inputStyle,
              marginTop: 8,
              resize: "vertical",
              lineHeight: 1.5,
            }}
          />

          <div style={{ marginTop: 8 }}>
            <div
              style={{
                color: COLORS.inkSoft,
                fontSize: 9,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Data da decisão
            </div>

            <input
              type="date"
              value={form.decision_date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  decision_date: e.target.value,
                }))
              }
              style={inputStyle}
            />
          </div>

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
              {editingDecision
                ? "Salvar"
                : "Registrar"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <EmptyState>Carregando...</EmptyState>
      ) : decisions.length === 0 ? (
        <EmptyState>
          Nenhuma decisão registrada.
        </EmptyState>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 8,
          }}
        >
          {decisions.map((decision) => (
            <div
              key={decision.id}
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
                  <div
                    style={{
                      color: COLORS.ink,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {decision.title}
                  </div>

                  <div
                    style={{
                      color: COLORS.primaryDark,
                      fontSize: 9,
                      fontWeight: 600,
                      marginTop: 4,
                    }}
                  >
                    {formatDate(
                      decision.decision_date
                    )}
                  </div>

                  {decision.description && (
                    <div
                      style={{
                        color: COLORS.inkSoft,
                        fontSize: 11,
                        lineHeight: 1.5,
                        marginTop: 7,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {decision.description}
                    </div>
                  )}
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
                    onClick={() =>
                      openEdit(decision)
                    }
                    title="Editar decisão"
                    style={actionButtonStyle}
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      remove(decision)
                    }
                    title="Excluir decisão"
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