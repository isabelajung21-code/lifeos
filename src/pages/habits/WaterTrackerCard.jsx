import { useEffect, useMemo, useState } from "react";
import {
  Droplets,
  GlassWater,
  Loader2,
} from "lucide-react";

import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";

const TOTAL_CUPS = 10;
const CUP_ML = 200;

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

  if (result.error) {
    throw result.error;
  }

  if (!result.data?.id) {
    throw new Error("Usuário não encontrado.");
  }

  return result.data.id;
}

function localDate(date = new Date()) {
  const copy = new Date(date);

  copy.setMinutes(
    copy.getMinutes() - copy.getTimezoneOffset()
  );

  return copy.toISOString().slice(0, 10);
}

function getMonthRange() {
  const now = new Date();

  const firstDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  );

  return {
    firstDay: localDate(firstDay),
    lastDay: localDate(lastDay),
    numberOfDays: lastDay.getDate(),
  };
}

function formatMl(value) {
  if (value >= 1000) {
    return `${(value / 1000)
      .toFixed(value % 1000 === 0 ? 0 : 1)
      .replace(".", ",")} L`;
  }

  return `${value} ml`;
}

export default function WaterTrackerCard({
  currentUser,
  showChart = false,
  compact = false,
}) {
  const [userId, setUserId] = useState(null);
  const [cupsCount, setCupsCount] = useState(0);
  const [monthLogs, setMonthLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = localDate();
  const monthRange = useMemo(() => getMonthRange(), []);

  useEffect(() => {
    loadWaterData();
  }, [currentUser]);

  async function loadWaterData() {
    setLoading(true);
    setError("");

    try {
      const foundUserId = await findUserId(currentUser);
      setUserId(foundUserId);

      const { data, error: loadError } = await supabase
        .from("water_logs")
        .select("*")
        .eq("owner_user_id", foundUserId)
        .gte("log_date", monthRange.firstDay)
        .lte("log_date", monthRange.lastDay)
        .order("log_date", { ascending: true });

      if (loadError) {
        throw loadError;
      }

      const logs = data || [];
      const todayLog = logs.find(
        (item) => item.log_date === today
      );

      setMonthLogs(logs);
      setCupsCount(
        Number(todayLog?.cups_count || 0)
      );
    } catch (loadError) {
      console.error(
        "Erro ao carregar consumo de água:",
        loadError
      );

      setError(
        loadError.message ||
          "Não foi possível carregar o consumo de água."
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeCups(clickedCup) {
    if (!userId || saving) {
      return;
    }

    const newCount =
      clickedCup === cupsCount
        ? Math.max(0, clickedCup - 1)
        : clickedCup;

    const previousCount = cupsCount;

    setCupsCount(newCount);
    setSaving(true);
    setError("");

    try {
      const now = new Date().toISOString();

      const { data, error: saveError } = await supabase
        .from("water_logs")
        .upsert(
          {
            owner_user_id: userId,
            log_date: today,
            cup_ml: CUP_ML,
            cups_count: newCount,
            updated_at: now,
          },
          {
            onConflict: "owner_user_id,log_date",
          }
        )
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      setMonthLogs((current) => {
        const withoutToday = current.filter(
          (item) => item.log_date !== today
        );

        return [...withoutToday, data].sort(
          (a, b) =>
            new Date(a.log_date) -
            new Date(b.log_date)
        );
      });
    } catch (saveError) {
      console.error(
        "Erro ao salvar consumo de água:",
        saveError
      );

      setCupsCount(previousCount);

      setError(
        saveError.message ||
          "Não foi possível registrar a água."
      );
    } finally {
      setSaving(false);
    }
  }

  const totalMl = cupsCount * CUP_ML;
  const progress = (cupsCount / TOTAL_CUPS) * 100;

  const chartDays = Array.from(
    { length: monthRange.numberOfDays },
    (_, index) => {
      const day = index + 1;

      const date = `${monthRange.firstDay.slice(
        0,
        8
      )}${String(day).padStart(2, "0")}`;

      const log = monthLogs.find(
        (item) => item.log_date === date
      );

      return {
        day,
        cups: Number(log?.cups_count || 0),
      };
    }
  );

  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: compact ? 16 : 18,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              borderRadius: 10,
              color: "#3977b8",
              background: "#eaf3fc",
            }}
          >
            <Droplets size={18} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                color: COLORS.ink,
                fontSize: 15,
              }}
            >
              Água de hoje
            </h2>

            <div
              style={{
                marginTop: 3,
                color: COLORS.inkSoft,
                fontSize: 11,
              }}
            >
              Cada copo representa 200 ml
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
          }}
        >
          <strong
            style={{
              display: "block",
              color: "#3977b8",
              fontSize: 17,
            }}
          >
            {formatMl(totalMl)}
          </strong>

          <span
            style={{
              color: COLORS.inkSoft,
              fontSize: 11,
            }}
          >
            de 2 L
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: 9,
            color: COLORS.danger,
            background: COLORS.dangerLight,
            borderRadius: 9,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            minHeight: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            color: COLORS.inkSoft,
            fontSize: 12,
          }}
        >
          <Loader2 size={15} />
          Carregando...
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(10, minmax(24px, 1fr))",
              gap: compact ? 5 : 7,
            }}
          >
            {Array.from(
              { length: TOTAL_CUPS },
              (_, index) => {
                const cupNumber = index + 1;
                const filled = cupNumber <= cupsCount;

                return (
                  <button
                    key={cupNumber}
                    type="button"
                    title={`${cupNumber * CUP_ML} ml`}
                    aria-label={`Registrar ${
                      cupNumber * CUP_ML
                    } ml de água`}
                    onClick={() =>
                      changeCups(cupNumber)
                    }
                    disabled={saving}
                    style={{
                      height: compact ? 34 : 40,
                      minWidth: 0,
                      display: "grid",
                      placeItems: "center",
                      padding: 0,
                      borderRadius: 10,
                      border: `1px solid ${
                        filled
                          ? "#5f92cc"
                          : COLORS.border
                      }`,
                      color: filled
                        ? "#ffffff"
                        : "#7b8798",
                      background: filled
                        ? "#5f92cc"
                        : COLORS.bg,
                      cursor: saving
                        ? "wait"
                        : "pointer",
                      transition: "0.15s ease",
                    }}
                  >
                    <GlassWater
                      size={compact ? 15 : 17}
                      strokeWidth={2}
                    />
                  </button>
                );
              }
            )}
          </div>

          <div
            style={{
              height: 6,
              marginTop: 12,
              overflow: "hidden",
              background: "#eaf3fc",
              borderRadius: 999,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#5f92cc",
                borderRadius: 999,
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </>
      )}

      {showChart && !loading && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              marginBottom: 12,
            }}
          >
            <strong
              style={{
                display: "block",
                color: COLORS.ink,
                fontSize: 13,
              }}
            >
              Consumo no mês
            </strong>

            <span
              style={{
                color: COLORS.inkSoft,
                fontSize: 11,
              }}
            >
              Meta diária: 10 copos
            </span>
          </div>

          <div
            style={{
              height: 120,
              display: "flex",
              alignItems: "flex-end",
              gap: 3,
              overflowX: "auto",
              paddingBottom: 5,
            }}
          >
            {chartDays.map((item) => {
              const height =
                item.cups === 0
                  ? 3
                  : Math.max(
                      8,
                      (item.cups / TOTAL_CUPS) * 90
                    );

              return (
                <div
                  key={item.day}
                  title={`Dia ${item.day}: ${
                    item.cups * CUP_ML
                  } ml`}
                  style={{
                    minWidth: 12,
                    flex: "1 0 12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 18,
                      height,
                      minHeight: 3,
                      borderRadius: "5px 5px 2px 2px",
                      background:
                        item.cups >= TOTAL_CUPS
                          ? "#3977b8"
                          : item.cups > 0
                          ? "#8bb7e3"
                          : "#dfe9f3",
                    }}
                  />

                  <span
                    style={{
                      color: COLORS.inkSoft,
                      fontSize: 8,
                    }}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}