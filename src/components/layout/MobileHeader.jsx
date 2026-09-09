import { Menu, Bell } from "lucide-react";
import { COLORS } from "../../constants/theme";

export default function MobileHeader({ onMenu }) {
  return (
    <header
      className="mobile-header"
      style={{
        height: 62,
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
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
        <Menu size={23} />
      </button>

      <div
        style={{
          fontWeight: 800,
          fontSize: 21,
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
          padding: 5,
        }}
      >
        <Bell size={21} />
      </button>
    </header>
  );
}