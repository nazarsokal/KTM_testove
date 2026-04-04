import { useTranslation } from 'react-i18next';
import { useFlightContext } from './context/FlightContext';
import MetricsGrid from './components/Metrics/MetricsGrid';
import FileUploader from './components/Upload/FileUploader';
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher';
import './App.css'
import { Trash2 } from 'lucide-react';

function App() {
    const { data, clearData, error } = useFlightContext();
    const { t } = useTranslation(); 

  return (
    <>
        <header className="dashboard-header">
            <div className="header-content">
                <h1>{t("app.title")}</h1>
                <LanguageSwitcher />
                {data && data.length > 0 && (
                    <button className="clear-data-btn" onClick={() => clearData()}>
                        <Trash2 size={16} />
                        {t("app.clearData")}
                    </button>
                )}
                <FileUploader />
            </div>
        </header>

        {error && (
            <div className="error-message">
                {t('app.error')}: {error}
            </div>
        )}

        <section className="metrics-section">
            <MetricsGrid />
        </section>
      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
