import { useEffect, useState } from "react";
import { AlertTriangle, FileText } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

async function findUserId(currentUser) {
  let result = await supabase.from("users").select("id").eq("display_name", currentUser).maybeSingle();
  if (!result.data && !result.error) result = await supabase.from("users").select("id").eq("name", currentUser).maybeSingle();
  if (result.error) throw result.error;
  return result.data?.id;
}

function documentAlert(document) {
  if (!document.expires_at) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${document.expires_at}T12:00:00`);
  const days = Math.ceil((expiry - today) / 86400000);
  if (days < 0) return { days, label: `Vencido há ${Math.abs(days)} dias`, danger: true };
  if (days <= Number(document.reminder_days || 0)) return { days, label: days === 0 ? "Vence hoje" : `Vence em ${days} dias`, danger: false };
  return null;
}

export default function HomeDocumentsAlert({
  currentUser,
  compact = false,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDocuments(); }, [currentUser]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const userId = await findUserId(currentUser);
      const { data, error } = await supabase.from("documents").select("*").is("deleted_at", null).not("expires_at", "is", null).or(`owner_user_id.eq.${userId},visibility.eq.shared`);
      if (error) throw error;
      setDocuments((data || []).map((document) => ({ ...document, alert: documentAlert(document) })).filter((document) => document.alert).sort((a, b) => a.alert.days - b.alert.days));
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  if (!loading && documents.length === 0) return null;

  return (
  <section
    style={{
      background: COLORS.primaryLight,
      border: `1px solid ${COLORS.border}`,
      borderRadius: compact ? 9 : 14,
      padding: compact ? 10 : 18,
      marginTop: compact ? 0 : 18,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: loading ? 0 : 12 }}><FileText size={compact ? 15 : 19}color={COLORS.primaryDark}/><h2 style={{margin: 0,color: COLORS.ink,fontSize: compact ? 12 : 16,}}>Documentos que precisam de atenção</h2></div>
    {loading ? <div style={{ color: COLORS.inkSoft, fontSize: 12 }}>Verificando validades...</div> : <div style={{ display: "grid", gap: 8 }}>{documents.slice(0, compact ? 2 : 5).map((document) => {
      const color = document.alert.danger ? COLORS.danger : COLORS.warning;
      const background = document.alert.danger ? COLORS.dangerLight : COLORS.warningLight;
      return <div key={document.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background, borderRadius: 8, padding: compact ? "7px 8px" : "10px 11px", }}><div><div style={{ color: COLORS.ink, fontWeight: 700, fontSize: compact ? 11 : 13 }}>{document.title}</div><div style={{ color, fontSize: compact ? 9 : 11, marginTop: 3 }}>{document.alert.label}</div></div><AlertTriangle size={17} color={color} /></div>;
    })}</div>}
  </section>);
}
