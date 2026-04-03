import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import './FileUploader.css';

const FileUploader = ({ onFileUpload }) => {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.bin') || file.name.endsWith('.BIN')) {
            onFileUpload(file);
        } else {
            alert("Please upload a .bin file");
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
            <button className="gradient-upload-btn" onClick={handleClick}>
                <Upload size={20} className="btn-icon" />
                <span>Upload Log File (.bin)</span>
            </button>
        </div>
    );
};

export default FileUploader;