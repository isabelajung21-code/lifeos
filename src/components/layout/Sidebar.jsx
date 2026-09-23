import {
  Home,
  CalendarDays,
  BriefcaseBusiness,
  FolderKanban,
  WalletCards,
  House,
  PawPrint,
  Clapperboard,
  GraduationCap,
  Popcorn,
  Inbox,
  Repeat2,
  ListChecks,
  FileText,
  Bell,
  BookHeart,
  Trash2
} from "lucide-react";

import { COLORS } from "../../constants/theme";

const items = [
  { id: "home", label: "Início", icon: Home },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "inbox", label: "Caixa de Entrada", icon: Inbox },
  { id: "habits", label: "Hábitos e Rotinas", icon: Repeat2 },
  { id: "journal", label: "Diário", icon: BookHeart },
  { id: "lists", label: "Listas", icon: ListChecks },
  { id: "documents", label: "Documentos", icon: FileText },
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
        width: 220,
        minHeight: "100vh",
        background: COLORS.surface,
        borderRight: `1px solid ${COLORS.border}`,
        padding: "18px 12px",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <div style={{ padding: "0 8px 18px" }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: COLORS.primaryDark,
            letterSpacing: "-0.6px",
          }}
        >
          lifeOS
        </div>

        <div
          style={{
            marginTop: 3,
            color: COLORS.inkSoft,
            fontSize: 11,
          }}
        >
          sua vida, organizada
        </div>
      </div>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
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
                padding: "7px 9px",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                gap: 8,
                textAlign: "left",
                background: active ? COLORS.primaryLight : "transparent",
                color: active ? COLORS.primaryDark : COLORS.ink,
                fontWeight: active ? 700 : 500,
                fontSize: 12,
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
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
          gap: 8,
          padding: "8px 9px",
          borderRadius: 10,
          color: COLORS.ink,
          marginBottom: 8,
          fontSize: 12,
        }}
      >
        <Bell size={17} />
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