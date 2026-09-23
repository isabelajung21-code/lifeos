import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";
import WorkDemandModal from "../../components/modals/WorkDemandModal";
import TaskModal from "../../components/modals/TaskModal";



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

  return labels[priority] || priority;
}

function statusLabel(status) {
  const labels = {
    pendente: "Pendente",
    em_andamento: "Em andamento",
    aguardando: "Aguardando",
    concluida: "Concluída",
    cancelada: "Cancelada",
  };

  return labels[status] || status;
}

export default function WorkPage({ currentUser }) {
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [demands, setDemands] = useState([]);
  const [projects, setProjects] = useState([]);

  const [search, setSearch] = useState("");

  const [demandModalOpen, setDemandModalOpen] =
    useState(false);

  const [editingDemand, setEditingDemand] =
    useState(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadWork();
  }, [currentUser]);

  async function loadWork() {
    try {
      setLoading(true);

      const { data: user, error: userError } =
        await supabase
          .from("users")
          .select("id")
          .eq("display_name", currentUser)
          .single();

      if (userError) throw userError;

      const [
        tasksResult,
        demandsResult,
        projectsResult,
      ] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("owner_user_id", user.id)
          .eq("source_module", "trabalho")
          .is("deleted_at", null)
          .order("due_date", { ascending: true }),

        supabase
          .from("work_demands")
          .select("*")
          .eq("owner_user_id", user.id)
          .is("deleted_at", null)
          .order("due_date", { ascending: true }),

        supabase
          .from("projects")
          .select("*")
          .eq("owner_user_id", user.id)
          .eq("linked_module", "trabalho")
          .is("deleted_at", null)
          .is("archived_at", null)
          .order("due_date", { ascending: true }),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (demandsResult.error) throw demandsResult.error;
      if (projectsResult.error) throw projectsResult.error;

      setTasks(tasksResult.data || []);
      setDemands(demandsResult.data || []);
      setProjects(projectsResult.data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar módulo Trabalho:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const openTasks = tasks.filter(
    (task) => task.status !== "concluida"
  );

  const openDemands = demands.filter(
    (demand) =>
      demand.status !== "concluida" &&
      demand.status !== "cancelada"
  );

  const activeProjects = projects.filter(
    (project) =>
      project.status !== "concluido" &&
      project.status !== "cancelado"
  );

  const completedDemands = demands.filter(
    (demand) => demand.status === "concluida"
  ).length;

  const filteredDemands = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return demands;

    return demands.filter(
      (demand) =>
        demand.title?.toLowerCase().includes(term) ||
        demand.description
          ?.toLowerCase()
          .includes(term) ||
        demand.category?.toLowerCase().includes(term)
    );
  }, [demands, search]);

  function openNewDemand() {
    setEditingDemand(null);
    setDemandModalOpen(true);
  }

  function openEditDemand(demand) {
    setEditingDemand(demand);
    setDemandModalOpen(true);
  }

  function closeDemandModal() {
    setDemandModalOpen(false);
    setEditingDemand(null);
  }

  function openEditTask(task) {
    setEditingTask(task);
    setTaskModalOpen(true);
  }

  function closeTaskModal() {
    setTaskModalOpen(false);
    setEditingTask(null);
  }

  async function moveToTrash(table, item, entityType) {
    
    try {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("display_name", currentUser)
        .single();

      if (userError) throw userError;

      const now = new Date().toISOString();
      const { error: deleteError } = await supabase
        .from(table)
        .update({ deleted_at: now, deleted_by: user.id, updated_at: now })
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        module: "Trabalho",
        action: "enviou para a lixeira",
        entity_type: entityType,
        entity_id: item.id,
        entity_name: item.title,
        details: { message: `Enviou para a lixeira: ${item.title}` },
      });

      await loadWork();
    } catch (error) {
      console.error("Erro ao mover item para a Lixeira:", error);
      alert("Não foi possível mover o item para a Lixeira.");
    }
  }

  if (loading) {
    return (
      <div style={{ color: COLORS.inkSoft }}>
        Carregando trabalho...
      </div>
    );
  }

  return (
    <div>
      {/* CABEÇALHO */}
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
            Trabalho
          </h1>

          <p
            style={{
              color: COLORS.inkSoft,
              margin: "4px 0 0",
              fontSize: 12,
            }}
          >
            Organize suas demandas, tarefas e projetos
            profissionais.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewDemand}
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
          Nova demanda
        </button>
      </div>

      {/* RESUMO */}
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
          icon={<ClipboardList size={15} />}
          label="Tarefas abertas"
          value={openTasks.length}
        />

        <SummaryCard
          icon={<BriefcaseBusiness size={15} />}
          label="Demandas abertas"
          value={openDemands.length}
        />

        <SummaryCard
          icon={<FolderKanban size={15} />}
          label="Projetos ativos"
          value={activeProjects.length}
        />

        <SummaryCard
          icon={<CheckCircle2 size={15} />}
          label="Demandas concluídas"
          value={completedDemands}
        />
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* DEMANDAS */}
        <SectionCard
          title="Demandas"
          icon={<BriefcaseBusiness size={17} />}
        >
          <div
            style={{
              position: "relative",
              marginBottom: 12,
            }}
          >
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: COLORS.inkSoft,
              }}
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Buscar demanda..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                background: COLORS.surface,
                color: COLORS.ink,
                padding: "8px 10px 8px 31px",
                outline: "none",
                fontSize: 11,
              }}
            />
          </div>

          {filteredDemands.length === 0 ? (
            <EmptyText>
              Nenhuma demanda cadastrada.
            </EmptyText>
          ) : (
            filteredDemands.map((demand) => (
              <div
                key={demand.id}
                style={{
                  padding: "9px 0",
                  borderBottom:
                    `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: COLORS.ink,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {demand.title}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        flexWrap: "wrap",
                        marginTop: 5,
                      }}
                    >
                      <Badge>
                        {statusLabel(demand.status)}
                      </Badge>

                      <Badge>
                        {priorityLabel(
                          demand.priority
                        )}
                      </Badge>

                      {demand.category && (
                        <Badge>
                          {demand.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        color: COLORS.inkSoft,
                        fontSize: 9,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(demand.due_date)}
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditDemand(demand)}
                      title="Editar demanda"
                      style={{
                        width: 28,
                        height: 28,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        background: COLORS.surface,
                        color: COLORS.primaryDark,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        moveToTrash("work_demands", demand, "work_demand")
                      }
                      title="Excluir demanda"
                      style={{
                        width: 28,
                        height: 28,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        background: COLORS.surface,
                        color: COLORS.danger,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </SectionCard>

        {/* COLUNA DIREITA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <SectionCard
            title="Tarefas"
            icon={<ClipboardList size={17} />}
          >
            {openTasks.length === 0 ? (
              <EmptyText>
                Nenhuma tarefa de trabalho aberta.
              </EmptyText>
            ) : (
              openTasks.slice(0, 6).map((task) => (
                <MiniItem
                  key={task.id}
                  title={task.title}
                  detail={formatDate(task.due_date)}
                  onEdit={() => openEditTask(task)}
                  onDelete={() => moveToTrash("tasks", task, "task")}
                />
              ))
            )}
          </SectionCard>

          <SectionCard
            title="Projetos"
            icon={<FolderKanban size={17} />}
          >
            {activeProjects.length === 0 ? (
              <EmptyText>
                Nenhum projeto profissional ativo.
              </EmptyText>
            ) : (
              activeProjects
                .slice(0, 5)
                .map((project) => (
                  <MiniItem
                    key={project.id}
                    title={project.title}
                    detail={`${Number(
                      project.progress || 0
                    )}%`}
                  />
                ))
            )}
          </SectionCard>

          <SectionCard
            title="Próximos prazos"
            icon={<CalendarDays size={17} />}
          >
            {openDemands
              .filter((item) => item.due_date)
              .slice(0, 5)
              .map((item) => (
                <MiniItem
                  key={item.id}
                  title={item.title}
                  detail={formatDate(item.due_date)}
                />
              ))}

            {openDemands.filter(
              (item) => item.due_date
            ).length === 0 && (
              <EmptyText>
                Nenhum prazo de demanda.
              </EmptyText>
            )}
          </SectionCard>
        </div>
      </div>

      <WorkDemandModal
        open={demandModalOpen}
        currentUser={currentUser}
        demand={editingDemand}
        onClose={closeDemandModal}
        onSaved={loadWork}
      />

      <TaskModal
        open={taskModalOpen}
        currentUser={currentUser}
        taskToEdit={editingTask}
        onClose={closeTaskModal}
        onSaved={async () => {
          closeTaskModal();
          await loadWork();
        }}
      />
    </div>
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
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: COLORS.inkSoft,
            fontSize: 10,
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

function SectionCard({ title, icon, children }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 11,
          color: COLORS.ink,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <span
          style={{ color: COLORS.primaryDark }}
        >
          {icon}
        </span>

        {title}
      </div>

      {children}
    </div>
  );
}

function MiniItem({ title, detail, onEdit, onDelete }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 0",
        borderBottom:
          `1px solid ${COLORS.border}`,
      }}
    >
      <span
        style={{
          color: COLORS.ink,
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        {title}
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: COLORS.inkSoft,
            fontSize: 9,
            whiteSpace: "nowrap",
          }}
        >
          {detail}
        </span>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title="Editar"
            style={miniActionButtonStyle}
          >
            <Pencil size={12} />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Excluir"
            style={{ ...miniActionButtonStyle, color: COLORS.danger }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyText({ children }) {
  return (
    <div
      style={{
        color: COLORS.inkSoft,
        fontSize: 10,
        padding: "8px 0",
      }}
    >
      {children}
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
        fontSize: 8,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

const miniActionButtonStyle = {
  width: 26,
  height: 26,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 7,
  background: COLORS.surface,
  color: COLORS.primaryDark,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};
