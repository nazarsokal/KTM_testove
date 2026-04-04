import React from 'react';
import { Sparkles } from 'lucide-react';
import './AIAssistant.css';

const AIAssistant = () => {
    return (
        <div className="ai-assistant-container">
            <div className="ai-header">
                <div className="ai-title-group">
                    <div className="ai-icon-box">
                        <Sparkles size={20} color="#62efff" />
                    </div>
                    <div>
                        <h3>AI Flight Assistant</h3>
                        <p className="ai-subtitle">Automated anomaly detection & insights</p>
                    </div>
                </div>
                {/*<div className="ai-badge">0 Events</div>*/}
            </div>

            <div className="ai-content-placeholder">
                <p>Flight analysis will appear after downloading and processing the .bin file</p>
            </div>

            <div className="ai-footer">
                <span>Last analysis: never</span>
                <button className="view-report-btn">View Full Report →</button>
            </div>
        </div>
    );
};

export default AIAssistant;