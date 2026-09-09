import { useEffect, useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import MobileHeader from "./components/layout/MobileHeader";
import PagePlaceholder from "./components/layout/PagePlaceholder";
import { COLORS } from "./constants/theme";
import HomePage from "./pages/home/HomePage";
import TrashPage from "./pages/Trash/TrashPage";
import FinancePage from "./pages/finance/FinancePage";

const pages = {
  home: {
    title: "Início",
    description: "Seu resumo geral da semana.",
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
          marginLeft: isMobile ? 0 : 250,
          padding: isMobile ? "22px 16px 60px" : "32px 36px 60px",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: 1450,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
          </div>

          {currentPage === "home" ? (
            <HomePage currentUser={currentUser} />
          ) : currentPage === "finance" ? (
            <FinancePage currentUser={currentUser} />
          ) : currentPage === "trash" ? (
            <TrashPage currentUser={currentUser} />
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