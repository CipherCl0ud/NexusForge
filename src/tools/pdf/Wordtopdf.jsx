import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Loader2, X, CheckCircle2, ShieldCheck, RefreshCw, Trash2, FileOutput, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

const ENDPOINT = 'http://localhost:8000/api/word-to-pdf';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function WordToPdf() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { blob, filename, isZip, size, url }

  // Cleanup URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const handleFilesSelected = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const valid = Array.from(selectedFiles).filter(f => 
      f.name.toLowerCase().endsWith('.docx') || 
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    if (valid.length === 0) {
      toast.error('Please select valid .docx Word files.');
      return;
    }

    const newFiles = valid.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      size: f.size
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearWorkspace = () => {
    setFiles([]);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
  };

  const convert = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    const toastId = toast.loading(`Converting ${files.length} document(s)...`);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f.file));

      const response = await fetch(ENDPOINT, { method: 'POST', body: formData });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Conversion failed');
      }

      const blob = await response.blob();
      const isZip = blob.type === 'application/zip';
      const filename = isZip ? 'converted_pdfs.zip' : `${files[0].name.replace(/\.[^/.]+$/, "")}.pdf`;
      const url = URL.createObjectURL(blob);
      
      setResult({ blob, filename, isZip, size: blob.size, url });
      toast.success('Conversion complete!', { id: toastId });
    } catch (err) {
      console.error('Conversion failed:', err);
      toast.error(err.message || 'Failed to convert document(s).', { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    a.click();
    toast.success("File downloaded!");
  };

  return (
    // ── RESPONSIVE IDE LAYOUT (4/8 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Document Queue ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        <div className="shrink-0">
          <UploadZone 
            onFilesSelected={handleFilesSelected}
            accept=".docx, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple={true}
            title="Add Word Docs"
            subtitle="Drag & drop .docx files"
          />
        </div>

        <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col bg-black/20">
          <div className="px-4 py-3 border-b border-white/5 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex justify-between items-center">
            <span>Document Queue ({files.length})</span>
            {files.length > 0 && !processing && !result && (
              <button onClick={clearWorkspace} className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm font-medium gap-3">
                <FileText size={32} className="opacity-20" />
                No documents queued.
              </div>
            ) : (
              <AnimatePresence mode='popLayout'>
                {files.map((f) => (
                  <motion.div 
                    layout key={f.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
                    className="flex items-center gap-3 p-3 rounded-xl border bg-white/5 border-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner bg-[#3b82f6]/20 text-[#3b82f6]">
                      <FileText size={16} />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-sm font-bold truncate transition-colors text-slate-200 group-hover:text-white">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{formatBytes(f.size)}</span>
                    </div>

                    {!processing && !result && (
                      <button onClick={() => removeFile(f.id)} className="p-2 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0">
                        <X size={16}/>
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="shrink-0 pt-2">
          {!result ? (
            <button 
              onClick={convert} disabled={processing || files.length === 0} 
              className="w-full py-4 bg-[#3b82f6] hover:bg-blue-500 disabled:opacity-50 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#3b82f6]/20 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {processing ? (
                <><RefreshCw size={18} className="animate-spin" /> Converting Document{files.length > 1 ? 's' : ''}...</>
              ) : (
                <><FileOutput size={18} /> Convert to PDF</>
              )}
            </button>
          ) : (
            <button onClick={clearWorkspace} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
              <RefreshCw size={18} /> Convert New Files
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT PANE: Preview / Success Dashboard ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col h-full min-h-0 bg-black/20">
        
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            {result ? (
              <><CheckCircle2 size={16} className="text-[#10B981]"/> Export Inspector</>
            ) : (
              <><FileOutput size={16} className="text-[#3b82f6]"/> Output Status</>
            )}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-md">
            <ShieldCheck size={12} className="text-[#3b82f6]" /> Local Engine
          </div>
        </div>
        
        <div className="flex-1 bg-[#0a0a0a] relative min-h-0">
          <AnimatePresence mode="wait">
            
            {/* 1. Empty State */}
            {files.length === 0 && !result && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
                <FileOutput size={32} className="opacity-20" />
                Waiting for documents...
              </motion.div>
            )}

            {/* 2. Ready / Processing State */}
            {files.length > 0 && !result && (
              <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center">
                {processing ? (
                  <>
                    <Loader2 size={48} className="text-[#3b82f6] animate-spin mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <h3 className="text-xl font-bold text-white mb-2 animate-pulse">Rendering PDF Engine...</h3>
                    <p className="text-sm text-slate-400">Rebuilding layouts, fonts, and images into a secure document.</p>
                  </>
                ) : (
                  <>
                    <FileText size={48} className="text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Render</h3>
                    <p className="text-sm text-slate-400 max-w-sm">Press "Convert to PDF" to generate your high-fidelity documents locally.</p>
                  </>
                )}
              </motion.div>
            )}

            {/* 3. Success Dashboard & Live PDF Preview */}
            {result && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#10B981]/5 to-transparent relative">
                
                {/* If it's a single PDF, we can show a live preview! */}
                {!result.isZip ? (
                  <div className="absolute inset-0 p-4 flex items-center justify-center">
                    <iframe src={`${result.url}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none rounded-xl bg-white shadow-2xl" title="Generated PDF Preview" />
                    
                    {/* Floating Download Overlay */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-4">
                      <button onClick={downloadResult} className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(16,185,129,0.4)] hover:scale-105">
                        <Download size={18} /> Download Generated PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  // ZIP UI for multiple files
                  <div className="flex flex-col items-center p-8 text-center">
                    <div className="w-24 h-24 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-[#10B981]/20">
                      <Archive size={48} />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Render Complete</h2>
                    <p className="text-slate-400 max-w-md mb-8">
                      Successfully generated {files.length} secure PDFs. They have been packed into a convenient ZIP archive.
                    </p>

                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-8 min-w-[300px]">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-500 text-sm font-medium">Output File</span>
                        <span className="text-white font-mono text-sm">{result.filename}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm font-medium">Archive Size</span>
                        <span className="text-white font-mono text-sm bg-white/5 px-2 py-0.5 rounded border border-white/10">{formatBytes(result.size)}</span>
                      </div>
                    </div>

                    <button onClick={downloadResult} className="px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20">
                      <Download size={20} /> Download ZIP Archive
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}