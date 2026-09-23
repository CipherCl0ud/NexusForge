import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, ArrowUp, ArrowDown, RefreshCw, Layers, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import toast from 'react-hot-toast';
import UploadZone from '../../components/UploadZone';

export default function PdfMerger() {
  const [pdfs, setPdfs] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;
    
    const validFiles = [...files].filter(f => f.type === 'application/pdf');
    if (validFiles.length === 0) {
      toast.error("Please select valid PDF documents.");
      return;
    }

    const toastId = toast.loading("Processing documents...");
    try {
      const newPdfs = [];
      for (const file of validFiles) {
        // Read the ArrayBuffer exactly ONCE upon upload to prevent memory leaks during reordering
        const bytes = await file.arrayBuffer();
        newPdfs.push({
          id: Math.random().toString(36).substr(2, 9),
          file: file,
          name: file.name,
          size: file.size,
          bytes: bytes
        });
      }
      setPdfs(prev => [...prev, ...newPdfs]);
      toast.success(`Added ${validFiles.length} document(s)!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to read PDFs. They might be corrupted.", { id: toastId });
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const items = [...pdfs];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    setPdfs(items);
  };

  const moveDown = (index) => {
    if (index === pdfs.length - 1) return;
    const items = [...pdfs];
    [items[index + 1], items[index]] = [items[index], items[index + 1]];
    setPdfs(items);
  };

  const removePdf = (id) => setPdfs(prev => prev.filter(p => p.id !== id));
  
  const clearWorkspace = () => {
    setPdfs([]);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  // Live PDF Merging Effect
  useEffect(() => {
    if (pdfs.length === 0) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const mergePdfs = async () => {
      setIsGenerating(true);
      try {
        const mergedPdf = await PDFDocument.create();
        
        for (const item of pdfs) {
          const loadedPdf = await PDFDocument.load(item.bytes);
          const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      } catch (error) {
        console.error("Merging failed:", error);
        toast.error("Failed to merge documents. One might be encrypted.");
      } finally {
        setIsGenerating(false);
      }
    };

    // Debounce to prevent heavy merging while rapidly clicking up/down arrows
    const timeout = setTimeout(mergePdfs, 400);
    return () => clearTimeout(timeout);
  }, [pdfs]);

  const downloadPdf = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `NexusForge_Merged.pdf`;
    a.click();
    toast.success("Merged PDF downloaded!");
  };

  return (
    // ── RESPONSIVE IDE LAYOUT (4/8 SPLIT) ──
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[600px] max-h-[850px]">
      
      {/* ── LEFT PANE: Editor & Sequence (4 Columns) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
        
        {/* Compact Dropzone */}
        <div className="shrink-0">
          <UploadZone 
            onFilesSelected={handleFilesSelected}
            accept=".pdf, application/pdf"
            multiple={true}
            maxFiles={20}
            title="Add PDFs to Merge"
            subtitle="Drag & drop multiple PDF files"
          />
        </div>

        {/* Sequence Editor */}
        <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col bg-black/20">
          <div className="px-4 py-3 border-b border-white/5 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex justify-between items-center">
            <span>Merge Sequence ({pdfs.length})</span>
            {pdfs.length > 0 && (
              <button 
                onClick={clearWorkspace}
                className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {pdfs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm font-medium gap-3">
                <Layers size={32} className="opacity-20" />
                Sequence empty. Add PDFs to merge.
              </div>
            ) : (
              <AnimatePresence mode='popLayout'>
                {pdfs.map((pdf, idx) => (
                  <motion.div 
                    layout 
                    key={pdf.id} 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }} 
                    className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors"
                  >
                    
                    {/* Ordering Controls */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors">
                        <ArrowUp size={12} strokeWidth={3}/>
                      </button>
                      <button onClick={() => moveDown(idx)} disabled={idx === pdfs.length - 1} className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors">
                        <ArrowDown size={12} strokeWidth={3}/>
                      </button>
                    </div>
                    
                    {/* Index Badge */}
                    <div className="w-8 h-8 rounded-lg bg-[#a855f7]/20 text-[#a855f7] flex items-center justify-center shrink-0 border border-[#a855f7]/30 shadow-inner">
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{pdf.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{(pdf.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>

                    {/* Remove Action */}
                    <button 
                      onClick={() => removePdf(pdf.id)} 
                      className="p-2 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                    >
                      <X size={16}/>
                    </button>

                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 pt-2">
          <button 
            onClick={downloadPdf} 
            disabled={!previewUrl || isGenerating || pdfs.length < 2} 
            className="w-full py-4 bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 disabled:bg-white/5 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#a855f7]/20 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <Download size={18} /> Download Merged PDF
          </button>
          {pdfs.length === 1 && (
            <p className="text-[10px] text-slate-500 text-center mt-3 font-medium">Add at least 2 documents to merge.</p>
          )}
        </div>
      </div>

      {/* ── RIGHT PANE: Live Preview (8 Columns) ── */}
      <div className="lg:col-span-8 glass-panel rounded-2xl overflow-hidden relative border border-white/10 flex flex-col h-full min-h-0 bg-black/20">
        <div className="bg-white/5 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold flex items-center gap-2 text-white">
            <Layers size={16} className="text-[#a855f7]"/> Live Merged Preview
          </span>
          {isGenerating && (
            <span className="text-xs font-medium text-[#a855f7] flex items-center gap-1.5 animate-pulse bg-[#a855f7]/10 px-2 py-1 rounded-md border border-[#a855f7]/20">
              <RefreshCw size={12} className="animate-spin"/> Fusing Documents...
            </span>
          )}
        </div>
        
        <div className="flex-1 bg-[#0a0a0a] relative min-h-0 p-4 flex items-center justify-center">
          {!previewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-3">
              <FileText size={32} className="opacity-20" />
              Waiting for sequence...
            </div>
          ) : (
            <iframe 
              src={previewUrl} 
              className="w-full h-full border-none rounded-xl bg-white shadow-2xl" 
              title="Merged PDF Preview" 
            />
          )}
        </div>
      </div>

    </div>
  );
}