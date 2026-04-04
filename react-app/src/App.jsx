import { useState } from 'react'
import MetricsGrid from './components/Metrics/MetricsGrid';
import FileUploader from './components/Upload/FileUploader';
import './App.css'

function App() {
    const [telemetryData, setTelemetryData] = useState(null);

    const handleUploadSuccess = (data) => {
        setTelemetryData(data);
    };

  return (
    <>
        <header className="dashboard-header">
            <div className="header-content">
                <h1>System for Flight Telemetry Analysis</h1>
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
