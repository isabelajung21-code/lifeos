import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  GraduationCap,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";
import StudyItemsSection from "./StudyItemsSection";
import StudySessionsSection from "./StudySessionsSection";
import StudyMaterialsSection from "./StudyMaterialsSection";

const emptyForm = {
  title: "",
  institution: "",
  category: "",
  description: "",
  status: "planejado",
  progress: 0,
  start_date: "",
  target_date: "",
  color: "#5B8FC9",
  notes: "",
};

const STATUS_LABELS = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  pausado: "Pausado",
  concluido: "Concluído",
  cancelado: "Cancelado",
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
  return result.data?.id;
}

function formatDate(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

export default function StudiesPage({ currentUser }) {
  const [userId, setUserId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCourses();
  }, [currentUser]);

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const resolvedUserId = await findUserId(currentUser);
      setUserId(resolvedUserId || null);

      if (!resolvedUserId) {
        setCourses([]);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("study_courses")
        .select("*")
        .eq("owner_user_id", resolvedUserId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      setCourses(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const active = courses.filter((course) => course.status === "em_andamento").length;
    const completed = courses.filter((course) => course.status === "concluido").length;
    const progressCourses = courses.filter((course) => course.status !== "cancelado");
    const average = progressCourses.length
      ? Math.round(
          progressCourses.reduce((total, course) => total + Number(course.progress || 0), 0) /
            progressCourses.length,
        )
      : 0;

    return { active, completed, average };
  }, [courses]);

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function editCourse(course) {
    setEditingId(course.id);
    setForm({
      title: course.title || "",
      institution: course.institution || "",
      category: course.category || "",
      description: course.description || "",
      status: course.status || "planejado",
      progress: Number(course.progress || 0),
      start_date: course.start_date || "",
      target_date: course.target_date || "",
      color: course.color || "#5B8FC9",
      notes: course.notes || "",
    });
    setMessage("");
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveCourse(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Informe o nome do curso ou disciplina.");
      return;
    }

    if (!userId) {
      setError("Não foi possível identificar o usuário selecionado.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        owner_user_id: userId,
        title: form.title.trim(),
        institution: form.institution.trim() || null,
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        status: form.status,
        progress: Number(form.progress || 0),
        start_date: form.start_date || null,
        target_date: form.target_date || null,
        color: form.color,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (form.status === "concluido") payload.progress = 100;

      const result = editingId
        ? await supabase.from("study_courses").update(payload).eq("id", editingId)
        : await supabase.from("study_courses").insert(payload);

      if (result.error) throw result.error;

      closeForm();
      await loadCourses();
      setMessage(editingId ? "Curso atualizado." : "Curso cadastrado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function moveToTrash(course) {
    
    const { error: deleteError } = await supabase
      .from("study_courses")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setCourses((current) => current.filter((item) => item.id !== course.id));
    setMessage("Curso movido para a Lixeira.");
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={panelStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <GraduationCap size={19} color={COLORS.primaryDark} />
              <h2 style={{ margin: 0, color: COLORS.ink, fontSize: 19, letterSpacing: "-0.3px" }}>Meus estudos</h2>
            </div>
            <p style={{ margin: "5px 0 0", color: COLORS.inkSoft, fontSize: 12 }}>
              Organize cursos, disciplinas e objetivos de aprendizagem.
            </p>
          </div>

          <button type="button" onClick={openNewForm} style={primaryButtonStyle}>
            <Plus size={15} /> Novo curso
          </button>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
          gap: 12,
        }}
      >
        <SummaryCard icon={BookOpen} label="Em andamento" value={summary.active} />
        <SummaryCard icon={CheckCircle2} label="Concluídos" value={summary.completed} />
        <SummaryCard icon={Clock3} label="Progresso médio" value={`${summary.average}%`} />
      </div>

      {showForm && (
        <form onSubmit={saveCourse} style={{ ...panelStyle, background: COLORS.bg }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <h3 style={{ margin: 0, color: COLORS.ink, fontSize: 17 }}>
              {editingId ? "Editar curso" : "Novo curso ou disciplina"}
            </h3>
            <button type="button" onClick={closeForm} style={iconButtonStyle} title="Fechar">
              <X size={18} />
            </button>
          </div>

          <div style={formGridStyle}>
            <Field label="Nome *">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Ex.: Mestrado em Cosméticos"
                style={inputStyle}
              />
            </Field>
            <Field label="Instituição">
              <input
                value={form.institution}
                onChange={(event) => setForm({ ...form, institution: event.target.value })}
                placeholder="Ex.: UFPR"
                style={inputStyle}
              />
            </Field>
            <Field label="Categoria">
              <input
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="Ex.: Pós-graduação"
                style={inputStyle}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                style={inputStyle}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Data de início">
              <input
                type="date"
                value={form.start_date}
                onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Previsão de conclusão">
              <input
                type="date"
                value={form.target_date}
                onChange={(event) => setForm({ ...form, target_date: event.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label={`Progresso: ${form.status === "concluido" ? 100 : form.progress}%`}>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                disabled={form.status === "concluido"}
                value={form.status === "concluido" ? 100 : form.progress}
                onChange={(event) => setForm({ ...form, progress: Number(event.target.value) })}
                style={{ width: "100%", accentColor: COLORS.primary }}
              />
            </Field>
            <Field label="Cor do curso">
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                style={{ ...inputStyle, height: 43, padding: 5 }}
              />
            </Field>
          </div>

          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <Field label="Observações">
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 14 }}>
            <button type="submit" disabled={saving} style={primaryButtonStyle}>
              <Save size={17} /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={closeForm} style={secondaryButtonStyle}>
              <X size={17} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {error && <div style={errorStyle}>{error}</div>}
      {message && <div style={messageStyle}>{message}</div>}

      <section style={panelStyle}>
        <h3 style={{ margin: "0 0 13px", color: COLORS.ink, fontSize: 17 }}>
          Cursos e disciplinas
        </h3>

        {loading ? (
          <div style={emptyStyle}>Carregando estudos...</div>
        ) : courses.length === 0 ? (
          <div style={emptyStyle}>
            Nenhum curso cadastrado. Clique em “Novo curso” para começar.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: 12,
            }}
          >
            {courses.map((course) => (
              <article
                key={course.id}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  borderTop: `4px solid ${course.color || COLORS.primary}`,
                  borderRadius: 13,
                  padding: 15,
                  background: COLORS.surface,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <h4 style={{ margin: 0, color: COLORS.ink, fontSize: 15 }}>{course.title}</h4>
                    {(course.institution || course.category) && (
                      <div style={{ color: COLORS.inkSoft, fontSize: 11, marginTop: 4 }}>
                        {[course.institution, course.category].filter(Boolean).join(" • ")}
                      </div>
                    )}
                  </div>
                  <span style={statusStyle}>{STATUS_LABELS[course.status] || course.status}</span>
                </div>

                {course.description && (
                  <p style={{ color: COLORS.inkSoft, fontSize: 12, lineHeight: 1.5, margin: "12px 0" }}>
                    {course.description}
                  </p>
                )}

                <div style={{ marginTop: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: COLORS.inkSoft }}>Progresso</span>
                    <strong style={{ color: COLORS.primaryDark }}>{course.progress}%</strong>
                  </div>
                  <div style={{ height: 7, background: COLORS.primaryLight, borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${course.progress}%`,
                        height: "100%",
                        background: course.color || COLORS.primary,
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>

                {(course.start_date || course.target_date) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.inkSoft, fontSize: 11, marginTop: 11 }}>
                    <CalendarDays size={13} />
                    {course.start_date ? formatDate(course.start_date) : "Sem início"}
                    {course.target_date ? ` → ${formatDate(course.target_date)}` : ""}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 14 }}>
                  <button type="button" onClick={() => editCourse(course)} style={iconButtonStyle} title="Editar">
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveToTrash(course)}
                    style={{ ...iconButtonStyle, color: COLORS.danger }}
                    title="Mover para a Lixeira"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
        <StudyItemsSection
            currentUser={currentUser}
            courses={courses}
        />
        <StudySessionsSection
            currentUser={currentUser}
            courses={courses}
        />
        <StudyMaterialsSection
            currentUser={currentUser}
            courses={courses}
        />
      
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div style={{ ...panelStyle, display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{ width: 39, height: 39, borderRadius: 11, background: COLORS.primaryLight, color: COLORS.primaryDark, display: "grid", placeItems: "center" }}>
        <Icon size={19} />
      </div>
      <div>
        <div style={{ color: COLORS.ink, fontWeight: 750, fontSize: 19 }}>{value}</div>
        <div style={{ color: COLORS.inkSoft, fontSize: 11 }}>{label}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6, color: COLORS.inkSoft, fontSize: 12 }}>
      {label}
      {children}
    </label>
  );
}

const panelStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: 14,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
  gap: 10,
  margin: "12px 0 10px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 9,
  padding: "8px 10px",
  background: COLORS.surface,
  color: COLORS.ink,
  font: "inherit",
  outline: "none",
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: 0,
  borderRadius: 9,
  padding: "8px 11px",
  background: COLORS.primary,
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  background: COLORS.surface,
  color: COLORS.ink,
  border: `1px solid ${COLORS.border}`,
};

const iconButtonStyle = {
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.primaryDark,
  width: 30,
  height: 30,
  borderRadius: 9,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const statusStyle = {
  alignSelf: "flex-start",
  whiteSpace: "nowrap",
  background: COLORS.primaryLight,
  color: COLORS.primaryDark,
  borderRadius: 99,
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 700,
};

const emptyStyle = {
  border: `1px dashed ${COLORS.border}`,
  borderRadius: 12,
  padding: 18,
  color: COLORS.inkSoft,
  textAlign: "center",
  fontSize: 12,
};

const errorStyle = {
  background: COLORS.dangerLight,
  color: COLORS.danger,
  padding: 10,
  borderRadius: 9,
  fontSize: 11,
};

const messageStyle = {
  background: COLORS.successLight,
  color: COLORS.success,
  padding: 12,
  borderRadius: 11,
};
