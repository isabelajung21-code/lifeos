import { useEffect, useState } from "react";
import { Flag, Link2, Plus, Save, Trash2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const emptyForm = {
  title: "",
  description: "",
  category: "pessoal",
  target_date: "",
  progress: 0,
  visibility: "private",
  project_id: "",
};

const CATEGORIES = [
  ["pessoal", "Pessoal"],
  ["casa", "Casa"],
  ["profissional", "Profissional"],
  ["estudos", "Estudos"],
  ["financeiro", "Financeiro"],
  ["viagem", "Viagem"],
  ["outros", "Outros"],
];

const fieldStyle = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: 9,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.ink,
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

export default function LifeGoalsSection({ currentUser }) {
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [currentUser]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const userId = await findUserId(currentUser);

      const [goalsResult, projectsResult, linksResult] = await Promise.all([
        supabase
          .from("goals")
          .select("*")
          .is("deleted_at", null)
          .or(`owner_user_id.eq.${userId},visibility.eq.shared`)
          .order("created_at", { ascending: false }),

        supabase
          .from("projects")
          .select("id, title, status")
          .eq("owner_user_id", userId)
          .is("deleted_at", null)
          .order("title"),

        supabase
          .from("goal_links")
          .select("*")
          .eq("entity_type", "project"),
      ]);

      const firstError = [goalsResult, projectsResult, linksResult].find(
        (result) => result.error
      )?.error;

      if (firstError) throw firstError;

      setGoals(goalsResult.data || []);
      setProjects(projectsResult.data || []);
      setLinks(linksResult.data || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar as metas.");
    } finally {
      setLoading(false);
    }
  }

  async function saveGoal(event) {
    event.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    setError("");

    try {
      const userId = await findUserId(currentUser);
      const { data: goal, error: goalError } = await supabase
        .from("goals")
        .insert({
          owner_user_id: userId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category,
          target_date: form.target_date || null,
          progress: Number(form.progress),
          visibility: form.visibility,
        })
        .select()
        .single();

      if (goalError) throw goalError;

      if (form.project_id) {
        const { error: linkError } = await supabase.from("goal_links").insert({
          goal_id: goal.id,
          entity_type: "project",
          entity_id: form.project_id,
        });

        if (linkError) throw linkError;
      }

      setForm(emptyForm);
      setFormOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Não foi possível criar esta meta.");
    } finally {
      setSaving(false);
    }
  }

  async function updateProgress(goal, progress) {
    const value = Math.max(0, Math.min(100, Number(progress)));
    const status = value === 100 ? "completed" : "active";

    const { error: updateError } = await supabase
      .from("goals")
      .update({
        progress: value,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setGoals((current) =>
      current.map((item) =>
        item.id === goal.id
          ? { ...item, progress: value, status }
          : item
      )
    );
  }

  async function removeGoal(goal) {
    
    const userId = await findUserId(currentUser);
    const now = new Date().toISOString();
    const { error: removeError } = await supabase
      .from("goals")
      .update({ deleted_at: now, deleted_by: userId, updated_at: now })
      .eq("id", goal.id);

    if (removeError) {
      setError(removeError.message);
      return;
    }

    setGoals((current) => current.filter((item) => item.id !== goal.id));
  }

  function linkedProject(goalId) {
    const link = links.find((item) => item.goal_id === goalId);
    return projects.find((project) => project.id === link?.entity_id);
  }

  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 15,
        padding: 18,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flag size={20} color={COLORS.primaryDark} />
            <h2 style={{ margin: 0, color: COLORS.ink, fontSize: 18 }}>
              Metas pessoais
            </h2>
          </div>
          <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 5 }}>
            Transforme objetivos em projetos e tarefas concretas.
          </div>
        </div>

        <button onClick={() => setFormOpen(true)} style={primaryButton}>
          <Plus size={15} /> Nova meta
        </button>
      </div>

      {error && (
        <div
          style={{
            background: COLORS.dangerLight,
            color: COLORS.danger,
            padding: 10,
            borderRadius: 9,
            marginTop: 12,
          }}
        >
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={saveGoal}
          style={{
            background: COLORS.bg,
            borderRadius: 12,
            padding: 14,
            marginTop: 15,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            <Field label="Meta">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="Ex.: Mudar para Curitiba"
                style={fieldStyle}
              />
            </Field>

            <Field label="Categoria">
              <select
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                style={fieldStyle}
              >
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            <Field label="Data-alvo">
              <input
                type="date"
                value={form.target_date}
                onChange={(event) =>
                  setForm({ ...form, target_date: event.target.value })
                }
                style={fieldStyle}
              />
            </Field>

            <Field label="Visibilidade">
              <select
                value={form.visibility}
                onChange={(event) =>
                  setForm({ ...form, visibility: event.target.value })
                }
                style={fieldStyle}
              >
                <option value="private">Só {currentUser}</option>
                <option value="shared">Compartilhada</option>
              </select>
            </Field>

            <Field label="Projeto relacionado">
              <select
                value={form.project_id}
                onChange={(event) =>
                  setForm({ ...form, project_id: event.target.value })
                }
                style={fieldStyle}
              >
                <option value="">Nenhum projeto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows={2}
              placeholder="O que significa alcançar esta meta?"
              style={{ ...fieldStyle, marginTop: 0, resize: "vertical" }}
            />
          </Field>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="submit" disabled={saving} style={primaryButton}>
              <Save size={16} /> {saving ? "Salvando..." : "Salvar meta"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              style={secondaryButton}
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: COLORS.inkSoft, padding: 22, textAlign: "center" }}>
          Carregando metas...
        </div>
      ) : goals.length === 0 ? (
        <div
          style={{
            color: COLORS.inkSoft,
            padding: 24,
            marginTop: 15,
            textAlign: "center",
            border: `1px dashed ${COLORS.border}`,
            borderRadius: 11,
          }}
        >
          Nenhuma meta pessoal cadastrada.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: 11,
            marginTop: 15,
          }}
        >
          {goals.map((goal) => {
            const project = linkedProject(goal.id);
            return (
              <article
                key={goal.id}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: 14,
                  background: COLORS.surface,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ color: COLORS.ink, fontWeight: 750 }}>
                      {goal.title}
                    </div>
                    <div style={{ color: COLORS.inkSoft, fontSize: 11, marginTop: 4 }}>
                      {CATEGORIES.find(([value]) => value === goal.category)?.[1] || "Pessoal"}
                      {goal.visibility === "shared" ? " • Compartilhada" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => removeGoal(goal)}
                    title="Mover para a Lixeira"
                    style={deleteButton}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {goal.description && (
                  <p style={{ color: COLORS.inkSoft, fontSize: 12, margin: "10px 0" }}>
                    {goal.description}
                  </p>
                )}

                {project && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      color: COLORS.primaryDark,
                      fontSize: 12,
                      marginTop: 9,
                    }}
                  >
                    <Link2 size={14} /> {project.title}
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.inkSoft }}>
                    <span>Progresso</span>
                    <strong style={{ color: COLORS.primaryDark }}>{goal.progress}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={goal.progress}
                    onChange={(event) =>
                      updateProgress(goal, event.target.value)
                    }
                    style={{ width: "100%", marginTop: 6 }}
                  />
                </div>

                {goal.target_date && (
                  <div style={{ color: COLORS.inkSoft, fontSize: 11, marginTop: 8 }}>
                    Até {new Date(`${goal.target_date}T12:00:00`).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginTop: 10 }}>
      <span
        style={{
          display: "block",
          color: COLORS.inkSoft,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 5,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const primaryButton = {
  border: 0,
  background: COLORS.primary,
  color: "white",
  padding: "9px 12px",
  borderRadius: 9,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

const secondaryButton = {
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.ink,
  padding: "8px 10px",
  borderRadius: 9,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  gap: 5,
};

const deleteButton = {
  border: 0,
  background: "transparent",
  color: COLORS.danger,
  padding: 5,
};