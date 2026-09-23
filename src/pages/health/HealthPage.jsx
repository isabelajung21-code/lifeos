import { useEffect, useState } from "react";
import { HeartPulse, LoaderCircle } from "lucide-react";
import { setHealthCurrentUser } from "../../services/healthService";
import HealthModule from "./HealthModule";


export default function HealthPage({ currentUser }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function prepareHealthPage() {
      try {
        setIsReady(false);
        setError("");

        await setHealthCurrentUser(currentUser);

        if (isMounted) {
          setIsReady(true);
        }
      } catch (healthError) {
        console.error(
          "Erro ao preparar página de Saúde:",
          healthError
        );

        if (isMounted) {
          setError(
            healthError?.message ||
              "Não foi possível carregar a página de Saúde."
          );
        }
      }
    }

    if (currentUser) {
      prepareHealthPage();
    } else {
      setIsReady(false);
      setError("Nenhum usuário foi selecionado.");
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  if (error) {
    return (
      <div style={styles.stateContainer}>
        <div style={styles.stateCard}>
          <div style={styles.errorIcon}>
            <HeartPulse size={22} />
          </div>

          <div>
            <strong style={styles.stateTitle}>
              Não foi possível abrir Saúde
            </strong>

            <p style={styles.stateText}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={styles.stateContainer}>
        <div style={styles.stateCard}>
          <LoaderCircle
            size={22}
            style={styles.loadingIcon}
          />

          <div>
            <strong style={styles.stateTitle}>
              Carregando Saúde
            </strong>

            <p style={styles.stateText}>
              Preparando os dados de {currentUser}...
            </p>
          </div>
        </div>
      </div>
    );
  }

    return (
        <div className="health-module">
        <HealthModule currentUser={currentUser} />
        </div>
    );
}

const styles = {
  page: {
    display: "grid",
    gap: "18px",
    width: "100%",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  headerIcon: {
    width: "38px",
    height: "38px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    color: "#3977b8",
    background: "#eaf3fc",
    border: "1px solid #d4e5f5",
    borderRadius: "11px",
  },

  title: {
    margin: 0,
    color: "#172033",
    fontSize: "20px",
    lineHeight: 1.2,
  },

  subtitle: {
    margin: "4px 0 0",
    color: "#6a7689",
    fontSize: "13px",
  },

  placeholder: {
    minHeight: "260px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "24px",
    color: "#3977b8",
    background: "#ffffff",
    border: "1px solid #dbe6f1",
    borderRadius: "16px",
    textAlign: "center",
  },

  placeholderTitle: {
    marginTop: "4px",
    color: "#172033",
    fontSize: "15px",
  },

  placeholderText: {
    maxWidth: "420px",
    color: "#6a7689",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  stateContainer: {
    width: "100%",
    minHeight: "260px",
    display: "grid",
    placeItems: "center",
  },

  stateCard: {
    maxWidth: "440px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "18px",
    background: "#ffffff",
    border: "1px solid #dbe6f1",
    borderRadius: "14px",
  },

  stateTitle: {
    display: "block",
    color: "#172033",
    fontSize: "14px",
  },

  stateText: {
    margin: "4px 0 0",
    color: "#6a7689",
    fontSize: "13px",
  },

  errorIcon: {
    width: "38px",
    height: "38px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    color: "#b94b55",
    background: "#fff0f1",
    borderRadius: "10px",
  },

  loadingIcon: {
    flexShrink: 0,
    color: "#3977b8",
    animation: "spin 1s linear infinite",
  },
};