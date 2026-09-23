import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X } from 'lucide-react';

export default function UploadZone({ onFilesSelected, accept = "*", multiple = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Convert FileList to Array and respect the 'multiple' prop
    const droppedFiles = [...e.dataTransfer.files];
    const validFiles = multiple ? droppedFiles : [droppedFiles[0]];
    
    setFiles(validFiles);
    if (onFilesSelected) onFilesSelected(validFiles);
  };

  const handleFileSelect = (e) => {
    const selected = [...e.target.files];
    const validFiles = multiple ? selected : [selected[0]];
    
    setFiles(validFiles);
    if (onFilesSelected) onFilesSelected(validFiles);
  };

  const clearFiles = (e) => {
    e.stopPropagation(); // Prevents reopening the file browser
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onFilesSelected) onFilesSelected([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hidden input securely triggered via ref */}
      <input 
        type="file" 
        ref={fileInputRef}
        multiple={multiple} 
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
      />

      <motion.div
        onClick={() => files.length === 0 && fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden min-h-[320px]
          ${isDragging 
            ? "border-accent bg-accent/10 shadow-[0_0_40px_rgba(59,130,246,0.2)]" 
            : "border-white/10 bg-white/5 hover:bg-white/[0.08] cursor-pointer"}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 pointer-events-none" />

        <AnimatePresence mode="wait">
          {files.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center z-10 pointer-events-none"
            >
              <div className={`mb-6 inline-flex p-4 rounded-2xl transition-colors duration-300 ${isDragging ? 'bg-accent/20 text-accent' : 'bg-white/5 border border-white/10 text-accent'}`}>
                <Upload size={40} />
              </div>
              <h3 className="text-2xl font-medium text-white mb-2">Drop your {multiple ? 'files' : 'file'} here</h3>
              <p className="text-slate-400">or click to browse from your device</p>
            </motion.div>
          ) : (
            <motion.div 
              key="loaded"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full z-10 flex flex-col h-full"
            >
              {/* Scrollable File List for multiple files */}
              <div className="w-full max-h-[200px] overflow-y-auto custom-scrollbar space-y-3 mb-6 pr-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-4 glass-panel border-white/10 bg-black/20">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <File className="text-accent shrink-0" size={24} />
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4 mt-auto pt-4 border-t border-white/10">
                <button 
                  onClick={clearFiles}
                  className="px-6 py-4 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <X size={18} /> Clear
                </button>
                <button className="flex-1 py-4 bg-accent hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-accent/20">
                  Process {files.length > 1 ? `${files.length} Files` : 'File'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}