import { Menu, Bell } from "lucide-react";
import { COLORS } from "../../constants/theme";

export default function MobileHeader({ onMenu }) {
  return (
    <header
      className="mobile-header"
      style={{
        height: 54,
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <button
        onClick={onMenu}
        style={{
          border: 0,
          background: "transparent",
          color: COLORS.ink,
          padding: 5,
        }}
      >
        <Menu size={20} />
      </button>

      <div
        style={{
          fontWeight: 800,
          fontSize: 18,
          color: COLORS.primaryDark,
        }}
      >
        lifeOS
      </div>

      <button
        style={{
          border: 0,
          background: "transparent",
          color: COLORS.ink,
          padding: 6,
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Bell size={19} />
      </button>
    </header>
  );
}