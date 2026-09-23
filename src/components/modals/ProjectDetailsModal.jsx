import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";
import ProjectTasksSection from "../projects/ProjectTasksSection";
import ProjectMilestonesSection from "../projects/ProjectMilestonesSection";
import ProjectNotesSection from "../projects/ProjectNotesSection";
import ProjectDecisionsSection from "../projects/ProjectDecisionsSection";
import ProjectRisksSection from "../projects/ProjectRisksSection";
import ProjectFinanceSection from "../projects/ProjectFinanceSection";



function formatDate(value) {
  if (!value) return "Sem prazo";

  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "pt-BR"
  );
}

function priorityLabel(priority) {
  const labels = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };

  return labels[priority] || priority || "Média";
}

function statusLabel(status) {
  const labels = {
    planejamento: "Planejamento",
    em_andamento: "Em andamento",
    pausado: "Pausado",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  return labels[status] || status;
}

export default function ProjectDetailsModal({
  open,
  onClose,
  project,
  currentUser,
  onProjectUpdated,
}) {
  const [userId, setUserId] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);

  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    if (!open || !project?.id) return;

    loadData();
  }, [open, project?.id, currentUser]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: user, error: userError } =
        await supabase
          .from("users")
          .select("id")
          .eq("display_name", currentUser)
          .single();

      if (userError) throw userError;

      setUserId(user.id);

      const [tasksResult, milestonesResult] =
        await Promise.all([
          supabase
            .from("tasks")
            .select("*")
            .eq("owner_user_id", user.id)
            .eq("source_module", "projetos")
            .eq("source_id", project.id)
            .is("deleted_at", null)
            .order("due_date", {
              ascending: true,
              nullsFirst: false,
            })
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("project_milestones")
            .select("*")
            .eq("project_id", project.id)
            .is("deleted_at", null)
            .order("due_date", {
              ascending: true,
              nullsFirst: false,
            })
            .order("created_at", {
              ascending: false,
            }),
        ]);

      if (tasksResult.error) throw tasksResult.error;
      if (milestonesResult.error) {
        throw milestonesResult.error;
      }

      setTasks(tasksResult.data || []);
      setMilestones(milestonesResult.data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar detalhes do projeto:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const projectProgress = useMemo(() => {
    const items = [
      ...tasks.map((task) => ({
        completed: task.status === "concluida",
      })),
      ...milestones.map((milestone) => ({
        completed:
          milestone.status === "concluido",
      })),
    ];

    if (items.length === 0) {
      return Number(project?.progress || 0);
    }

    const completed = items.filter(
      (item) => item.completed
    ).length;

    return Math.round(
      (completed / items.length) * 100
    );
  }, [tasks, milestones, project?.progress]);

  async function updateProjectProgress(
    nextTasks = tasks,
    nextMilestones = milestones
  ) {
    const items = [
      ...nextTasks.map((task) => ({
        completed: task.status === "concluida",
      })),
      ...nextMilestones.map((milestone) => ({
        completed:
          milestone.status === "concluido",
      })),
    ];

    if (items.length === 0) return;

    const completed = items.filter(
      (item) => item.completed
    ).length;

    const progress = Math.round(
      (completed / items.length) * 100
    );

    const updatePayload = {
      progress,
      updated_at: new Date().toISOString(),
    };

    if (progress === 100) {
      updatePayload.status = "concluido";
      updatePayload.completed_at =
        new Date().toISOString();
    } else if (project.status === "concluido") {
      updatePayload.status = "em_andamento";
      updatePayload.completed_at = null;
    }

    const { error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", project.id);

    if (error) {
      console.error(
        "Erro ao atualizar progresso:",
        error
      );
      return;
    }

    onProjectUpdated?.();
  }


  if (!open || !project) return null;

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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,30,40,0.38)",
        zIndex: 1100,
        padding: 20,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1050,
          margin: "20px auto",
          background: COLORS.bg,
          borderRadius: 18,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: COLORS.surface,
            padding: 20,
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {project.title}
            </div>

            <div
              style={{
                marginTop: 5,
                color: COLORS.inkSoft,
                fontSize: 12,
              }}
            >
              {statusLabel(project.status)}
              {" • "}
              {priorityLabel(project.priority)}
              {" • "}
              Prazo {formatDate(project.due_date)}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              ...actionButtonStyle,
              flexShrink: 0,
            }}
          >
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: COLORS.inkSoft,
                marginBottom: 8,
              }}
            >
              <span>Progresso do projeto</span>

              <strong
                style={{
                  color: COLORS.ink,
                }}
              >
                {projectProgress}%
              </strong>
            </div>

            <div
              style={{
                height: 8,
                background: COLORS.primaryLight,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${projectProgress}%`,
                  background: COLORS.primary,
                  borderRadius: 999,
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </div>

          {/* TAREFAS + MARCOS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            <ProjectTasksSection
              project={project}
              userId={userId}
              tasks={tasks}
              setTasks={setTasks}
              milestones={milestones}
              updateProjectProgress={updateProjectProgress}
              reloadData={loadData}
            />

            <ProjectMilestonesSection
              project={project}
              userId={userId}
              tasks={tasks}
              milestones={milestones}
              setMilestones={setMilestones}
              updateProjectProgress={updateProjectProgress}
              reloadData={loadData}
            />
          </div>

          {/* NOTAS + DECISÕES */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
              marginTop: 16,
              width: "100%",
            }}
          >
            <ProjectNotesSection
              project={project}
              userId={userId}
            />

            <ProjectDecisionsSection
              project={project}
              userId={userId}
            />
          </div>

                    {/* RISCOS */}
          <div
            style={{
              marginTop: 16,
              width: "100%",
            }}
          >
            <ProjectRisksSection
              project={project}
              userId={userId}
            />
          </div>

          {/* FINANCEIRO */}
          <div
            style={{
              marginTop: 16,
              width: "100%",
            }}
          >
            <ProjectFinanceSection
              project={project}
              currentUser={currentUser}
            />
          </div>

        </div>
      </div>
    </div>
  );
}