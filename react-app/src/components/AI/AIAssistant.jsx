import React, { useState } from 'react';
import { Sparkles, ShieldAlert, ListTree, Activity, ChevronDown, AlertTriangle, Info, Loader2 } from 'lucide-react';
import './AIAssistant.css';
import { useTranslation } from 'react-i18next';
import { useAIContext } from '../../context/AIContext';

const AIAssistant = () => {
    const { t } = useTranslation();
    const { aiAnalysis, loading, error } = useAIContext();

    const [openSections, setOpenSections] = useState({
        feedback: false,
        details: false,
        risk: false
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Стан помилки (наприклад, API Key expired)
    if (error) {
        return (
            <div className="ai-assistant-container ai-error-state">
                <div className="section-title icon-red" style={{ padding: '20px' }}>
                    <AlertTriangle size={18} />
                    <span>{t('aiAssistant.error')}: {error}</span>
                </div>
            </div>
        );
    }

    // Якщо даних ще немає і завантаження не йде (файл не вибрано) — не рендеримо нічого
    if (!aiAnalysis && !loading) return null;

    return (
        <div className="ai-assistant-container">
            <div className="ai-main-header">
                <div className="ai-title-group">
                    <div className="ai-logo-box">
                        {loading ? <Loader2 size={18} className="animate-spin" color="#61ff8c" /> : <Sparkles size={18} color="#61ff8c" />}
                    </div>
                    <h3>{t('aiAssistant.title')}</h3>
                </div>
                <div className="ai-status-dot">
                    {loading ? t('aiAssistant.statusAnalyzing') || "Аналізуємо..." : t('aiAssistant.statusLive')}
                </div>
            </div>

            <div className="ai-sections-wrapper">

                {/* СЕКЦІЯ 1: FEEDBACK */}
                <div className={`ai-collapsible-section ${openSections.feedback ? 'is-open' : ''}`}>
                    <div className="section-trigger" onClick={() => toggleSection('feedback')}>
                        <div className="section-title">
                            <Activity size={18} className="icon-blue" />
                            <span>{t('aiAssistant.sections.feedback')}</span>
                        </div>
                        <ChevronDown size={18} className="section-arrow" />
                    </div>
                    {openSections.feedback && (
                        <div className="section-content feedback-bg">
                            {loading ? (
                                <div className="ai-skeleton-text">
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                                </div>
                            ) : (
                                <p>{aiAnalysis?.feedback}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* СЕКЦІЯ 2: DETAILS */}
                <div className={`ai-collapsible-section ${openSections.details ? 'is-open' : ''}`}>
                    <div className="section-trigger" onClick={() => toggleSection('details')}>
                        <div className="section-title">
                            <ListTree size={18} className="icon-green" />
                            <span>{t('aiAssistant.sections.details')}</span>
                        </div>
                        <ChevronDown size={18} className="section-arrow" />
                    </div>
                    {openSections.details && (
                        <div className="section-content">
                            <div className="details-stack">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="detail-row skeleton-row">
                                            <div className="skeleton-icon"></div>
                                            <div className="skeleton-line" style={{ height: '12px' }}></div>
                                        </div>
                                    ))
                                ) : (
                                    aiAnalysis?.details?.map((item, idx) => (
                                        <div key={idx} className="detail-row">
                                            {(item.toLowerCase().includes('аномалія') || item.toLowerCase().includes('anomaly'))
                                                ? <AlertTriangle size={14} color="#f59e0b" />
                                                : <Info size={14} color="#3b82f6" />
                                            }
                                            <p>{item}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* СЕКЦІЯ 3: RISK LEVEL */}
                <div className={`ai-collapsible-section ${openSections.risk ? 'is-open' : ''}`}>
                    <div className="section-trigger" onClick={() => toggleSection('risk')}>
                        <div className="section-title">
                            <ShieldAlert size={18} className="icon-red" />
                            <span>{t('aiAssistant.sections.risk')}</span>
                        </div>
                        <ChevronDown size={18} className="section-arrow" />
                    </div>
                    {openSections.risk && (
                        <div className="section-content risk-content">
                            {loading ? (
                                <div className="skeleton-risk">
                                    <div className="skeleton-badge"></div>
                                    <div className="skeleton-line" style={{ width: '80%', marginTop: '10px' }}></div>
                                </div>
                            ) : (
                                <>
                                    <div className={`risk-indicator ${aiAnalysis?.riskLevel?.toLowerCase()}`}>
                                        <strong>{t('aiAssistant.lvlName')}</strong>{' '}
                                        {t(`aiAssistant.riskState.${aiAnalysis?.riskLevel?.toLowerCase()}`)}
                                    </div>
                                    <p className="risk-note">
                                        {aiAnalysis?.riskLevel === 'HIGH'
                                            ? t('aiAssistant.riskNotes.high')
                                            : aiAnalysis?.riskLevel === 'MEDIUM'
                                                ? t('aiAssistant.riskNotes.medium')
                                                : t('aiAssistant.riskNotes.low')}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;