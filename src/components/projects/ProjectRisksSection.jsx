import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

function probabilityLabel(value) {
  const labels = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
  };

  return labels[value] || value;
}

function impactLabel(value) {
  const labels = {
    baixo: "Baixo",
    medio: "Médio",
    alto: "Alto",
  };

  return labels[value] || value;
}

function statusLabel(value) {
  const labels = {
    aberto: "Aberto",
    monitorando: "Monitorando",
    resolvido: "Resolvido",
  };

  return labels[value] || value;
}

export default function ProjectRisksSection({
  project,
  userId,
}) {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    probability: "media",
    impact: "medio",
    mitigation: "",
    status: "aberto",
  });

  useEffect(() => {
    if (!project?.id) return;
    loadRisks();
  }, [project?.id]);

  async function loadRisks() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("project_risks")
        .select("*")
        .eq("project_id", project.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRisks(data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar riscos do projeto:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingRisk(null);

    setForm({
      title: "",
      description: "",
      probability: "media",
      impact: "medio",
      mitigation: "",
      status: "aberto",
    });

    setFormOpen(true);
  }

  function openEdit(risk) {
    setEditingRisk(risk);

    setForm({
      title: risk.title || "",
      description: risk.description || "",
      probability: risk.probability || "media",
      impact: risk.impact || "medio",
      mitigation: risk.mitigation || "",
      status: risk.status || "aberto",
    });

    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingRisk(null);

    setForm({
      title: "",
      description: "",
      probability: "media",
      impact: "medio",
      mitigation: "",
      status: "aberto",
    });
  }

  async function save(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Informe o título do risco.");
      return;
    }

    try {
      let savedRisk;

      const payload = {
        title: form.title.trim(),
        description:
          form.description.trim() || null,
        probability: form.probability,
        impact: form.impact,
        mitigation:
          form.mitigation.trim() || null,
        status: form.status,
        updated_at: new Date().toISOString(),
      };

      if (editingRisk) {
        const { data, error } = await supabase
          .from("project_risks")
          .update(payload)
          .eq("id", editingRisk.id)
          .select()
          .single();

        if (error) throw error;

        savedRisk = data;
      } else {
        const { data, error } = await supabase
          .from("project_risks")
          .insert({
            project_id: project.id,
            ...payload,
          })
          .select()
          .single();

        if (error) throw error;

        savedRisk = data;
      }

      const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Projetos",
          action: editingRisk
            ? "updated"
            : "created",
          entity_type: "project_risk",
          entity_id: savedRisk.id,
          entity_name: savedRisk.title,
          details: {
            message: editingRisk
              ? `Atualizou risco do projeto ${project.title}: ${savedRisk.title}`
              : `Criou risco no projeto ${project.title}: ${savedRisk.title}`,
          },
        });

      if (logError) {
        console.error(
          "Erro ao registrar risco no histórico:",
          logError
        );
      }

      closeForm();
      await loadRisks();
    } catch (error) {
      console.error(
        "Erro ao salvar risco:",
        error
      );

      alert("Não foi possível salvar o risco.");
    }
  }

  async function remove(risk) {
    
    try {
      const { error } = await supabase
        .from("project_risks")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", risk.id);

      if (error) throw error;

      const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: userId,
          module: "Projetos",
          action: "deleted",
          entity_type: "project_risk",
          entity_id: risk.id,
          entity_name: risk.title,
          details: {
            message: `Moveu o risco ${risk.title} do projeto ${project.title} para a Lixeira`,
          },
        });

      if (logError) {
        console.error(
          "Erro ao registrar exclusão no histórico:",
          logError
        );
      }

      setRisks((prev) =>
        prev.filter((item) => item.id !== risk.id)
      );
    } catch (error) {
      console.error(
        "Erro ao excluir risco:",
        error
      );

      alert("Não foi possível excluir o risco.");
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
            <AlertTriangle
              size={16}
              color={COLORS.primaryDark}
            />
            Riscos
          </div>

          <div
            style={{
              color: COLORS.inkSoft,
              fontSize: 10,
              marginTop: 3,
            }}
          >
            {risks.length}{" "}
            {risks.length === 1
              ? "risco"
              : "riscos"}
          </div>
        </div>

        <button
          type="button"
          onClick={openNew}
          title="Novo risco"
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
            placeholder="Título do risco"
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
            placeholder="Descrição do risco"
            rows={2}
            style={{
              ...inputStyle,
              marginTop: 8,
              resize: "vertical",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 8,
              marginTop: 8,
            }}
          >
            <select
              value={form.probability}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  probability: e.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="baixa">
                Probabilidade baixa
              </option>
              <option value="media">
                Probabilidade média
              </option>
              <option value="alta">
                Probabilidade alta
              </option>
            </select>

            <select
              value={form.impact}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  impact: e.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="baixo">
                Impacto baixo
              </option>
              <option value="medio">
                Impacto médio
              </option>
              <option value="alto">
                Impacto alto
              </option>
            </select>

            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="aberto">
                Aberto
              </option>
              <option value="monitorando">
                Monitorando
              </option>
              <option value="resolvido">
                Resolvido
              </option>
            </select>
          </div>

          <textarea
            value={form.mitigation}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                mitigation: e.target.value,
              }))
            }
            placeholder="Plano de mitigação / como reduzir este risco"
            rows={3}
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
              {editingRisk
                ? "Salvar"
                : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <EmptyState>Carregando...</EmptyState>
      ) : risks.length === 0 ? (
        <EmptyState>
          Nenhum risco cadastrado.
        </EmptyState>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 9,
          }}
        >
          {risks.map((risk) => (
            <div
              key={risk.id}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: 12,
                background: COLORS.surface,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: COLORS.ink,
                    }}
                  >
                    {risk.title}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginTop: 7,
                    }}
                  >
                    <Badge>
                      Probabilidade:{" "}
                      {probabilityLabel(
                        risk.probability
                      )}
                    </Badge>

                    <Badge>
                      Impacto:{" "}
                      {impactLabel(risk.impact)}
                    </Badge>

                    <Badge>
                      {statusLabel(risk.status)}
                    </Badge>
                  </div>

                  {risk.description && (
                    <div
                      style={{
                        marginTop: 9,
                        color: COLORS.inkSoft,
                        fontSize: 11,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {risk.description}
                    </div>
                  )}

                  {risk.mitigation && (
                    <div
                      style={{
                        marginTop: 9,
                        padding: 9,
                        borderRadius: 8,
                        background: COLORS.bg,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: COLORS.inkSoft,
                          marginBottom: 3,
                        }}
                      >
                        Mitigação
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: COLORS.ink,
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {risk.mitigation}
                      </div>
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
                    onClick={() => openEdit(risk)}
                    title="Editar risco"
                    style={actionButtonStyle}
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(risk)}
                    title="Excluir risco"
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

function Badge({ children }) {
  return (
    <span
      style={{
        padding: "4px 7px",
        borderRadius: 999,
        background: COLORS.primaryLight,
        color: COLORS.primaryDark,
        fontSize: 9,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
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