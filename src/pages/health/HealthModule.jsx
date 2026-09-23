import { useEffect, useState } from "react";
import "./HealthModule.css";

import {
  getHistoryLogs,
  addHistoryLog,

  getMeasurements,
  addMeasurement,
  deleteMeasurement as deleteMeasurementFromSupabase,

  getBioimpedanceRecords,
  addBioimpedance,
  deleteBioimpedance,

  getCheckIns,
  saveCheckIn,
  deleteCheckIn as deleteCheckInFromSupabase,

  getExams,
  addExam,
  deleteExam as deleteExamFromSupabase,

  getNutritionGoals,
  saveNutritionGoals,
  getFoods,
  addFood,
  deleteFood as deleteFoodFromSupabase,
  getNutritionEntries,
  addNutritionEntry,
  deleteNutritionEntry,

  getSubstitutionGroups,
  addSubstitutionGroup,
  addSubstitutionItem,
  deleteSubstitutionItem as deleteSubstitutionItemFromSupabase,
  deleteSubstitutionGroup as deleteSubstitutionGroupFromSupabase,
  replaceSubstitutionGroups,

  getWorkoutPlans,
  addWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan as deleteWorkoutPlanFromSupabase,

  getWorkoutSessions,
  addWorkoutSession,
  deleteWorkoutSession as deleteWorkoutSessionFromSupabase,
  updateWorkoutSession,

  getSleepRecords,
  addSleepRecord,
  updateSleepRecord,
  deleteSleepRecord as deleteSleepRecordFromSupabase,
} from "../../services/healthService";


const menu = [
  "Visão Geral",
  "Alimentação",
  "Medidas",
  "Bioimpedância",
  "Exames",
  "Sono",
  "Treinos",
  "Performance",
  "Evolução",
  "Check-in",
  "Histórico",
];

export default function HealthModule({ currentUser }) {
  const [historyLogs, setHistoryLogs] = useState([]);

useEffect(() => {
  async function loadHistory() {
    try {
      const data = await getHistoryLogs();
      setHistoryLogs(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  }

  loadHistory();
}, []);

async function addHistory(
  action,
  module,
  description = ""
) {
  try {
    const created = await addHistoryLog(
      currentUser,
      action,
      module,
      description
    );

    const newLog = {
      id: created.id,
      user: created.user_name,
      action: created.action,
      module: created.module,
      description: created.description || "",
      createdAt: created.created_at,
    };

    setHistoryLogs((previous) => [
      newLog,
      ...previous,
    ]);
  } catch (error) {
    console.error(
      "Erro ao registrar histórico:",
      error
    );
  }
}

  const [tab, setTab] = useState(() => {
    const requestedTab = sessionStorage.getItem(
      "lifeos-health-tab"
    );

    sessionStorage.removeItem("lifeos-health-tab");

    return requestedTab || "Visão Geral";
  });
  
  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <h1>EVOLVE</h1>
          <p>Saúde & Performance</p>
        </div>

        <nav>
          {menu.map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">MEU PAINEL</span>
            <h2>{tab}</h2>
          </div>
<div className="topbarActions">

  <div className="currentUserInfo">
    <div className="currentUserAvatar">
      {currentUser === "Isabela" ? "IJ" : "ES"}
    </div>

    <div>
      <span>Usuário</span>
      <strong>{currentUser}</strong>
    </div>
  </div>

</div>
          
        </header>

        {tab === "Visão Geral" ? (
          <Dashboard setTab={setTab}/>

        ) : tab === "Alimentação" ? (
          <NutritionPage
            currentUser={currentUser}
            addHistory={addHistory}
          />
        ) : tab === "Medidas" ? (
          <MeasurementsPage
            currentUser={currentUser}
            addHistory={addHistory}
          />
        ) : tab === "Bioimpedância" ? (
          <BioimpedancePage
            currentUser={currentUser}
            addHistory={addHistory}
          />
        ) : tab === "Exames" ? (
          <ExamsPage
            currentUser={currentUser}
            addHistory={addHistory}
          />
        ) : tab === "Sono" ? (
          <SleepPage
            currentUser={currentUser}
            addHistory={addHistory}
          />
        ) : tab === "Treinos" ? (
          <WorkoutsPage
            currentUser={currentUser}
            addHistory={addHistory}          
          />
        ) : tab === "Performance" ? (
          <PerformancePage
            currentUser={currentUser}
            addHistory={addHistory}          
          />
        ) : tab === "Evolução" ? (
          <EvolutionPage
            currentUser={currentUser}
            addHistory={addHistory}          
          />
        ) : tab === "Check-in" ? (
          <CheckInPage
            currentUser={currentUser}
            addHistory={addHistory}
          />
        ) : tab === "Histórico" ? (
          <HistoryPage logs={historyLogs} />
        ) : (
          <EmptyPage title={tab} />
        )}
      </main>
    </div>
  );
}

function Dashboard({ setTab }) {
  const [data, setData] = useState({
    goals: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },

    entries: [],
    measurements: [],
    bioimpedance: [],
    sessions: [],
    checkins: [],
    sleepRecords: []
  });

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          goals,
          entries,
          measurements,
          bioimpedance,
          sessions,
          checkins,
          sleepRecords,
        ] = await Promise.all([
          getNutritionGoals(),
          getNutritionEntries(),
          getMeasurements(),
          getBioimpedanceRecords(),
          getWorkoutSessions(),
          getCheckIns(),
          getSleepRecords(),
        ]);

        setData({
          goals,
          entries,
          measurements,
          bioimpedance,
          sessions,
          checkins,
          sleepRecords,
        });
      } catch (error) {
        console.error(
          "Erro ao carregar visão geral:",
          error
        );
      } finally {
        setDashboardLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const todayEntries = data.entries.filter(
    (entry) => entry.date === today
  );

  const totals = todayEntries.reduce(
    (acc, entry) => ({
      calories:
        acc.calories +
        Number(entry.calories || 0),

      protein:
        acc.protein +
        Number(entry.protein || 0),

      carbs:
        acc.carbs +
        Number(entry.carbs || 0),

      fat:
        acc.fat +
        Number(entry.fat || 0),

      fiber:
        acc.fiber +
        Number(entry.fiber || 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    }
  );

  const latestMeasurement =
    data.measurements[0] || null;

  const latestBio =
    data.bioimpedance[0] || null;

  const latestCheckIn =
    data.checkins[0] || null;

  const latestSleep =
    data.sleepRecords[0] || null;

  const latestSession =
    data.sessions[0] || null;

  const currentWeight =
    latestMeasurement?.weight !== "" &&
    latestMeasurement?.weight !== undefined
      ? latestMeasurement.weight
      : latestCheckIn?.weight !== "" &&
        latestCheckIn?.weight !== undefined
      ? latestCheckIn.weight
      : latestBio?.weight !== "" &&
        latestBio?.weight !== undefined
      ? latestBio.weight
      : null;

  const recentWeights = data.measurements
    .filter(
      (item) =>
        item.weight !== "" &&
        item.weight !== null &&
        item.weight !== undefined
    )
    .slice(0, 8)
    .reverse();

  const weights =
    recentWeights.map((item) =>
      Number(item.weight)
    );

  const minWeight =
    weights.length > 0
      ? Math.min(...weights)
      : 0;

  const maxWeight =
    weights.length > 0
      ? Math.max(...weights)
      : 0;

  function macroPercent(value, goal) {
    if (!goal) return 0;

    return Math.min(
      (Number(value) / Number(goal)) * 100,
      100
    );
  }

  if (dashboardLoading) {
    return (
      <section className="panel pagePlaceholder">
        <span className="eyebrow">
          EVOLVE
        </span>

        <h3>Carregando sua evolução...</h3>
      </section>
    );
  }

  return (
    <>
      <section className="welcome">
        <div>
          <span className="eyebrow">
            HOJE
          </span>

          <h3>
            Seu progresso em um só lugar.
          </h3>

          <p>
            Acompanhe alimentação,
            composição corporal, treinos e
            performance.
          </p>
        </div>

        <button
          className="primaryButton"
          onClick={() =>
            setTab("Check-in")
          }
        >
          + Novo check-in
        </button>
      </section>

      <section className="cards">
        <Card
          title="Calorias"
          value={totals.calories.toFixed(0)}
          suffix={` / ${Number(
            data.goals.calories || 0
          ).toFixed(0)} kcal`}
          detail={
            todayEntries.length
              ? `${todayEntries.length} registros hoje`
              : "Nenhum alimento registrado hoje"
          }
        />

        <Card
          title="Proteína"
          value={totals.protein.toFixed(0)}
          suffix={` / ${Number(
            data.goals.protein || 0
          ).toFixed(0)} g`}
          detail="Consumo diário"
        />

        <Card
          title="Peso"
          value={
            currentWeight !== null
              ? Number(
                  currentWeight
                ).toFixed(1)
              : "--"
          }
          suffix=" kg"
          detail={
            latestMeasurement
              ? `Última medição: ${formatDate(
                  latestMeasurement.date
                )}`
              : "Nenhum registro"
          }
        />

        <Card
          title="Gordura corporal"
          value={
            latestBio?.bodyFatPercent !== "" &&
            latestBio?.bodyFatPercent !==
              undefined
              ? Number(
                  latestBio.bodyFatPercent
                ).toFixed(1)
              : "--"
          }
          suffix="%"
          detail={
            latestBio
              ? `Bioimpedância: ${formatDate(
                  latestBio.date
                )}`
              : "Nenhuma bioimpedância"
          }
        />
      </section>

      <section className="dashboardSleepGrid">
        <Card
          title="Sono"
          value={
            latestSleep?.actualSleepMinutes !== "" &&
            latestSleep?.actualSleepMinutes !== undefined
              ? formatSleepMinutes(
                  latestSleep.actualSleepMinutes
                )
              : "--"
          }
          detail={
            latestSleep
              ? `Última noite: ${formatDate(
                  latestSleep.date
                )}`
              : "Nenhum registro de sono"
          }
        />

        <Card
          title="Pontuação do sono"
          value={
            latestSleep?.sleepScore !== "" &&
            latestSleep?.sleepScore !== undefined
              ? Number(
                  latestSleep.sleepScore
                ).toFixed(0)
              : "--"
          }
          suffix="/100"
          detail="Qualidade da última noite"
        />

        <Card
          title="Recuperação física"
          value={
            latestSleep?.physicalRecovery !== "" &&
            latestSleep?.physicalRecovery !== undefined
              ? Number(
                  latestSleep.physicalRecovery
                ).toFixed(0)
              : "--"
          }
          suffix="%"
          detail="Último registro"
        />

        <Card
          title="Recuperação mental"
          value={
            latestSleep?.mentalRecovery !== "" &&
            latestSleep?.mentalRecovery !== undefined
              ? Number(
                  latestSleep.mentalRecovery
                ).toFixed(0)
              : "--"
          }
          suffix="%"
          detail="Último registro"
        />
      </section>

      <section className="dashboardGrid">
        <div className="panel large">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">
                EVOLUÇÃO
              </span>

              <h3>
                Evolução do peso
              </h3>
            </div>

            <span className="dashboardPeriod">
              Últimos {recentWeights.length} registros
            </span>
          </div>

          {recentWeights.length === 0 ? (
            <div className="placeholderChart">
              <span>
                Registre suas medidas para
                acompanhar a evolução.
              </span>
            </div>
          ) : (
            <div className="dashboardWeightChart">
              {recentWeights.map(
                (item) => {
                  const weight =
                    Number(item.weight);

                  const range =
                    maxWeight - minWeight;

                  const height =
                    range === 0
                      ? 65
                      : 30 +
                        ((weight -
                          minWeight) /
                          range) *
                          70;

                  return (
                    <div
                      className="dashboardWeightColumn"
                      key={item.id}
                    >
                      <strong>
                        {weight.toFixed(1)}
                      </strong>

                      <div className="dashboardWeightBarArea">
                        <div
                          className="dashboardWeightBar"
                          style={{
                            height: `${height}%`,
                          }}
                        />
                      </div>

                      <span>
                        {new Date(
                          `${item.date}T12:00:00`
                        ).toLocaleDateString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="panel">
          <span className="eyebrow">
            TREINO
          </span>

          <h3>Último treino</h3>

          {!latestSession ? (
            <div className="emptyState">
              <strong>
                Nenhum treino realizado
              </strong>

              <span>
                Seus treinos finalizados
                aparecerão aqui.
              </span>
            </div>
          ) : (
            <div className="dashboardWorkout">
              <span>
                {formatDate(
                  latestSession.date
                )}
              </span>

              <strong>
                {latestSession.planName}
              </strong>

              <small>
                {latestSession.focus ||
                  "Treino"}
              </small>

              <div className="dashboardWorkoutStats">
                <div>
                  <span>
                    Exercícios
                  </span>

                  <strong>
                    {
                      (
                        latestSession.exercises ||
                        []
                      ).length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Séries
                  </span>

                  <strong>
                    {(
                      latestSession.exercises ||
                      []
                    ).reduce(
                      (
                        total,
                        exercise
                      ) =>
                        total +
                        (
                          exercise.performedSets ||
                          []
                        ).filter(
                          (set) =>
                            set.done
                        ).length,
                      0
                    )}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="dashboardLinkButton"
                onClick={() =>
                  setTab("Treinos")
                }
              >
                Ver treinos
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="dashboardGrid">
        <div className="panel">
          <span className="eyebrow">
            MACROS
          </span>

          <h3>
            Distribuição diária
          </h3>

          <Macro
            label="Proteína"
            value={`${totals.protein.toFixed(
              0
            )} / ${Number(
              data.goals.protein || 0
            ).toFixed(0)} g`}
            percent={macroPercent(
              totals.protein,
              data.goals.protein
            )}
          />

          <Macro
            label="Carboidratos"
            value={`${totals.carbs.toFixed(
              0
            )} / ${Number(
              data.goals.carbs || 0
            ).toFixed(0)} g`}
            percent={macroPercent(
              totals.carbs,
              data.goals.carbs
            )}
          />

          <Macro
            label="Gorduras"
            value={`${totals.fat.toFixed(
              0
            )} / ${Number(
              data.goals.fat || 0
            ).toFixed(0)} g`}
            percent={macroPercent(
              totals.fat,
              data.goals.fat
            )}
          />
        </div>

        <div className="panel">
          <span className="eyebrow">
            RESUMO CORPORAL
          </span>

          <h3>Últimos dados</h3>

          <div className="statsList">
            <Stat
              label="Peso"
              value={
                currentWeight !== null
                  ? `${Number(
                      currentWeight
                    ).toFixed(1)} kg`
                  : "-- kg"
              }
            />

            <Stat
              label="Massa muscular"
              value={
                latestBio?.muscleMass !== "" &&
                latestBio?.muscleMass !==
                  undefined
                  ? `${Number(
                      latestBio.muscleMass
                    ).toFixed(1)} kg`
                  : "-- kg"
              }
            />

            <Stat
              label="Gordura corporal"
              value={
                latestBio?.bodyFatPercent !== "" &&
                latestBio?.bodyFatPercent !==
                  undefined
                  ? `${Number(
                      latestBio.bodyFatPercent
                    ).toFixed(1)} %`
                  : "-- %"
              }
            />

            <Stat
              label="Cintura"
              value={
                latestMeasurement?.waist !==
                  "" &&
                latestMeasurement?.waist !==
                  undefined
                  ? `${Number(
                      latestMeasurement.waist
                    ).toFixed(1)} cm`
                  : "-- cm"
              }
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Card({ title, value, suffix, detail }) {
  return (
    <div className="card">
      <span>{title}</span>

      <div className="cardValue">
        {value}
        <small>{suffix}</small>
      </div>

      <p>{detail}</p>
    </div>
  );
}

function Macro({
  label,
  value,
  percent = 0,
}) {
  return (
    <div className="macro">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="progress">
        <div
          style={{
            width: `${Math.min(
              Math.max(percent, 0),
              100
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyPage({ title }) {
  return (
    <section className="panel pagePlaceholder">
      <span className="eyebrow">MÓDULO</span>
      <h3>{title}</h3>

      <p>
        Essa área será construída na próxima etapa.
      </p>
    </section>
  );
}

function ExamsPage({
  currentUser,
  addHistory,
}) {
  const [exams, setExams] =
    useState([]);

  useEffect(() => {
    async function loadExams() {
      try {
        const data = await getExams();
        setExams(data);
      } catch (error) {
        console.error(
          "Erro ao carregar exames:",
          error
        );
      }
    }

    loadExams();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    date: "",
    laboratory: "",
    category: "Exames laboratoriais",
    notes: "",
  });

  const [results, setResults] = useState([
    {
      id: crypto.randomUUID(),
      marker: "",
      value: "",
      unit: "",
      min: "",
      max: "",
    },
  ]);


  function addResultRow() {
    setResults((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        marker: "",
        value: "",
        unit: "",
        min: "",
        max: "",
      },
    ]);
  }

  function removeResultRow(id) {
    if (results.length === 1) return;

    setResults((current) =>
      current.filter((result) => result.id !== id)
    );
  }

  function updateResult(id, field, value) {
    setResults((current) =>
      current.map((result) =>
        result.id === id
          ? { ...result, [field]: value }
          : result
      )
    );
  }

  async function handleSubmit(e) {
  e.preventDefault();

  if (!form.date) {
    alert("Informe a data do exame.");
    return;
  }

  const validResults = results.filter(
    (result) =>
      result.marker.trim() !== "" &&
      result.value !== ""
  );

  if (validResults.length === 0) {
    alert("Adicione pelo menos um resultado.");
    return;
  }

  try {
    const created = await addExam(
      form,
      validResults,
      currentUser
    );

    setExams((previous) =>
      [created, ...previous].sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )
    );

    await addHistory(
      "adicionou",
      "Exames",
      `${form.category} em ${formatDate(
        form.date
      )} • ${validResults.length} ${
        validResults.length === 1
          ? "resultado"
          : "resultados"
      }${
        form.laboratory
          ? ` • ${form.laboratory}`
          : ""
      }`
    );

    setForm({
      date: "",
      laboratory: "",
      category: "Exames laboratoriais",
      notes: "",
    });

    setResults([
      {
        id: crypto.randomUUID(),
        marker: "",
        value: "",
        unit: "",
        min: "",
        max: "",
      },
    ]);

    setShowForm(false);
  } catch (error) {
    console.error(
      "Erro ao salvar exame:",
      error
    );

    alert(
      "Não foi possível salvar o exame."
    );
  }
}

async function deleteExam(id) {
  const confirmed = window.confirm(
    "Deseja excluir este exame e todos os resultados dele?"
  );

  if (!confirmed) return;

  const exam = exams.find(
    (item) => item.id === id
  );

  try {
    await deleteExamFromSupabase(id);

    setExams((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    await addHistory(
      "excluiu",
      "Exames",
      exam
        ? `${exam.category} de ${formatDate(
            exam.date
          )}`
        : "Registro de exame"
    );
  } catch (error) {
    console.error(
      "Erro ao excluir exame:",
      error
    );

    alert(
      "Não foi possível excluir o exame."
    );
  }
}

  const allResults = exams.flatMap((exam) =>
    exam.results.map((result) => ({
      ...result,
      examId: exam.id,
      date: exam.date,
      laboratory: exam.laboratory,
      category: exam.category,
    }))
  );

  const filteredResults = allResults.filter((result) => {
    const term = search.toLowerCase();

    return (
      result.marker.toLowerCase().includes(term) ||
      result.laboratory.toLowerCase().includes(term) ||
      result.category.toLowerCase().includes(term)
    );
  });

  const latestResultsMap = {};

  allResults.forEach((result) => {
    const markerKey = result.marker.toLowerCase();

    if (
      !latestResultsMap[markerKey] ||
      new Date(result.date) >
        new Date(latestResultsMap[markerKey].date)
    ) {
      latestResultsMap[markerKey] = result;
    }
  });

  const latestResults = Object.values(latestResultsMap).slice(
    0,
    4
  );

  return (
    <div className="examsPage">
      <section className="examsHero">
        <div>
          <span className="eyebrow">SAÚDE</span>

          <h3>Histórico de exames</h3>

          <p>
            Registre seus exames laboratoriais e acompanhe a
            evolução dos resultados ao longo do tempo.
          </p>
        </div>

        <button
          className="examAddButton"
          onClick={() => setShowForm(true)}
        >
          + Adicionar exame
        </button>
      </section>

      <section className="examSummaryGrid">
        <ExamSummaryCard
          title="Exames registrados"
          value={exams.length}
          detail="Histórico total"
        />

        <ExamSummaryCard
          title="Resultados"
          value={allResults.length}
          detail="Marcadores registrados"
        />

        <ExamSummaryCard
          title="Último exame"
          value={
            exams.length > 0
              ? formatDate(exams[0].date)
              : "--"
          }
          detail={
            exams.length > 0
              ? exams[0].laboratory || "Laboratório não informado"
              : "Nenhum exame registrado"
          }
        />

        <ExamSummaryCard
          title="Marcadores"
          value={Object.keys(latestResultsMap).length}
          detail="Diferentes parâmetros"
        />
      </section>

      <section className="panel examLatestPanel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">RESULTADOS RECENTES</span>
            <h3>Últimos marcadores</h3>
          </div>
        </div>

        {latestResults.length === 0 ? (
          <div className="examEmpty">
            <strong>Nenhum resultado registrado</strong>

            <span>
              Adicione seu primeiro exame para começar seu
              histórico.
            </span>
          </div>
        ) : (
          <div className="latestResultsGrid">
            {latestResults.map((result) => {
              const status = getExamStatus(result);

              return (
                <div
                  className="latestResultCard"
                  key={`${result.examId}-${result.id}`}
                >
                  <div className="latestResultTop">
                    <span>{result.marker}</span>

                    <ExamStatus status={status} />
                  </div>

                  <strong>
                    {result.value}{" "}
                    <small>{result.unit}</small>
                  </strong>

                  <p>{formatDate(result.date)}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="examTableHeader">
          <div>
            <span className="eyebrow">HISTÓRICO</span>
            <h3>Todos os resultados</h3>
          </div>

          <input
            className="examSearch"
            type="text"
            placeholder="Buscar marcador ou laboratório..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredResults.length === 0 ? (
          <div className="examEmpty">
            <strong>
              {allResults.length === 0
                ? "Seu histórico ainda está vazio"
                : "Nenhum resultado encontrado"}
            </strong>

            <span>
              {allResults.length === 0
                ? "Seus resultados aparecerão aqui."
                : "Tente pesquisar por outro termo."}
            </span>
          </div>
        ) : (
          <div className="examTableWrapper">
            <table className="examTable">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Marcador</th>
                  <th>Resultado</th>
                  <th>Referência</th>
                  <th>Status</th>
                  <th>Laboratório</th>
                </tr>
              </thead>

              <tbody>
                {filteredResults.map((result) => {
                  const status = getExamStatus(result);

                  return (
                    <tr
                      key={`${result.examId}-${result.id}`}
                    >
                      <td>{formatDate(result.date)}</td>

                      <td>
                        <strong>{result.marker}</strong>
                      </td>

                      <td>
                        {result.value} {result.unit}
                      </td>

                      <td>
                        {result.min !== "" &&
                        result.max !== ""
                          ? `${result.min} – ${result.max} ${result.unit}`
                          : "--"}
                      </td>

                      <td>
                        <ExamStatus status={status} />
                      </td>

                      <td>
                        {result.laboratory || "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel examHistoryPanel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">EXAMES</span>
            <h3>Registros por data</h3>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="examEmpty">
            <strong>Nenhum exame cadastrado</strong>
            <span>Adicione seu primeiro exame.</span>
          </div>
        ) : (
          <div className="examHistoryList">
            {exams.map((exam) => (
              <div
                className="examHistoryItem"
                key={exam.id}
              >
                <div className="examDateBox">
                  <strong>
                    {new Date(
                      `${exam.date}T12:00:00`
                    ).getDate()}
                  </strong>

                  <span>
                    {new Date(
                      `${exam.date}T12:00:00`
                    )
                      .toLocaleDateString("pt-BR", {
                        month: "short",
                      })
                      .replace(".", "")}
                  </span>
                </div>

                <div className="examHistoryInfo">
                  <strong>
                    {exam.category}
                  </strong>

                  <span>
                    {exam.laboratory ||
                      "Laboratório não informado"}
                  </span>

                  <small>
                    {exam.results.length}{" "}
                    {exam.results.length === 1
                      ? "resultado"
                      : "resultados"}
                  </small>
                </div>

                <div className="examHistoryMarkers">
                  {exam.results
                    .slice(0, 3)
                    .map((result) => (
                      <span key={result.id}>
                        {result.marker}
                      </span>
                    ))}

                  {exam.results.length > 3 && (
                    <span>
                      +{exam.results.length - 3}
                    </span>
                  )}
                </div>

                <button
                  className="examDeleteButton"
                  onClick={() => deleteExam(exam.id)}
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="examModalOverlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="examModal">
            <div className="examModalHeader">
              <div>
                <span className="eyebrow">
                  NOVO REGISTRO
                </span>

                <h3>Adicionar exame</h3>
              </div>

              <button
                className="examCloseButton"
                type="button"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="examFormGrid">
                <label>
                  Data do exame

                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Laboratório

                  <input
                    type="text"
                    placeholder="Ex.: Sabin"
                    value={form.laboratory}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        laboratory: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Categoria

                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                  >
                    <option>
                      Exames laboratoriais
                    </option>

                    <option>
                      Hemograma
                    </option>

                    <option>
                      Perfil lipídico
                    </option>

                    <option>
                      Hormonal
                    </option>

                    <option>
                      Vitaminas e minerais
                    </option>

                    <option>
                      Função hepática
                    </option>

                    <option>
                      Função renal
                    </option>

                    <option>
                      Glicemia e metabolismo
                    </option>

                    <option>
                      Outros
                    </option>
                  </select>
                </label>
              </div>

              <div className="examResultsTitle">
                <div>
                  <span className="eyebrow">
                    RESULTADOS
                  </span>

                  <h4>Marcadores do exame</h4>
                </div>

                <button
                  type="button"
                  className="examSecondaryButton"
                  onClick={addResultRow}
                >
                  + Adicionar marcador
                </button>
              </div>

              <div className="examResultRows">
                {results.map((result, index) => (
                  <div
                    className="examResultRow"
                    key={result.id}
                  >
                    <div className="examResultNumber">
                      {index + 1}
                    </div>

                    <label className="markerField">
                      Marcador

                      <input
                        type="text"
                        placeholder="Ex.: Ferritina"
                        value={result.marker}
                        onChange={(e) =>
                          updateResult(
                            result.id,
                            "marker",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Resultado

                      <input
                        type="number"
                        step="any"
                        placeholder="42"
                        value={result.value}
                        onChange={(e) =>
                          updateResult(
                            result.id,
                            "value",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Unidade

                      <input
                        type="text"
                        placeholder="ng/mL"
                        value={result.unit}
                        onChange={(e) =>
                          updateResult(
                            result.id,
                            "unit",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Ref. mín.

                      <input
                        type="number"
                        step="any"
                        placeholder="15"
                        value={result.min}
                        onChange={(e) =>
                          updateResult(
                            result.id,
                            "min",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Ref. máx.

                      <input
                        type="number"
                        step="any"
                        placeholder="150"
                        value={result.max}
                        onChange={(e) =>
                          updateResult(
                            result.id,
                            "max",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <button
                      type="button"
                      className="examRemoveResult"
                      onClick={() =>
                        removeResultRow(result.id)
                      }
                      title="Remover resultado"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <label className="examNotes">
                Observações

                <textarea
                  rows="3"
                  placeholder="Observações sobre o exame..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                />
              </label>

              <div className="examFormActions">
                <button
                  type="button"
                  className="examCancelButton"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="examSaveButton"
                >
                  Salvar exame
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamSummaryCard({ title, value, detail }) {
  return (
    <div className="card examSummaryCard">
      <span>{title}</span>

      <div className="cardValue">{value}</div>

      <p>{detail}</p>
    </div>
  );
}

function ExamStatus({ status }) {
  const labels = {
    low: "Baixo",
    normal: "Referência",
    high: "Alto",
    unknown: "Sem referência",
  };

  return (
    <span
      className={`examStatus examStatus-${status}`}
    >
      {labels[status]}
    </span>
  );
}

function getExamStatus(result) {
  if (
    result.value === "" ||
    result.min === "" ||
    result.max === ""
  ) {
    return "unknown";
  }

  const value = Number(result.value);
  const min = Number(result.min);
  const max = Number(result.max);

  if (
    Number.isNaN(value) ||
    Number.isNaN(min) ||
    Number.isNaN(max)
  ) {
    return "unknown";
  }

  if (value < min) return "low";
  if (value > max) return "high";

  return "normal";
}

function formatSleepMinutes(minutes) {
  if (
    minutes === "" ||
    minutes === null ||
    minutes === undefined
  ) {
    return "--";
  }

  const total = Number(minutes);

  if (Number.isNaN(total)) {
    return "--";
  }

  const hours = Math.floor(total / 60);
  const remaining = total % 60;

  if (hours === 0) {
    return `${remaining}min`;
  }

  if (remaining === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}min`;
}

function formatDate(date) {
  if (!date) return "--";

  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "pt-BR"
  );
}

function NutritionPage({
  currentUser,
  addHistory,
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(today);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showAddMealFood, setShowAddMealFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("Café da manhã");

const [goals, setGoals] = useState({
  calories: 1800,
  protein: 140,
  carbs: 190,
  fat: 60,
  fiber: 25,
});

const [foods, setFoods] = useState([]);

const [entries, setEntries] = useState([]);

const [nutritionLoading, setNutritionLoading] =
  useState(true);

const [foodForm, setFoodForm] = useState({
  name: "",
  portion: 100,
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
});

const [mealFoodForm, setMealFoodForm] = useState({
  foodId: "",
  quantity: "",
});

const meals = [
  "Café da manhã",
  "Almoço",
  "Lanche",
  "Jantar",
  "Ceia",
];

useEffect(() => {
  async function loadNutritionData() {
    try {
      const [
        goalsData,
        foodsData,
        entriesData,
      ] = await Promise.all([
        getNutritionGoals(),
        getFoods(),
        getNutritionEntries(),
      ]);

      setGoals(goalsData);
      setFoods(foodsData);
      setEntries(entriesData);
    } catch (error) {
      console.error(
        "Erro ao carregar alimentação:",
        error
      );
    } finally {
      setNutritionLoading(false);
    }
  }

  loadNutritionData();
}, []);

async function saveGoals(updated) {
  setGoals(updated);

  try {
    await saveNutritionGoals(
      updated,
      currentUser
    );

    await addHistory(
      "alterou",
      "Alimentação",
      "Metas nutricionais atualizadas"
    );
  } catch (error) {
    console.error(
      "Erro ao salvar metas nutricionais:",
      error
    );

    alert(
      "Não foi possível salvar as metas."
    );
  }
}

  async function handleAddFood(e) {
  e.preventDefault();

  if (!foodForm.name || !foodForm.portion) {
    alert("Preencha o nome e a porção.");
    return;
  }

  try {
    const newFood = {
      name: foodForm.name,
      portion: Number(foodForm.portion),
      calories: Number(foodForm.calories || 0),
      protein: Number(foodForm.protein || 0),
      carbs: Number(foodForm.carbs || 0),
      fat: Number(foodForm.fat || 0),
      fiber: Number(foodForm.fiber || 0),
    };

    const created = await addFood(
      newFood,
      currentUser
    );

    setFoods((previous) =>
      [...previous, created].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );

    await addHistory(
      "adicionou",
      "Alimentação",
      `Alimento cadastrado: ${created.name}`
    );

    setFoodForm({
      name: "",
      portion: 100,
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
    });

    setShowFoodForm(false);
  } catch (error) {
    console.error(
      "Erro ao cadastrar alimento:",
      error
    );

    alert(
      "Não foi possível cadastrar o alimento."
    );
  }
}

async function handleAddFoodToMeal(e) {
  e.preventDefault();

  const food = foods.find(
    (item) => item.id === mealFoodForm.foodId
  );

  if (!food || !mealFoodForm.quantity) {
    alert(
      "Selecione um alimento e informe a quantidade."
    );
    return;
  }

  try {
    const quantity =
      Number(mealFoodForm.quantity);

    const ratio =
      quantity / Number(food.portion);

    const entry = {
      date: selectedDate,
      meal: selectedMeal,

      foodId: food.id,
      foodName: food.name,

      quantity,

      calories:
        Number(food.calories) * ratio,

      protein:
        Number(food.protein) * ratio,

      carbs:
        Number(food.carbs) * ratio,

      fat:
        Number(food.fat) * ratio,

      fiber:
        Number(food.fiber) * ratio,

      isSubstitution: false,
    };

    const created =
      await addNutritionEntry(
        entry,
        currentUser
      );

    setEntries((previous) => [
      ...previous,
      created,
    ]);

    await addHistory(
      "registrou",
      "Alimentação",
      `${food.name} • ${quantity} g • ${selectedMeal} • ${formatDate(
        selectedDate
      )}`
    );

    setMealFoodForm({
      foodId: "",
      quantity: "",
    });

    setShowAddMealFood(false);
  } catch (error) {
    console.error(
      "Erro ao registrar alimento:",
      error
    );

    alert(
      "Não foi possível adicionar o alimento à refeição."
    );
  }
}

async function deleteEntry(id) {
  const entry = entries.find(
    (item) => item.id === id
  );

  if (!entry) return;

  if (
    !window.confirm(
      "Excluir este alimento da refeição?"
    )
  ) {
    return;
  }

  try {
    await deleteNutritionEntry(id);

    setEntries((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    await addHistory(
      "excluiu",
      "Alimentação",
      `${entry.foodName} • ${entry.meal} • ${formatDate(
        entry.date
      )}`
    );
  } catch (error) {
    console.error(
      "Erro ao excluir registro alimentar:",
      error
    );

    alert(
      "Não foi possível excluir o registro."
    );
  }
}

async function deleteFood(id) {
  const food = foods.find(
    (item) => item.id === id
  );

  if (!food) return;

  const used = entries.some(
    (entry) => entry.foodId === id
  );

  if (used) {
    alert(
      "Esse alimento já foi usado no histórico e não pode ser excluído."
    );

    return;
  }

  if (
    !window.confirm(
      `Excluir o alimento "${food.name}"?`
    )
  ) {
    return;
  }

  try {
    await deleteFoodFromSupabase(id);

    setFoods((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    await addHistory(
      "excluiu",
      "Alimentação",
      `Alimento excluído: ${food.name}`
    );
  } catch (error) {
    console.error(
      "Erro ao excluir alimento:",
      error
    );

    alert(
      "Não foi possível excluir o alimento."
    );
  }
}

async function addSubstitutionToMeal({
  groupName,
  description,
  item,
  meal,
  portions,
}) {
  try {
    const entry = {
      date: selectedDate,
      meal,

      foodId: null,
      foodName: item,
      quantity: null,

      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,

      isSubstitution: true,

      substitutionGroup: groupName,

      substitutionDescription:
        description,

      portions: Number(portions || 1),
    };

    const created =
      await addNutritionEntry(
        entry,
        currentUser
      );

    setEntries((previous) => [
      ...previous,
      created,
    ]);

    await addHistory(
      "registrou",
      "Alimentação",
      `${item} • ${meal} • ${
        Number(portions || 1)
      } ${
        Number(portions || 1) === 1
          ? "porção"
          : "porções"
      } do plano`
    );
  } catch (error) {
    console.error(
      "Erro ao registrar substituição:",
      error
    );

    alert(
      "Não foi possível adicionar a substituição à refeição."
    );
  }
}

  const dayEntries = entries.filter(
    (entry) => entry.date === selectedDate
  );

  const totals = dayEntries.reduce(
    (acc, entry) => {
      acc.calories += entry.calories;
      acc.protein += entry.protein;
      acc.carbs += entry.carbs;
      acc.fat += entry.fat;
      acc.fiber += entry.fiber;
      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    }
  );

  function percentage(value, goal) {
    if (!goal) return 0;

    return Math.min(
      (value / goal) * 100,
      100
    );
  }

  return (
    <div className="nutritionPage">
      <section className="nutritionHero">
        <div>
          <span className="eyebrow">
            NUTRIÇÃO
          </span>

          <h3>Alimentação diária</h3>

          <p>
            Registre suas refeições e acompanhe calorias,
            macronutrientes e fibras.
          </p>
        </div>

        <div className="nutritionHeroActions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) =>
              setSelectedDate(e.target.value)
            }
          />

          <button
            className="nutritionPrimaryButton"
            onClick={() => setShowFoodForm(true)}
          >
            + Cadastrar alimento
          </button>
        </div>
      </section>

      <section className="nutritionCards">
        <NutritionStatCard
          title="Calorias"
          value={totals.calories}
          goal={goals.calories}
          unit="kcal"
        />

        <NutritionStatCard
          title="Proteína"
          value={totals.protein}
          goal={goals.protein}
          unit="g"
        />

        <NutritionStatCard
          title="Carboidratos"
          value={totals.carbs}
          goal={goals.carbs}
          unit="g"
        />

        <NutritionStatCard
          title="Gorduras"
          value={totals.fat}
          goal={goals.fat}
          unit="g"
        />

        <NutritionStatCard
          title="Fibras"
          value={totals.fiber}
          goal={goals.fiber}
          unit="g"
        />
      </section>

      <section className="nutritionLayout">
        <div className="nutritionMeals">
          {meals.map((meal) => {
            const mealEntries = dayEntries.filter(
              (entry) => entry.meal === meal
            );

            const mealCalories = mealEntries.reduce(
              (sum, entry) =>
                sum + entry.calories,
              0
            );

            return (
              <div
                className="panel mealPanel"
                key={meal}
              >
                <div className="mealHeader">
                  <div>
                    <span className="eyebrow">
                      REFEIÇÃO
                    </span>

                    <h3>{meal}</h3>
                  </div>

                  <div className="mealHeaderRight">
                    <strong>
                      {mealCalories.toFixed(0)} kcal
                    </strong>

                    <button
                      onClick={() => {
                        setSelectedMeal(meal);
                        setShowAddMealFood(true);
                      }}
                    >
                      + Adicionar alimento
                    </button>
                  </div>
                </div>

                {mealEntries.length === 0 ? (
                  <div className="nutritionEmpty">
                    Nenhum alimento registrado.
                  </div>
                ) : (
                  <div className="mealEntries">
                    {mealEntries.map((entry) => (
                      <div
                        className="mealEntry"
                        key={entry.id}
                      >
                        <div>
                          <strong>{entry.foodName}</strong>

                          {entry.isSubstitution ? (
                            <>
                              <span>
                                {entry.substitutionGroup}
                              </span>

                              <small className="mealPlanPortion">
                                {entry.portions}{" "}
                                {Number(entry.portions) === 1
                                  ? "porção do plano"
                                  : "porções do plano"}
                              </small>
                            </>
                          ) : (
                            <span>
                              {entry.quantity} g
                            </span>
                          )}
                        </div>

                        {entry.isSubstitution ? (
                          <div className="mealSubstitutionBadge">
                            Substituição
                          </div>
                        ) : (
                          <div className="mealMacros">
                            <span>
                              {entry.calories.toFixed(0)} kcal
                            </span>

                            <small>
                              P {entry.protein.toFixed(1)} g
                            </small>

                            <small>
                              C {entry.carbs.toFixed(1)} g
                            </small>

                            <small>
                              G {entry.fat.toFixed(1)} g
                            </small>
                          </div>
                        )}

                        <button
                          className="mealDeleteButton"
                          onClick={() =>
                            deleteEntry(entry.id)
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="nutritionSide">
          <section className="panel">
            <span className="eyebrow">
              METAS
            </span>

            <h3>Metas diárias</h3>

            <NutritionGoal
              label="Calorias"
              value={goals.calories}
              unit="kcal"
              onChange={(value) =>
                saveGoals({
                  ...goals,
                  calories: value,
                })
              }
            />

            <NutritionGoal
              label="Proteína"
              value={goals.protein}
              unit="g"
              onChange={(value) =>
                saveGoals({
                  ...goals,
                  protein: value,
                })
              }
            />

            <NutritionGoal
              label="Carboidratos"
              value={goals.carbs}
              unit="g"
              onChange={(value) =>
                saveGoals({
                  ...goals,
                  carbs: value,
                })
              }
            />

            <NutritionGoal
              label="Gorduras"
              value={goals.fat}
              unit="g"
              onChange={(value) =>
                saveGoals({
                  ...goals,
                  fat: value,
                })
              }
            />

            <NutritionGoal
              label="Fibras"
              value={goals.fiber}
              unit="g"
              onChange={(value) =>
                saveGoals({
                  ...goals,
                  fiber: value,
                })
              }
            />
          </section>

          <section className="panel">
            <span className="eyebrow">
              RESUMO
            </span>

            <h3>Distribuição diária</h3>

            <NutritionProgress
              label="Calorias"
              value={totals.calories}
              goal={goals.calories}
            />

            <NutritionProgress
              label="Proteína"
              value={totals.protein}
              goal={goals.protein}
            />

            <NutritionProgress
              label="Carboidratos"
              value={totals.carbs}
              goal={goals.carbs}
            />

            <NutritionProgress
              label="Gorduras"
              value={totals.fat}
              goal={goals.fat}
            />

            <NutritionProgress
              label="Fibras"
              value={totals.fiber}
              goal={goals.fiber}
            />
          </section>

          <section className="panel">
            <span className="eyebrow">
              ALIMENTOS
            </span>

            <h3>Alimentos cadastrados</h3>

            {foods.length === 0 ? (
              <div className="nutritionEmpty">
                Nenhum alimento cadastrado.
              </div>
            ) : (
              <div className="foodLibrary">
                {foods.map((food) => (
                  <div
                    className="foodLibraryItem"
                    key={food.id}
                  >
                    <div>
                      <strong>{food.name}</strong>

                      <span>
                        {food.portion} g •{" "}
                        {food.calories} kcal
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        deleteFood(food.id)
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
      <SubstitutionsSection
        onAddSubstitution={addSubstitutionToMeal}
        currentUser={currentUser}
        addHistory={addHistory}
      />
      {showFoodForm && (
        <div className="nutritionModalOverlay">
          <div className="nutritionModal">
            <div className="nutritionModalHeader">
              <div>
                <span className="eyebrow">
                  NOVO ALIMENTO
                </span>

                <h3>Cadastrar alimento</h3>
              </div>

              <button
                onClick={() =>
                  setShowFoodForm(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddFood}>
              <div className="nutritionFormGrid">
                <label>
                  Nome do alimento

                  <input
                    type="text"
                    value={foodForm.name}
                    onChange={(e) =>
                      setFoodForm({
                        ...foodForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Ex.: Whey Protein"
                  />
                </label>

                <label>
                  Porção de referência (g)

                  <input
                    type="number"
                    step="any"
                    value={foodForm.portion}
                    onChange={(e) =>
                      setFoodForm({
                        ...foodForm,
                        portion: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Calorias

                  <input
                    type="number"
                    step="any"
                    value={foodForm.calories}
                    onChange={(e) =>
                      setFoodForm({
                        ...foodForm,
                        calories: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Proteína (g)

                  <input
                    type="number"
                    step="any"
                    value={foodForm.protein}
                    onChange={(e) =>
                      setFoodForm({
                        ...foodForm,
                        protein: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Carboidratos (g)

                  <input
                    type="number"
                    step="any"
                    value={foodForm.carbs}
                    onChange={(e) =>
                      setFoodForm({
                        ...foodForm,
                        carbs: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Gorduras (g)

                  <input
                    type="number"
                    step="any"
                    value={foodForm.fat}
                    onChange={(e) =>
                      setFoodForm({
                        ...foodForm,
                        fat: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Fibras (g)

                  <input
                    type="number"
                    step="any"
                    value={foodForm.fiber}
                    onChange={(e) =>
                      setFoodForm({
                        ...foodForm,
                        fiber: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="nutritionModalActions">
                <button
                  type="button"
                  className="nutritionCancelButton"
                  onClick={() =>
                    setShowFoodForm(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="nutritionSaveButton"
                >
                  Salvar alimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMealFood && (
        <div className="nutritionModalOverlay">
          <div className="nutritionModal smallModal">
            <div className="nutritionModalHeader">
              <div>
                <span className="eyebrow">
                  {selectedMeal.toUpperCase()}
                </span>

                <h3>Adicionar alimento</h3>
              </div>

              <button
                onClick={() =>
                  setShowAddMealFood(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddFoodToMeal}>
              <label className="nutritionSingleField">
                Alimento

                <select
                  value={mealFoodForm.foodId}
                  onChange={(e) =>
                    setMealFoodForm({
                      ...mealFoodForm,
                      foodId: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Selecione...
                  </option>

                  {foods.map((food) => (
                    <option
                      key={food.id}
                      value={food.id}
                    >
                      {food.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="nutritionSingleField">
                Quantidade consumida (g)

                <input
                  type="number"
                  step="any"
                  value={mealFoodForm.quantity}
                  onChange={(e) =>
                    setMealFoodForm({
                      ...mealFoodForm,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="Ex.: 150"
                />
              </label>

              <div className="nutritionModalActions">
                <button
                  type="button"
                  className="nutritionCancelButton"
                  onClick={() =>
                    setShowAddMealFood(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="nutritionSaveButton"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NutritionStatCard({
  title,
  value,
  goal,
  unit,
}) {
  return (
    <div className="card nutritionStatCard">
      <span>{title}</span>

      <div className="cardValue">
        {Number(value).toFixed(0)}

        <small>
          {" "}
          / {goal} {unit}
        </small>
      </div>

      <div className="nutritionMiniProgress">
        <div
          style={{
            width: `${Math.min(
              (value / goal) * 100 || 0,
              100
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function NutritionGoal({
  label,
  value,
  unit,
  onChange,
}) {
  return (
    <label className="nutritionGoal">
      <span>{label}</span>

      <div>
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) =>
            onChange(Number(e.target.value))
          }
        />

        <small>{unit}</small>
      </div>
    </label>
  );
}

function NutritionProgress({
  label,
  value,
  goal,
}) {
  const percent = goal
    ? Math.min((value / goal) * 100, 100)
    : 0;

  return (
    <div className="nutritionProgress">
      <div className="nutritionProgressHeader">
        <span>{label}</span>

        <strong>
          {value.toFixed(0)} / {goal}
        </strong>
      </div>

      <div className="nutritionProgressBar">
        <div
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

function MeasurementsPage({
  currentUser,
  addHistory,
}) {
  const [measurements, setMeasurements] =
    useState([]);

  const [loadingMeasurements, setLoadingMeasurements] =
    useState(true);

  useEffect(() => {
    async function loadMeasurements() {
      try {
        const data = await getMeasurements();
        setMeasurements(data);
      } catch (error) {
        console.error(
          "Erro ao carregar medidas:",
          error
        );

        alert(
          "Não foi possível carregar as medidas."
        );
      } finally {
        setLoadingMeasurements(false);
      }
    }

    loadMeasurements();
  }, []);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weight: "",
    waist: "",
    abdomen: "",
    hip: "",
    armRight: "",
    armLeft: "",
    thighRight: "",
    thighLeft: "",
    calfRight: "",
    calfLeft: "",
    chest: "",
    notes: "",
  });


  async function handleSubmit(e) {
  e.preventDefault();

  if (!form.date) {
    alert("Informe a data.");
    return;
  }

  try {
    const newMeasurement = {
      date: form.date,

      weight: numberOrEmpty(form.weight),
      waist: numberOrEmpty(form.waist),
      abdomen: numberOrEmpty(form.abdomen),
      hip: numberOrEmpty(form.hip),

      armRight: numberOrEmpty(form.armRight),
      armLeft: numberOrEmpty(form.armLeft),

      thighRight: numberOrEmpty(form.thighRight),
      thighLeft: numberOrEmpty(form.thighLeft),

      calfRight: numberOrEmpty(form.calfRight),
      calfLeft: numberOrEmpty(form.calfLeft),

      chest: numberOrEmpty(form.chest),

      notes: form.notes,
    };

    const created = await addMeasurement(
      newMeasurement,
      currentUser
    );

    setMeasurements((previous) =>
      [created, ...previous].sort(
        (a, b) =>
          new Date(b.date) - new Date(a.date)
      )
    );

    await addHistory(
      "adicionou",
      "Medidas",
      `Nova medição corporal em ${formatDate(
        form.date
      )}${
        form.weight
          ? ` • Peso: ${form.weight} kg`
          : ""
      }${
        form.waist
          ? ` • Cintura: ${form.waist} cm`
          : ""
      }`
    );

    setForm({
      date: new Date()
        .toISOString()
        .slice(0, 10),

      weight: "",
      waist: "",
      abdomen: "",
      hip: "",
      armRight: "",
      armLeft: "",
      thighRight: "",
      thighLeft: "",
      calfRight: "",
      calfLeft: "",
      chest: "",
      notes: "",
    });

    setShowForm(false);
  } catch (error) {
    console.error(
      "Erro ao salvar medição:",
      error
    );

    alert(
      "Não foi possível salvar a medição."
    );
  }
}

  async function deleteMeasurement(id) {
  if (
    !window.confirm(
      "Deseja excluir este registro?"
    )
  ) {
    return;
  }

  const measurement = measurements.find(
    (item) => item.id === id
  );

  try {
    await deleteMeasurementFromSupabase(id);

    setMeasurements((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    await addHistory(
      "excluiu",
      "Medidas",
      measurement
        ? `Medição de ${formatDate(
            measurement.date
          )}`
        : "Registro de medidas corporais"
    );
  } catch (error) {
    console.error(
      "Erro ao excluir medição:",
      error
    );

    alert(
      "Não foi possível excluir a medição."
    );
  }
}

  const latest = measurements[0];
  const previous = measurements[1];

  return (
    <div className="measurementsPage">
      <section className="measurementsHero">
        <div>
          <span className="eyebrow">CORPO</span>

          <h3>Medidas corporais</h3>

          <p>
            Acompanhe peso e circunferências ao longo do tempo.
          </p>
        </div>

        <button
          className="measurementAddButton"
          onClick={() => setShowForm(true)}
        >
          + Nova medição
        </button>
      </section>

      <section className="measurementSummaryGrid">
        <MeasurementCard
          title="Peso atual"
          value={latest?.weight}
          previous={previous?.weight}
          unit="kg"
        />

        <MeasurementCard
          title="Cintura"
          value={latest?.waist}
          previous={previous?.waist}
          unit="cm"
        />

        <MeasurementCard
          title="Abdômen"
          value={latest?.abdomen}
          previous={previous?.abdomen}
          unit="cm"
        />

        <MeasurementCard
          title="Quadril"
          value={latest?.hip}
          previous={previous?.hip}
          unit="cm"
        />
      </section>

      <section className="measurementGrid">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">ÚLTIMO REGISTRO</span>
              <h3>Resumo corporal</h3>
            </div>

            {latest && (
              <span className="measurementDate">
                {formatDate(latest.date)}
              </span>
            )}
          </div>

          {!latest ? (
            <div className="measurementEmpty">
              <strong>Nenhuma medição registrada</strong>

              <span>
                Adicione sua primeira medição para começar.
              </span>
            </div>
          ) : (
            <div className="measurementDetailsGrid">
              <MeasurementDetail
                label="Peso"
                value={latest.weight}
                unit="kg"
              />

              <MeasurementDetail
                label="Peitoral"
                value={latest.chest}
                unit="cm"
              />

              <MeasurementDetail
                label="Cintura"
                value={latest.waist}
                unit="cm"
              />

              <MeasurementDetail
                label="Abdômen"
                value={latest.abdomen}
                unit="cm"
              />

              <MeasurementDetail
                label="Quadril"
                value={latest.hip}
                unit="cm"
              />

              <MeasurementDetail
                label="Braço direito"
                value={latest.armRight}
                unit="cm"
              />

              <MeasurementDetail
                label="Braço esquerdo"
                value={latest.armLeft}
                unit="cm"
              />

              <MeasurementDetail
                label="Coxa direita"
                value={latest.thighRight}
                unit="cm"
              />

              <MeasurementDetail
                label="Coxa esquerda"
                value={latest.thighLeft}
                unit="cm"
              />

              <MeasurementDetail
                label="Panturrilha direita"
                value={latest.calfRight}
                unit="cm"
              />

              <MeasurementDetail
                label="Panturrilha esquerda"
                value={latest.calfLeft}
                unit="cm"
              />
            </div>
          )}
        </div>

        <div className="panel">
          <span className="eyebrow">EVOLUÇÃO</span>
          <h3>Comparação</h3>

          {!latest || !previous ? (
            <div className="measurementEmpty">
              <strong>
                Precisamos de pelo menos 2 registros
              </strong>

              <span>
                A comparação aparecerá automaticamente.
              </span>
            </div>
          ) : (
            <div className="measurementComparison">
              <MeasurementComparisonRow
                label="Peso"
                current={latest.weight}
                previous={previous.weight}
                unit="kg"
              />

              <MeasurementComparisonRow
                label="Cintura"
                current={latest.waist}
                previous={previous.waist}
                unit="cm"
              />

              <MeasurementComparisonRow
                label="Abdômen"
                current={latest.abdomen}
                previous={previous.abdomen}
                unit="cm"
              />

              <MeasurementComparisonRow
                label="Quadril"
                current={latest.hip}
                previous={previous.hip}
                unit="cm"
              />

              <MeasurementComparisonRow
                label="Coxa direita"
                current={latest.thighRight}
                previous={previous.thighRight}
                unit="cm"
              />

              <MeasurementComparisonRow
                label="Braço direito"
                current={latest.armRight}
                previous={previous.armRight}
                unit="cm"
              />
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">HISTÓRICO</span>
            <h3>Registros de medidas</h3>
          </div>
        </div>

        {measurements.length === 0 ? (
          <div className="measurementEmpty">
            <strong>Nenhum registro encontrado</strong>
            <span>Seu histórico aparecerá aqui.</span>
          </div>
        ) : (
          <div className="measurementTableWrapper">
            <table className="measurementTable">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Peso</th>
                  <th>Cintura</th>
                  <th>Abdômen</th>
                  <th>Quadril</th>
                  <th>Braço D</th>
                  <th>Coxa D</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {measurements.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>

                    <td>
                      {displayMeasurement(item.weight, "kg")}
                    </td>

                    <td>
                      {displayMeasurement(item.waist, "cm")}
                    </td>

                    <td>
                      {displayMeasurement(item.abdomen, "cm")}
                    </td>

                    <td>
                      {displayMeasurement(item.hip, "cm")}
                    </td>

                    <td>
                      {displayMeasurement(item.armRight, "cm")}
                    </td>

                    <td>
                      {displayMeasurement(item.thighRight, "cm")}
                    </td>

                    <td>
                      <button
                        className="measurementDeleteButton"
                        onClick={() =>
                          deleteMeasurement(item.id)
                        }
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="measurementModalOverlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="measurementModal">
            <div className="measurementModalHeader">
              <div>
                <span className="eyebrow">NOVA MEDIÇÃO</span>
                <h3>Registrar medidas</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="measurementFormGrid">
                <MeasurementInput
                  label="Data"
                  type="date"
                  value={form.date}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      date: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Peso"
                  value={form.weight}
                  unit="kg"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      weight: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Peitoral"
                  value={form.chest}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      chest: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Cintura"
                  value={form.waist}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      waist: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Abdômen"
                  value={form.abdomen}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      abdomen: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Quadril"
                  value={form.hip}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      hip: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Braço direito"
                  value={form.armRight}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      armRight: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Braço esquerdo"
                  value={form.armLeft}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      armLeft: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Coxa direita"
                  value={form.thighRight}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      thighRight: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Coxa esquerda"
                  value={form.thighLeft}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      thighLeft: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Panturrilha direita"
                  value={form.calfRight}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      calfRight: value,
                    })
                  }
                />

                <MeasurementInput
                  label="Panturrilha esquerda"
                  value={form.calfLeft}
                  unit="cm"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      calfLeft: value,
                    })
                  }
                />
              </div>

              <label className="measurementNotes">
                Observações

                <textarea
                  rows="3"
                  value={form.notes}
                  placeholder="Ex.: medição em jejum..."
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                />
              </label>

              <div className="measurementModalActions">
                <button
                  type="button"
                  className="measurementCancelButton"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="measurementSaveButton"
                >
                  Salvar medição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MeasurementCard({
  title,
  value,
  previous,
  unit,
}) {
  const difference =
    value !== "" &&
    value !== undefined &&
    previous !== "" &&
    previous !== undefined
      ? Number(value) - Number(previous)
      : null;

  return (
    <div className="card measurementCard">
      <span>{title}</span>

      <div className="cardValue">
        {value !== "" && value !== undefined
          ? Number(value).toFixed(1)
          : "--"}

        <small> {unit}</small>
      </div>

      <p>
        {difference === null
          ? "Sem comparação"
          : `${difference > 0 ? "+" : ""}${difference.toFixed(
              1
            )} ${unit} desde a última medição`}
      </p>
    </div>
  );
}

function MeasurementDetail({
  label,
  value,
  unit,
}) {
  return (
    <div className="measurementDetail">
      <span>{label}</span>

      <strong>
        {value !== "" && value !== undefined
          ? `${Number(value).toFixed(1)} ${unit}`
          : "--"}
      </strong>
    </div>
  );
}

function MeasurementComparisonRow({
  label,
  current,
  previous,
  unit,
}) {
  if (
    current === "" ||
    current === undefined ||
    previous === "" ||
    previous === undefined
  ) {
    return (
      <div className="measurementComparisonRow">
        <span>{label}</span>
        <strong>--</strong>
      </div>
    );
  }

  const difference =
    Number(current) - Number(previous);

  return (
    <div className="measurementComparisonRow">
      <div>
        <span>{label}</span>

        <small>
          {Number(previous).toFixed(1)} →{" "}
          {Number(current).toFixed(1)} {unit}
        </small>
      </div>

      <strong
        className={
          difference > 0
            ? "measurementPositive"
            : difference < 0
            ? "measurementNegative"
            : ""
        }
      >
        {difference > 0 ? "+" : ""}
        {difference.toFixed(1)} {unit}
      </strong>
    </div>
  );
}

function MeasurementInput({
  label,
  value,
  onChange,
  unit,
  type = "number",
}) {
  return (
    <label>
      {label}

      <div className="measurementInputWrap">
        <input
          type={type}
          step={type === "number" ? "0.1" : undefined}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />

        {unit && <span>{unit}</span>}
      </div>
    </label>
  );
}

function numberOrEmpty(value) {
  if (value === "") return "";

  return Number(value);
}

function displayMeasurement(value, unit) {
  if (value === "" || value === undefined) {
    return "--";
  }

  return `${Number(value).toFixed(1)} ${unit}`;
}

function BioimpedancePage({
  currentUser,
  addHistory,
}) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    async function loadBioimpedance() {
      try {
        const data =
          await getBioimpedanceRecords();

        setRecords(data);
      } catch (error) {
        console.error(
          "Erro ao carregar bioimpedâncias:",
          error
        );
      }
    }

    loadBioimpedance();
  }, []);


  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weight: "",
    bmi: "",
    bodyFatPercent: "",
    fatMass: "",
    muscleMass: "",
    leanMass: "",
    bodyWaterPercent: "",
    visceralFat: "",
    basalMetabolism: "",
    metabolicAge: "",
    notes: "",
  });


  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.date) {
      alert("Informe a data da bioimpedância.");
      return;
    }

    try {
      const newRecord = {
        date: form.date,
        weight: bioNumber(form.weight),
        bmi: bioNumber(form.bmi),

        bodyFatPercent:
          bioNumber(form.bodyFatPercent),

        fatMass:
          bioNumber(form.fatMass),

        muscleMass:
          bioNumber(form.muscleMass),

        leanMass:
          bioNumber(form.leanMass),

        bodyWaterPercent:
          bioNumber(form.bodyWaterPercent),

        visceralFat:
          bioNumber(form.visceralFat),

        basalMetabolism:
          bioNumber(form.basalMetabolism),

        metabolicAge:
          bioNumber(form.metabolicAge),

        notes: form.notes,
      };

      const created = await addBioimpedance(
        newRecord,
        currentUser
      );

      setRecords((previous) =>
        [created, ...previous].sort(
          (a, b) =>
            new Date(b.date) -
            new Date(a.date)
        )
      );

      await addHistory(
        "adicionou",
        "Bioimpedância",
        `Avaliação de ${formatDate(form.date)}${
          form.weight
            ? ` • Peso: ${form.weight} kg`
            : ""
        }${
          form.bodyFatPercent
            ? ` • Gordura: ${form.bodyFatPercent}%`
            : ""
        }${
          form.muscleMass
            ? ` • Massa muscular: ${form.muscleMass} kg`
            : ""
        }`
      );

      setForm({
        date: new Date()
          .toISOString()
          .slice(0, 10),

        weight: "",
        bmi: "",
        bodyFatPercent: "",
        fatMass: "",
        muscleMass: "",
        leanMass: "",
        bodyWaterPercent: "",
        visceralFat: "",
        basalMetabolism: "",
        metabolicAge: "",
        notes: "",
      });

      setShowForm(false);
    } catch (error) {
      console.error(
        "Erro ao salvar bioimpedância:",
        error
      );

      alert(
        "Não foi possível salvar a bioimpedância."
      );
    }
  }


  async function deleteRecord(id) {
    const confirmed = window.confirm(
      "Deseja excluir esta bioimpedância?"
    );

    if (!confirmed) return;

    const record = records.find(
      (item) => item.id === id
    );

    try {
      await deleteBioimpedance(id);

      setRecords((previous) =>
        previous.filter(
          (item) => item.id !== id
        )
      );

      await addHistory(
        "excluiu",
        "Bioimpedância",
        record
          ? `Avaliação de ${formatDate(
            record.date
          )}`
        : "Registro de bioimpedância"
    );
  } catch (error) {
    console.error(
      "Erro ao excluir bioimpedância:",
      error
    );

    alert(
      "Não foi possível excluir a bioimpedância."
    );
  }
}

  const latest = records[0];
  const previous = records[1];

  return (
    <div className="bioPage">
      <section className="bioHero">
        <div>
          <span className="eyebrow">COMPOSIÇÃO CORPORAL</span>

          <h3>Bioimpedância</h3>

          <p>
            Acompanhe gordura corporal, massa muscular,
            hidratação e outros parâmetros ao longo do tempo.
          </p>
        </div>

        <button
          className="bioAddButton"
          onClick={() => setShowForm(true)}
        >
          + Nova bioimpedância
        </button>
      </section>

      <section className="bioSummaryGrid">
        <BioCard
          title="Peso"
          value={latest?.weight}
          previous={previous?.weight}
          unit="kg"
        />

        <BioCard
          title="Gordura corporal"
          value={latest?.bodyFatPercent}
          previous={previous?.bodyFatPercent}
          unit="%"
        />

        <BioCard
          title="Massa muscular"
          value={latest?.muscleMass}
          previous={previous?.muscleMass}
          unit="kg"
        />

        <BioCard
          title="Massa de gordura"
          value={latest?.fatMass}
          previous={previous?.fatMass}
          unit="kg"
        />
      </section>

      <section className="bioMainGrid">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">ÚLTIMO REGISTRO</span>
              <h3>Composição corporal</h3>
            </div>

            {latest && (
              <span className="bioDate">
                {formatDate(latest.date)}
              </span>
            )}
          </div>

          {!latest ? (
            <div className="bioEmpty">
              <strong>
                Nenhuma bioimpedância registrada
              </strong>

              <span>
                Adicione sua primeira avaliação.
              </span>
            </div>
          ) : (
            <div className="bioDetailsGrid">
              <BioDetail
                label="Peso"
                value={latest.weight}
                unit="kg"
              />

              <BioDetail
                label="IMC"
                value={latest.bmi}
              />

              <BioDetail
                label="Gordura corporal"
                value={latest.bodyFatPercent}
                unit="%"
              />

              <BioDetail
                label="Massa de gordura"
                value={latest.fatMass}
                unit="kg"
              />

              <BioDetail
                label="Massa muscular"
                value={latest.muscleMass}
                unit="kg"
              />

              <BioDetail
                label="Massa magra"
                value={latest.leanMass}
                unit="kg"
              />

              <BioDetail
                label="Água corporal"
                value={latest.bodyWaterPercent}
                unit="%"
              />

              <BioDetail
                label="Gordura visceral"
                value={latest.visceralFat}
              />

              <BioDetail
                label="Metabolismo basal"
                value={latest.basalMetabolism}
                unit="kcal"
              />

              <BioDetail
                label="Idade metabólica"
                value={latest.metabolicAge}
                unit="anos"
              />
            </div>
          )}

          {latest?.notes && (
            <div className="bioNotesBox">
              <span>Observações</span>
              <p>{latest.notes}</p>
            </div>
          )}
        </div>

        <div className="panel">
          <span className="eyebrow">EVOLUÇÃO</span>
          <h3>Comparação com a anterior</h3>

          {!latest || !previous ? (
            <div className="bioEmpty">
              <strong>
                Precisamos de pelo menos 2 registros
              </strong>

              <span>
                As diferenças aparecerão automaticamente.
              </span>
            </div>
          ) : (
            <div className="bioComparison">
              <BioComparisonRow
                label="Peso"
                current={latest.weight}
                previous={previous.weight}
                unit="kg"
              />

              <BioComparisonRow
                label="Gordura corporal"
                current={latest.bodyFatPercent}
                previous={previous.bodyFatPercent}
                unit="%"
              />

              <BioComparisonRow
                label="Massa de gordura"
                current={latest.fatMass}
                previous={previous.fatMass}
                unit="kg"
              />

              <BioComparisonRow
                label="Massa muscular"
                current={latest.muscleMass}
                previous={previous.muscleMass}
                unit="kg"
              />

              <BioComparisonRow
                label="Massa magra"
                current={latest.leanMass}
                previous={previous.leanMass}
                unit="kg"
              />

              <BioComparisonRow
                label="Água corporal"
                current={latest.bodyWaterPercent}
                previous={previous.bodyWaterPercent}
                unit="%"
              />
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">HISTÓRICO</span>
            <h3>Avaliações anteriores</h3>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="bioEmpty">
            <strong>Nenhum registro encontrado</strong>
            <span>Seu histórico aparecerá aqui.</span>
          </div>
        ) : (
          <div className="bioTableWrapper">
            <table className="bioTable">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Peso</th>
                  <th>IMC</th>
                  <th>Gordura</th>
                  <th>Massa gorda</th>
                  <th>Massa muscular</th>
                  <th>Água</th>
                  <th>Visceral</th>
                  <th>TMB</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>

                    <td>
                      {bioDisplay(record.weight, "kg")}
                    </td>

                    <td>
                      {bioDisplay(record.bmi)}
                    </td>

                    <td>
                      {bioDisplay(
                        record.bodyFatPercent,
                        "%"
                      )}
                    </td>

                    <td>
                      {bioDisplay(
                        record.fatMass,
                        "kg"
                      )}
                    </td>

                    <td>
                      {bioDisplay(
                        record.muscleMass,
                        "kg"
                      )}
                    </td>

                    <td>
                      {bioDisplay(
                        record.bodyWaterPercent,
                        "%"
                      )}
                    </td>

                    <td>
                      {bioDisplay(record.visceralFat)}
                    </td>

                    <td>
                      {bioDisplay(
                        record.basalMetabolism,
                        "kcal",
                        0
                      )}
                    </td>

                    <td>
                      <button
                        className="bioDeleteButton"
                        onClick={() =>
                          deleteRecord(record.id)
                        }
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="bioModalOverlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="bioModal">
            <div className="bioModalHeader">
              <div>
                <span className="eyebrow">
                  NOVA AVALIAÇÃO
                </span>

                <h3>Registrar bioimpedância</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bioFormGrid">
                <BioInput
                  label="Data"
                  type="date"
                  value={form.date}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      date: value,
                    })
                  }
                />

                <BioInput
                  label="Peso"
                  value={form.weight}
                  unit="kg"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      weight: value,
                    })
                  }
                />

                <BioInput
                  label="IMC"
                  value={form.bmi}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      bmi: value,
                    })
                  }
                />

                <BioInput
                  label="Gordura corporal"
                  value={form.bodyFatPercent}
                  unit="%"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      bodyFatPercent: value,
                    })
                  }
                />

                <BioInput
                  label="Massa de gordura"
                  value={form.fatMass}
                  unit="kg"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      fatMass: value,
                    })
                  }
                />

                <BioInput
                  label="Massa muscular"
                  value={form.muscleMass}
                  unit="kg"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      muscleMass: value,
                    })
                  }
                />

                <BioInput
                  label="Massa magra"
                  value={form.leanMass}
                  unit="kg"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      leanMass: value,
                    })
                  }
                />

                <BioInput
                  label="Água corporal"
                  value={form.bodyWaterPercent}
                  unit="%"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      bodyWaterPercent: value,
                    })
                  }
                />

                <BioInput
                  label="Gordura visceral"
                  value={form.visceralFat}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      visceralFat: value,
                    })
                  }
                />

                <BioInput
                  label="Metabolismo basal"
                  value={form.basalMetabolism}
                  unit="kcal"
                  step="1"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      basalMetabolism: value,
                    })
                  }
                />

                <BioInput
                  label="Idade metabólica"
                  value={form.metabolicAge}
                  unit="anos"
                  step="1"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      metabolicAge: value,
                    })
                  }
                />
              </div>

              <label className="bioNotes">
                Observações

                <textarea
                  rows="3"
                  placeholder="Ex.: avaliação realizada em jejum..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                />
              </label>

              <div className="bioModalActions">
                <button
                  type="button"
                  className="bioCancelButton"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bioSaveButton"
                >
                  Salvar bioimpedância
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BioCard({
  title,
  value,
  previous,
  unit,
}) {
  const hasCurrent =
    value !== "" && value !== undefined;

  const hasPrevious =
    previous !== "" && previous !== undefined;

  const difference =
    hasCurrent && hasPrevious
      ? Number(value) - Number(previous)
      : null;

  return (
    <div className="card bioCard">
      <span>{title}</span>

      <div className="cardValue">
        {hasCurrent
          ? Number(value).toFixed(1)
          : "--"}

        <small> {unit}</small>
      </div>

      <p>
        {difference === null
          ? "Sem comparação"
          : `${difference > 0 ? "+" : ""}${difference.toFixed(
              1
            )} ${unit} desde a avaliação anterior`}
      </p>
    </div>
  );
}

function BioDetail({
  label,
  value,
  unit = "",
}) {
  return (
    <div className="bioDetail">
      <span>{label}</span>

      <strong>
        {value !== "" && value !== undefined
          ? `${Number(value).toFixed(1)}${
              unit ? ` ${unit}` : ""
            }`
          : "--"}
      </strong>
    </div>
  );
}

function BioComparisonRow({
  label,
  current,
  previous,
  unit,
}) {
  if (
    current === "" ||
    current === undefined ||
    previous === "" ||
    previous === undefined
  ) {
    return (
      <div className="bioComparisonRow">
        <span>{label}</span>
        <strong>--</strong>
      </div>
    );
  }

  const difference =
    Number(current) - Number(previous);

  return (
    <div className="bioComparisonRow">
      <div>
        <span>{label}</span>

        <small>
          {Number(previous).toFixed(1)} →{" "}
          {Number(current).toFixed(1)}
          {unit ? ` ${unit}` : ""}
        </small>
      </div>

      <strong>
        {difference > 0 ? "+" : ""}
        {difference.toFixed(1)}
        {unit ? ` ${unit}` : ""}
      </strong>
    </div>
  );
}

function BioInput({
  label,
  value,
  onChange,
  unit,
  type = "number",
  step = "0.1",
}) {
  return (
    <label>
      {label}

      <div className="bioInputWrap">
        <input
          type={type}
          step={type === "number" ? step : undefined}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />

        {unit && <span>{unit}</span>}
      </div>
    </label>
  );
}

function bioNumber(value) {
  if (value === "") return "";

  return Number(value);
}

function bioDisplay(
  value,
  unit = "",
  decimals = 1
) {
  if (
    value === "" ||
    value === undefined ||
    value === null
  ) {
    return "--";
  }

  return `${Number(value).toFixed(decimals)}${
    unit ? ` ${unit}` : ""
  }`;
}

function SleepPage({
  currentUser,
  addHistory,
}) {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const emptyForm = {
    date: today,

    sleepScore: "",
    bedtime: "",
    wakeTime: "",

    sleepDurationMinutes: "",
    actualSleepMinutes: "",

    physicalRecovery: "",
    restScore: "",
    mentalRecovery: "",

    sleepCycles: "",

    deepSleepMinutes: "",
    remSleepMinutes: "",
    lightSleepMinutes: "",
    awakeMinutes: "",

    perceivedQuality: "",
    notes: "",
  };

  const [form, setForm] =
    useState(emptyForm);

  useEffect(() => {
    async function loadSleep() {
      try {
        const data =
          await getSleepRecords();

        setRecords(data || []);
      } catch (error) {
        console.error(
          "Erro ao carregar sono:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSleep();
  }, []);

  function formatMinutes(minutes) {
    if (
      minutes === "" ||
      minutes === null ||
      minutes === undefined
    ) {
      return "--";
    }

    const total = Number(minutes);

    if (Number.isNaN(total)) {
      return "--";
    }

    const hours = Math.floor(
      total / 60
    );

    const remaining =
      total % 60;

    if (hours === 0) {
      return `${remaining}min`;
    }

    if (remaining === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remaining}min`;
  }

  function openNewRecord() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      date: today,
    });

    setShowForm(true);
  }

  function openEditRecord(record) {
    setEditingId(record.id);

    setForm({
      date: record.date || today,

      sleepScore:
        record.sleepScore ?? "",

      bedtime:
        record.bedtime || "",

      wakeTime:
        record.wakeTime || "",

      sleepDurationMinutes:
        record.sleepDurationMinutes ??
        "",

      actualSleepMinutes:
        record.actualSleepMinutes ??
        "",

      physicalRecovery:
        record.physicalRecovery ??
        "",

      restScore:
        record.restScore ?? "",

      mentalRecovery:
        record.mentalRecovery ??
        "",

      sleepCycles:
        record.sleepCycles ?? "",

      deepSleepMinutes:
        record.deepSleepMinutes ??
        "",

      remSleepMinutes:
        record.remSleepMinutes ?? "",

      lightSleepMinutes:
        record.lightSleepMinutes ??
        "",

      awakeMinutes:
        record.awakeMinutes ?? "",

      perceivedQuality:
        record.perceivedQuality ??
        "",

      notes:
        record.notes || "",
    });

    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.date) {
      alert(
        "Informe a data do registro."
      );
      return;
    }

    try {
      const record = {
        date: form.date,

        sleepScore:
          form.sleepScore === ""
            ? ""
            : Number(
                form.sleepScore
              ),

        bedtime:
          form.bedtime,

        wakeTime:
          form.wakeTime,

        sleepDurationMinutes:
          form.sleepDurationMinutes ===
          ""
            ? ""
            : Number(
                form.sleepDurationMinutes
              ),

        actualSleepMinutes:
          form.actualSleepMinutes ===
          ""
            ? ""
            : Number(
                form.actualSleepMinutes
              ),

        physicalRecovery:
          form.physicalRecovery === ""
            ? ""
            : Number(
                form.physicalRecovery
              ),

        restScore:
          form.restScore === ""
            ? ""
            : Number(
                form.restScore
              ),

        mentalRecovery:
          form.mentalRecovery === ""
            ? ""
            : Number(
                form.mentalRecovery
              ),

        sleepCycles:
          form.sleepCycles === ""
            ? ""
            : Number(
                form.sleepCycles
              ),

        deepSleepMinutes:
          form.deepSleepMinutes === ""
            ? ""
            : Number(
                form.deepSleepMinutes
              ),

        remSleepMinutes:
          form.remSleepMinutes === ""
            ? ""
            : Number(
                form.remSleepMinutes
              ),

        lightSleepMinutes:
          form.lightSleepMinutes === ""
            ? ""
            : Number(
                form.lightSleepMinutes
              ),

        awakeMinutes:
          form.awakeMinutes === ""
            ? ""
            : Number(
                form.awakeMinutes
              ),

        perceivedQuality:
          form.perceivedQuality === ""
            ? ""
            : Number(
                form.perceivedQuality
              ),

        notes: form.notes,
      };

      let saved;

      if (editingId) {
        saved =
          await updateSleepRecord(
            editingId,
            record,
            currentUser
          );

        setRecords((previous) =>
          previous
            .map((item) =>
              item.id === editingId
                ? saved
                : item
            )
            .sort(
              (a, b) =>
                new Date(b.date) -
                new Date(a.date)
            )
        );

        await addHistory(
          "alterou",
          "Sono",
          `Registro de sono de ${formatDate(
            record.date
          )} atualizado`
        );
      } else {
        saved =
          await addSleepRecord(
            record,
            currentUser
          );

        setRecords((previous) =>
          [
            saved,
            ...previous,
          ].sort(
            (a, b) =>
              new Date(b.date) -
              new Date(a.date)
          )
        );

        await addHistory(
          "registrou",
          "Sono",
          `Sono de ${formatDate(
            record.date
          )}${
            record.sleepScore !== ""
              ? ` • Pontuação: ${record.sleepScore}`
              : ""
          }${
            record.actualSleepMinutes !==
            ""
              ? ` • ${formatMinutes(
                  record.actualSleepMinutes
                )}`
              : ""
          }`
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (error) {
      console.error(
        "Erro ao salvar sono:",
        error
      );

      alert(
        "Não foi possível salvar o registro de sono."
      );
    }
  }

  async function deleteRecord(id) {
    const record = records.find(
      (item) => item.id === id
    );

    if (!record) return;

    if (
      !window.confirm(
        `Excluir o registro de sono de ${formatDate(
          record.date
        )}?`
      )
    ) {
      return;
    }

    try {
      await deleteSleepRecordFromSupabase(
        id
      );

      setRecords((previous) =>
        previous.filter(
          (item) =>
            item.id !== id
        )
      );

      await addHistory(
        "excluiu",
        "Sono",
        `Registro de ${formatDate(
          record.date
        )}`
      );
    } catch (error) {
      console.error(
        "Erro ao excluir sono:",
        error
      );

      alert(
        "Não foi possível excluir o registro."
      );
    }
  }

  const latest =
    records[0] || null;

  const last7 =
    records.slice(0, 7);

  const averageScore =
    last7.length > 0
      ? last7.reduce(
          (sum, item) =>
            sum +
            Number(
              item.sleepScore || 0
            ),
          0
        ) / last7.length
      : 0;

  const averageActualSleep =
    last7.length > 0
      ? last7.reduce(
          (sum, item) =>
            sum +
            Number(
              item.actualSleepMinutes ||
                0
            ),
          0
        ) / last7.length
      : 0;

  const averagePhysicalRecovery =
    last7.length > 0
      ? last7.reduce(
          (sum, item) =>
            sum +
            Number(
              item.physicalRecovery ||
                0
            ),
          0
        ) / last7.length
      : 0;

  const averageMentalRecovery =
    last7.length > 0
      ? last7.reduce(
          (sum, item) =>
            sum +
            Number(
              item.mentalRecovery ||
                0
            ),
          0
        ) / last7.length
      : 0;

  if (loading) {
    return (
      <section className="panel pagePlaceholder">
        <span className="eyebrow">
          SONO
        </span>

        <h3>
          Carregando seus registros...
        </h3>
      </section>
    );
  }

  return (
    <div className="sleepPage">
      <section className="sleepHero">
        <div>
          <span className="eyebrow">
            RECUPERAÇÃO
          </span>

          <h3>Sono</h3>

          <p>
            Acompanhe duração,
            recuperação, qualidade e
            fases do sono.
          </p>
        </div>

        <button
          className="sleepPrimaryButton"
          onClick={openNewRecord}
        >
          + Adicionar sono
        </button>
      </section>

      <section className="sleepSummaryGrid">
        <SleepSummaryCard
          title="Pontuação"
          value={
            latest?.sleepScore !== ""
              ? latest?.sleepScore ??
                "--"
              : "--"
          }
          suffix="/100"
          detail={
            latest
              ? formatDate(
                  latest.date
                )
              : "Sem registros"
          }
        />

        <SleepSummaryCard
          title="Sono real"
          value={
            latest
              ? formatMinutes(
                  latest.actualSleepMinutes
                )
              : "--"
          }
          detail="Última noite"
        />

        <SleepSummaryCard
          title="Recuperação física"
          value={
            latest?.physicalRecovery !==
              "" &&
            latest?.physicalRecovery !==
              undefined
              ? latest.physicalRecovery
              : "--"
          }
          suffix="%"
          detail="Último registro"
        />

        <SleepSummaryCard
          title="Recuperação mental"
          value={
            latest?.mentalRecovery !==
              "" &&
            latest?.mentalRecovery !==
              undefined
              ? latest.mentalRecovery
              : "--"
          }
          suffix="%"
          detail="Último registro"
        />
      </section>

      {latest && (
        <section className="sleepMainGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <span className="eyebrow">
                  ÚLTIMA NOITE
                </span>

                <h3>
                  Resumo do sono
                </h3>
              </div>

              <span className="sleepDate">
                {formatDate(
                  latest.date
                )}
              </span>
            </div>

            <div className="sleepMetricsGrid">
              <SleepMetric
                label="Pontuação"
                value={
                  latest.sleepScore !==
                  ""
                    ? `${latest.sleepScore}/100`
                    : "--"
                }
              />

              <SleepMetric
                label="Hora de dormir"
                value={
                  latest.bedtime ||
                  "--"
                }
              />

              <SleepMetric
                label="Hora de acordar"
                value={
                  latest.wakeTime ||
                  "--"
                }
              />

              <SleepMetric
                label="Tempo de sono"
                value={formatMinutes(
                  latest.sleepDurationMinutes
                )}
              />

              <SleepMetric
                label="Sono real"
                value={formatMinutes(
                  latest.actualSleepMinutes
                )}
              />

              <SleepMetric
                label="Ciclos"
                value={
                  latest.sleepCycles !==
                  ""
                    ? latest.sleepCycles
                    : "--"
                }
              />
            </div>
          </div>

          <div className="panel">
            <span className="eyebrow">
              RECUPERAÇÃO
            </span>

            <h3>
              Indicadores
            </h3>

            <div className="sleepRecoveryGrid">
              <SleepRecovery
                label="Recuperação física"
                value={
                  latest.physicalRecovery
                }
              />

              <SleepRecovery
                label="Descanso"
                value={
                  latest.restScore
                }
              />

              <SleepRecovery
                label="Recuperação mental"
                value={
                  latest.mentalRecovery
                }
              />

              <SleepRecovery
                label="Qualidade percebida"
                value={
                  latest.perceivedQuality !==
                  ""
                    ? Number(
                        latest.perceivedQuality
                      ) * 20
                    : ""
                }
              />
            </div>
          </div>
        </section>
      )}

      <section className="sleepMainGrid">
        <div className="panel">
          <span className="eyebrow">
            FASES
          </span>

          <h3>
            Fases do sono
          </h3>

          {!latest ? (
            <div className="sleepEmpty">
              Nenhum registro.
            </div>
          ) : (
            <div className="sleepStagesGrid">
              <SleepStage
                label="Sono profundo"
                value={formatMinutes(
                  latest.deepSleepMinutes
                )}
              />

              <SleepStage
                label="Sono REM"
                value={formatMinutes(
                  latest.remSleepMinutes
                )}
              />

              <SleepStage
                label="Sono leve"
                value={formatMinutes(
                  latest.lightSleepMinutes
                )}
              />

              <SleepStage
                label="Acordada"
                value={formatMinutes(
                  latest.awakeMinutes
                )}
              />
            </div>
          )}
        </div>

        <div className="panel">
          <span className="eyebrow">
            MÉDIA RECENTE
          </span>

          <h3>
            Últimos registros
          </h3>

          <div className="sleepMetricsGrid">
            <SleepMetric
              label="Pontuação média"
              value={
                last7.length
                  ? averageScore.toFixed(
                      0
                    )
                  : "--"
              }
            />

            <SleepMetric
              label="Sono médio"
              value={
                last7.length
                  ? formatMinutes(
                      Math.round(
                        averageActualSleep
                      )
                    )
                  : "--"
              }
            />

            <SleepMetric
              label="Recuperação física"
              value={
                last7.length
                  ? `${averagePhysicalRecovery.toFixed(
                      0
                    )}%`
                  : "--"
              }
            />

            <SleepMetric
              label="Recuperação mental"
              value={
                last7.length
                  ? `${averageMentalRecovery.toFixed(
                      0
                    )}%`
                  : "--"
              }
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">
              HISTÓRICO
            </span>

            <h3>
              Registros de sono
            </h3>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="sleepEmpty">
            <strong>
              Nenhum sono registrado
            </strong>

            <span>
              Adicione sua primeira
              noite para acompanhar a
              evolução.
            </span>
          </div>
        ) : (
          <div className="sleepHistory">
            {records.map(
              (record) => (
                <div
                  className="sleepHistoryRow"
                  key={record.id}
                >
                  <div>
                    <strong>
                      {formatDate(
                        record.date
                      )}
                    </strong>

                    <span>
                      {record.bedtime ||
                        "--"}
                      {" → "}
                      {record.wakeTime ||
                        "--"}
                    </span>
                  </div>

                  <div>
                    <span>
                      Pontuação
                    </span>

                    <strong>
                      {record.sleepScore !==
                      ""
                        ? record.sleepScore
                        : "--"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Sono real
                    </span>

                    <strong>
                      {formatMinutes(
                        record.actualSleepMinutes
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Física
                    </span>

                    <strong>
                      {record.physicalRecovery !==
                      ""
                        ? `${record.physicalRecovery}%`
                        : "--"}
                    </strong>
                  </div>

                  <div className="sleepHistoryActions">
                    <button
                      type="button"
                      onClick={() =>
                        openEditRecord(
                          record
                        )
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        deleteRecord(
                          record.id
                        )
                      }
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="sleepModalOverlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setShowForm(false);
            }
          }}
        >
          <div className="sleepModal">
            <div className="sleepModalHeader">
              <div>
                <span className="eyebrow">
                  {editingId
                    ? "EDITAR SONO"
                    : "NOVO REGISTRO"}
                </span>

                <h3>
                  {editingId
                    ? "Editar registro"
                    : "Registrar sono"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div className="sleepFormGrid">
                <label>
                  Data

                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Pontuação do sono

                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="71"
                    value={
                      form.sleepScore
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sleepScore:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Hora de dormir

                  <input
                    type="time"
                    value={
                      form.bedtime
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bedtime:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Hora de acordar

                  <input
                    type="time"
                    value={
                      form.wakeTime
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        wakeTime:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Tempo de sono (min)

                  <input
                    type="number"
                    min="0"
                    placeholder="355"
                    value={
                      form.sleepDurationMinutes
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sleepDurationMinutes:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Sono real (min)

                  <input
                    type="number"
                    min="0"
                    placeholder="312"
                    value={
                      form.actualSleepMinutes
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        actualSleepMinutes:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Recuperação física (%)

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      form.physicalRecovery
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        physicalRecovery:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Descanso (%)

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      form.restScore
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        restScore:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Recuperação mental (%)

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      form.mentalRecovery
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mentalRecovery:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Ciclos do sono

                  <input
                    type="number"
                    min="0"
                    value={
                      form.sleepCycles
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sleepCycles:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Sono profundo (min)

                  <input
                    type="number"
                    min="0"
                    value={
                      form.deepSleepMinutes
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        deepSleepMinutes:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Sono REM (min)

                  <input
                    type="number"
                    min="0"
                    value={
                      form.remSleepMinutes
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        remSleepMinutes:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Sono leve (min)

                  <input
                    type="number"
                    min="0"
                    value={
                      form.lightSleepMinutes
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lightSleepMinutes:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Tempo acordada (min)

                  <input
                    type="number"
                    min="0"
                    value={
                      form.awakeMinutes
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        awakeMinutes:
                          e.target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Qualidade percebida

                  <select
                    value={
                      form.perceivedQuality
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        perceivedQuality:
                          e.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Não informado
                    </option>

                    <option value="1">
                      1 — Muito ruim
                    </option>

                    <option value="2">
                      2 — Ruim
                    </option>

                    <option value="3">
                      3 — Razoável
                    </option>

                    <option value="4">
                      4 — Boa
                    </option>

                    <option value="5">
                      5 — Excelente
                    </option>
                  </select>
                </label>
              </div>

              <label className="sleepNotes">
                Observações

                <textarea
                  rows="3"
                  placeholder="Ex.: acordei durante a noite, treino intenso no dia anterior..."
                  value={
                    form.notes
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target.value,
                    })
                  }
                />
              </label>

              <div className="sleepModalActions">
                <button
                  type="button"
                  className="sleepCancelButton"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="sleepSaveButton"
                >
                  {editingId
                    ? "Salvar alterações"
                    : "Salvar sono"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SleepSummaryCard({
  title,
  value,
  suffix = "",
  detail,
}) {
  return (
    <div className="card sleepSummaryCard">
      <span>{title}</span>

      <div className="cardValue">
        {value}

        {suffix && (
          <small> {suffix}</small>
        )}
      </div>

      <p>{detail}</p>
    </div>
  );
}

function SleepMetric({
  label,
  value,
}) {
  return (
    <div className="sleepMetric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SleepRecovery({
  label,
  value,
}) {
  const numeric =
    value === "" ||
    value === undefined ||
    value === null
      ? null
      : Number(value);

  return (
    <div className="sleepRecovery">
      <div>
        <span>{label}</span>

        <strong>
          {numeric === null
            ? "--"
            : `${numeric.toFixed(
                0
              )}%`}
        </strong>
      </div>

      <div className="sleepRecoveryBar">
        <div
          style={{
            width:
              numeric === null
                ? "0%"
                : `${Math.min(
                    Math.max(
                      numeric,
                      0
                    ),
                    100
                  )}%`,
          }}
        />
      </div>
    </div>
  );
}

function SleepStage({
  label,
  value,
}) {
  return (
    <div className="sleepStage">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}



function WorkoutsPage({
  currentUser,
  addHistory,
}) {
  const [plans, setPlans] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] =
    useState(null);
  const [editingPlanId, setEditingPlanId] =
    useState(null);

  const [workoutsLoading, setWorkoutsLoading] =
    useState(true);

  useEffect(() => {
    async function loadWorkouts() {
      try {
        const [
          plansData,
          sessionsData,
        ] = await Promise.all([
          getWorkoutPlans(),
          getWorkoutSessions(),
        ]);

        setPlans(plansData);
        setSessions(sessionsData);
      } catch (error) {
        console.error(
          "Erro ao carregar treinos:",
          error
        );
      } finally {
        setWorkoutsLoading(false);
      }
    }

    loadWorkouts();
  }, []);

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [showSession, setShowSession] = useState(false);

  const [planForm, setPlanForm] = useState({
    name: "",
    focus: "",
    notes: "",
  });

  const [exerciseRows, setExerciseRows] = useState([
    {
      id: crypto.randomUUID(),
      name: "",
      sets: 3,
      reps: "10",
      load: "",
      rest: 60,
    },
  ]);

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [sessionExercises, setSessionExercises] = useState([]);

  function addExerciseRow() {
    setExerciseRows((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: "",
        sets: 3,
        reps: "10",
        load: "",
        rest: 60,
      },
    ]);
  }

  function updateExerciseRow(id, field, value) {
    setExerciseRows((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
  }

  function removeExerciseRow(id) {
    if (exerciseRows.length === 1) return;

    setExerciseRows((current) =>
      current.filter((item) => item.id !== id)
    );
  }

function editWorkoutSession(session) {
  setEditingSessionId(session.id);

  setActivePlan({
    id: session.planId,
    name: session.planName,
    focus: session.focus,
  });

  setSessionDate(session.date);

  setSessionExercises(
    (session.exercises || []).map(
      (exercise) => ({
        id:
          exercise.id ||
          crypto.randomUUID(),

        name: exercise.name,

        rest: exercise.rest,

        performedSets: (
          exercise.performedSets || []
        ).map((set, index) => ({
          id:
            set.id ||
            crypto.randomUUID(),

          setNumber:
            set.setNumber ||
            index + 1,

          reps: set.reps,

          load: set.load,

          done: Boolean(set.done),
        })),
      })
    )
  );

  setShowSession(true);
}

async function handleSavePlan(e) {
  e.preventDefault();

  if (!planForm.name.trim()) {
    alert("Informe um nome para o treino.");
    return;
  }

  const validExercises =
    exerciseRows.filter(
      (item) =>
        item.name.trim() !== ""
    );

  if (validExercises.length === 0) {
    alert(
      "Adicione pelo menos um exercício."
    );
    return;
  }

  try {
    const planData = {
      name: planForm.name.trim(),
      focus: planForm.focus.trim(),
      notes: planForm.notes.trim(),

      exercises:
        validExercises.map(
          (item) => ({
            name: item.name.trim(),

            sets: Number(
              item.sets || 0
            ),

            reps:
              item.reps?.toString() ||
              "",

            load:
              item.load === ""
                ? ""
                : Number(
                    item.load
                  ),

            rest:
              item.rest === ""
                ? ""
                : Number(
                    item.rest
                  ),
          })
        ),
    };

    let saved;

    if (editingPlanId) {
      saved =
        await updateWorkoutPlan(
          editingPlanId,
          planData,
          currentUser
        );

      setPlans((previous) =>
        previous.map((item) =>
          item.id === editingPlanId
            ? saved
            : item
        )
      );

      await addHistory(
        "alterou",
        "Treinos",
        `Ficha editada: ${saved.name}`
      );
    } else {
      saved =
        await addWorkoutPlan(
          planData,
          currentUser
        );

      setPlans((previous) => [
        ...previous,
        saved,
      ]);

      await addHistory(
        "adicionou",
        "Treinos",
        `Ficha criada: ${saved.name} • ${
          saved.exercises.length
        } ${
          saved.exercises.length ===
          1
            ? "exercício"
            : "exercícios"
        }`
      );
    }

    setPlanForm({
      name: "",
      focus: "",
      notes: "",
    });

    setExerciseRows([
      {
        id: crypto.randomUUID(),
        name: "",
        sets: 3,
        reps: "10",
        load: "",
        rest: 60,
      },
    ]);

    setEditingPlanId(null);
    setShowPlanForm(false);
  } catch (error) {
    console.error(
      "Erro ao salvar ficha:",
      error
    );

    alert(
      "Não foi possível salvar a ficha de treino."
    );
  }
}

function editPlan(plan) {
  setEditingPlanId(plan.id);

  setPlanForm({
    name: plan.name || "",
    focus: plan.focus || "",
    notes: plan.notes || "",
  });

  setExerciseRows(
    (plan.exercises || []).map(
      (exercise) => ({
        id:
          exercise.id ||
          crypto.randomUUID(),

        name: exercise.name || "",

        sets:
          exercise.sets || 3,

        reps:
          exercise.reps || "10",

        load:
          exercise.load ?? "",

        rest:
          exercise.rest ?? 60,
      })
    )
  );

  setShowPlanForm(true);
}

async function deletePlan(id) {
  const plan = plans.find(
    (item) => item.id === id
  );

  if (!plan) return;

  if (
    !window.confirm(
      "Excluir esta ficha de treino?"
    )
  ) {
    return;
  }

  try {
    await deleteWorkoutPlanFromSupabase(
      id
    );

    setPlans((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    await addHistory(
      "excluiu",
      "Treinos",
      `Ficha excluída: ${plan.name}`
    );
  } catch (error) {
    console.error(
      "Erro ao excluir ficha:",
      error
    );

    alert(
      "Não foi possível excluir a ficha."
    );
  }
}
  

  function startWorkout(plan) {
    setEditingSessionId(null);
    setActivePlan(plan);

    setSessionExercises(
      plan.exercises.map((exercise) => ({
        ...exercise,
        sessionId: crypto.randomUUID(),
        performedSets: Array.from(
          { length: Number(exercise.sets || 0) },
          (_, index) => ({
            id: crypto.randomUUID(),
            setNumber: index + 1,
            reps: exercise.reps,
            load: exercise.load,
            done: false,
          })
        ),
      }))
    );

    setSessionDate(
      new Date().toISOString().slice(0, 10)
    );

    setShowSession(true);
  }

  function updatePerformedSet(
    exerciseId,
    setId,
    field,
    value
  ) {
    setSessionExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          performedSets: exercise.performedSets.map(
            (set) =>
              set.id === setId
                ? {
                    ...set,
                    [field]:
                      field === "done"
                        ? value
                        : value,
                  }
                : set
          ),
        };
      })
    );
  }

async function finishWorkout() {
  if (!activePlan) return;

  try {
    const session = {
      planId: activePlan.id,
      planName: activePlan.name,
      focus: activePlan.focus,

      date: sessionDate,

      exercises:
        sessionExercises.map(
          (exercise) => ({
            name: exercise.name,
            rest: exercise.rest,

            performedSets: (
              exercise.performedSets || []
            ).map((set, index) => ({
              setNumber:
                set.setNumber ||
                index + 1,

              reps:
                set.reps === ""
                  ? ""
                  : Number(set.reps),

              load:
                set.load === ""
                  ? ""
                  : Number(set.load),

              done: Boolean(set.done),
            })),
          })
        ),
    };

    let saved;

    if (editingSessionId) {
      saved =
        await updateWorkoutSession(
          editingSessionId,
          session,
          currentUser
        );

      setSessions((previous) =>
        previous
          .map((item) =>
            item.id === editingSessionId
              ? saved
              : item
          )
          .sort(
            (a, b) =>
              new Date(b.date) -
              new Date(a.date)
          )
      );

      await addHistory(
        "alterou",
        "Treinos",
        `Sessão editada: ${
          activePlan.name
        } • ${formatDate(sessionDate)}`
      );
    } else {
      saved =
        await addWorkoutSession(
          session,
          currentUser
        );

      setSessions((previous) => [
        saved,
        ...previous,
      ]);

      const completedSets =
        session.exercises.reduce(
          (total, exercise) =>
            total +
            (
              exercise.performedSets || []
            ).filter(
              (set) => set.done
            ).length,
          0
        );

      await addHistory(
        "registrou",
        "Treinos",
        `${activePlan.name} • ${formatDate(
          sessionDate
        )} • ${completedSets} ${
          completedSets === 1
            ? "série concluída"
            : "séries concluídas"
        }`
      );
    }

    setShowSession(false);
    setActivePlan(null);
    setSessionExercises([]);
    setEditingSessionId(null);
  } catch (error) {
    console.error(
      "Erro ao salvar treino:",
      error
    );

    alert(
      "Não foi possível salvar o treino."
    );
  }
}

async function deleteSession(id) {
  const session = sessions.find(
    (item) => item.id === id
  );

  if (!session) return;

  if (
    !window.confirm(
      `Excluir a sessão "${session.planName}" de ${formatDate(
        session.date
      )}?`
    )
  ) {
    return;
  }

  try {
    await deleteWorkoutSessionFromSupabase(
      id
    );

    setSessions((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    await addHistory(
      "excluiu",
      "Treinos",
      `Sessão excluída: ${
        session.planName
      } • ${formatDate(session.date)}`
    );
  } catch (error) {
    console.error(
      "Erro ao excluir sessão:",
      error
    );

    alert(
      "Não foi possível excluir a sessão."
    );
  }
}

  const totalSessions = sessions.length;

const totalVolume = (sessions || []).reduce(
  (sessionSum, session) => {
    const sessionVolume = (
      session.exercises || []
    ).reduce(
      (exerciseSum, exercise) => {
        const exerciseVolume = (
          exercise.performedSets || []
        ).reduce(
          (setSum, set) => {
            if (!set.done) return setSum;

            const reps = Number(set.reps || 0);
            const load = Number(set.load || 0);

            return setSum + reps * load;
          },
          0
        );

        return exerciseSum + exerciseVolume;
      },
      0
    );

    return sessionSum + sessionVolume;
  },
  0
);

  return (
    <div className="workoutsPage">
      <section className="workoutsHero">
        <div>
          <span className="eyebrow">
            FORÇA & PERFORMANCE
          </span>

          <h3>Treinos</h3>

          <p>
            Organize suas fichas, registre cargas,
            repetições e acompanhe cada sessão realizada.
          </p>
        </div>

        <button
          className="workoutPrimaryButton"
          onClick={() => setShowPlanForm(true)}
        >
          + Criar treino
        </button>
      </section>

      <section className="workoutSummaryGrid">
        <WorkoutSummaryCard
          title="Fichas"
          value={plans.length}
          detail="Treinos cadastrados"
        />

        <WorkoutSummaryCard
          title="Sessões"
          value={totalSessions}
          detail="Treinos realizados"
        />

        <WorkoutSummaryCard
          title="Volume acumulado"
          value={totalVolume.toFixed(0)}
          detail="kg movimentados"
        />

        <WorkoutSummaryCard
          title="Último treino"
          value={
            sessions.length
              ? formatDate(sessions[0].date)
              : "--"
          }
          detail={
            sessions.length
              ? sessions[0].planName
              : "Nenhuma sessão"
          }
        />
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">FICHAS</span>
            <h3>Meus treinos</h3>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="workoutEmpty">
            <strong>Nenhum treino cadastrado</strong>

            <span>
              Crie sua primeira ficha para começar.
            </span>
          </div>
        ) : (
          <div className="workoutPlansGrid">
            {plans.map((plan) => (
              <div
                className="workoutPlanCard"
                key={plan.id}
              >
                <div className="workoutPlanTop">
                  <div>
                    <span className="eyebrow">
                      {plan.focus || "TREINO"}
                    </span>

                    <h4>{plan.name}</h4>
                  </div>

                  <button
                    type="button"
                    className="workoutEditButton"
                    onClick={() =>
                      editPlan(plan)
                    }
                  >
                     Editar
                  </button>

                  <button
                    className="workoutDeleteButton"
                    onClick={() =>
                      deletePlan(plan.id)
                    }
                  >
                    ×
                  </button>
                </div>

                <div className="workoutExercisePreview">
                  {plan.exercises
                    .slice(0, 5)
                    .map((exercise) => (
                      <div
                        key={exercise.id}
                        className="workoutExercisePreviewRow"
                      >
                        <span>
                          {exercise.name}
                        </span>

                        <small>
                          {exercise.sets} ×{" "}
                          {exercise.reps}
                          {exercise.load !== ""
                            ? ` • ${exercise.load} kg`
                            : ""}
                        </small>
                      </div>
                    ))}

                  {plan.exercises.length > 5 && (
                    <span className="workoutMoreExercises">
                      +{plan.exercises.length - 5} exercícios
                    </span>
                  )}
                </div>

                <button
                  className="workoutStartButton"
                  onClick={() =>
                    startWorkout(plan)
                  }
                >
                  Iniciar treino
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">HISTÓRICO</span>
            <h3>Sessões realizadas</h3>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="workoutEmpty">
            <strong>
              Nenhum treino realizado
            </strong>

            <span>
              Quando finalizar um treino, ele aparecerá aqui.
            </span>
          </div>
        ) : (
          <div className="workoutSessionList">
            {sessions.map((session) => {
              const volume = (
                session.exercises || [] ).reduce(
                  (total, exercise) =>
                    total +
                    (exercise.performedSets ||[]).reduce(
                      (sum, set) =>
                        set.done
                          ? sum +
                            Number(set.reps || 0) *
                              Number(set.load || 0)
                          : sum,
                      0
                    ),
                  0
                );

              const completedSets =(
                session.exercises || []).reduce(
                  (total, exercise) =>
                    total +
                    (exercise.performedSets || []).filter(
                      (set) => set.done
                    ).length,
                  0
                );

              return (
                <div
                  className="workoutSessionItem"
                  key={session.id}
                >
                  <div className="workoutSessionDate">
                    <strong>
                      {new Date(
                        `${session.date}T12:00:00`
                      ).getDate()}
                    </strong>

                    <span>
                      {new Date(
                        `${session.date}T12:00:00`
                      )
                        .toLocaleDateString("pt-BR", {
                          month: "short",
                        })
                        .replace(".", "")}
                    </span>
                  </div>

                  <div className="workoutSessionInfo">
                    <strong>
                      {session.planName}
                    </strong>

                    <span>
                      {session.focus ||
                        "Treino"}
                    </span>
                  </div>

                  <div className="workoutSessionMetric">
                    <span>Séries</span>
                    <strong>
                      {completedSets}
                    </strong>
                  </div>

                  <div className="workoutSessionMetric">
                    <span>Volume</span>
                    <strong>
                      {volume.toFixed(0)} kg
                    </strong>
                  </div>
                  <div className="workoutSessionActions">
                    <button
                      type="button"
                      onClick={() =>
                        editWorkoutSession(session)
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        deleteSession(session.id)
                      }
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showPlanForm && (
        <div
          className="workoutModalOverlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowPlanForm(false);
            }
          }}
        >
          <div className="workoutModal">
            <div className="workoutModalHeader">
              <div>
                <span className="eyebrow">
                  NOVA FICHA
                </span>

                <h3>
                  {editingPlanId
                    ? "Editar treino"
                    : "Criar treino"}
                </h3>
              </div>

              <button
                onClick={() =>
                  setShowPlanForm(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePlan}>
              <div className="workoutPlanFormGrid">
                <label>
                  Nome do treino

                  <input
                    type="text"
                    placeholder="Ex.: Treino A"
                    value={planForm.name}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        name: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Foco

                  <input
                    type="text"
                    placeholder="Ex.: Quadríceps e glúteos"
                    value={planForm.focus}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        focus: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="workoutExercisesTitle">
                <div>
                  <span className="eyebrow">
                    EXERCÍCIOS
                  </span>

                  <h4>Montagem da ficha</h4>
                </div>

                <button
                  type="button"
                  onClick={addExerciseRow}
                >
                  + Adicionar exercício
                </button>
              </div>

              <div className="workoutExerciseRows">
                {exerciseRows.map(
                  (exercise, index) => (
                    <div
                      className="workoutExerciseRow"
                      key={exercise.id}
                    >
                      <div className="workoutExerciseNumber">
                        {index + 1}
                      </div>

                      <label className="workoutExerciseName">
                        Exercício

                        <input
                          type="text"
                          placeholder="Ex.: Agachamento livre"
                          value={exercise.name}
                          onChange={(e) =>
                            updateExerciseRow(
                              exercise.id,
                              "name",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Séries

                        <input
                          type="number"
                          min="1"
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExerciseRow(
                              exercise.id,
                              "sets",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Repetições

                        <input
                          type="text"
                          placeholder="8-12"
                          value={exercise.reps}
                          onChange={(e) =>
                            updateExerciseRow(
                              exercise.id,
                              "reps",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Carga inicial

                        <input
                          type="number"
                          step="0.5"
                          placeholder="kg"
                          value={exercise.load}
                          onChange={(e) =>
                            updateExerciseRow(
                              exercise.id,
                              "load",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Descanso

                        <input
                          type="number"
                          step="5"
                          value={exercise.rest}
                          onChange={(e) =>
                            updateExerciseRow(
                              exercise.id,
                              "rest",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <button
                        type="button"
                        className="workoutRemoveExercise"
                        onClick={() =>
                          removeExerciseRow(
                            exercise.id
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>

              <label className="workoutNotes">
                Observações

                <textarea
                  rows="3"
                  placeholder="Ex.: priorizar amplitude e controle..."
                  value={planForm.notes}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      notes: e.target.value,
                    })
                  }
                />
              </label>

              <div className="workoutModalActions">
                <button
                  type="button"
                  className="workoutCancelButton"
                  onClick={() =>
                    setShowPlanForm(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="workoutSaveButton"
                >
                  {editingPlanId
                    ? "Salvar alterações"
                    : "Salvar treino"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSession && activePlan && (
        <div className="workoutSessionOverlay">
          <div className="workoutSessionModal">
            <div className="workoutModalHeader">
              <div>
                <span className="eyebrow">
                  TREINO EM ANDAMENTO
                </span>

                <h3>{activePlan.name}</h3>

                <p className="workoutFocusText">
                  {activePlan.focus}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowSession(false)
                }
              >
                ×
              </button>
            </div>

            <label className="workoutSessionDateField">
              Data

              <input
                type="date"
                value={sessionDate}
                onChange={(e) =>
                  setSessionDate(e.target.value)
                }
              />
            </label>

            <div className="workoutLiveExercises">
              {sessionExercises.map(
                (exercise) => (
                  <div
                    className="workoutLiveExercise"
                    key={exercise.id}
                  >
                    <div className="workoutLiveExerciseHeader">
                      <div>
                        <strong>
                          {exercise.name}
                        </strong>

                        <span>
                          Descanso: {exercise.rest}s
                        </span>
                      </div>
                    </div>

                    <div className="workoutSetHeader">
                      <span>Série</span>
                      <span>Reps</span>
                      <span>Carga</span>
                      <span>Feita</span>
                    </div>

                    {exercise.performedSets.map(
                      (set) => (
                        <div
                          className="workoutSetRow"
                          key={set.id}
                        >
                          <strong>
                            {set.setNumber}
                          </strong>

                          <input
                            type="number"
                            min="0"
                            value={set.reps}
                            onChange={(e) =>
                              updatePerformedSet(
                                exercise.id,
                                set.id,
                                "reps",
                                e.target.value
                              )
                            }
                          />

                          <div className="workoutLoadInput">
                            <input
                              type="number"
                              step="0.5"
                              value={set.load}
                              onChange={(e) =>
                                updatePerformedSet(
                                  exercise.id,
                                  set.id,
                                  "load",
                                  e.target.value
                                )
                              }
                            />

                            <span>kg</span>
                          </div>

                          <input
                            type="checkbox"
                            checked={set.done}
                            onChange={(e) =>
                              updatePerformedSet(
                                exercise.id,
                                set.id,
                                "done",
                                e.target.checked
                              )
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                )
              )}
            </div>

            <div className="workoutModalActions">
              <button
                type="button"
                className="workoutCancelButton"
                onClick={() =>
                  setShowSession(false)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="workoutSaveButton"
                onClick={finishWorkout}
              >
                Finalizar treino
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutSummaryCard({
  title,
  value,
  detail,
}) {
  return (
    <div className="card workoutSummaryCard">
      <span>{title}</span>

      <div className="cardValue">
        {value}
      </div>

      <p>{detail}</p>
    </div>
  );
}

function PerformancePage() {
  const [sessions, setSessions] = useState([]);
  const [performanceLoading, setPerformanceLoading] =
    useState(true);

  useEffect(() => {
    async function loadPerformance() {
      try {
        const data =
          await getWorkoutSessions();

        setSessions(data);
      } catch (error) {
        console.error(
          "Erro ao carregar performance:",
          error
        );
      } finally {
        setPerformanceLoading(false);
      }
    }

    loadPerformance();
  }, []);

  const exerciseNames = Array.from(
    new Set(
      sessions.flatMap((session) =>
        (session.exercises || []).map(
          (exercise) => exercise.name
        )
      )
    )
  )
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b)
    );

  const [selectedExercise, setSelectedExercise] = useState(
    exerciseNames[0] || ""
  );

  useEffect(() => {
    if (
      !selectedExercise &&
      exerciseNames.length > 0
    ) {
      setSelectedExercise(
        exerciseNames[0]
      );
    }
  }, [
    exerciseNames,
    selectedExercise,
  ]);

  function getSessionVolume(session) {
    return (
      session.exercises || []
    ).reduce(
      (total, exercise) => {
        const exerciseVolume = (
          exercise.performedSets || []
        ).reduce(
          (sum, set) => {
            if (!set.done) return sum;

            return (
              sum +
              Number(set.reps || 0) *
                Number(set.load || 0)
            );
          },
          0
        );

        return total + exerciseVolume;
      },
      0
    );
  }

  function getSessionCompletedSets(
    session
  ) {
    return (
      session.exercises || []
    ).reduce(
      (total, exercise) =>
        total +
        (
          exercise.performedSets || []
        ).filter(
          (set) => set.done
        ).length,
      0
    );
  }

  const totalVolume = sessions.reduce(
    (sum, session) =>
      sum + getSessionVolume(session),
    0
  );

  const totalSets = sessions.reduce(
    (sum, session) =>
      sum + getSessionCompletedSets(session),
    0
  );

  const allCompletedSets = sessions.flatMap((session) =>
    (session.exercises || []).flatMap((exercise) =>
      (exercise.performedSets || [])
        .filter((set) => set.done)
        .map((set) => ({
          ...set,
          exerciseName: exercise.name,
          date: session.date,
          planName: session.planName,
        }))
    )
  );

  const maxLoad =
    allCompletedSets.length > 0
      ? Math.max(
          ...allCompletedSets.map((set) =>
            Number(set.load || 0)
          )
        )
      : 0;

  const bestSession =
    sessions.length > 0
      ? [...sessions].sort(
          (a, b) =>
            getSessionVolume(b) -
            getSessionVolume(a)
        )[0]
      : null;

  const exerciseHistory = sessions
    .flatMap((session) => {
      const exercise = (session.exercises || []).find(
        (item) =>
          item.name === selectedExercise
      );

      if (!exercise) return [];

      const completedSets =
        (exercise.performedSets || []).filter(
          (set) => set.done
        );

      if (completedSets.length === 0) return [];

      const volume = completedSets.reduce(
        (sum, set) =>
          sum +
          Number(set.reps || 0) *
            Number(set.load || 0),
        0
      );

      const bestLoad = Math.max(
        ...completedSets.map((set) =>
          Number(set.load || 0)
        )
      );

      const totalReps = completedSets.reduce(
        (sum, set) =>
          sum + Number(set.reps || 0),
        0
      );

      return [
        {
          sessionId: session.id,
          date: session.date,
          planName: session.planName,
          volume,
          bestLoad,
          totalReps,
          sets: completedSets.length,
        },
      ];
    })
    .sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );

  const exerciseBestLoad =
    exerciseHistory.length > 0
      ? Math.max(
          ...exerciseHistory.map(
            (item) => item.bestLoad
          )
        )
      : 0;

  const exerciseBestVolume =
    exerciseHistory.length > 0
      ? Math.max(
          ...exerciseHistory.map(
            (item) => item.volume
          )
        )
      : 0;

  const latestExerciseSession =
    exerciseHistory.length > 0
      ? exerciseHistory[
          exerciseHistory.length - 1
        ]
      : null;

  const previousExerciseSession =
    exerciseHistory.length > 1
      ? exerciseHistory[
          exerciseHistory.length - 2
        ]
      : null;

  const loadDifference =
    latestExerciseSession &&
    previousExerciseSession
      ? latestExerciseSession.bestLoad -
        previousExerciseSession.bestLoad
      : null;

  const volumeDifference =
    latestExerciseSession &&
    previousExerciseSession
      ? latestExerciseSession.volume -
        previousExerciseSession.volume
      : null;

  const maxChartVolume =
    exerciseHistory.length > 0
      ? Math.max(
          ...exerciseHistory.map(
            (item) => item.volume
          )
        )
      : 0;

  const exerciseRanking = exerciseNames
    .map((name) => {
      const sets = allCompletedSets.filter(
        (set) => set.exerciseName === name
      );

      const bestLoad =
        sets.length > 0
          ? Math.max(
              ...sets.map((set) =>
                Number(set.load || 0)
              )
            )
          : 0;

      const volume = sets.reduce(
        (sum, set) =>
          sum +
          Number(set.load || 0) *
            Number(set.reps || 0),
        0
      );

      return {
        name,
        bestLoad,
        volume,
        sets: sets.length,
      };
    })
    .sort((a, b) => b.volume - a.volume);

if (performanceLoading) {
  return (
    <section className="panel pagePlaceholder">
      <span className="eyebrow">
        PERFORMANCE
      </span>

      <h3>
        Carregando seus treinos...
      </h3>
    </section>
  );
}
    
  return (
    <div className="performancePage">
      <section className="performanceHero">
        <div>
          <span className="eyebrow">
            DADOS DE TREINO
          </span>

          <h3>Performance</h3>

          <p>
            Acompanhe evolução de carga, volume,
            frequência e desempenho por exercício.
          </p>
        </div>

        <div className="performanceHeroBadge">
          {sessions.length}{" "}
          {sessions.length === 1
            ? "sessão registrada"
            : "sessões registradas"}
        </div>
      </section>

      <section className="performanceSummaryGrid">
        <PerformanceCard
          title="Treinos realizados"
          value={sessions.length}
          detail="Sessões registradas"
        />

        <PerformanceCard
          title="Volume total"
          value={totalVolume.toFixed(0)}
          suffix=" kg"
          detail="Carga acumulada"
        />

        <PerformanceCard
          title="Séries realizadas"
          value={totalSets}
          detail="Séries concluídas"
        />

        <PerformanceCard
          title="Maior carga"
          value={maxLoad.toFixed(1)}
          suffix=" kg"
          detail="Entre todos os exercícios"
        />
      </section>

      <section className="performanceMainGrid">
        <div className="panel">
          <div className="performanceSectionHeader">
            <div>
              <span className="eyebrow">
                EXERCÍCIO
              </span>

              <h3>Evolução individual</h3>
            </div>

            <select
              className="performanceSelect"
              value={selectedExercise}
              onChange={(e) =>
                setSelectedExercise(e.target.value)
              }
              disabled={
                exerciseNames.length === 0
              }
            >
              {exerciseNames.length === 0 ? (
                <option>
                  Nenhum exercício
                </option>
              ) : (
                exerciseNames.map((name) => (
                  <option key={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
          </div>

          {exerciseHistory.length === 0 ? (
            <div className="performanceEmpty">
              <strong>
                Ainda não existem dados suficientes
              </strong>

              <span>
                Finalize um treino com séries marcadas
                como realizadas.
              </span>
            </div>
          ) : (
            <>
              <div className="exercisePerformanceCards">
                <MiniPerformanceCard
                  title="Melhor carga"
                  value={exerciseBestLoad.toFixed(1)}
                  unit="kg"
                />

                <MiniPerformanceCard
                  title="Maior volume"
                  value={exerciseBestVolume.toFixed(0)}
                  unit="kg"
                />

                <MiniPerformanceCard
                  title="Sessões"
                  value={exerciseHistory.length}
                />

                <MiniPerformanceCard
                  title="Última carga"
                  value={
                    latestExerciseSession.bestLoad.toFixed(
                      1
                    )
                  }
                  unit="kg"
                />
              </div>

              <div className="performanceChart">
                <div className="performanceChartTitle">
                  <strong>
                    Volume por sessão
                  </strong>

                  <span>
                    {selectedExercise}
                  </span>
                </div>

                <div className="performanceBars">
                  {exerciseHistory.map(
                    (item) => {
                      const height =
                        maxChartVolume > 0
                          ? Math.max(
                              (item.volume /
                                maxChartVolume) *
                                100,
                              5
                            )
                          : 5;

                      return (
                        <div
                          className="performanceBarColumn"
                          key={item.sessionId}
                        >
                          <div className="performanceBarValue">
                            {item.volume.toFixed(0)}
                          </div>

                          <div className="performanceBarArea">
                            <div
                              className="performanceBar"
                              style={{
                                height: `${height}%`,
                              }}
                            />
                          </div>

                          <span>
                            {new Date(
                              `${item.date}T12:00:00`
                            ).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="panel">
          <span className="eyebrow">
            ÚLTIMA EVOLUÇÃO
          </span>

          <h3>Comparação</h3>

          {!latestExerciseSession ||
          !previousExerciseSession ? (
            <div className="performanceEmpty">
              <strong>
                Precisamos de 2 sessões
              </strong>

              <span>
                Faça o mesmo exercício novamente
                para comparar.
              </span>
            </div>
          ) : (
            <div className="performanceComparison">
              <PerformanceComparisonRow
                label="Melhor carga"
                previous={
                  previousExerciseSession.bestLoad
                }
                current={
                  latestExerciseSession.bestLoad
                }
                difference={loadDifference}
                unit="kg"
              />

              <PerformanceComparisonRow
                label="Volume"
                previous={
                  previousExerciseSession.volume
                }
                current={
                  latestExerciseSession.volume
                }
                difference={volumeDifference}
                unit="kg"
                decimals={0}
              />

              <PerformanceComparisonRow
                label="Repetições totais"
                previous={
                  previousExerciseSession.totalReps
                }
                current={
                  latestExerciseSession.totalReps
                }
                difference={
                  latestExerciseSession.totalReps -
                  previousExerciseSession.totalReps
                }
                unit=""
                decimals={0}
              />

              <PerformanceComparisonRow
                label="Séries"
                previous={
                  previousExerciseSession.sets
                }
                current={
                  latestExerciseSession.sets
                }
                difference={
                  latestExerciseSession.sets -
                  previousExerciseSession.sets
                }
                unit=""
                decimals={0}
              />
            </div>
          )}
        </div>
      </section>

      <section className="performanceBottomGrid">
        <div className="panel">
          <span className="eyebrow">
            EXERCÍCIOS
          </span>

          <h3>Ranking por volume</h3>

          {exerciseRanking.length === 0 ? (
            <div className="performanceEmpty">
              <strong>
                Nenhum exercício registrado
              </strong>
            </div>
          ) : (
            <div className="performanceRanking">
              {exerciseRanking.map(
                (exercise, index) => (
                  <div
                    className="performanceRankingRow"
                    key={exercise.name}
                  >
                    <div className="performanceRankingNumber">
                      {index + 1}
                    </div>

                    <div className="performanceRankingInfo">
                      <strong>
                        {exercise.name}
                      </strong>

                      <span>
                        {exercise.sets} séries
                        realizadas
                      </span>
                    </div>

                    <div className="performanceRankingMetric">
                      <span>Melhor carga</span>

                      <strong>
                        {exercise.bestLoad.toFixed(1)} kg
                      </strong>
                    </div>

                    <div className="performanceRankingMetric">
                      <span>Volume total</span>

                      <strong>
                        {exercise.volume.toFixed(0)} kg
                      </strong>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="panel">
          <span className="eyebrow">
            DESTAQUE
          </span>

          <h3>Melhor sessão</h3>

          {!bestSession ? (
            <div className="performanceEmpty">
              <strong>
                Nenhuma sessão registrada
              </strong>
            </div>
          ) : (
            <div className="bestSessionCard">
              <div className="bestSessionDate">
                {formatDate(bestSession.date)}
              </div>

              <strong>
                {bestSession.planName}
              </strong>

              <span>
                {bestSession.focus || "Treino"}
              </span>

              <div className="bestSessionMetrics">
                <div>
                  <span>Volume</span>

                  <strong>
                    {getSessionVolume(
                      bestSession
                    ).toFixed(0)}{" "}
                    kg
                  </strong>
                </div>

                <div>
                  <span>Séries</span>

                  <strong>
                    {getSessionCompletedSets(
                      bestSession
                    )}
                  </strong>
                </div>

                <div>
                  <span>Exercícios</span>

                  <strong>
                    {
                      bestSession.exercises
                        .length
                    }
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">
              HISTÓRICO
            </span>

            <h3>
              Performance por sessão
            </h3>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="performanceEmpty">
            <strong>
              Nenhum treino registrado
            </strong>
          </div>
        ) : (
          <div className="performanceTableWrapper">
            <table className="performanceTable">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Treino</th>
                  <th>Foco</th>
                  <th>Exercícios</th>
                  <th>Séries</th>
                  <th>Volume</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      {formatDate(
                        session.date
                      )}
                    </td>

                    <td>
                      <strong>
                        {session.planName}
                      </strong>
                    </td>

                    <td>
                      {session.focus || "--"}
                    </td>

                    <td>
                      {
                        session.exercises
                          .length
                      }
                    </td>

                    <td>
                      {getSessionCompletedSets(
                        session
                      )}
                    </td>

                    <td>
                      {getSessionVolume(
                        session
                      ).toFixed(0)}{" "}
                      kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PerformanceCard({
  title,
  value,
  suffix = "",
  detail,
}) {
  return (
    <div className="card performanceCard">
      <span>{title}</span>

      <div className="cardValue">
        {value}

        {suffix && (
          <small>{suffix}</small>
        )}
      </div>

      <p>{detail}</p>
    </div>
  );
}

function MiniPerformanceCard({
  title,
  value,
  unit = "",
}) {
  return (
    <div className="miniPerformanceCard">
      <span>{title}</span>

      <strong>
        {value}
        {unit && (
          <small> {unit}</small>
        )}
      </strong>
    </div>
  );
}

function PerformanceComparisonRow({
  label,
  previous,
  current,
  difference,
  unit,
  decimals = 1,
}) {
  const percent =
    previous !== 0
      ? ((current - previous) /
          previous) *
        100
      : null;

  return (
    <div className="performanceComparisonRow">
      <div>
        <span>{label}</span>

        <small>
          {Number(previous).toFixed(
            decimals
          )}
          {unit ? ` ${unit}` : ""}
          {" → "}
          {Number(current).toFixed(
            decimals
          )}
          {unit ? ` ${unit}` : ""}
        </small>
      </div>

      <div className="performanceDifference">
        <strong>
          {difference > 0 ? "+" : ""}
          {Number(difference).toFixed(
            decimals
          )}
          {unit ? ` ${unit}` : ""}
        </strong>

        {percent !== null && (
          <span>
            {percent > 0 ? "+" : ""}
            {percent.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function CheckInPage({
  currentUser,
  addHistory,
}) {

  const [openTodayRequested] = useState(() => {
    const requested =
      sessionStorage.getItem(
        "lifeos-open-today-checkin"
      ) === "true";

    sessionStorage.removeItem(
      "lifeos-open-today-checkin"
    );

    return requested;
  });

  const [checkInDataLoaded, setCheckInDataLoaded] =
    useState(false);
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const [records, setRecords] =
    useState([]);

  const [sleepRecords, setSleepRecords] = useState([]);

  useEffect(() => {
    async function loadCheckIns() {
      try {
        const [
          checkinData,
          sleepData,
        ] = await Promise.all([
          getCheckIns(),
          getSleepRecords(),
        ]);

        setRecords(checkinData || []);
        setSleepRecords(sleepData || []);
        setCheckInDataLoaded(true);
      } catch (error) {
        console.error(
          "Erro ao carregar check-ins:",
          error
        );

        setCheckInDataLoaded(true);
      }
    }

    loadCheckIns();
  }, []);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    date: today,
    weight: "",
    sleepHours: "",
    sleepQuality: 3,
    water: "",
    energy: 3,
    hunger: 3,
    stress: 3,
    steps: "",
    trained: false,
    notes: "",
  });


  async function handleSubmit(e) {
  e.preventDefault();

  if (!form.date) {
    alert("Informe a data.");
    return;
  }

  const existing = records.find(
    (item) => item.date === form.date
  );

  try {
    const record = {
      date: form.date,

      weight:
        form.weight === ""
          ? ""
          : Number(form.weight),

      sleepHours:
        form.sleepHours === ""
          ? ""
          : Number(form.sleepHours),

      sleepQuality:
        Number(form.sleepQuality),

      water:
        form.water === ""
          ? ""
          : Number(form.water),

      energy: Number(form.energy),
      hunger: Number(form.hunger),
      stress: Number(form.stress),

      steps:
        form.steps === ""
          ? ""
          : Number(form.steps),

      trained: form.trained,
      notes: form.notes,
    };

    const saved = await saveCheckIn(
      record,
      currentUser
    );

    setRecords((previous) => {
      const withoutSameDate =
        previous.filter(
          (item) =>
            item.date !== saved.date
        );

      return [
        saved,
        ...withoutSameDate,
      ].sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );
    });

    await addHistory(
      existing ? "alterou" : "registrou",
      "Check-in",
      `${existing ? "Check-in atualizado" : "Check-in registrado"} em ${formatDate(
        form.date
      )}${
        form.weight
          ? ` • Peso: ${form.weight} kg`
          : ""
      }${
        form.sleepHours
          ? ` • Sono: ${form.sleepHours} h`
          : ""
      }${
        form.trained
          ? " • Treino realizado"
          : ""
      }`
    );

    setShowForm(false);
  } catch (error) {
    console.error(
      "Erro ao salvar check-in:",
      error
    );

    alert(
      "Não foi possível salvar o check-in."
    );
  }
}

  function getSleepForDate(date) {
    return sleepRecords.find(
      (item) => item.date === date
    );
  }

  function openNewCheckIn() {
    const existing = records.find(
      (item) => item.date === today
    );

    const sleepRecord =
      getSleepForDate(today);

    if (existing) {
      setForm({
        date: existing.date,
        weight: existing.weight,

        sleepHours:
          existing.sleepHours,

        sleepQuality:
          existing.sleepQuality,

        water: existing.water,
        energy: existing.energy,
        hunger: existing.hunger,
        stress: existing.stress,
        steps: existing.steps,
        trained: existing.trained,
        notes: existing.notes || "",
      });
    } else {
      const sleepHours =
        sleepRecord?.actualSleepMinutes !== "" &&
        sleepRecord?.actualSleepMinutes !== undefined
          ? (
              Number(
               sleepRecord.actualSleepMinutes
              ) / 60
            ).toFixed(1)
          : "";

      const sleepQuality =
        sleepRecord?.sleepScore !== "" &&
        sleepRecord?.sleepScore !== undefined
          ? Math.max(
              1,
              Math.min(
                5,
                Math.round(
                  Number(
                    sleepRecord.sleepScore
                  ) / 20
                )
              )
            )
          : 3;

      setForm({
        date: today,
        weight: "",
        sleepHours,
        sleepQuality,
        water: "",
        energy: 3,
        hunger: 3,
        stress: 3,
        steps: "",
        trained: false,
        notes: "",
      });
    }

    setShowForm(true);
  }

  useEffect(() => {
    if (
      checkInDataLoaded &&
      openTodayRequested
    ) {
      openNewCheckIn();
    }
  }, [
    checkInDataLoaded,
    openTodayRequested,
  ]);

  function editCheckIn(record) {
    const sleepRecord =
      getSleepForDate(record.date);

    const sleepHours =
      record.sleepHours !== "" &&
      record.sleepHours !== undefined
        ? record.sleepHours
        : sleepRecord?.actualSleepMinutes !== "" &&
          sleepRecord?.actualSleepMinutes !== undefined
        ? (
            Number(
              sleepRecord.actualSleepMinutes
            ) / 60
          ).toFixed(1)
        : "";

    setForm({
      date: record.date,
      weight: record.weight,

      sleepHours,

      sleepQuality:
        record.sleepQuality,

      water: record.water,
      energy: record.energy,
      hunger: record.hunger,
      stress: record.stress,
      steps: record.steps,
      trained: record.trained,
      notes: record.notes || "",
    });

    setShowForm(true);
  }

  async function deleteCheckIn(id) {
  if (
    !window.confirm(
      "Excluir este check-in?"
    )
  ) {
    return;
  }

  const record = records.find(
    (item) => item.id === id
  );

  try {
    await deleteCheckInFromSupabase(id);

    setRecords((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    await addHistory(
      "excluiu",
      "Check-in",
      record
        ? `Check-in de ${formatDate(
            record.date
          )}`
        : "Check-in"
    );
  } catch (error) {
    console.error(
      "Erro ao excluir check-in:",
      error
    );

    alert(
      "Não foi possível excluir o check-in."
    );
  }
}

  const latest = records[0];

  const last7Days = records.slice(0, 7);

  const averageSleep =
    last7Days.length > 0
      ? last7Days.reduce(
          (sum, item) =>
            sum +
            Number(item.sleepHours || 0),
          0
        ) / last7Days.length
      : 0;

  const averageWater =
    last7Days.length > 0
      ? last7Days.reduce(
          (sum, item) =>
            sum + Number(item.water || 0),
          0
        ) / last7Days.length
      : 0;

  const averageEnergy =
    last7Days.length > 0
      ? last7Days.reduce(
          (sum, item) =>
            sum + Number(item.energy || 0),
          0
        ) / last7Days.length
      : 0;

  const trainedDays = last7Days.filter(
    (item) => item.trained
  ).length;

  return (
    <div className="checkinPage">
      <section className="checkinHero">
        <div>
          <span className="eyebrow">
            ROTINA DIÁRIA
          </span>

          <h3>Check-in</h3>

          <p>
            Registre rapidamente como foi seu dia e
            acompanhe sono, hidratação, disposição e hábitos.
          </p>
        </div>

        <button
          className="checkinPrimaryButton"
          onClick={openNewCheckIn}
        >
          + Check-in de hoje
        </button>
      </section>

      <section className="checkinSummaryGrid">
        <CheckInSummaryCard
          title="Sono médio"
          value={
            last7Days.length
              ? averageSleep.toFixed(1)
              : "--"
          }
          suffix=" h"
          detail="Últimos registros"
        />

        <CheckInSummaryCard
          title="Água média"
          value={
            last7Days.length
              ? averageWater.toFixed(1)
              : "--"
          }
          suffix=" L"
          detail="Últimos registros"
        />

        <CheckInSummaryCard
          title="Disposição"
          value={
            last7Days.length
              ? averageEnergy.toFixed(1)
              : "--"
          }
          suffix="/5"
          detail="Média recente"
        />

        <CheckInSummaryCard
          title="Treinos"
          value={trainedDays}
          suffix={
            last7Days.length
              ? ` / ${last7Days.length}`
              : ""
          }
          detail="Dias com treino"
        />
      </section>

      <section className="checkinMainGrid">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">
                ÚLTIMO CHECK-IN
              </span>

              <h3>Resumo do dia</h3>
            </div>

            {latest && (
              <span className="checkinDate">
                {formatDate(latest.date)}
              </span>
            )}
          </div>

          {!latest ? (
            <div className="checkinEmpty">
              <strong>
                Nenhum check-in registrado
              </strong>

              <span>
                Faça seu primeiro registro diário.
              </span>
            </div>
          ) : (
            <>
              <div className="checkinDetailGrid">
                <CheckInDetail
                  label="Peso"
                  value={
                    latest.weight !== ""
                      ? `${Number(
                          latest.weight
                        ).toFixed(1)} kg`
                      : "--"
                  }
                />

                <CheckInDetail
                  label="Sono"
                  value={
                    latest.sleepHours !== ""
                      ? `${latest.sleepHours} h`
                      : "--"
                  }
                />

                <CheckInDetail
                  label="Água"
                  value={
                    latest.water !== ""
                      ? `${latest.water} L`
                      : "--"
                  }
                />

                <CheckInDetail
                  label="Passos"
                  value={
                    latest.steps !== ""
                      ? Number(
                          latest.steps
                        ).toLocaleString("pt-BR")
                      : "--"
                  }
                />

                <CheckInDetail
                  label="Disposição"
                  value={`${latest.energy}/5`}
                />

                <CheckInDetail
                  label="Fome"
                  value={`${latest.hunger}/5`}
                />

                <CheckInDetail
                  label="Estresse"
                  value={`${latest.stress}/5`}
                />

                <CheckInDetail
                  label="Treino"
                  value={
                    latest.trained
                      ? "Realizado"
                      : "Não realizado"
                  }
                />
              </div>

              {latest.notes && (
                <div className="checkinNotesBox">
                  <span>Observações</span>
                  <p>{latest.notes}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="panel">
          <span className="eyebrow">
            BEM-ESTAR
          </span>

          <h3>Indicadores recentes</h3>

          {!latest ? (
            <div className="checkinEmpty">
              <strong>
                Sem dados disponíveis
              </strong>
            </div>
          ) : (
            <div className="checkinIndicators">
              <CheckInIndicator
                label="Qualidade do sono"
                value={latest.sleepQuality}
              />

              <CheckInIndicator
                label="Disposição"
                value={latest.energy}
              />

              <CheckInIndicator
                label="Fome"
                value={latest.hunger}
              />

              <CheckInIndicator
                label="Estresse"
                value={latest.stress}
              />
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">
              HISTÓRICO
            </span>

            <h3>Check-ins registrados</h3>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="checkinEmpty">
            <strong>
              Seu histórico ainda está vazio
            </strong>
          </div>
        ) : (
          <div className="checkinTableWrapper">
            <table className="checkinTable">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Peso</th>
                  <th>Sono</th>
                  <th>Água</th>
                  <th>Disposição</th>
                  <th>Fome</th>
                  <th>Estresse</th>
                  <th>Passos</th>
                  <th>Treino</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {formatDate(record.date)}
                    </td>

                    <td>
                      {record.weight !== ""
                        ? `${Number(
                            record.weight
                          ).toFixed(1)} kg`
                        : "--"}
                    </td>

                    <td>
                      {record.sleepHours !== ""
                        ? `${record.sleepHours} h`
                        : "--"}
                    </td>

                    <td>
                      {record.water !== ""
                        ? `${record.water} L`
                        : "--"}
                    </td>

                    <td>
                      {record.energy}/5
                    </td>

                    <td>
                      {record.hunger}/5
                    </td>

                    <td>
                      {record.stress}/5
                    </td>

                    <td>
                      {record.steps !== ""
                        ? Number(
                            record.steps
                          ).toLocaleString("pt-BR")
                        : "--"}
                    </td>

                    <td>
                      <span
                        className={
                          record.trained
                            ? "checkinTrained yes"
                            : "checkinTrained no"
                        }
                      >
                        {record.trained
                          ? "Sim"
                          : "Não"}
                      </span>
                    </td>

                    <td>
                      <div className="checkinActions">
                        <button
                          onClick={() =>
                            editCheckIn(record)
                          }
                        >
                          Editar
                        </button>

                        <button
                          className="checkinDelete"
                          onClick={() =>
                            deleteCheckIn(
                              record.id
                            )
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="checkinModalOverlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="checkinModal">
            <div className="checkinModalHeader">
              <div>
                <span className="eyebrow">
                  REGISTRO DIÁRIO
                </span>

                <h3>Check-in</h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="checkinFormGrid">
                <CheckInInput
                  label="Data"
                  type="date"
                  value={form.date}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      date: value,
                    })
                  }
                />

                <CheckInInput
                  label="Peso"
                  value={form.weight}
                  unit="kg"
                  step="0.1"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      weight: value,
                    })
                  }
                />

                <CheckInInput
                  label="Horas de sono"
                  value={form.sleepHours}
                  unit="h"
                  step="0.1"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      sleepHours: value,
                    })
                  }
                />

                <CheckInInput
                  label="Água"
                  value={form.water}
                  unit="L"
                  step="0.1"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      water: value,
                    })
                  }
                />

                <CheckInInput
                  label="Passos"
                  value={form.steps}
                  step="1"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      steps: value,
                    })
                  }
                />
              </div>

              <div className="checkinScales">
                <CheckInScale
                  label="Qualidade do sono"
                  value={form.sleepQuality}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      sleepQuality: value,
                    })
                  }
                />

                <CheckInScale
                  label="Disposição"
                  value={form.energy}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      energy: value,
                    })
                  }
                />

                <CheckInScale
                  label="Fome"
                  value={form.hunger}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      hunger: value,
                    })
                  }
                />

                <CheckInScale
                  label="Estresse"
                  value={form.stress}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      stress: value,
                    })
                  }
                />
              </div>

              <label className="checkinToggle">
                <input
                  type="checkbox"
                  checked={form.trained}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      trained: e.target.checked,
                    })
                  }
                />

                <div>
                  <strong>
                    Treino realizado
                  </strong>

                  <span>
                    Marque caso tenha treinado
                    neste dia.
                  </span>
                </div>
              </label>

              <label className="checkinNotes">
                Observações

                <textarea
                  rows="4"
                  placeholder="Ex.: dormi tarde, treino muito bom, mais fome à tarde..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                />
              </label>

              <div className="checkinModalActions">
                <button
                  type="button"
                  className="checkinCancelButton"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="checkinSaveButton"
                >
                  Salvar check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckInSummaryCard({
  title,
  value,
  suffix = "",
  detail,
}) {
  return (
    <div className="card checkinSummaryCard">
      <span>{title}</span>

      <div className="cardValue">
        {value}

        {suffix && (
          <small>{suffix}</small>
        )}
      </div>

      <p>{detail}</p>
    </div>
  );
}

function CheckInDetail({
  label,
  value,
}) {
  return (
    <div className="checkinDetail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CheckInIndicator({
  label,
  value,
}) {
  return (
    <div className="checkinIndicator">
      <div>
        <span>{label}</span>
        <strong>{value}/5</strong>
      </div>

      <div className="checkinIndicatorBar">
        <div
          style={{
            width: `${(value / 5) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

function CheckInInput({
  label,
  value,
  onChange,
  unit,
  type = "number",
  step = "0.1",
}) {
  return (
    <label>
      {label}

      <div className="checkinInputWrap">
        <input
          type={type}
          step={
            type === "number"
              ? step
              : undefined
          }
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />

        {unit && (
          <span>{unit}</span>
        )}
      </div>
    </label>
  );
}

function CheckInScale({
  label,
  value,
  onChange,
}) {
  return (
    <div className="checkinScale">
      <div className="checkinScaleHeader">
        <span>{label}</span>

        <strong>{value}/5</strong>
      </div>

      <div className="checkinScaleButtons">
        {[1, 2, 3, 4, 5].map(
          (number) => (
            <button
              key={number}
              type="button"
              className={
                value === number
                  ? "active"
                  : ""
              }
              onClick={() =>
                onChange(number)
              }
            >
              {number}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function EvolutionPage() {
  const [measurements, setMeasurements] =
    useState([]);

  const [sleepRecords, setSleepRecords] =
    useState([]);

  const [bioRecords, setBioRecords] =
    useState([]);

  const [
    nutritionEntries,
    setNutritionEntries,
  ] = useState([]);

  const [
    workoutSessions,
    setWorkoutSessions,
  ] = useState([]);

  const [checkins, setCheckins] =
    useState([]);

  const [
    evolutionLoading,
    setEvolutionLoading,
  ] = useState(true);

  const [period, setPeriod] =
    useState("all");

  useEffect(() => {
    async function loadEvolution() {
      try {
        const [
          measurementsData,
          bioData,
          nutritionData,
          workoutsData,
          checkinsData,
          sleepData,
        ] = await Promise.all([
          getMeasurements(),
          getBioimpedanceRecords(),
          getNutritionEntries(),
          getWorkoutSessions(),
          getCheckIns(),
          getSleepRecords(),
        ]);

        setSleepRecords(
          sleepData || []
        );

        setMeasurements(
          measurementsData || []
        );

        setBioRecords(
          bioData || []
        );

        setNutritionEntries(
          nutritionData || []
        );

        setWorkoutSessions(
          workoutsData || []
        );

        setCheckins(
          checkinsData || []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar evolução:",
          error
        );
      } finally {
        setEvolutionLoading(false);
      }
    }

    loadEvolution();
  }, []);

  function getStartDate() {
    if (period === "all") return null;

    const now = new Date();
    const date = new Date(now);

    if (period === "30") {
      date.setDate(date.getDate() - 30);
    }

    if (period === "90") {
      date.setDate(date.getDate() - 90);
    }

    if (period === "180") {
      date.setDate(date.getDate() - 180);
    }

    if (period === "365") {
      date.setDate(date.getDate() - 365);
    }

    return date;
  }

  const startDate = getStartDate();

  function withinPeriod(date) {
    if (!startDate) return true;

    return (
      new Date(`${date}T12:00:00`) >=
      startDate
    );
  }

  const filteredMeasurements = measurements
    .filter((item) => withinPeriod(item.date))
    .sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );

  const filteredBio = bioRecords
    .filter((item) => withinPeriod(item.date))
    .sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );

  const filteredCheckins = checkins
    .filter((item) => withinPeriod(item.date))
    .sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );

  const filteredSleep = sleepRecords
    .filter((item) =>
      withinPeriod(item.date)
    )
    .sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );

  const filteredWorkouts = workoutSessions
    .filter((item) => withinPeriod(item.date))
    .sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );

  const filteredNutrition = nutritionEntries.filter(
    (item) => withinPeriod(item.date)
  );

  const weightData = filteredMeasurements
    .filter(
      (item) =>
        item.weight !== "" &&
        item.weight !== undefined
    )
    .map((item) => ({
      date: item.date,
      value: Number(item.weight),
    }));

  const waistData = filteredMeasurements
    .filter(
      (item) =>
        item.waist !== "" &&
        item.waist !== undefined
    )
    .map((item) => ({
      date: item.date,
      value: Number(item.waist),
    }));

  const fatData = filteredBio
    .filter(
      (item) =>
        item.bodyFatPercent !== "" &&
        item.bodyFatPercent !== undefined
    )
    .map((item) => ({
      date: item.date,
      value: Number(item.bodyFatPercent),
    }));

  const muscleData = filteredBio
    .filter(
      (item) =>
        item.muscleMass !== "" &&
        item.muscleMass !== undefined
    )
    .map((item) => ({
      date: item.date,
      value: Number(item.muscleMass),
    }));

  function getWorkoutVolume(session) {
    return (session.exercises ||[]).reduce(
      (total, exercise) =>
        total +
        (exercise.performedSets || []).reduce(
          (sum, set) =>
            set.done
              ? sum +
                Number(set.reps || 0) *
                  Number(set.load || 0)
              : sum,
          0
        ),
      0
    );
  }

  const workoutVolumeData = filteredWorkouts.map(
    (session) => ({
      date: session.date,
      value: getWorkoutVolume(session),
    })
  );

  const nutritionByDate = {};

  filteredNutrition.forEach((entry) => {
    if (!nutritionByDate[entry.date]) {
      nutritionByDate[entry.date] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };
    }

    nutritionByDate[entry.date].calories +=
      Number(entry.calories || 0);

    nutritionByDate[entry.date].protein +=
      Number(entry.protein || 0);

    nutritionByDate[entry.date].carbs +=
      Number(entry.carbs || 0);

    nutritionByDate[entry.date].fat +=
      Number(entry.fat || 0);

    nutritionByDate[entry.date].fiber +=
      Number(entry.fiber || 0);
  });

  const nutritionDays = Object.values(
    nutritionByDate
  );

  const averageCalories =
    nutritionDays.length > 0
      ? nutritionDays.reduce(
          (sum, day) =>
            sum + day.calories,
          0
        ) / nutritionDays.length
      : 0;

  const averageProtein =
    nutritionDays.length > 0
      ? nutritionDays.reduce(
          (sum, day) =>
            sum + day.protein,
          0
        ) / nutritionDays.length
      : 0;

  const averageSleep =
    filteredCheckins.length > 0
      ? filteredCheckins.reduce(
          (sum, item) =>
            sum +
            Number(item.sleepHours || 0),
          0
        ) / filteredCheckins.length
      : 0;

  const averageWater =
    filteredCheckins.length > 0
      ? filteredCheckins.reduce(
          (sum, item) =>
            sum + Number(item.water || 0),
          0
        ) / filteredCheckins.length
      : 0;

  const validSleepScores =
    filteredSleep.filter(
      (item) =>
        item.sleepScore !== "" &&
        item.sleepScore !== undefined
    );

  const averageSleepScore =
    validSleepScores.length > 0
      ? validSleepScores.reduce(
          (sum, item) =>
            sum +
            Number(item.sleepScore || 0),
          0
       ) / validSleepScores.length
     : 0;

  const validActualSleep =
   filteredSleep.filter(
     (item) =>
        item.actualSleepMinutes !== "" &&
        item.actualSleepMinutes !== undefined
    );

  const averageActualSleep =
    validActualSleep.length > 0
     ? validActualSleep.reduce(
         (sum, item) =>
           sum +
           Number(
             item.actualSleepMinutes || 0
           ),
         0
       ) / validActualSleep.length
     : 0;

  const validPhysicalRecovery =
    filteredSleep.filter(
      (item) =>
        item.physicalRecovery !== "" &&
        item.physicalRecovery !== undefined
    );

  const averagePhysicalRecovery =
   validPhysicalRecovery.length > 0
      ? validPhysicalRecovery.reduce(
         (sum, item) =>
            sum +
            Number(
              item.physicalRecovery || 0
            ),
          0
        ) /
        validPhysicalRecovery.length
      : 0;

  const validMentalRecovery =
    filteredSleep.filter(
     (item) =>
       item.mentalRecovery !== "" &&
       item.mentalRecovery !== undefined
    );

  const averageMentalRecovery =
   validMentalRecovery.length > 0
     ? validMentalRecovery.reduce(
         (sum, item) =>
           sum +
           Number(
             item.mentalRecovery || 0
           ),
         0
       ) /
       validMentalRecovery.length
     : 0;    

  const totalTrainingVolume =
    workoutVolumeData.reduce(
      (sum, item) => sum + item.value,
      0
    );

  const weightChange =
    weightData.length >= 2
      ? weightData[weightData.length - 1]
          .value - weightData[0].value
      : null;

  const fatChange =
    fatData.length >= 2
      ? fatData[fatData.length - 1]
          .value - fatData[0].value
      : null;

  const muscleChange =
    muscleData.length >= 2
      ? muscleData[muscleData.length - 1]
          .value - muscleData[0].value
      : null;

  const waistChange =
    waistData.length >= 2
      ? waistData[waistData.length - 1]
          .value - waistData[0].value
      : null;

if (evolutionLoading) {
  return (
    <section className="panel pagePlaceholder">
      <span className="eyebrow">
        EVOLUÇÃO
      </span>

      <h3>
        Carregando sua evolução...
      </h3>
    </section>
  );
}

  return (
    <div className="evolutionPage">
      <section className="evolutionHero">
        <div>
          <span className="eyebrow">
            VISÃO INTEGRADA
          </span>

          <h3>Evolução</h3>

          <p>
            Visualize sua evolução corporal, nutricional
            e de performance ao longo do tempo.
          </p>
        </div>

        <select
          className="evolutionPeriod"
          value={period}
          onChange={(e) =>
            setPeriod(e.target.value)
          }
        >
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 3 meses</option>
          <option value="180">Últimos 6 meses</option>
          <option value="365">Último ano</option>
          <option value="all">Todo o histórico</option>
        </select>
      </section>

      <section className="evolutionSummaryGrid">
        <EvolutionSummaryCard
          title="Peso"
          value={
            weightData.length
              ? weightData[
                  weightData.length - 1
                ].value.toFixed(1)
              : "--"
          }
          suffix=" kg"
          change={weightChange}
          changeUnit="kg"
        />

        <EvolutionSummaryCard
          title="Gordura corporal"
          value={
            fatData.length
              ? fatData[
                  fatData.length - 1
                ].value.toFixed(1)
              : "--"
          }
          suffix="%"
          change={fatChange}
          changeUnit="p.p."
        />

        <EvolutionSummaryCard
          title="Massa muscular"
          value={
            muscleData.length
              ? muscleData[
                  muscleData.length - 1
                ].value.toFixed(1)
              : "--"
          }
          suffix=" kg"
          change={muscleChange}
          changeUnit="kg"
        />

        <EvolutionSummaryCard
          title="Cintura"
          value={
            waistData.length
              ? waistData[
                  waistData.length - 1
                ].value.toFixed(1)
              : "--"
          }
          suffix=" cm"
          change={waistChange}
          changeUnit="cm"
        />
      </section>

      <section className="evolutionChartsGrid">
        <EvolutionChart
          title="Peso"
          subtitle="Evolução corporal"
          data={weightData}
          unit="kg"
        />

        <EvolutionChart
          title="Gordura corporal"
          subtitle="Bioimpedância"
          data={fatData}
          unit="%"
        />

        <EvolutionChart
          title="Massa muscular"
          subtitle="Bioimpedância"
          data={muscleData}
          unit="kg"
        />

        <EvolutionChart
          title="Cintura"
          subtitle="Medidas corporais"
          data={waistData}
          unit="cm"
        />
      </section>

      <section className="evolutionStatsGrid">
        <div className="panel">
          <span className="eyebrow">
            ALIMENTAÇÃO
          </span>

          <h3>Média nutricional</h3>

          <div className="evolutionMetricGrid">
            <EvolutionMetric
              label="Calorias"
              value={
                nutritionDays.length
                  ? averageCalories.toFixed(0)
                  : "--"
              }
              unit="kcal/dia"
            />

            <EvolutionMetric
              label="Proteína"
              value={
                nutritionDays.length
                  ? averageProtein.toFixed(1)
                  : "--"
              }
              unit="g/dia"
            />

            <EvolutionMetric
              label="Dias registrados"
              value={nutritionDays.length}
            />
          </div>
        </div>

        <div className="panel">
          <span className="eyebrow">
            ROTINA
          </span>

          <h3>Hábitos médios</h3>

          <div className="evolutionMetricGrid">
            <EvolutionMetric
              label="Sono"
              value={
                validActualSleep.length
                  ? formatSleepMinutes(
                     Math.round(
                       averageActualSleep
                      )
                    )
                  : "--"
              }
              unit="média/noite"
            />

            <EvolutionMetric
              label="Pontuação do sono"
              value={
                validSleepScores.length
                  ? averageSleepScore.toFixed(0)
                  : "--"
              }
              unit="/100"
            />

            <EvolutionMetric
              label="Recuperação física"
              value={
                validPhysicalRecovery.length
                  ? averagePhysicalRecovery.toFixed(
                      0
                    )
                 : "--"
              }
              unit="%"
            />

            <EvolutionMetric
              label="Recuperação mental"
              value={
                validMentalRecovery.length
                  ? averageMentalRecovery.toFixed(
                      0
                    )
                 : "--"
              }
              unit="%"
           />

            <EvolutionMetric
              label="Água"
              value={
                filteredCheckins.length
                  ? averageWater.toFixed(1)
                 : "--"
              }
              unit="L/dia"
            />

           <EvolutionMetric
             label="Check-ins"
             value={
               filteredCheckins.length
             }
           />
          </div>
        </div>

        <div className="panel">
          <span className="eyebrow">
            TREINO
          </span>

          <h3>Performance</h3>

          <div className="evolutionMetricGrid">
            <EvolutionMetric
              label="Sessões"
              value={filteredWorkouts.length}
            />

            <EvolutionMetric
              label="Volume total"
              value={
                filteredWorkouts.length
                  ? totalTrainingVolume.toFixed(0)
                  : "--"
              }
              unit="kg"
            />

            <EvolutionMetric
              label="Volume médio"
              value={
                filteredWorkouts.length
                  ? (
                      totalTrainingVolume /
                      filteredWorkouts.length
                    ).toFixed(0)
                  : "--"
              }
              unit="kg/treino"
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">
              TREINOS
            </span>

            <h3>Volume por sessão</h3>
          </div>
        </div>

        <EvolutionChart
          title=""
          subtitle=""
          data={workoutVolumeData}
          unit="kg"
          insidePanel
        />
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">
              RESUMO
            </span>

            <h3>Comparação do período</h3>
          </div>
        </div>

        <div className="evolutionComparisonGrid">
          <EvolutionComparison
            label="Peso"
            data={weightData}
            unit="kg"
          />

          <EvolutionComparison
            label="Gordura corporal"
            data={fatData}
            unit="%"
          />

          <EvolutionComparison
            label="Massa muscular"
            data={muscleData}
            unit="kg"
          />

          <EvolutionComparison
            label="Cintura"
            data={waistData}
            unit="cm"
          />
        </div>
      </section>
    </div>
  );
}

function EvolutionSummaryCard({
  title,
  value,
  suffix,
  change,
  changeUnit,
}) {
  return (
    <div className="card evolutionSummaryCard">
      <span>{title}</span>

      <div className="cardValue">
        {value}

        <small>{suffix}</small>
      </div>

      <p>
        {change === null
          ? "Sem comparação disponível"
          : `${change > 0 ? "+" : ""}${change.toFixed(
              1
            )} ${changeUnit} no período`}
      </p>
    </div>
  );
}

function EvolutionChart({
  title,
  subtitle,
  data,
  unit,
  insidePanel = false,
}) {
  const values = data.map((item) => item.value);

  const min =
    values.length > 0
      ? Math.min(...values)
      : 0;

  const max =
    values.length > 0
      ? Math.max(...values)
      : 0;

  const range = max - min || 1;

  const content = (
    <>
      {(title || subtitle) && (
        <div className="evolutionChartHeader">
          <div>
            {subtitle && (
              <span className="eyebrow">
                {subtitle}
              </span>
            )}

            {title && <h3>{title}</h3>}
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div className="evolutionEmpty">
          <strong>
            Nenhum dado disponível
          </strong>

          <span>
            Os registros aparecerão aqui.
          </span>
        </div>
      ) : (
        <div className="evolutionChartArea">
          <div className="evolutionLineChart">
            {data.map((item, index) => {
              const height =
                ((item.value - min) /
                  range) *
                  75 +
                15;

              return (
                <div
                  className="evolutionPointColumn"
                  key={`${item.date}-${index}`}
                >
                  <div className="evolutionPointValue">
                    {item.value.toFixed(1)}{" "}
                    {unit}
                  </div>

                  <div className="evolutionPointArea">
                    <div
                      className="evolutionPoint"
                      style={{
                        bottom: `${height}%`,
                      }}
                    />
                  </div>

                  <span>
                    {new Date(
                      `${item.date}T12:00:00`
                    ).toLocaleDateString(
                      "pt-BR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                      }
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  if (insidePanel) {
    return (
      <div className="evolutionInnerChart">
        {content}
      </div>
    );
  }

  return (
    <div className="panel evolutionChartCard">
      {content}
    </div>
  );
}

function EvolutionMetric({
  label,
  value,
  unit = "",
}) {
  return (
    <div className="evolutionMetric">
      <span>{label}</span>

      <strong>
        {value}

        {unit && (
          <small> {unit}</small>
        )}
      </strong>
    </div>
  );
}

function EvolutionComparison({
  label,
  data,
  unit,
}) {
  if (data.length < 2) {
    return (
      <div className="evolutionComparisonItem">
        <span>{label}</span>

        <strong>--</strong>

        <small>
          Dados insuficientes
        </small>
      </div>
    );
  }

  const first = data[0];
  const last = data[data.length - 1];

  const difference =
    last.value - first.value;

  const percent =
    first.value !== 0
      ? (difference / first.value) * 100
      : null;

  return (
    <div className="evolutionComparisonItem">
      <span>{label}</span>

      <strong>
        {first.value.toFixed(1)}
        {" → "}
        {last.value.toFixed(1)} {unit}
      </strong>

      <small>
        {difference > 0 ? "+" : ""}
        {difference.toFixed(1)} {unit}

        {percent !== null && (
          <>
            {" • "}
            {percent > 0 ? "+" : ""}
            {percent.toFixed(1)}%
          </>
        )}
      </small>
    </div>
  );
}

function SubstitutionsSection({
  onAddSubstitution,
  currentUser,
  addHistory,
}) {
  const DEFAULT_GROUPS = [
    {
      id: "bread-cereals",
      name: "Cereais — Pães",
      description: "1 porção equivale a",
      items: [
        "1 fatia de pão integral",
        "1 fatia de pão de centeio",
        "1/2 unidade de pão francês sem miolo",
        "1 fatia fina de pão de glúten",
        "1 pão de hot dog",
        "1 unidade pequena de pão de batata",
        "1 unidade pequena de pão sírio",
        "1 fatia de pão caseiro",
        "1 fatia de pão de forma",
        "1 unidade de pão de leite",
        "2 xícaras de chá de pipoca",
        "1 colher de sopa de cereais integrais",
        "2 fatias finas de torrada de pão francês",
        "2 unidades de torrada tipo Bauducco",
        "1 unidade de torrada de pão de forma",
        "2 unidades de biscoito cream cracker",
        "4 unidades de biscoito integral",
        "2 fatias de pão light",
        "2 colheres de sopa de tapioca",
        "3 colheres de sopa de cuscuz cru",
      ],
    },

    {
      id: "rice-cereals",
      name: "Cereais — Arroz e acompanhamentos",
      description: "1 porção equivale a",
      items: [
        "3 colheres de sopa de arroz integral",
        "3 colheres de sopa de arroz branco cozido",
        "3 pegadores de macarrão cozido",
        "4 colheres de sopa de batata-doce",
        "4 colheres de sopa de batata cozida",
        "1 colher de servir de purê de batatas",
        "2 colheres de sopa de farinha de milho",
        "2 colheres de sopa de farinha de mandioca",
        "3 colheres de sopa de mandioca cozida",
        "3 colheres de sopa de mandioquinha-salsa cozida",
        "4 colheres de sopa de milho-verde enlatado",
        "1 espiga pequena de milho-verde",
        "2 colheres de sopa de polenta",
        "2 colheres de sopa de fubá",
        "4 colheres de sopa de nhoque",
        "1 unidade média de canelone",
        "1 xícara de chá de capeleti ou ravioli",
        "2 colheres de sopa de inhame",
        "1 xícara de pipoca",
      ],
    },

    {
      id: "vegetables-a",
      name: "Grupo A — Folhosos e verduras",
      description: "Opções do grupo",
      items: [
        "Acelga",
        "Agrião",
        "Aipo",
        "Alface",
        "Almeirão",
        "Cebola",
        "Couve",
        "Chicória",
        "Champignon",
        "Espinafre",
        "Moyashi",
        "Nabo",
        "Pepino",
        "Palmito",
        "Rabanete",
        "Repolho",
        "Rúcula",
        "Salsão",
        "Tomate",
        "Tomate-cereja",
      ],
    },

    {
      id: "vegetables-b",
      name: "Grupo B — Legumes",
      description: "Opções do grupo",
      items: [
        "Brócolis cozido",
        "Couve-flor cozida",
        "Pimentão",
        "Abobrinha",
        "Acelga cozida",
        "Berinjela cozida",
        "Abóbora cozida",
        "Beterraba cozida",
        "Beterraba crua ralada",
        "Cenoura",
        "Chuchu cozido",
        "Quiabo cozido",
        "Vagem cozida",
        "Ervilha fresca",
      ],
    },

    {
      id: "fruits",
      name: "Frutas",
      description: "1 porção equivale a",
      items: [
        "1/2 copo de suco natural, somente frutas",
        "1 xícara de salada de frutas",
        "2 fatias finas de abacaxi",
        "1 xícara de chá de acerola",
        "1 unidade de goiaba",
        "2 unidades de kiwi",
        "1 unidade grande de laranja",
        "1 fatia grande de melancia",
        "3 fatias finas de melão",
        "15 unidades médias de morango",
        "1 unidade média de tangerina ou mexerica",
        "3 unidades de nectarina",
        "1 unidade média de pêssego amarelo",
        "2 unidades de pêssego branco",
        "2 colheres de sopa de abacate",
        "4 unidades de ameixa-preta seca",
        "3 unidades de ameixa vermelha",
        "2 unidades pequenas de banana-prata",
        "1 unidade pequena de banana-nanica",
        "1 unidade grande de banana-maçã",
        "1 unidade média de banana-ouro",
        "1 unidade média de caqui",
        "1 unidade de fruta-do-conde",
        "3 unidades de figo",
        "15 g de jaca",
        "15 unidades de jabuticaba",
        "1 unidade média de maçã",
        "1 unidade pequena de manga-espada",
        "6 colheres de sopa de maracujá",
        "1 unidade grande de pera",
        "10 unidades de uva comum",
        "1/2 mamão-papaia",
        "1 fatia de mamão-formosa",
        "12 unidades de amora",
        "4 unidades de damasco seco",
      ],
    },

    {
      id: "legumes",
      name: "Leguminosas",
      description: "1 porção equivale a",
      items: [
        "3 colheres de sopa de ervilha seca cozida",
        "3 colheres de sopa de grão-de-bico",
        "3 colheres de sopa de lentilha",
        "2 colheres de sopa de soja",
        "2 colheres de sopa de trigo para quibe",
        "1 concha pequena de feijão",
      ],
    },

    {
      id: "meats",
      name: "Carnes e proteínas",
      description: "1 porção equivale a",
      items: [
        "2 unidades de almôndegas",
        "1 unidade média de fígado",
        "1 unidade média de carne bovina",
        "1 unidade de bisteca bovina",
        "4 pedaços pequenos de carne cozida",
        "4 colheres de sopa de carne moída",
        "1 fatia pequena de carne assada",
        "1 fatia média de carne de carneiro magro",
        "1 fatia de carne de porco",
        "5 unidades de coração de frango",
        "1 unidade de filé de frango",
        "1 unidade de coxa de frango sem pele e sem molho",
        "1 unidade de hambúrguer de carne ou frango",
        "1 pedaço médio de bacalhau",
        "7 unidades grandes de camarão cozido",
        "1 pedaço médio de peixe linguado",
        "2 filés pequenos de merluza cozida",
        "3 colheres de sopa de atum enlatado em água",
        "1 unidade de sardinha fresca",
        "2 unidades de sardinha em conserva",
        "2 unidades de ovo ou omelete",
        "5 unidades de ovo de codorna",
        "2 fatias de peito de peru",
        "2 fatias de chester",
        "2 fatias médias de peru assado sem pele",
        "2 fatias de tender",
      ],
    },

    {
      id: "dairy",
      name: "Leite e derivados",
      description: "1 porção equivale a",
      items: [
        "2 colheres de sopa de coalhada",
        "1 copo de iogurte natural",
        "1 copo de iogurte desnatado ou light",
        "1 copo de leite de soja",
        "1 xícara de chá de leite integral",
        "1 xícara de leite semidesnatado",
        "1 xícara de chá de leite desnatado",
        "2 colheres de sopa rasas de leite em pó integral",
        "3 colheres de sopa de leite em pó semidesnatado",
        "4 colheres de sopa de leite em pó desnatado",
        "2 fatias de queijo tipo minas frescal",
        "1 fatia fina de queijo muçarela",
        "2 fatias grossas de queijo ricota",
        "5 colheres de sopa de queijo cottage",
        "2 fatias finas de queijo 0% gordura",
        "1 fatia média de queijo prato",
        "1 xícara de vitaminas de leite com frutas",
        "1 colher de sopa de queijo parmesão",
      ],
    },

    {
      id: "fats",
      name: "Gorduras",
      description: "1 porção equivale a",
      items: [
        "1 colher de sopa de azeite ou óleo vegetal",
        "5 unidades médias de azeitona preta ou verde",
        "1 colher de chá de margarina light",
        "1 colher de chá de margarina",
        "1 colher de chá de manteiga",
        "1 colher de sopa de creme de leite",
        "2 colheres de sopa de creme de leite light",
        "1 colher de sobremesa rasa de maionese light",
        "1 colher de chá de maionese tradicional",
        "1 colher de chá rasa de requeijão",
        "1 1/2 colher de chá de requeijão light",
      ],
    },

    {
      id: "oilseeds",
      name: "Oleaginosas",
      description: "1 porção equivale a",
      items: [
        "2 unidades de castanha-do-pará",
        "2 colheres de sopa cheias de avelã, castanha de caju, amêndoa, nozes ou macadâmia",
        "2 colheres de sopa cheias de amendoim sem sal",
      ],
    },
  ];

const [groups, setGroups] = useState([]);

const [substitutionsLoading, setSubstitutionsLoading] =
  useState(true);

useEffect(() => {
  async function loadSubstitutions() {
    try {
      let data =
        await getSubstitutionGroups();

      // Primeira utilização:
      // popula o Supabase com a lista original.
      if (data.length === 0) {
        data =
          await replaceSubstitutionGroups(
            DEFAULT_GROUPS,
            currentUser
          );
      }

      setGroups(data);
    } catch (error) {
      console.error(
        "Erro ao carregar substituições:",
        error
      );
    } finally {
      setSubstitutionsLoading(false);
    }
  }

  loadSubstitutions();
}, []);

  const [search, setSearch] = useState("");
  const [openGroup, setOpenGroup] = useState(null);

  const [showGroupForm, setShowGroupForm] =
    useState(false);

  const [showItemForm, setShowItemForm] =
    useState(false);

  const [selectedGroupId, setSelectedGroupId] =
    useState("");

  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "1 porção equivale a",
  });

  const [itemText, setItemText] = useState("");
  const [showUseItemForm, setShowUseItemForm] =
    useState(false);

  const [selectedSubstitution, setSelectedSubstitution] =
    useState(null);

  const [useItemForm, setUseItemForm] = useState({
    meal: "Café da manhã",
    portions: 1,
  });

async function handleCreateGroup(e) {
  e.preventDefault();

  if (!groupForm.name.trim()) {
    alert("Informe o nome do grupo.");
    return;
  }

  try {
    const created =
      await addSubstitutionGroup(
        {
          name: groupForm.name.trim(),

          description:
            groupForm.description.trim() ||
            "1 porção equivale a",
        },
        currentUser
      );

    setGroups((previous) => [
      ...previous,
      created,
    ]);

    await addHistory(
      "adicionou",
      "Substituições",
      `Novo grupo: ${created.name}`
    );

    setGroupForm({
      name: "",
      description:
        "1 porção equivale a",
    });

    setShowGroupForm(false);
  } catch (error) {
    console.error(
      "Erro ao criar grupo:",
      error
    );

    alert(
      "Não foi possível criar o grupo."
    );
  }
}

async function deleteItem(
  groupId,
  itemId
) {
  if (
    !window.confirm(
      "Deseja excluir esta opção?"
    )
  ) {
    return;
  }

  const group = groups.find(
    (item) => item.id === groupId
  );

  const item = group?.items.find(
    (option) => option.id === itemId
  );

  try {
    await deleteSubstitutionItemFromSupabase(
      itemId
    );

    setGroups((previous) =>
      previous.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.filter(
                (option) =>
                  option.id !== itemId
              ),
            }
          : group
      )
    );

    await addHistory(
      "excluiu",
      "Substituições",
      item
        ? `Opção excluída: ${item.text}`
        : "Opção de substituição excluída"
    );
  } catch (error) {
    console.error(
      "Erro ao excluir opção:",
      error
    );

    alert(
      "Não foi possível excluir a opção."
    );
  }
}

async function deleteGroup(groupId) {
  const group = groups.find(
    (item) => item.id === groupId
  );

  if (!group) return;

  if (
    !window.confirm(
      `Excluir o grupo "${group.name}" e todas as suas opções?`
    )
  ) {
    return;
  }

  try {
    await deleteSubstitutionGroupFromSupabase(
      groupId
    );

    setGroups((previous) =>
      previous.filter(
        (item) =>
          item.id !== groupId
      )
    );

    await addHistory(
      "excluiu",
      "Substituições",
      `Grupo excluído: ${group.name}`
    );
  } catch (error) {
    console.error(
      "Erro ao excluir grupo:",
      error
    );

    alert(
      "Não foi possível excluir o grupo."
    );
  }
}

async function restoreDefaults() {
  if (
    !window.confirm(
      "Restaurar a lista original? Alterações feitas nas substituições serão perdidas."
    )
  ) {
    return;
  }

  try {
    const restored =
      await replaceSubstitutionGroups(
        DEFAULT_GROUPS,
        currentUser
      );

    setGroups(restored);
    setOpenGroup(null);

    await addHistory(
      "restaurou",
      "Substituições",
      "Lista original de substituições restaurada"
    );
  } catch (error) {
    console.error(
      "Erro ao restaurar lista:",
      error
    );

    alert(
      "Não foi possível restaurar a lista."
    );
  }
}

  function openUseSubstitution(group, item) {
  setSelectedSubstitution({
    groupName: group.name,
    description: group.description,
    item,
  });

  setUseItemForm({
    meal: "Café da manhã",
    portions: 1,
  });

  setShowUseItemForm(true);
}

function handleUseSubstitution(e) {
  e.preventDefault();

  if (!selectedSubstitution) return;

  if (
    !useItemForm.portions ||
    Number(useItemForm.portions) <= 0
  ) {
    alert("Informe uma quantidade de porções válida.");
    return;
  }

  onAddSubstitution({
    ...selectedSubstitution,
    meal: useItemForm.meal,
    portions: Number(useItemForm.portions),
  });

  setShowUseItemForm(false);
  setSelectedSubstitution(null);
}

  const searchNormalized =
    search.trim().toLowerCase();

  const filteredGroups = groups
    .map((group) => {
      if (!searchNormalized) {
        return group;
      }

      const groupMatches =
        group.name
          .toLowerCase()
          .includes(searchNormalized) ||
        group.description
          .toLowerCase()
          .includes(searchNormalized);

      const matchingItems =
        group.items.filter((item) =>
          item.text
            .toLowerCase()
            .includes(searchNormalized)
        );

      if (
        groupMatches ||
        matchingItems.length > 0
      ) {
        return {
          ...group,
          items: groupMatches
            ? group.items
            : matchingItems,
        };
      }

      return null;
    })
    .filter(Boolean);

  const totalItems = groups.reduce(
    (sum, group) =>
      sum + group.items.length,
    0
  );

  return (
    <section className="substitutionsSection">
      <div className="substitutionsHero">
        <div>
          <span className="eyebrow">
            PLANO ALIMENTAR
          </span>

          <h3>Lista de substituições</h3>

          <p>
            Consulte opções equivalentes dentro de
            cada grupo alimentar.
          </p>
        </div>

        <div className="substitutionHeroActions">
          <button
            className="substitutionSecondaryButton"
            onClick={restoreDefaults}
          >
            Restaurar lista
          </button>

          <button
            className="substitutionPrimaryButton"
            onClick={() =>
              setShowGroupForm(true)
            }
          >
            + Novo grupo
          </button>
        </div>
      </div>

      <div className="substitutionSummary">
        <div>
          <span>Grupos</span>
          <strong>{groups.length}</strong>
        </div>

        <div>
          <span>Opções cadastradas</span>
          <strong>{totalItems}</strong>
        </div>

        <div className="substitutionSearchBox">
          <input
            type="text"
            placeholder="Buscar pão, arroz, banana, frango..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="panel substitutionEmpty">
          <strong>
            Nenhuma substituição encontrada
          </strong>

          <span>
            Tente buscar outro alimento.
          </span>
        </div>
      ) : (
        <div className="substitutionGroupsGrid">
          {filteredGroups.map((group) => {
            const isOpen =
              openGroup === group.id ||
              searchNormalized !== "";

            return (
              <div
                className="substitutionGroupCard"
                key={group.id}
              >
                <div
                  className="substitutionGroupHeader"
                  onClick={() =>
                    setOpenGroup(
                      openGroup === group.id
                        ? null
                        : group.id
                    )
                  }
                >
                  <div>
                    <span className="eyebrow">
                      GRUPO ALIMENTAR
                    </span>

                    <h4>{group.name}</h4>

                    <p>
                      {group.description} •{" "}
                      {group.items.length} opções
                    </p>
                  </div>

                  <span className="substitutionChevron">
                    {isOpen ? "−" : "+"}
                  </span>
                </div>

                {isOpen && (
                  <div className="substitutionGroupContent">
                    <div className="substitutionItems">
                      {group.items.length === 0 ? (
                        <div className="substitutionNoItems">
                          Nenhuma opção cadastrada.
                        </div>
                      ) : (
                        group.items.map(
                          (item) => (
                            <div
                              className="substitutionItem"
                              key={item.id}
                            >
                              <div className="substitutionItemInfo">
                                <span className="substitutionBullet">
                                  ✓
                                </span>

                                <span>{item.text}</span>
                              </div>

                              <div className="substitutionItemActions">
                                <button
                                  type="button"
                                  className="substitutionUseButton"
                                  onClick={() =>
                                    openUseSubstitution(
                                      group,
                                      item.text
                                    )
                                  }
                                >
                                  + Refeição
                                </button>

                                <button
                                  type="button"
                                  className="substitutionRemoveButton"
                                  onClick={() =>
                                    deleteItem(
                                      group.id,
                                      item.id
                                    )
                                  }
                                  title="Excluir opção"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>

                    <div className="substitutionGroupActions">
                      <button
                        className="substitutionAddOptionButton"
                        onClick={() =>
                          openAddItem(group.id)
                        }
                      >
                        + Adicionar opção
                      </button>

                      <button
                        className="substitutionDeleteGroupButton"
                        onClick={() =>
                          deleteGroup(group.id)
                        }
                      >
                        Excluir grupo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showGroupForm && (
        <div
          className="substitutionModalOverlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              setShowGroupForm(false);
            }
          }}
        >
          <div className="substitutionModal small">
            <div className="substitutionModalHeader">
              <div>
                <span className="eyebrow">
                  NOVO GRUPO
                </span>

                <h3>
                  Criar grupo de substituição
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowGroupForm(false)
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateGroup}
            >
              <label>
                Nome do grupo

                <input
                  type="text"
                  placeholder="Ex.: Café da manhã"
                  value={groupForm.name}
                  onChange={(e) =>
                    setGroupForm({
                      ...groupForm,
                      name: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Descrição

                <input
                  type="text"
                  placeholder="Ex.: 1 porção equivale a"
                  value={
                    groupForm.description
                  }
                  onChange={(e) =>
                    setGroupForm({
                      ...groupForm,
                      description:
                        e.target.value,
                    })
                  }
                />
              </label>

              <div className="substitutionModalActions">
                <button
                  type="button"
                  className="substitutionCancelButton"
                  onClick={() =>
                    setShowGroupForm(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="substitutionSaveButton"
                >
                  Criar grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemForm && (
        <div
          className="substitutionModalOverlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              setShowItemForm(false);
            }
          }}
        >
          <div className="substitutionModal small">
            <div className="substitutionModalHeader">
              <div>
                <span className="eyebrow">
                  NOVA OPÇÃO
                </span>

                <h3>
                  Adicionar substituição
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowItemForm(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddItem}>
              <label>
                Opção equivalente

                <input
                  type="text"
                  autoFocus
                  placeholder="Ex.: 1 fatia de pão integral"
                  value={itemText}
                  onChange={(e) =>
                    setItemText(
                      e.target.value
                    )
                  }
                />
              </label>

              <div className="substitutionModalActions">
                <button
                  type="button"
                  className="substitutionCancelButton"
                  onClick={() =>
                    setShowItemForm(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="substitutionSaveButton"
                >
                  Adicionar opção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{showUseItemForm &&
  selectedSubstitution && (
    <div
      className="substitutionModalOverlay"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          setShowUseItemForm(false);
        }
      }}
    >
      <div className="substitutionModal small">
        <div className="substitutionModalHeader">
          <div>
            <span className="eyebrow">
              ADICIONAR À REFEIÇÃO
            </span>

            <h3>
              Registrar substituição
            </h3>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowUseItemForm(false)
            }
          >
            ×
          </button>
        </div>

        <div className="substitutionSelectedItem">
          <span>
            {selectedSubstitution.groupName}
          </span>

          <strong>
            {selectedSubstitution.item}
          </strong>

          <small>
            {
              selectedSubstitution.description
            }
          </small>
        </div>

        <form
          onSubmit={
            handleUseSubstitution
          }
        >
          <label>
            Refeição

            <select
              value={useItemForm.meal}
              onChange={(e) =>
                setUseItemForm({
                  ...useItemForm,
                  meal: e.target.value,
                })
              }
            >
              <option>
                Café da manhã
              </option>

              <option>
                Almoço
              </option>

              <option>
                Lanche
              </option>

              <option>
                Jantar
              </option>

              <option>
                Ceia
              </option>
            </select>
          </label>

          <label>
            Quantidade de porções

            <input
              type="number"
              min="0.25"
              step="0.25"
              value={
                useItemForm.portions
              }
              onChange={(e) =>
                setUseItemForm({
                  ...useItemForm,
                  portions:
                    e.target.value,
                })
              }
            />
          </label>

          <div className="substitutionPortionExamples">
            <span>Exemplos:</span>

            <button
              type="button"
              onClick={() =>
                setUseItemForm({
                  ...useItemForm,
                  portions: 0.5,
                })
              }
            >
              ½ porção
            </button>

            <button
              type="button"
              onClick={() =>
                setUseItemForm({
                  ...useItemForm,
                  portions: 1,
                })
              }
            >
              1 porção
            </button>

            <button
              type="button"
              onClick={() =>
                setUseItemForm({
                  ...useItemForm,
                  portions: 1.5,
                })
              }
            >
              1½ porção
            </button>

            <button
              type="button"
              onClick={() =>
                setUseItemForm({
                  ...useItemForm,
                  portions: 2,
                })
              }
            >
              2 porções
            </button>
          </div>

          <div className="substitutionModalActions">
            <button
              type="button"
              className="substitutionCancelButton"
              onClick={() =>
                setShowUseItemForm(false)
              }
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="substitutionSaveButton"
            >
              Adicionar à refeição
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

    </section>
  );
}

function UserSelection({ onSelect }) {
  return (
    <div className="userSelectionPage">
      <div className="userSelectionCard">

        <div className="userSelectionBrand">
          <div className="userSelectionLogo">
            E
          </div>

          <div>
            <h1>EVOLVE</h1>
            <span>Saúde & Performance</span>
          </div>
        </div>

        <div className="userSelectionContent">
          <span className="eyebrow">
            BEM-VINDO
          </span>

          <h2>Quem está usando?</h2>

          <p>
            Selecione o usuário para continuar.
            As alterações realizadas serão
            identificadas no histórico.
          </p>

          <div className="userOptions">

            <button
              type="button"
              className="userOption"
              onClick={() =>
                onSelect("Isabela")
              }
            >
              <div className="userOptionAvatar">
                IJ
              </div>

              <div>
                <strong>Isabela</strong>
                <span>Usuária principal</span>
              </div>

              <span className="userArrow">
                →
              </span>
            </button>

            <button
              type="button"
              className="userOption"
              onClick={() =>
                onSelect("Visitante")
              }
            >
              <div className="userOptionAvatar visitor">
                V
              </div>

              <div>
                <strong>Visitante</strong>
                <span>Acesso ao sistema</span>
              </div>

              <span className="userArrow">
                →
              </span>
            </button>

          </div>
        </div>

        <div className="userSelectionFooter">
          EVOLVE • Controle pessoal de saúde
        </div>

      </div>
    </div>
  );
}

function HistoryPage({ logs }) {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] =
    useState("Todos");

  const modules = [
    "Todos",
    ...Array.from(
      new Set(logs.map((log) => log.module))
    ),
  ];

  const filteredLogs = logs.filter((log) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      log.user?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.module?.toLowerCase().includes(term) ||
      log.description?.toLowerCase().includes(term);

    const matchesModule =
      moduleFilter === "Todos" ||
      log.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  function formatDate(value) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function getActionLabel(action) {
    const labels = {
      adicionou: "Adição",
      alterou: "Alteração",
      excluiu: "Exclusão",
      registrou: "Registro",
      atualizou: "Atualização",
    };

    return labels[action] || action;
  }

  return (
    <div className="historyPage">
      <section className="historyHeader panel">
        <div>
          <span className="eyebrow">
            AUDITORIA
          </span>

          <h2>Histórico</h2>

          <p>
            Registro das alterações realizadas
            no EVOLVE.
          </p>
        </div>

        <div className="historyTotal">
          <span>Registros</span>
          <strong>{logs.length}</strong>
        </div>
      </section>

      <section className="historyFilters panel">
        <div className="historySearch">
          <label>Buscar</label>

          <input
            type="text"
            placeholder="Usuário, ação, módulo..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="historyFilter">
          <label>Módulo</label>

          <select
            value={moduleFilter}
            onChange={(e) =>
              setModuleFilter(e.target.value)
            }
          >
            {modules.map((module) => (
              <option
                key={module}
                value={module}
              >
                {module}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="historyList panel">
        {filteredLogs.length === 0 ? (
          <div className="historyEmpty">
            <strong>
              Nenhum registro encontrado
            </strong>

            <span>
              As alterações realizadas no
              aplicativo aparecerão aqui.
            </span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              className="historyItem"
              key={log.id}
            >
              <div className="historyTimeline">
                <div className="historyDot" />
                <div className="historyLine" />
              </div>

              <div className="historyItemContent">
                <div className="historyItemTop">
                  <div>
                    <strong>
                      {log.user}
                    </strong>

                    <span>
                      {" "}
                      {log.action}{" "}
                    </span>

                    <strong>
                      {log.module}
                    </strong>
                  </div>

                  <div className="historyDate">
                    <span>
                      {formatDate(
                        log.createdAt
                      )}
                    </span>

                    <small>
                      {formatTime(
                        log.createdAt
                      )}
                    </small>
                  </div>
                </div>

                {log.description && (
                  <p>{log.description}</p>
                )}

                <div className="historyMeta">
                  <span>
                    {getActionLabel(
                      log.action
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
