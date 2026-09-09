import {
  Home,
  BriefcaseBusiness,
  FolderKanban,
  WalletCards,
  House,
  PawPrint,
  Clapperboard,
  GraduationCap,
  Popcorn,
  Bell,
  Trash2
} from "lucide-react";

import { COLORS } from "../../constants/theme";

const items = [
  { id: "home", label: "Início", icon: Home },
  { id: "work", label: "Trabalho", icon: BriefcaseBusiness },
  { id: "projects", label: "Projetos", icon: FolderKanban },
  { id: "finance", label: "Financeiro", icon: WalletCards },
  { id: "house", label: "Casa", icon: House },
  { id: "pets", label: "Pets", icon: PawPrint },
  { id: "content", label: "Conteúdo", icon: Clapperboard },
  { id: "studies", label: "Estudos", icon: GraduationCap },
  { id: "entertainment", label: "Entretenimento", icon: Popcorn },
  { id: "trash", label: "Lixeira", icon: Trash2 },

];

export default function Sidebar({
  currentPage,
  setCurrentPage,
  currentUser,
  setCurrentUser,
}) {
  return (
    <aside
      style={{
        width: 250,
        minHeight: "100vh",
        background: COLORS.surface,
        borderRight: `1px solid ${COLORS.border}`,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div style={{ padding: "0 10px 26px" }}>
        <div
          style={{
            fontSize: 27,
            fontWeight: 800,
            color: COLORS.primaryDark,
            letterSpacing: "-1px",
          }}
        >
          lifeOS
        </div>

        <div
          style={{
            marginTop: 3,
            color: COLORS.inkSoft,
            fontSize: 12,
          }}
        >
          sua vida, organizada
        </div>
      </div>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          flex: 1,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                border: 0,
                width: "100%",
                padding: "11px 12px",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 11,
                textAlign: "left",
                background: active ? COLORS.primaryLight : "transparent",
                color: active ? COLORS.primaryDark : COLORS.ink,
                fontWeight: active ? 700 : 500,
              }}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        style={{
          border: 0,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px",
          borderRadius: 10,
          color: COLORS.ink,
          marginBottom: 8,
        }}
      >
        <Bell size={19} />
        Notificações
      </button>

      <div
        style={{
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: COLORS.inkSoft,
            marginBottom: 7,
            paddingLeft: 4,
          }}
        >
          Usuário
        </div>

        <select
          value={currentUser}
          onChange={(e) => setCurrentUser(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 11px",
            borderRadius: 9,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.bg,
            color: COLORS.ink,
            outline: "none",
          }}
        >
          <option value="Isabela">Isabela</option>
          <option value="Eduardo">Eduardo</option>
        </select>
      </div>
    </aside>
  );
}