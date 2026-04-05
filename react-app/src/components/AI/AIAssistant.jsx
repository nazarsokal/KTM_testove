import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Sparkles, ShieldAlert, ListTree, Activity, ChevronDown, 
    AlertTriangle, Info, Loader2 
} from 'lucide-react';
import './AIAssistant.css';
import { useTranslation } from 'react-i18next';
import { useAIContext } from '../../context/AIContext';

const TypewriterText = ({ text, speed = 30, onComplete, delay = 0 }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [started, setStarted] = useState(false);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const timer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    useEffect(() => {
        if (!started || !text) return;
        setDisplayedText("");
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayedText(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(interval);
                if (onCompleteRef.current) onCompleteRef.current();
            }
        }, speed);
        return () => clearInterval(interval);
    }, [started, text, speed]);

    return (
        <p className="typing-text">
            {displayedText}
            {started && displayedText.length < (text?.length || 0) && (
                <span className="typing-cursor">|</span>
            )}
        </p>
    );
};

const AIAssistant = () => {
    const { t } = useTranslation();
    const { aiAnalysis, loading, error } = useAIContext();

    const [renderStep, setRenderStep] = useState('none');
    const [visibleDetailsCount, setVisibleDetailsCount] = useState(0);
    const [openSections, setOpenSections] = useState({ feedback: true, details: true, risk: true });

    const riskSectionRef = useRef(null);

    useEffect(() => {
        if (!loading && aiAnalysis) {
            setRenderStep('feedback');
            setVisibleDetailsCount(0);
        } else if (loading) {
            setRenderStep('none');
        }
    }, [loading, aiAnalysis]);

    useEffect(() => {
        if (renderStep === 'risk' && riskSectionRef.current) {
            riskSectionRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }, [renderStep]);

    const handleFeedbackComplete = useCallback(() => setRenderStep('details'), []);

    const handleDetailComplete = useCallback(() => {
        setVisibleDetailsCount(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (renderStep === 'details' && aiAnalysis?.details && visibleDetailsCount >= aiAnalysis.details.length) {
            const timer = setTimeout(() => setRenderStep('risk'), 500);
            return () => clearTimeout(timer);
        }
    }, [renderStep, visibleDetailsCount, aiAnalysis]);

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (error) return (
        <div className="ai-assistant-container ai-error-state">
            <div className="section-title icon-red" style={{ padding: '20px' }}>
                <AlertTriangle size={18} />
                <span>{t('aiAssistant.error')}: {error}</span>
            </div>
        </div>
    );

    if (!loading && !aiAnalysis) return null;

    return (
        <div className="ai-assistant-container">
            <div className="ai-main-header">
                <div className="ai-title-group">
                    <div className="ai-logo-box">
                        {loading ? <Loader2 size={18} className="animate-spin" color="#61ff8c" /> : <Sparkles size={18} color="#61ff8c" />}
                    </div>
                    <h3>{t('aiAssistant.title')}</h3>
                </div>
                <div className={`ai-status-dot ${loading ? 'is-loading' : 'is-live'}`}>
                    {loading ? t('aiAssistant.statusAnalyzing') : t('aiAssistant.statusLive')}
                </div>
            </div>

            <div className="ai-sections-wrapper">
                
                {/* 1. FEEDBACK */}
                {(loading || renderStep !== 'none') && (
                    <div className={`ai-collapsible-section ${openSections.feedback ? 'is-open' : ''}`}>
                        <div className="section-trigger" onClick={() => toggleSection('feedback')}>
                            <div className="section-title">
                                <Activity size={18} className="icon-blue" />
                                <span>{t('aiAssistant.sections.feedback')}</span>
                            </div>
                            <ChevronDown size={18} className="section-arrow" />
                        </div>
                        {/* Контент більше не видаляється з DOM, а просто ховається */}
                        <div 
                            className="section-content highlight-text feedback-bg"
                            style={{ display: openSections.feedback ? undefined : 'none' }}
                        >
                            {loading ? (
                                <div className="ai-skeleton-text">
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                                </div>
                            ) : (
                                <TypewriterText 
                                    text={aiAnalysis?.feedback} 
                                    speed={30}
                                    onComplete={handleFeedbackComplete} 
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* 2. DETAILS */}
                {(loading || (['details', 'risk', 'finished'].includes(renderStep))) && (
                    <div className={`ai-collapsible-section ${openSections.details ? 'is-open' : ''} animate-section-in`}>
                        <div className="section-trigger" onClick={() => toggleSection('details')}>
                            <div className="section-title">
                                <ListTree size={18} className="icon-green" />
                                <span>{t('aiAssistant.sections.details')}</span>
                            </div>
                            <ChevronDown size={18} className="section-arrow" />
                        </div>
                        <div 
                            className="section-content highlight-text"
                            style={{ display: openSections.details ? undefined : 'none' }}
                        >
                            <div className="details-stack">
                                {loading ? (
                                    [1, 2].map(i => <div key={i} className="skeleton-row"><div className="skeleton-icon"></div><div className="skeleton-line" style={{width: '75%'}}></div></div>)
                                ) : (
                                    aiAnalysis?.details?.map((item, idx) => (
                                        idx <= visibleDetailsCount && (
                                            <div key={idx} className="detail-row">
                                                {item.toLowerCase().includes('аномалія') ? <AlertTriangle size={14} color="#f59e0b" /> : <Info size={14} color="#3b82f6" />}
                                                <TypewriterText 
                                                    text={item} 
                                                    speed={25}
                                                    onComplete={idx === visibleDetailsCount ? handleDetailComplete : null}
                                                />
                                            </div>
                                        )
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. RISK LEVEL */}
                {(loading || (['risk', 'finished'].includes(renderStep))) && (
                    <div 
                        ref={riskSectionRef}
                        className={`ai-collapsible-section ${openSections.risk ? 'is-open' : ''} animate-section-in`}
                    >
                        <div className="section-trigger" onClick={() => toggleSection('risk')}>
                            <div className="section-title">
                                <ShieldAlert size={18} className="icon-red" />
                                <span>{t('aiAssistant.sections.risk')}</span>
                            </div>
                            <ChevronDown size={18} className="section-arrow" />
                        </div>
                        <div 
                            className="section-content risk-content highlight-text"
                            style={{ display: openSections.risk ? undefined : 'none' }}
                        >
                            {loading ? (
                                <div className="skeleton-risk"><div className="skeleton-badge"></div></div>
                            ) : (
                                <div className="animate-in">
                                    <div className={`risk-indicator ${aiAnalysis?.riskLevel?.toLowerCase()}`}>
                                        <strong>{t('aiAssistant.lvlName')}</strong> {t(`aiAssistant.riskState.${aiAnalysis?.riskLevel?.toLowerCase()}`)}
                                    </div>
                                    <TypewriterText 
                                        text={aiAnalysis?.riskLevel === 'HIGH' ? t('aiAssistant.riskNotes.high') : aiAnalysis?.riskLevel === 'MEDIUM' ? t('aiAssistant.riskNotes.medium') : t('aiAssistant.riskNotes.low')} 
                                        speed={35}
                                        onComplete={() => setRenderStep('finished')}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAssistant;