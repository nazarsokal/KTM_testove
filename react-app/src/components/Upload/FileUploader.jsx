import { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import './FileUploader.css';
import { useFlightContext } from '../../context/FlightContext';

const FileUploader = () => {
    const fileInputRef = useRef(null);
    const { uploadFile, loading } = useFlightContext();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.bin') && !file.name.endsWith('.BIN')) {
            alert("Будь ласка, виберіть бінарний лог-файл (.bin)");
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
                <span>{loading ? 'Processing...' : 'Upload Log File (.bin)'}</span>
            </button>
        </div>
    );
};

export default FileUploader;