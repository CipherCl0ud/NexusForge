import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';

export default function UploadZone({ onFilesSelected, accept = "*", multiple = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);

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
    const droppedFiles = [...e.dataTransfer.files];
    setFiles(droppedFiles);
    onFilesSelected(droppedFiles);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative h-80 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-12 overflow-hidden
          ${isDragging 
            ? "border-accent bg-accent/10 shadow-[0_0_40px_rgba(59,130,246,0.2)]" 
            : "border-white/10 bg-white/5 hover:bg-white/[0.08]"}
        `}
      >
        {/* Decorative Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 pointer-events-none" />

        <AnimatePresence mode="wait">
          {files.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center z-10"
            >
              <div className="mb-6 inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 text-accent">
                <Upload size={40} />
              </div>
              <h3 className="text-2xl font-medium text-white mb-2">Drop your files here</h3>
              <p className="text-slate-400">or click to browse from your computer</p>
              <input 
                type="file" 
                multiple={multiple} 
                accept={accept}
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const selected = [...e.target.files];
                  setFiles(selected);
                  onFilesSelected(selected);
                }}
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full z-10 space-y-4"
            >
              <div className="flex items-center justify-between p-4 glass-panel border-accent/30">
                <div className="flex items-center gap-4">
                  <File className="text-accent" />
                  <div>
                    <p className="text-sm font-medium text-white">{files[0].name}</p>
                    <p className="text-xs text-slate-500">{(files[0].size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFiles([])}
                  className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <button className="w-full py-4 bg-accent hover:bg-blue-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-accent/20">
                Process File
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}