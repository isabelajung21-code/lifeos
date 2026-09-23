import { useEffect, useState } from "react";
import { BookHeart, CheckCircle2, PenLine } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

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

const MOODS = {
  otimo: "🤩 Ótimo",
  bem: "🙂 Bem",
  neutro: "😐 Neutro",
  cansado: "😴 Cansado",
  dificil: "😔 Difícil",
};

export default function HomeJournalCard({ currentUser }) {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayEntry();
  }, [currentUser]);

  async function loadTodayEntry() {
    setLoading(true);

    try {
      const userId = await findUserId(currentUser);

      if (!userId) {
        setEntry(null);
        return;
      }

      const { data, error } = await supabase
        .from("journal_entries")
        .select("id, mood, best_moment, content")
        .eq("owner_user_id", userId)
        .eq("entry_date", localDate())
        .is("deleted_at", null)
        .maybeSingle();

      if (error) throw error;
      setEntry(data || null);
    } catch {
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }

  const preview = entry?.best_moment || entry?.content;

  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 18,
        marginTop: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <BookHeart size={19} color={COLORS.primaryDark} />
        <h2 style={{ margin: 0, color: COLORS.ink, fontSize: 16 }}>
          Diário de hoje
        </h2>
      </div>

      {loading ? (
        <div style={{ color: COLORS.inkSoft, fontSize: 13, marginTop: 12 }}>
          Verificando seu registro...
        </div>
      ) : entry ? (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: COLORS.successLight,
            borderRadius: 11,
            padding: 12,
            marginTop: 12,
          }}
        >
          <CheckCircle2 size={19} color={COLORS.success} />
          <div>
            <strong style={{ color: COLORS.ink, fontSize: 13 }}>
              Registro feito {entry.mood ? `• ${MOODS[entry.mood] || entry.mood}` : ""}
            </strong>
            {preview && (
              <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 5 }}>
                {preview.slice(0, 100)}{preview.length > 100 ? "..." : ""}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: COLORS.primaryLight,
            borderRadius: 11,
            padding: 12,
            marginTop: 12,
          }}
        >
          <PenLine size={19} color={COLORS.primaryDark} />
          <div>
            <strong style={{ color: COLORS.ink, fontSize: 13 }}>
              Você ainda não escreveu hoje
            </strong>
            <div style={{ color: COLORS.inkSoft, fontSize: 12, marginTop: 5 }}>
              Abra o Diário pelo menu para registrar como foi seu dia.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}