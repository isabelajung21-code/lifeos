import { useEffect, useState } from "react";
import { Flag, Link2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  return result.data?.id;
}

export default function HomeLifeGoalsCard({ currentUser, compact = false }) {
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGoals(); }, [currentUser]);

  async function loadGoals() {
    setLoading(true);
    try {
      const userId = await findUserId(currentUser);
      if (!userId) return;
      const [goalsResult, linksResult, projectsResult] = await Promise.all([
        supabase.from("goals").select("*").is("deleted_at", null).in("status", ["active", "paused"]).or(`owner_user_id.eq.${userId},visibility.eq.shared`).order("target_date", { ascending: true, nullsFirst: false }).limit(4),
        supabase.from("goal_links").select("*").eq("entity_type", "project"),
        supabase.from("projects").select("id, title").is("deleted_at", null),
      ]);
      if (goalsResult.error) throw goalsResult.error;
      setGoals(goalsResult.data || []);
      setLinks(linksResult.data || []);
      setProjects(projectsResult.data || []);
    } finally {
      setLoading(false);
    }
  }

  function projectFor(goalId) {
    const link = links.find((item) => item.goal_id === goalId);
    return projects.find((project) => project.id === link?.entity_id);
  }

  if (!loading && goals.length === 0) return null;

  return (
    <section
      style={{
        background: compact ? "transparent" : COLORS.surface,
        border: compact ? 0 : `1px solid ${COLORS.border}`,
        borderRadius: compact ? 0 : 14,
        padding: compact ? 0 : 18,
        marginTop: compact ? 16 : 18,
        paddingTop: compact ? 14 : 18,
        borderTop: compact
          ? `1px solid ${COLORS.border}`
          : `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: compact ? 10 : 14,
        }}
      >
        <Flag size={compact ? 15 : 19} color={COLORS.primaryDark} />
        <h2
          style={{
            margin: 0,
            color: COLORS.ink,
            fontSize: compact ? 13 : 16,
          }}
        >Metas pessoais</h2>
      </div>
      {loading ? <div style={{ color: COLORS.inkSoft, fontSize: 13 }}>Carregando metas...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: compact ? "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" : "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 10 }}>
          {goals.map((goal) => {
            const project = projectFor(goal.id);
            return <div key={goal.id} style={{ background: COLORS.bg, borderRadius: 11, padding: compact ? 9 : 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ color: COLORS.ink, fontSize: 13 }}>{goal.title}</strong><span style={{ color: COLORS.primaryDark, fontSize: 11, fontWeight: 700 }}>{goal.progress}%</span></div>
              <div style={{ height: 6, background: COLORS.primaryLight, borderRadius: 99, overflow: "hidden", marginTop: 9 }}><div style={{ height: "100%", width: `${goal.progress}%`, background: COLORS.primary, borderRadius: 99 }} /></div>
              {project && <div style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.primaryDark, fontSize: 11, marginTop: 8 }}><Link2 size={12} /> {project.title}</div>}
              {goal.target_date && <div style={{ color: COLORS.inkSoft, fontSize: 10, marginTop: 7 }}>Até {new Date(`${goal.target_date}T12:00:00`).toLocaleDateString("pt-BR")}</div>}
            </div>;
          })}
        </div>
      )}
    </section>
  );
}
