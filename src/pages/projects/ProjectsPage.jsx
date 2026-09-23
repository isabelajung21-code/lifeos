import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Columns3,
  FolderKanban,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
} from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";
import ProjectModal from "../../components/modals/ProjectModal";
import ProjectDetailsModal from "../../components/modals/ProjectDetailsModal";
import LifeGoalsSection from "./LifeGoalsSection";



function formatDate(value) {
  if (!value) return "Sem prazo";

  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "pt-BR"
  );
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

function priorityLabel(priority) {
  const labels = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };

  return labels[priority] || priority;
}

function moduleLabel(module) {
  const labels = {
    trabalho: "Trabalho",
    conteudo: "Conteúdo",
    casa: "Casa",
    estudos: "Estudos",
    pessoal: "Pessoal",
  };

  return labels[module] || null;
}

export default function ProjectsPage({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectFinances, setProjectFinances] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [archiveFilter, setArchiveFilter] = useState("ativos");

  const [viewMode, setViewMode] = useState("cards");

  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [selectedProject, setSelectedProject] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  

  useEffect(() => {
    loadProjects();
  }, [currentUser]);

  async function loadProjects() {
    try {
      setLoading(true);

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("display_name", currentUser)
        .single();

      if (userError) throw userError;

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const loadedProjects = data || [];

      setProjects(loadedProjects);

      // =====================================
      // FINANCEIRO DOS PROJETOS
      // =====================================

      const { data: transactions, error: financeError } =
        await supabase
          .from("finance_transactions")
          .select(
            "id, source_id, amount, status, type"
          )
          .eq("source_module", "projetos")
          .eq("type", "despesa")
          .is("deleted_at", null);

      if (financeError) throw financeError;

      const finances = {};

      loadedProjects.forEach((project) => {
        finances[project.id] = {
          paid: 0,
          committed: 0,
        };
      });

      (transactions || []).forEach((transaction) => {
        if (!transaction.source_id) return;

        if (!finances[transaction.source_id]) {
          finances[transaction.source_id] = {
            paid: 0,
            committed: 0,
          };
        }

        const amount = Number(
          transaction.amount || 0
        );

        if (transaction.status === "pago") {
          finances[transaction.source_id].paid +=
            amount;
        } else if (
          transaction.status !== "cancelado"
        ) {
          finances[
            transaction.source_id
          ].committed += amount;
        }
      });

      setProjectFinances(finances);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !term ||
        project.title?.toLowerCase().includes(term) ||
        project.description?.toLowerCase().includes(term) ||
        project.category?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "todos" ||
        project.status === statusFilter;

      const matchesArchive =
        archiveFilter === "arquivados"
          ? !!project.archived_at
          : !project.archived_at;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesArchive
      );
    });
  }, [
    projects,
    search,
    statusFilter,
    archiveFilter,
  ]);

  const activeProjects = projects.filter(
    (project) => !project.archived_at
  );

  const activeCount = activeProjects.filter(
    (project) => project.status === "em_andamento"
  ).length;

  const planningCount = projects.filter(
    (project) => project.status === "planejamento"
  ).length;

  const completedCount = projects.filter(
    (project) => project.status === "concluido"
  ).length;

  function openNewProject() {
    setEditingProject(null);
    setModalOpen(true);
  }

  function openEditProject(project) {
    setEditingProject(project);
    setModalOpen(true);
  }

  function openProject(project) {
    setSelectedProject(project);
    setDetailsOpen(true);
  }

  async function toggleArchiveProject(project) {
    const isArchived = !!project.archived_at;

    try {
      const { data: user, error: userError } =
        await supabase
          .from("users")
          .select("id")
          .eq("display_name", currentUser)
          .single();

      if (userError) throw userError;

      const archivedAt = isArchived
        ? null
        : new Date().toISOString();

      const { error } = await supabase
        .from("projects")
        .update({
          archived_at: archivedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (error) throw error;

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        module: "Projetos",
        action: isArchived
          ? "Projeto desarquivado"
          : "Projeto arquivado",
        entity_type: "project",
        entity_id: project.id,
        entity_name: project.title,
        details: {
          message: isArchived
            ? `Projeto "${project.title}" desarquivado.`
            : `Projeto "${project.title}" arquivado.`,
        },
      });

      if (selectedProject?.id === project.id) {
        setDetailsOpen(false);
        setSelectedProject(null);
      }

      await loadProjects();
    } catch (error) {
      console.error(
        "Erro ao alterar arquivamento do projeto:",
        error
      );

      alert(
        isArchived
          ? "Não foi possível desarquivar o projeto."
          : "Não foi possível arquivar o projeto."
      );
    }
  }

  async function deleteProject(project) {

    try {
      const { data: user, error: userError } =
        await supabase
          .from("users")
          .select("id")
          .eq("display_name", currentUser)
          .single();

      if (userError) throw userError;

      const deletedAt = new Date().toISOString();

      const { error } = await supabase
        .from("projects")
        .update({
          deleted_at: deletedAt,
          deleted_by: user.id,
          updated_at: deletedAt,
        })
        .eq("id", project.id);

      if (error) throw error;

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        module: "Projetos",
        action: "Projeto movido para a Lixeira",
        entity_type: "project",
        entity_id: project.id,
        entity_name: project.title,
        details: {
          message: `Projeto "${project.title}" movido para a Lixeira.`,
        },
      });

      if (selectedProject?.id === project.id) {
        setDetailsOpen(false);
        setSelectedProject(null);
      }

      await loadProjects();
    } catch (error) {
      console.error(
        "Erro ao mover projeto para a Lixeira:",
        error
      );

      alert(
        "Não foi possível mover o projeto para a Lixeira."
      );
    }
  }

  async function handleKanbanDrop(projectId, newStatus) {
    const project = projects.find(
      (item) => item.id === projectId
    );

    if (!project) return;

    if (project.status === newStatus) return;

    const previousProjects = [...projects];

    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "concluido") {
      updateData.completed_at =
        new Date().toISOString();
      updateData.progress = 100;
    } else if (project.status === "concluido") {
      updateData.completed_at = null;
    }

    setProjects((current) =>
      current.map((item) =>
        item.id === projectId
          ? {
              ...item,
              ...updateData,
            }
          : item
      )
    );

    try {
      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);

      if (error) throw error;

      if (selectedProject?.id === projectId) {
        setSelectedProject((current) =>
          current
            ? {
                ...current,
                ...updateData,
              }
            : current
        );
      }
    } catch (error) {
      console.error(
        "Erro ao alterar status do projeto:",
        error
      );

      setProjects(previousProjects);

      alert(
        "Não foi possível alterar o status do projeto."
      );
    }
  }

  const inputStyle = {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 9,
    background: COLORS.surface,
    color: COLORS.ink,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div style={{ color: COLORS.inkSoft }}>
        Carregando projetos...
      </div>
    );
  }

  return (
    <>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: COLORS.ink,
                fontSize: 20,
                letterSpacing: "-0.3px",
              }}
            >
              Projetos
            </h1>

            <p
              style={{
                color: COLORS.inkSoft,
                margin: "4px 0 0",
                fontSize: 12,
              }}
            >
              Acompanhe seus projetos, etapas e prazos.
            </p>
          </div>

          <button
            onClick={openNewProject}
            style={{
              border: 0,
              borderRadius: 9,
              background: COLORS.primary,
              color: "#fff",
              padding: "9px 12px",
              display: "flex",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Plus size={16} />
            Novo projeto
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <SummaryCard
            icon={<FolderKanban size={15} />}
            label="Total de projetos"
            value={activeProjects.length}
          />

          <SummaryCard
            icon={<Target size={15} />}
            label="Em andamento"
            value={activeCount}
          />

          <SummaryCard
            icon={<CalendarDays size={15} />}
            label="Planejamento"
            value={planningCount}
          />

          <SummaryCard
            icon={<Target size={15} />}
            label="Concluídos"
            value={completedCount}
          />
        </div>

        <LifeGoalsSection currentUser={currentUser} />

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 280px",
            }}
          >
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: COLORS.inkSoft,
              }}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar projeto..."
              style={{
                ...inputStyle,
                width: "100%",
                padding: "8px 10px 8px 32px",
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            style={{
              ...inputStyle,
              padding: "8px 10px",
              minWidth: 175,
            }}
          >
            <option value="todos">Todos os status</option>
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

          <select
            value={archiveFilter}
            onChange={(e) => {
              setArchiveFilter(e.target.value);

              if (e.target.value === "arquivados") {
                setViewMode("cards");
              }
            }}
            style={{
              ...inputStyle,
              padding: "10px 11px",
              minWidth: 145,
            }}
          >
            <option value="ativos">Projetos ativos</option>
            <option value="arquivados">
              Arquivados
            </option>
          </select>
          <div
            style={{
              display: "flex",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 9,
              overflow: "hidden",
              background: COLORS.surface,
            }}
          >
            <button
              onClick={() => setViewMode("cards")}
              title="Visualização em cards"
              style={{
                border: 0,
                borderRight: `1px solid ${COLORS.border}`,
                background:
                  viewMode === "cards"
                    ? COLORS.primaryLight
                    : COLORS.surface,
                color:
                  viewMode === "cards"
                    ? COLORS.primaryDark
                    : COLORS.inkSoft,
                padding: "7px 9px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <LayoutGrid size={15} />
              Cards
            </button>

            <button
              onClick={() => setViewMode("list")}
              title="Visualização em lista"
              style={{
                border: 0,
                borderRight: `1px solid ${COLORS.border}`,
                background:
                  viewMode === "list"
                    ? COLORS.primaryLight
                    : COLORS.surface,
                color:
                  viewMode === "list"
                    ? COLORS.primaryDark
                    : COLORS.inkSoft,
                padding: "7px 9px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <List size={15} />
              Lista
            </button>

            <button
              onClick={() => setViewMode("kanban")}
              title="Visualização Kanban"
              style={{
                border: 0,
                background:
                  viewMode === "kanban"
                    ? COLORS.primaryLight
                    : COLORS.surface,
                color:
                  viewMode === "kanban"
                    ? COLORS.primaryDark
                    : COLORS.inkSoft,
                padding: "7px 9px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                borderRight: `1px solid ${COLORS.border}`,
              }}
            >
              <Columns3 size={15} />
              Kanban
            </button>

            <button
              onClick={() => setViewMode("calendar")}
              title="Visualização em calendário"
              style={{
                border: 0,
                background:
                  viewMode === "calendar"
                    ? COLORS.primaryLight
                    : COLORS.surface,
                color:
                  viewMode === "calendar"
                    ? COLORS.primaryDark
                    : COLORS.inkSoft,
                padding: "7px 9px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <CalendarDays size={15} />
              Calendário
            </button>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              borderRadius: 14,
              padding: 28,
              textAlign: "center",
            }}
          >
            <FolderKanban
              size={28}
              style={{
                color: COLORS.primary,
                marginBottom: 8,
              }}
            />

            <div
              style={{
                color: COLORS.ink,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {projects.length === 0
                ? "Nenhum projeto ainda"
                : "Nenhum projeto encontrado"}
            </div>

            <div
              style={{
                color: COLORS.inkSoft,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {projects.length === 0
                ? "Crie seu primeiro projeto para começar."
                : "Tente alterar os filtros de busca."}
            </div>
          </div>
        ) : viewMode === "cards" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 270px), 1fr))",
              gap: 14,
            }}
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                finance={
                  projectFinances[project.id] || {
                    paid: 0,
                    committed: 0,
                  }
                }
                onEdit={() =>
                  openEditProject(project)
                }
                onOpen={() =>
                  openProject(project)
                }
                onArchive={() =>
                  toggleArchiveProject(project)
                }
                onDelete={() =>
                  deleteProject(project)
                }
              />
            ))}
          </div>
        ) : viewMode === "list" ? (
          <ProjectsList
            projects={filteredProjects}
            onOpen={openProject}
            onEdit={openEditProject}
          />
        ) : viewMode === "calendar" ? (
          <ProjectsCalendar
            projects={filteredProjects}
            calendarDate={calendarDate}
            setCalendarDate={setCalendarDate}
            onOpen={openProject}
          />
        ) : (
          
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(5, minmax(215px, 1fr))",
                gap: 12,
                alignItems: "start",
                overflowX: "auto",
                paddingBottom: 8,
              }}
            >
              <KanbanColumn
                id="planejamento"
                title="Planejamento"
                projects={filteredProjects.filter(
                  (project) =>
                    project.status === "planejamento"
                )}
                onOpen={openProject}
                onEdit={openEditProject}
                onDropProject={handleKanbanDrop}
              />

              <KanbanColumn
                id="em_andamento"
                title="Em andamento"
                projects={filteredProjects.filter(
                  (project) =>
                    project.status === "em_andamento"
                )}
                onOpen={openProject}
                onEdit={openEditProject}
                onDropProject={handleKanbanDrop}
              />

              <KanbanColumn
                id="pausado"
                title="Pausado"
                projects={filteredProjects.filter(
                  (project) =>
                    project.status === "pausado"
                )}
                onOpen={openProject}
                onEdit={openEditProject}
                onDropProject={handleKanbanDrop}
              />

              <KanbanColumn
                id="concluido"
                title="Concluído"
                projects={filteredProjects.filter(
                  (project) =>
                    project.status === "concluido"
                )}
                onOpen={openProject}
                onEdit={openEditProject}
                onDropProject={handleKanbanDrop}
              />

              <KanbanColumn
                id="cancelado"
                title="Cancelado"
                projects={filteredProjects.filter(
                  (project) =>
                    project.status === "cancelado"
                )}
                onOpen={openProject}
                onEdit={openEditProject}
                onDropProject={handleKanbanDrop}
              />
            </div>
          
        )}
      </div>

      <ProjectModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
        onSaved={loadProjects}
        currentUser={currentUser}
        project={editingProject}
      />

      <ProjectDetailsModal
        open={detailsOpen}
        onClose={() => {
            setDetailsOpen(false);
            setSelectedProject(null);
        }}
        project={selectedProject}
        currentUser={currentUser}
        onProjectUpdated={async () => {
            await loadProjects();

            if (selectedProject?.id) {
            const { data } = await supabase
                .from("projects")
                .select("*")
                .eq("id", selectedProject.id)
                .single();

            if (data) {
                setSelectedProject(data);
            }
            }
        }}
        />
    </>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: COLORS.primaryLight,
          color: COLORS.primaryDark,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: COLORS.inkSoft,
            fontSize: 10,
            marginBottom: 2,
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: COLORS.ink,
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  finance,
  onEdit,
  onOpen,
  onArchive,
  onDelete,
}) {
  const progress = Number(
    project.progress || 0
  );

  const budget = Number(
    project.budget_value || 0
  );

  const paid = Number(
    finance?.paid || 0
  );

  const committed = Number(
    finance?.committed || 0
  );

  const available =
    budget - paid - committed;

  function money(value) {
    return Number(value || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  return (
    <div
        onClick={onOpen}
        style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: 13,
            minWidth: 0,
            cursor: "pointer",
        }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: COLORS.ink,
              fontWeight: 700,
              fontSize: 14,
              wordBreak: "break-word",
            }}
          >
            {project.title}
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 7,
            }}
          >
            <Badge>{statusLabel(project.status)}</Badge>

            <Badge>
              Prioridade {priorityLabel(project.priority)}
            </Badge>

            {project.linked_module && (
              <Badge>
                {moduleLabel(project.linked_module)}
              </Badge>
            )}
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
            onClick={(e) => {
              e.stopPropagation();
              onArchive();
            }}
            title={
              project.archived_at
                ? "Desarquivar projeto"
                : "Arquivar projeto"
            }
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.inkSoft,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Archive size={14} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Mover projeto para a Lixeira"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.danger,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Editar projeto"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.primaryDark,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {project.description && (
        <div
          style={{
            color: COLORS.inkSoft,
            fontSize: 11,
            lineHeight: 1.5,
            marginTop: 9,
          }}
        >
          {project.description}
        </div>
      )}

      <div style={{ marginTop: 15 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: COLORS.inkSoft,
            fontSize: 10,
            marginBottom: 6,
          }}
        >
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>

        <div
          style={{
            height: 6,
            background: COLORS.primaryLight,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: COLORS.primary,
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      {budget > 0 && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              color: COLORS.inkSoft,
              fontSize: 9,
              fontWeight: 700,
              marginBottom: 7,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Financeiro
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 7,
            }}
          >
            <div>
              <div
                style={{
                  color: COLORS.inkSoft,
                  fontSize: 8,
                }}
              >
                Orçamento
              </div>

              <div
                style={{
                  color: COLORS.ink,
                  fontSize: 10,
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {money(budget)}
              </div>
            </div>

            <div>
              <div
                style={{
                  color: COLORS.inkSoft,
                  fontSize: 8,
                }}
              >
                Gasto
              </div>

              <div
                style={{
                  color: COLORS.ink,
                  fontSize: 10,
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {money(paid)}
              </div>
            </div>

            <div>
              <div
                style={{
                  color: COLORS.inkSoft,
                  fontSize: 8,
                }}
              >
                Disponível
              </div>

              <div
                style={{
                  color:
                    available < 0
                      ? COLORS.danger
                      : COLORS.primaryDark,
                  fontSize: 10,
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {money(available)}
              </div>
            </div>
          </div>

          {committed > 0 && (
            <div
              style={{
                color: COLORS.inkSoft,
                fontSize: 8,
                marginTop: 6,
              }}
            >
              + {money(committed)} comprometido
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          color: COLORS.inkSoft,
          fontSize: 10,
        }}
      >
        <span>
          Prazo: {formatDate(project.due_date)}
        </span>

        {project.category && (
          <span>{project.category}</span>
        )}
      </div>
    </div>
  );
}

function ProjectsList({
  projects,
  onOpen,
  onEdit,
}) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          minWidth: 900,
        }}
      >
        {/* CABEÇALHO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(220px, 2fr) 120px 110px 130px 150px 105px 105px 45px",
            gap: 12,
            alignItems: "center",
            padding: "11px 14px",
            borderBottom: `1px solid ${COLORS.border}`,
            background: "#F8FAFB",
            color: COLORS.inkSoft,
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          <span>Projeto</span>
          <span>Área</span>
          <span>Prioridade</span>
          <span>Status</span>
          <span>Progresso</span>
          <span>Início</span>
          <span>Prazo</span>
          <span />
        </div>

        {/* PROJETOS */}
        {projects.map((project, index) => {
          const progress =
            Number(project.progress || 0);

          return (
            <div
              key={project.id}
              onClick={() => onOpen(project)}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px, 2fr) 120px 110px 130px 150px 105px 105px 45px",
                gap: 12,
                alignItems: "center",
                padding: "12px 14px",
                borderBottom:
                  index < projects.length - 1
                    ? `1px solid ${COLORS.border}`
                    : "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "#F8FAFB";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  COLORS.surface;
              }}
            >
              {/* PROJETO */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: COLORS.ink,
                    fontSize: 12,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project.title}
                </div>

                {project.category && (
                  <div
                    style={{
                      color: COLORS.inkSoft,
                      fontSize: 9,
                      marginTop: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.category}
                  </div>
                )}
              </div>

              {/* ÁREA */}
              <div
                style={{
                  color: COLORS.inkSoft,
                  fontSize: 10,
                }}
              >
                {project.linked_module
                  ? moduleLabel(
                      project.linked_module
                    )
                  : "—"}
              </div>

              {/* PRIORIDADE */}
              <div>
                <Badge>
                  {priorityLabel(
                    project.priority
                  )}
                </Badge>
              </div>

              {/* STATUS */}
              <div>
                <Badge>
                  {statusLabel(
                    project.status
                  )}
                </Badge>
              </div>

              {/* PROGRESSO */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 7,
                    color: COLORS.inkSoft,
                    fontSize: 9,
                    marginBottom: 4,
                  }}
                >
                  <span>{progress}%</span>
                </div>

                <div
                  style={{
                    height: 5,
                    background:
                      COLORS.primaryLight,
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background:
                        COLORS.primary,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>

              {/* INÍCIO */}
              <div
                style={{
                  color: COLORS.inkSoft,
                  fontSize: 10,
                }}
              >
                {project.start_date
                  ? formatDate(
                      project.start_date
                    )
                  : "—"}
              </div>

              {/* PRAZO */}
              <div
                style={{
                  color: COLORS.inkSoft,
                  fontSize: 10,
                }}
              >
                {project.due_date
                  ? formatDate(
                      project.due_date
                    )
                  : "—"}
              </div>

              {/* EDITAR */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
                title="Editar projeto"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.surface,
                  color: COLORS.primaryDark,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Pencil size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectsCalendar({
  projects,
  calendarDate,
  setCalendarDate,
  onOpen,
}) {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const today = new Date();

  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const monthLabel = calendarDate.toLocaleDateString(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    }
  );

  const firstDay = new Date(year, month, 1);
  const firstWeekDay = firstDay.getDay();

  const lastDay = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const previousMonthLastDay = new Date(
    year,
    month,
    0
  ).getDate();

  const cells = [];

  for (let i = firstWeekDay - 1; i >= 0; i--) {
    const day =
      previousMonthLastDay - i;

    const date = new Date(
      year,
      month - 1,
      day
    );

    cells.push({
      date,
      currentMonth: false,
    });
  }

  for (let day = 1; day <= lastDay; day++) {
    cells.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  let nextMonthDay = 1;

  while (cells.length < 42) {
    cells.push({
      date: new Date(
        year,
        month + 1,
        nextMonthDay
      ),
      currentMonth: false,
    });

    nextMonthDay++;
  }

  function dateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(
        2,
        "0"
      ),
      String(date.getDate()).padStart(
        2,
        "0"
      ),
    ].join("-");
  }

  function previousMonth() {
    setCalendarDate(
      new Date(year, month - 1, 1)
    );
  }

  function nextMonth() {
    setCalendarDate(
      new Date(year, month + 1, 1)
    );
  }

  function goToday() {
    setCalendarDate(new Date());
  }

  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* CABEÇALHO */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={previousMonth}
            title="Mês anterior"
            style={calendarNavButtonStyle}
          >
            <ChevronLeft size={15} />
          </button>

          <button
            onClick={goToday}
            style={{
              ...calendarNavButtonStyle,
              width: "auto",
              padding: "0 11px",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            Hoje
          </button>

          <button
            onClick={nextMonth}
            title="Próximo mês"
            style={calendarNavButtonStyle}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div
          style={{
            color: COLORS.ink,
            fontSize: 15,
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        >
          {monthLabel}
        </div>

        <div
          style={{
            color: COLORS.inkSoft,
            fontSize: 10,
          }}
        >
          {
            projects.filter(
              (project) => project.due_date
            ).length
          }{" "}
          projeto(s) com prazo
        </div>
      </div>

      {/* ÁREA ROLÁVEL */}
      <div
        style={{
          overflowX: "auto",
        }}
      >
        <div
          style={{
            minWidth: 850,
          }}
        >
          {/* DIAS DA SEMANA */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(7, 1fr)",
              background: "#F8FAFB",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            {[
              "Dom",
              "Seg",
              "Ter",
              "Qua",
              "Qui",
              "Sex",
              "Sáb",
            ].map((day) => (
              <div
                key={day}
                style={{
                  padding: "9px 8px",
                  textAlign: "center",
                  color: COLORS.inkSoft,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* GRADE */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(7, 1fr)",
            }}
          >
            {cells.map(
              (
                {
                  date,
                  currentMonth,
                },
                index
              ) => {
                const key = dateKey(date);

                const isToday =
                  key === todayKey;

                const dayProjects =
                  projects.filter(
                    (project) =>
                      project.due_date ===
                      key
                  );

                return (
                  <div
                    key={`${key}-${index}`}
                    style={{
                      minHeight: 120,
                      padding: 7,
                      borderRight:
                        (index + 1) % 7 !==
                        0
                          ? `1px solid ${COLORS.border}`
                          : "none",
                      borderBottom:
                        index < 35
                          ? `1px solid ${COLORS.border}`
                          : "none",
                      background:
                        currentMonth
                          ? COLORS.surface
                          : "#FAFBFC",
                      boxSizing:
                        "border-box",
                    }}
                  >
                    {/* NÚMERO DO DIA */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "flex-end",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 25,
                          height: 25,
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          background:
                            isToday
                              ? COLORS.primary
                              : "transparent",
                          color: isToday
                            ? "#fff"
                            : currentMonth
                            ? COLORS.ink
                            : COLORS.inkSoft,
                          fontSize: 10,
                          fontWeight:
                            isToday
                              ? 700
                              : 500,
                        }}
                      >
                        {date.getDate()}
                      </div>
                    </div>

                    {/* PROJETOS DO DIA */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: 4,
                      }}
                    >
                      {dayProjects.map(
                        (project) => (
                          <button
                            key={project.id}
                            onClick={() =>
                              onOpen(
                                project
                              )
                            }
                            title={
                              project.title
                            }
                            style={{
                              width: "100%",
                              border: 0,
                              borderRadius: 6,
                              padding:
                                "5px 6px",
                              background:
                                COLORS.primaryLight,
                              color:
                                COLORS.primaryDark,
                              textAlign:
                                "left",
                              cursor:
                                "pointer",
                              fontSize: 9,
                              fontWeight:
                                600,
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {project.title}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const calendarNavButtonStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.primaryDark,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

function KanbanColumn({
  id,
  title,
  projects,
  onOpen,
  onEdit,
  onDropProject,
}) {
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(event) {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    setIsOver(true);
  }

  function handleDragLeave(event) {
    const current = event.currentTarget;

    if (
      !current.contains(event.relatedTarget)
    ) {
      setIsOver(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();

    setIsOver(false);

    const projectId =
      event.dataTransfer.getData(
        "text/plain"
      );

    if (!projectId) return;

    onDropProject(projectId, id);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background: isOver
          ? COLORS.primaryLight
          : "#F8FAFB",
        border: `1px solid ${
          isOver
            ? COLORS.primary
            : COLORS.border
        }`,
        borderRadius: 14,
        minHeight: 180,
        padding: 10,
        transition: "0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          padding: "3px 3px 10px",
        }}
      >
        <div
          style={{
            color: COLORS.ink,
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {title}
        </div>

        <div
          style={{
            minWidth: 22,
            height: 22,
            padding: "0 6px",
            borderRadius: 999,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.inkSoft,
            display: "grid",
            placeItems: "center",
            fontSize: 9,
            fontWeight: 700,
          }}
        >
          {projects.length}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 9,
          minHeight: 90,
        }}
      >
        {projects.length === 0 ? (
          <div
            style={{
              border: `1px dashed ${COLORS.border}`,
              borderRadius: 10,
              padding: "18px 10px",
              textAlign: "center",
              color: COLORS.inkSoft,
              fontSize: 10,
            }}
          >
            Arraste um projeto para cá
          </div>
        ) : (
          projects.map((project) => (
            <KanbanProjectCard
              key={project.id}
              project={project}
              onOpen={() =>
                onOpen(project)
              }
              onEdit={() =>
                onEdit(project)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanProjectCard({
  project,
  onOpen,
  onEdit,
}) {
  const progress =
    Number(project.progress || 0);

  function handleDragStart(event) {
    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      project.id
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onOpen}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 11,
        padding: 11,
        cursor: "grab",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            color: COLORS.ink,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.35,
            minWidth: 0,
            wordBreak: "break-word",
          }}
        >
          {project.title}
        </div>

        <button
          draggable={false}
          onMouseDown={(e) =>
            e.stopPropagation()
          }
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Editar projeto"
          style={{
            width: 27,
            height: 27,
            flexShrink: 0,
            borderRadius: 7,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            color: COLORS.primaryDark,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <Pencil size={12} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 5,
          flexWrap: "wrap",
          marginTop: 7,
        }}
      >
        <Badge>
          {priorityLabel(
            project.priority
          )}
        </Badge>

        {project.linked_module && (
          <Badge>
            {moduleLabel(
              project.linked_module
            )}
          </Badge>
        )}
      </div>

      <div style={{ marginTop: 11 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: COLORS.inkSoft,
            fontSize: 9,
            marginBottom: 5,
          }}
        >
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>

        <div
          style={{
            height: 5,
            background:
              COLORS.primaryLight,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: COLORS.primary,
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          paddingTop: 9,
          borderTop: `1px solid ${COLORS.border}`,
          color: COLORS.inkSoft,
          fontSize: 9,
        }}
      >
        Prazo: {formatDate(project.due_date)}
      </div>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span
      style={{
        background: COLORS.primaryLight,
        color: COLORS.primaryDark,
        padding: "3px 7px",
        borderRadius: 999,
        fontSize: 9,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}