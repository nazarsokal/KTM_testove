import { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './FileUploader.css';
import { useFlightContext } from '../../context/FlightContext';

const FileUploader = () => {
    const fileInputRef = useRef(null);
    const { uploadFile, loading } = useFlightContext();
    const { t } = useTranslation();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.bin') && !file.name.endsWith('.BIN')) {
            alert(t('upload.alertWrongFormat'));
            return;
        }

        uploadFile(file);

        event.target.value = null;
    };

    return (
        <div className="uploader-wrapper">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".bin"
                style={{ display: 'none' }}
            />
            <button
                className={`gradient-upload-btn ${loading ? 'loading' : ''}`}
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Upload size={20} className="btn-icon" />
                )}
                <span>{loading ? t('upload.btnProcessing') : t('upload.btnSelect')}</span>
            </button>
        </div>
    );
};

export default FileUploader;