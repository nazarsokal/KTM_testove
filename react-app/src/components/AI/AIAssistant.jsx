import React, { useState } from 'react';
import { Sparkles, ShieldAlert, ListTree, Activity, ChevronDown, AlertTriangle, Info } from 'lucide-react';
import './AIAssistant.css';
import { useTranslation } from 'react-i18next';

const AIAssistant = ({ data }) => {
    const defaultData = {
        "feedback": "Цей політ БПЛА характеризувався швидким і потужним підйомом, досягнувши максимальної висоти 600.89 м за 9.6 секунд з високими вертикальними швидкостями та прискоренням. Апарат подолав значну горизонтальну відстань у 1234.13 м. Проте, під час фази спуску були зафіксовані значні коливання орієнтації (Attitude), що вказує на нестабільність польоту. Також відзначено потенційну проблему з показаннями висоти або взаємодією з ґрунтом після приземлення. Загалом, політ демонструє високу продуктивність, але з помітними проблемами стабільності під час спуску.",
        "details": [
            "Під час фази спуску (приблизно з t=9.6с до t=21.8с) дані телеметрії 'Att' (кути орієнтації) демонструють значні коливання, особливо помітні між t=13.6с і t=15.2с, де компонента X змінюється від -2.0796 до 1.3469, що підтверджує нестабільність, зазначену в аномаліях.",
            "Аномалія 'Altitude becomes negative after t=21.8' вказує на можливе проникнення в ґрунт або дрейф датчика висоти після приземлення. Хоча надані точки телеметрії завершуються на t=21.6с, це є потенційним серйозним питанням, що потребує додаткових даних для верифікації та розуміння причин.",
            "Зниження швидкості до нуля після приземлення ('Velocity drops abruptly to 0 after landing') є очікуваною та нормальною поведінкою для БПЛА і не класифікується як аномалія."
        ],
        "riskLevel": "MEDIUM"
    };
    const { t } = useTranslation();

    const activeData = data || defaultData;

    const [openSections, setOpenSections] = useState({
        feedback: false,
        details: false,
        risk: false
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="ai-assistant-container">
            <div className="ai-main-header">
                <div className="ai-title-group">
                    <div className="ai-logo-box"><Sparkles size={18} color="#61ff8c" /></div>
                    <h3>{t('aiAssistant.title')}</h3>
                </div>
                <div className="ai-status-dot">{t('aiAssistant.statusLive')}</div>
            </div>

            <div className="ai-sections-wrapper">

                {/* СЕКЦІЯ 1: FEEDBACK (SUMMARY) */}
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
                            <p>{activeData.feedback}</p>
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
                                {activeData.details.map((item, idx) => (
                                    <div key={idx} className="detail-row">
                                        {item.includes('Аномалія') ? <AlertTriangle size={14} color="#f59e0b" /> : <Info size={14} color="#3b82f6" />}
                                        <p>{item}</p>
                                    </div>
                                ))}
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
                            <div className={`risk-indicator ${activeData.riskLevel.toLowerCase()}`}>
                                <strong>{t('aiAssistant.lvlName')}</strong> {activeData.riskLevel}
                            </div>
                            <p className="risk-note">
                                {activeData.riskLevel === 'HIGH'
                                    ? t('aiAssistant.riskNotes.high')
                                    : activeData.riskLevel === 'MEDIUM'
                                        ? t('aiAssistant.riskNotes.medium')
                                        : t('aiAssistant.riskNotes.low')}
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AIAssistant;