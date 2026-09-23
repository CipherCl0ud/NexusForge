import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileOutput, Download, Loader2, X, FileText, CheckCircle2, ShieldCheck, RefreshCw, Trash2, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

const ENDPOINT = 'http://localhost:8000/api/pdf-to-word';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function PdfToWord() {
  const [files, setFiles] = useState([]);
  const [activePreviewId, setActivePreviewId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.url));
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [files, result]);

  const handleFilesSelected = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const valid = Array.from(selectedFiles).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (valid.length === 0) {
      toast.error('Please select valid .pdf files.');
      return;
    }

    const newFiles = valid.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f)
    }));

    setFiles(prev => {
      const updated = [...prev, ...newFiles];
      if (!activePreviewId && updated.length > 0) setActivePreviewId(updated[0].id);
      return updated;
    });
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (activePreviewId === id) setActivePreviewId(filtered.length > 0 ? filtered[0].id : null);
      return filtered;
    });
  };

  const clearWorkspace = () => {
    setFiles([]);
    setResult(null);
    setActivePreviewId(null);
  };

  const convert = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    const toastId = toast.loading(`Analyzing layout and converting ${files.length} document(s)...`);

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
      const filename = isZip ? 'converted_docs.zip' : `${files[0].name.replace(/\.[^/.]+$/, "")}.docx`;
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

  const activeFile = files.find(f => f.id === activePreviewId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Document Queue ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        <div className="shrink-0">
          <UploadZone 
            onFilesSelected={handleFilesSelected}
            accept=".pdf, application/pdf"
            multiple={true}
            title="Add PDFs to Convert"
            subtitle="Drag & drop PDF files"
          />
        </div>

        {/* UPDATED: High-Accuracy Layout Banner */}
        <div className="shrink-0 bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] text-[11px] px-4 py-3 rounded-xl flex items-start gap-2 leading-relaxed">
          <LayoutTemplate size={14} className="shrink-0 mt-0.5" />
          <p><strong>Layout Preservation Active.</strong> The local engine will automatically reconstruct tables, images, and column alignments.</p>
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
                <FileOutput size={32} className="opacity-20" />
                No documents queued.
              </div>
            ) : (
              <AnimatePresence mode='popLayout'>
                {files.map((f) => (
                  <motion.div 
                    layout key={f.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
                    onClick={() => setActivePreviewId(f.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors group
                      ${activePreviewId === f.id ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${activePreviewId === f.id ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'bg-black/20 text-slate-400'}`}>
                      <FileText size={16} />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className={`text-sm font-bold truncate transition-colors ${activePreviewId === f.id ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {f.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{formatBytes(f.size)}</span>
                    </div>

                    {!processing && !result && (
                      <button onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="p-2 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0">
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
                <><FileOutput size={18} /> Convert to Word</>
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
              <><CheckCircle2 size={16} className="text-[#10B981]"/> Conversion Complete</>
            ) : (
              <><FileText size={16} className="text-[#3b82f6]"/> Source Document Preview</>
            )}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-md">
            <ShieldCheck size={12} className="text-[#3b82f6]" /> Native Layout Engine
          </div>
        </div>
        
        <div className="flex-1 bg-[#0a0a0a] relative min-h-0">
          <AnimatePresence mode="wait">
            
            {files.length === 0 && !result && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
                <FileOutput size={32} className="opacity-20" />
                Waiting for documents...
              </motion.div>
            )}

            {files.length > 0 && !result && activeFile && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 p-4 flex items-center justify-center">
                {processing && (
                  <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-[#3b82f6]">
                    <Loader2 size={32} className="animate-spin mb-4" />
                    <p className="text-sm font-bold tracking-wide animate-pulse">Reconstructing Layout & Tables...</p>
                  </div>
                )}
                <iframe src={`${activeFile.url}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none rounded-xl bg-white shadow-2xl" title="Source PDF Preview" />
              </motion.div>
            )}

            {result && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#10B981]/5 to-transparent">
                <div className="w-24 h-24 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-[#10B981]/20">
                  <CheckCircle2 size={48} />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Ready for Word</h2>
                <p className="text-slate-400 max-w-md mb-8">
                  Successfully reconstructed layouts for {files.length} document{files.length > 1 ? 's' : ''}. The output has been packed into a native DOCX format.
                </p>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-8 min-w-[300px]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-500 text-sm font-medium">Output File</span>
                    <span className="text-white font-mono text-sm">{result.filename}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium">Total Size</span>
                    <span className="text-white font-mono text-sm bg-white/5 px-2 py-0.5 rounded border border-white/10">{formatBytes(result.size)}</span>
                  </div>
                </div>

                <button 
                  onClick={downloadResult} 
                  className="px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
                >
                  <Download size={20} /> Download {result.isZip ? 'ZIP Archive' : 'Word Document'}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}