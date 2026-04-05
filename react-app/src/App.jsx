import { useTranslation } from "react-i18next";
import { useFlightContext } from "./context/FlightContext";
import MetricsGrid from "./components/Metrics/MetricsGrid";
import FileUploader from "./components/Upload/FileUploader";
import AIAssistant from "./components/AI/AIAssistant";
import LanguageSwitcher from "./components/LanguageSwitcher/LanguageSwitcher";
import FlightPanel from "./components/FlightPanel/FlightPanel";
import "./App.css";
import { Trash2 } from "lucide-react";

function App() {
  const { data, clearData, error } = useFlightContext();
  const { t } = useTranslation();

  const hasData = data?.length > 0;

  return (
    <>
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{t("app.title")}</h1>
          <LanguageSwitcher />
          {hasData && (
            <button className="clear-data-btn" onClick={clearData}>
              <Trash2 size={16} />
              {t("app.clearData")}
            </button>
          )}
          <FileUploader />
        </div>
      </header>

      <main className="dashboard-main">
        {error && (
          <div className="error-message" role="alert">
            {t("app.error")}: {error}
          </div>
        )}

        <section className="metrics-section">
          <MetricsGrid />
        </section>

        {hasData && (
          <section
            className="flight-visuals-section"
            style={{ marginTop: "20px" }}
          >
            <FlightPanel />
          </section>
        )}

        <section className="ai-section" style={{ margin: "20px" }}>
          <AIAssistant />
        </section>
      </main>
    </>
  );
}

export default App;
