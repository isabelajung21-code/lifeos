import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  linked_module: "",
  status: "planejamento",
  priority: "media",
  progress: 0,
  start_date: "",
  due_date: "",
  budget_value: "",
};

export default function ProjectModal({
  open,
  onClose,
  onSaved,
  currentUser,
  project = null,
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (project) {
      setForm({
        title: project.title || "",
        description: project.description || "",
        category: project.category || "",
        linked_module: project.linked_module || "",
        status: project.status || "planejamento",
        priority: project.priority || "media",
        progress: project.progress ?? 0,
        start_date: project.start_date || "",
        due_date: project.due_date || "",
        budget_value: project.budget_value ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, project]);

  if (!open) return null;

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Informe o nome do projeto.");
      return;
    }

    try {
      setSaving(true);

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("display_name", currentUser)
        .single();

      if (userError) throw userError;

      const payload = {
        owner_user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        linked_module: form.linked_module || null,
        status: form.status,
        priority: form.priority,
        progress: Number(form.progress || 0),
        start_date: form.start_date || null,
        due_date: form.due_date || null,
        budget_value:
          form.budget_value === ""
            ? null
            : Number(form.budget_value),
        updated_at: new Date().toISOString(),
      };

      let savedProject;

      if (project?.id) {
        const { data, error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", project.id)
          .select()
          .single();

        if (error) throw error;

        savedProject = data;
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        savedProject = data;
      }

      const action = project?.id ? "updated" : "created";

      const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          module: "Projetos",
          action,
          entity_type: "project",
          entity_id: savedProject.id,
          entity_name: savedProject.title,
          details: {
            message: project?.id
              ? `Atualizou o projeto: ${savedProject.title}`
              : `Criou o projeto: ${savedProject.title}`,
          },
        });

      if (logError) {
        console.error(
          "Erro ao registrar projeto no histórico:",
          logError
        );
      }

      onSaved?.(savedProject);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Não foi possível salvar o projeto.");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 9,
    padding: "10px 11px",
    fontSize: 13,
    color: COLORS.ink,
    background: COLORS.surface,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.inkSoft,
    marginBottom: 5,
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 30, 40, 0.35)",
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
    >
      <form
        onSubmit={handleSave}
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 18px 55px rgba(30, 45, 60, 0.16)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                color: COLORS.ink,
                fontWeight: 700,
                fontSize: 17,
              }}
            >
              {project ? "Editar projeto" : "Novo projeto"}
            </div>

            <div
              style={{
                color: COLORS.inkSoft,
                fontSize: 11,
                marginTop: 3,
              }}
            >
              Organize prazos, prioridade e progresso.
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
              padding: 5,
            }}
          >
            <X size={19} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nome do projeto *</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ex.: Reforma do escritório"
              style={fieldStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                update("description", e.target.value)
              }
              placeholder="Objetivo e informações gerais..."
              rows={3}
              style={{
                ...fieldStyle,
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>Categoria</label>
              <input
                value={form.category}
                onChange={(e) =>
                  update("category", e.target.value)
                }
                placeholder="Ex.: Pessoal"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Área relacionada
              </label>

              <select
                value={form.linked_module}
                onChange={(e) =>
                  update("linked_module", e.target.value)
                }
                style={fieldStyle}
              >
                <option value="">Nenhuma</option>
                <option value="trabalho">Trabalho</option>
                <option value="conteudo">Conteúdo</option>
                <option value="casa">Casa</option>
                <option value="estudos">Estudos</option>
                <option value="pessoal">Pessoal</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value)
                }
                style={fieldStyle}
              >
                <option value="planejamento">
                  Planejamento
                </option>
                <option value="em_andamento">
                  Em andamento
                </option>
                <option value="pausado">Pausado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Prioridade</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  update("priority", e.target.value)
                }
                style={fieldStyle}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Progresso — {form.progress}%
              </label>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.progress}
                onChange={(e) =>
                  update("progress", e.target.value)
                }
                style={{
                  width: "100%",
                  marginTop: 8,
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>Data de início</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  update("start_date", e.target.value)
                }
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Prazo</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  update("due_date", e.target.value)
                }
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Orçamento previsto
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budget_value}
                onChange={(e) =>
                  update("budget_value", e.target.value)
                }
                placeholder="R$ 0,00"
                style={fieldStyle}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "15px 20px",
            borderTop: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 9,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.ink,
              borderRadius: 9,
              padding: "9px 14px",
              cursor: "pointer",
              fontSize: 12,
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
              background: COLORS.primary,
              color: "#fff",
              borderRadius: 9,
              padding: "9px 16px",
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.65 : 1,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {saving
              ? "Salvando..."
              : project
                ? "Salvar alterações"
                : "Criar projeto"}
          </button>
        </div>
      </form>
    </div>
  );
}