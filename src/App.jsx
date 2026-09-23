import { useEffect, useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import MobileHeader from "./components/layout/MobileHeader";
import PagePlaceholder from "./components/layout/PagePlaceholder";
import { COLORS } from "./constants/theme";
import HomePage from "./pages/home/HomePage";
import TrashPage from "./pages/Trash/TrashPageV2";
import FinancePage from "./pages/finance/FinancePage";
import HousePage from "./pages/home/HousePage";
import PetsPage from "./pages/pets/PetsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import WorkPage from "./pages/work/WorkPage";
import InboxPage from "./pages/inbox/InboxPage";
import HabitsPage from "./pages/habits/HabitsPage";
import AgendaPage from "./pages/agenda/AgendaPage";
import ListsPage from "./pages/lists/ListsPage";
import DocumentsPage from "./pages/documents/DocumentsPage";
import JournalPage from "./pages/journal/JournalPage";
import StudiesPage from "./pages/studies/StudiesPage";
import ContentPage from "./pages/content/ContentPage";
import EntertainmentPage from "./pages/entertainment/EntertainmentPage";
import HealthPage from "./pages/health/HealthPage";



const pages = {
  home: {
    title: "Início",
    description: "Seu resumo geral da semana.",
  },
  inbox: {
    title: "Caixa de Entrada",
    description: "Capture agora e organize quando estiver pronta.",
  },
  habits: {
    title: "Hábitos e Rotinas",
    description: "Acompanhe suas rotinas e sua constância.",
  },
  health: {
    title: "Saúde",
    description: "Saúde, bem-estar e performance.",
  },
  agenda: {
    title: "Agenda",
    description: "Compromissos, tarefas e vencimentos em um só lugar.",
  },
journal: {
  title: "Diário",
  description: "Um espaço privado para registrar seus dias.",
},
  lists: {
    title: "Listas",
    description: "Ideias, desejos e planos rápidos.",
  },
  documents: {
    title: "Documentos",
    description: "Informações importantes e alertas de validade.",
  },
  work: {
    title: "Trabalho",
    description: "Tarefas, reuniões, documentos e organização profissional.",
  },
  projects: {
    title: "Projetos",
    description: "Acompanhe seus projetos, etapas e prazos.",
  },
  finance: {
    title: "Financeiro",
    description: "Controle financeiro compartilhado.",
  },
  house: {
    title: "Casa",
    description: "Organização da casa e da rotina de vocês.",
  },
  pets: {
    title: "Pets",
    description: "Saúde, cuidados e rotina dos pets.",
  },
  content: {
    title: "Conteúdo",
    description: "Planejamento de conteúdo e parcerias.",
  },
  studies: {
    title: "Estudos",
    description: "Cursos, mestrado, metas e sessões de estudo.",
  },
  entertainment: {
    title: "Entretenimento",
    description: "Livros, filmes e séries.",
  },
  trash: {
    title: "Lixeira",
    description: "Itens excluídos recentemente.",
  },
};

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem("lifeos-user") || "Isabela";
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("lifeos-user", currentUser);
  }, [currentUser]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);

      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const page = pages[currentPage];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
      }}
    >
      {!isMobile && (
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      )}

      {isMobile && (
        <MobileHeader onMenu={() => setMenuOpen(true)} />
      )}

      {isMobile && menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(20, 30, 40, 0.25)",
              zIndex: 50,
            }}
          />

          <div
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 60,
            }}
          >
            <Sidebar
              currentPage={currentPage}
              setCurrentPage={(pageId) => {
                setCurrentPage(pageId);
                setMenuOpen(false);
              }}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          </div>
        </>
      )}

      <main
        style={{
          marginLeft: isMobile ? 0 : 220,
          padding: isMobile ? "16px 12px 40px" : "22px 26px 48px",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: 1250,
            margin: "0 auto",
          }}
        >
          
          {currentPage === "home" ? (
            <HomePage
              currentUser={currentUser}
              onNavigate={setCurrentPage}
            />
          ) : currentPage === "inbox" ? (
            <InboxPage currentUser={currentUser} />
          ) : currentPage === "habits" ? (
            <HabitsPage currentUser={currentUser} />
          ) : currentPage === "health" ? (
            <HealthPage currentUser={currentUser} />
          ) : currentPage === "agenda" ? (
            <AgendaPage currentUser={currentUser} />
          ) : currentPage === "journal" ? (
            <JournalPage currentUser={currentUser} />
          ) : currentPage === "lists" ? (
            <ListsPage currentUser={currentUser} />
          ) : currentPage === "documents" ? (
            <DocumentsPage currentUser={currentUser} />
          ) : currentPage === "projects" ? (
            <ProjectsPage currentUser={currentUser} />
          ) : currentPage === "finance" ? (
            <FinancePage currentUser={currentUser} />
          ) : currentPage === "house" ? (
            <HousePage currentUser={currentUser} />
          ) : currentPage === "pets" ? (
            <PetsPage currentUser={currentUser} />
          ) : currentPage === "content" ? (
            <ContentPage currentUser={currentUser} />
          ) : currentPage === "entertainment" ? (
            <EntertainmentPage currentUser={currentUser} />
          ) : currentPage === "studies" ? (
            <StudiesPage currentUser={currentUser} />
          ) : currentPage === "trash" ? (
            <TrashPage currentUser={currentUser} />
          ) : currentPage === "work" ? (
            <WorkPage currentUser={currentUser} />
          ) : (
            <PagePlaceholder
              title={page.title}
              description={page.description}
            />
          )}
        </div>
      </main>
    </div>
  );
}