import React from "react";
import { useTranslation } from "react-i18next";
import { Rocket, BarChart3, Bot } from "lucide-react"; // Видалили ArrowUpRight звідси
import "./WelcomeScreen.css";

function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <div className="welcome-container">
      <div className="welcome-hero">
        <div className="hero-icon-wrapper">
          <Rocket size={56} className="hero-icon" />
        </div>
        <h2 className="welcome-title">{t("welcome.title")}</h2>
        <p className="welcome-subtitle">{t("welcome.subtitle")}</p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon-container">
            <BarChart3 size={28} />
          </div>
          <h3>{t("welcome.feature1Title")}</h3>
          <p>{t("welcome.feature1Desc")}</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-container">
            <Rocket size={28} />
          </div>
          <h3>{t("welcome.feature2Title")}</h3>
          <p>{t("welcome.feature2Desc")}</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-container">
            <Bot size={28} />
          </div>
          <h3>{t("welcome.feature3Title")}</h3>
          <p>{t("welcome.feature3Desc")}</p>
        </div>
      </div>

      <div className="upload-hint">
        <span>{t("welcome.uploadHint")}</span>
        {/* Компонент зі стрілочкою успішно видалено */}
      </div>
    </div>
  );
}

export default WelcomeScreen;