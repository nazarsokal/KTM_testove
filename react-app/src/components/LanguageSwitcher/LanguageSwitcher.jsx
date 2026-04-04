import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="lang-switcher">
            <button 
                className={`lang-btn ${i18n.resolvedLanguage === 'uk' ? 'active' : ''}`} 
                onClick={() => changeLanguage('uk')}
            >
                UA
            </button>
            <div className="lang-divider"></div>
            <button 
                className={`lang-btn ${i18n.resolvedLanguage === 'en' ? 'active' : ''}`} 
                onClick={() => changeLanguage('en')}
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;