import { useMemo } from "react";
import { BarChart3, CalendarDays } from "lucide-react";
import { COLORS } from "../../constants/theme";

function localDate(date = new Date()) {
  const copy = new Date(date);

  copy.setMinutes(
    copy.getMinutes() - copy.getTimezoneOffset()
  );

  return copy.toISOString().slice(0, 10);
}

function dateFromParts(year, month, day) {
  const date = new Date(year, month, day);

  return localDate(date);
}

function hexToRgba(hex, opacity) {
  const normalized = (hex || "#5F92CC").replace(
    "#",
    ""
  );

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function isHabitScheduled(habit, dateString) {
  if (!habit.is_active) {
    return false;
  }


  if (habit.frequency_type === "weekdays") {
    const weekday = new Date(
      `${dateString}T12:00:00`
    ).getDay();

    return (habit.days_of_week || []).includes(
      weekday
    );
  }

  return true;
}

export default function HabitMonthTracker({
  habits,
  logs,
  onToggleDate,
}) {
  const now = new Date();
  const today = localDate();

  const year = now.getFullYear();
  const month = now.getMonth();

  const totalDays = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const days = useMemo(
    () =>
      Array.from(
        { length: totalDays },
        (_, index) => {
          const day = index + 1;

          return {
            day,
            date: dateFromParts(
              year,
              month,
              day
            ),
          };
        }
      ),
    [year, month, totalDays]
  );

  const monthName = new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    }
  ).format(now);

  function isCompleted(habitId, date) {
    return logs.some(
      (log) =>
        log.habit_id === habitId &&
        log.log_date === date
    );
  }

  const chartWidth = 900;
  const chartHeight = 190;
  const chartLeft = 38;
  const chartRight = 15;
  const chartTop = 15;
  const chartBottom = 28;

  const plotWidth =
    chartWidth - chartLeft - chartRight;

  const plotHeight =
    chartHeight - chartTop - chartBottom;

  function createHabitPoints(habit) {
    let scheduledCount = 0;
    let completedCount = 0;

    return days
      .filter((item) => item.date <= today)
      .map((item, index) => {
        const scheduled = isHabitScheduled(
          habit,
          item.date
        );

        if (scheduled) {
          scheduledCount += 1;

          if (
            isCompleted(habit.id, item.date)
          ) {
            completedCount += 1;
          }
        }

        const percentage =
          scheduledCount > 0
            ? (completedCount /
                scheduledCount) *
              100
            : 0;

        const x =
          chartLeft +
          (index /
            Math.max(
              1,
              Math.min(totalDays, now.getDate()) -
                1
            )) *
            plotWidth;

        const y =
          chartTop +
          plotHeight -
          (percentage / 100) * plotHeight;

        return `${x},${y}`;
      })
      .join(" ");
  }

  if (!habits.length) {
    return (
      <section style={cardStyle}>
        <div
          style={{
            color: COLORS.inkSoft,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Crie um hábito para acompanhar sua
          constância mensal.
        </div>
      </section>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CalendarDays
              size={18}
              color={COLORS.primaryDark}
            />

            <div>
              <h2
                style={{
                  margin: 0,
                  color: COLORS.ink,
                  fontSize: 15,
                }}
              >
                Constância mensal
              </h2>

              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  color: COLORS.inkSoft,
                  fontSize: 11,
                  textTransform: "capitalize",
                }}
              >
                {monthName}
              </span>
            </div>
          </div>

          <span
            style={{
              color: COLORS.inkSoft,
              fontSize: 11,
            }}
          >
            Clique em um dia para marcar
          </span>
        </div>

        <div
          style={{
            overflowX: "auto",
            paddingBottom: 6,
          }}
        >
          <div
            style={{
              minWidth: 840,
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "170px repeat(" +
                  totalDays +
                  ", 20px)",
                gap: 5,
                alignItems: "center",
              }}
            >
              <span />

              {days.map((item) => (
                <span
                  key={item.date}
                  style={{
                    color:
                      item.date === today
                        ? COLORS.primaryDark
                        : COLORS.inkSoft,
                    fontSize: 8,
                    fontWeight:
                      item.date === today
                        ? 800
                        : 500,
                    textAlign: "center",
                  }}
                >
                  {item.day}
                </span>
              ))}
            </div>

            {habits.map((habit) => {
              const habitColor =
                habit.color || "#5F92CC";

              return (
                <div
                  key={habit.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "170px repeat(" +
                      totalDays +
                      ", 20px)",
                    gap: 5,
                    alignItems: "center",
                  }}
                >
                  <div
                    title={habit.title}
                    style={{
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      paddingRight: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        flexShrink: 0,
                        borderRadius: 999,
                        background: habitColor,
                      }}
                    />

                    <span
                      style={{
                        overflow: "hidden",
                        color: COLORS.ink,
                        fontSize: 11,
                        fontWeight: 650,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {habit.title}
                    </span>
                  </div>

                  {days.map((item) => {
                    const scheduled =
                      isHabitScheduled(
                        habit,
                        item.date
                      );

                    const completed =
                      isCompleted(
                        habit.id,
                        item.date
                      );


                    return (
                      <button
                        key={item.date}
                        type="button"
                        disabled={
                          !scheduled
                        }
                        title={
                          !scheduled
                            ? "Hábito não programado para este dia"
                            : completed
                            ? `Concluído no dia ${item.day}`
                            : `Marcar dia ${item.day}`
                        }
                        onClick={() =>
                          onToggleDate?.(
                            habit,
                            item.date
                          )
                        }
                        style={{
                          width: 19,
                          height: 19,
                          display: "grid",
                          placeItems: "center",
                          padding: 0,
                          borderRadius: 999,
                          border:
                            item.date === today
                              ? `2px solid ${habitColor}`
                              : `1px solid ${
                                  completed
                                    ? habitColor
                                    : COLORS.border
                                }`,
                          background: completed
                            ? habitColor
                            : scheduled
                            ? hexToRgba(
                                habitColor,
                                0.08
                              )
                            : "#f1f4f7",
                          opacity: scheduled
                            ? 1
                            : 0.45,
                          cursor: scheduled
                            ? "pointer"
                            : "default",
                          transition:
                            "transform 0.12s ease",
                        }}
                      >
                        {completed && (
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 999,
                              background: "#ffffff",
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <BarChart3
            size={18}
            color={COLORS.primaryDark}
          />

          <div>
            <h2
              style={{
                margin: 0,
                color: COLORS.ink,
                fontSize: 15,
              }}
            >
              Evolução da constância
            </h2>

            <span
              style={{
                display: "block",
                marginTop: 2,
                color: COLORS.inkSoft,
                fontSize: 11,
              }}
            >
              Percentual acumulado durante o mês
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "7px 14px",
            marginBottom: 8,
          }}
        >
          {habits.map((habit) => (
            <div
              key={habit.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: COLORS.inkSoft,
                fontSize: 10,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background:
                    habit.color || "#5F92CC",
                }}
              />

              {habit.title}
            </div>
          ))}
        </div>

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            role="img"
            aria-label="Gráfico mensal de constância dos hábitos"
            style={{
              width: "100%",
              minWidth: 680,
              height: 210,
              display: "block",
            }}
          >
            {[0, 25, 50, 75, 100].map(
              (percentage) => {
                const y =
                  chartTop +
                  plotHeight -
                  (percentage / 100) *
                    plotHeight;

                return (
                  <g key={percentage}>
                    <line
                      x1={chartLeft}
                      x2={
                        chartWidth -
                        chartRight
                      }
                      y1={y}
                      y2={y}
                      stroke="#e4ebf2"
                      strokeWidth="1"
                    />

                    <text
                      x={chartLeft - 7}
                      y={y + 3}
                      fill="#7b8798"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {percentage}%
                    </text>
                  </g>
                );
              }
            )}

            {habits.map((habit) => (
              <polyline
                key={habit.id}
                points={createHabitPoints(habit)}
                fill="none"
                stroke={
                  habit.color || "#5F92CC"
                }
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {days
              .filter(
                (item, index) =>
                  index === 0 ||
                  item.day % 5 === 0 ||
                  item.day === totalDays
              )
              .map((item) => {
                const x =
                  chartLeft +
                  ((item.day - 1) /
                    Math.max(
                      1,
                      totalDays - 1
                    )) *
                    plotWidth;

                return (
                  <text
                    key={item.date}
                    x={x}
                    y={chartHeight - 7}
                    fill="#7b8798"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {item.day}
                  </text>
                );
              })}
          </svg>
        </div>
      </section>
    </div>
  );
}

const cardStyle = {
  minWidth: 0,
  padding: 14,
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  boxShadow:
    "0 4px 14px rgba(55, 106, 159, 0.04)",
};