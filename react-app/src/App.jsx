import { useTranslation } from 'react-i18next';
import { useState } from 'react'
import MetricsGrid from './components/Metrics/MetricsGrid';
import FileUploader from './components/Upload/FileUploader';
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher';
import './App.css'

function App() {
    const [telemetryData, setTelemetryData] = useState(null);
    const { t } = useTranslation(); 

    const handleUploadSuccess = (data) => {
        setTelemetryData(data);
    };

  return (
    <>
        <header className="dashboard-header">
            <div className="header-content">
                <h1>{t("app.title")}</h1>
                <LanguageSwitcher />
                <FileUploader onUploadSuccess={handleUploadSuccess} />
            </div>
        </header>



        <section className="metrics-section">
            <MetricsGrid data={telemetryData} />
        </section>
      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
