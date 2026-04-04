import { useTranslation } from 'react-i18next';
import { useFlightContext } from './context/FlightContext';
import MetricsGrid from './components/Metrics/MetricsGrid';
import FileUploader from './components/Upload/FileUploader';
import AIAssistant from "./components/AI/AIAssistant";
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher';
import FlightPanel from './components/FlightPanel/FlightPanel';
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

      <section className="metrics-section">
        <MetricsGrid />
      </section>

        <main className="dashboard-main">
            <section className="ai-section">
                <AIAssistant />
            </section>
        </main>

      {/*<section id="next-steps">*/}
      {/*  <div id="docs">*/}
      {/*    <svg className="icon" role="presentation" aria-hidden="true">*/}
      {/*      <use href="/icons.svg#documentation-icon"></use>*/}
      {/*    </svg>*/}
      {/*    <h2>Documentation</h2>*/}
      {/*    <p>Your questions, answered</p>*/}
      {/*    <ul>*/}
      {/*      <li>*/}
      {/*        <a href="https://vite.dev/" target="_blank">*/}
      {/*          <img className="logo" src={viteLogo} alt="" />*/}
      {/*          Explore Vite*/}
      {/*        </a>*/}
      {/*      </li>*/}
      {/*      <li>*/}
      {/*        <a href="https://react.dev/" target="_blank">*/}
      {/*          <img className="button-icon" src={reactLogo} alt="" />*/}
      {/*          Learn more*/}
      {/*        </a>*/}
      {/*      </li>*/}
      {/*    </ul>*/}
      {/*  </div>*/}
      {/*  <div id="social">*/}
      {/*    <svg className="icon" role="presentation" aria-hidden="true">*/}
      {/*      <use href="/icons.svg#social-icon"></use>*/}
      {/*    </svg>*/}
      {/*    <h2>Connect with us</h2>*/}
      {/*    <p>Join the Vite community</p>*/}
      {/*    <ul>*/}
      {/*      <li>*/}
      {/*        <a href="https://github.com/vitejs/vite" target="_blank">*/}
      {/*          <svg*/}
      {/*            className="button-icon"*/}
      {/*            role="presentation"*/}
      {/*            aria-hidden="true"*/}
      {/*          >*/}
      {/*            <use href="/icons.svg#github-icon"></use>*/}
      {/*          </svg>*/}
      {/*          GitHub*/}
      {/*        </a>*/}
      {/*      </li>*/}
      {/*      <li>*/}
      {/*        <a href="https://chat.vite.dev/" target="_blank">*/}
      {/*          <svg*/}
      {/*            className="button-icon"*/}
      {/*            role="presentation"*/}
      {/*            aria-hidden="true"*/}
      {/*          >*/}
      {/*            <use href="/icons.svg#discord-icon"></use>*/}
      {/*          </svg>*/}
      {/*          Discord*/}
      {/*        </a>*/}
      {/*      </li>*/}
      {/*      <li>*/}
      {/*        <a href="https://x.com/vite_js" target="_blank">*/}
      {/*          <svg*/}
      {/*            className="button-icon"*/}
      {/*            role="presentation"*/}
      {/*            aria-hidden="true"*/}
      {/*          >*/}
      {/*            <use href="/icons.svg#x-icon"></use>*/}
      {/*          </svg>*/}
      {/*          X.com*/}
      {/*        </a>*/}
      {/*      </li>*/}
      {/*      <li>*/}
      {/*        <a href="https://bsky.app/profile/vite.dev" target="_blank">*/}
      {/*          <svg*/}
      {/*            className="button-icon"*/}
      {/*            role="presentation"*/}
      {/*            aria-hidden="true"*/}
      {/*          >*/}
      {/*            <use href="/icons.svg#bluesky-icon"></use>*/}
      {/*          </svg>*/}
      {/*          Bluesky*/}
      {/*        </a>*/}
      {/*      </li>*/}
      {/*    </ul>*/}
      {/*  </div>*/}
      {/*</section>*/}

      <div className="ticks"></div>
      <section id="spacer"></section>
        {error && (
            <div className="error-message">
                {t('app.error')}: {error}
            </div>
        )}

        <section className="metrics-section">
            <MetricsGrid />
        </section>

        {data && data.length > 0 && (
                <section className="flight-visuals-section" style={{ marginTop: '20px' }}>
                    <FlightPanel />
                </section>
            )}
        <div className="ticks"></div>
        <section id="spacer"></section>
    </>
  )
}

export default App
