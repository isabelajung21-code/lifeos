import { COLORS } from "../../constants/theme";

export default function PagePlaceholder({ title, description }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            color: COLORS.ink,
            letterSpacing: "-0.7px",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            color: COLORS.inkSoft,
            marginTop: 7,
            marginBottom: 0,
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 15,
          padding: 28,
          minHeight: 200,
        }}
      >
        <div
          style={{
            color: COLORS.inkSoft,
            textAlign: "center",
            paddingTop: 45,
          }}
        >
          Esta área será construída nas próximas etapas.
        </div>
      </div>
    </div>
  );
}