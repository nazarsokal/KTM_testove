import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import './FileUploader.css';

const FileUploader = ({ onUploadSuccess }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.bin') && !file.name.endsWith('.BIN')) {
            alert("Будь ласка, виберіть бінарний лог-файл (.bin)");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);

        try {
            const response = await fetch('http://localhost:5208/file/load', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log("File upload", data);
                if (onUploadSuccess) onUploadSuccess(data);
            } else {
                throw new Error('File upload failed.');
            }
        } catch (error) {
            console.error("Error", error);
            alert("File upload failed.");
        } finally {
            setIsUploading(false);
        }
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
                className={`gradient-upload-btn ${isUploading ? 'loading' : ''}`}
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
            >
                {isUploading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Upload size={20} className="btn-icon" />
                )}
                <span>{isUploading ? 'Processing...' : 'Upload Log File (.bin)'}</span>
            </button>
        </div>
    );
};

export default FileUploader;